import { Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { prisma } from "../configs/prisma.js";
import { v2 as cloudinary } from "cloudinary";
import {
  GenerateContentConfig,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/genai";
import fs from "fs";
import path from "path";
import ai from "../configs/ai.js";
import axios from "axios";

/* -------------------------------------------------- */
/* Helper */
/* -------------------------------------------------- */

const loadImage = (filePath: string, mimeType: string) => {
  return {
    inlineData: {
      data: fs.readFileSync(filePath).toString("base64"),
      mimeType,
    },
  };
};

/* -------------------------------------------------- */
/* CREATE PROJECT (IMAGE GENERATION) */
/* -------------------------------------------------- */

export const createProject = async (req: Request, res: Response) => {
  let tempProjectId: string | null = null;
  let isCreditDeducted = false;

  try {
    const auth = req.auth();
    if (!auth?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = auth.userId;

    const {
      name = "New Project",
      aspectRatio,
      userPrompt,
      productName,
      productDescription,
      targetLength = 5,
    } = req.body;

    const images: any = req.files;

    if (!images || images.length < 2 || !productName) {
      return res
        .status(400)
        .json({ message: "Upload at least 2 images & product name" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.credits < 5) {
      return res.status(401).json({ message: "Insufficient credits" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: 5 } },
    });

    isCreditDeducted = true;

    /* Upload Images */
    const uploadedImages = await Promise.all(
      images.map(async (item: any) => {
        const result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      })
    );

    /* Create Project */
    const project = await prisma.project.create({
      data: {
        name,
        userId,
        productName,
        productDescription,
        userPrompt,
        aspectRatio,
        targetLength: parseInt(targetLength),
        uploadedImages,
        isGenerating: true,
      },
    });

    tempProjectId = project.id;

    /* AI Image Generation Config */
    const generationConfig: GenerateContentConfig = {
      maxOutputTokens: 32768,
      temperature: 1,
      topP: 0.95,
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: aspectRatio || "9:16",
        imageSize: "1K",
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.OFF,
        },
      ],
    };

    const img1base64 = loadImage(images[0].path, images[0].mimetype);
    const img2base64 = loadImage(images[1].path, images[1].mimetype);

    const prompt = {
      text: `Combine the person and product into a realistic photo.
Make the person naturally hold or use the product.
Match lighting, shadows, scale and perspective.
Professional studio lighting.
${userPrompt || ""}`,
    };

    const response: any = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [img1base64, img2base64, prompt],
      config: generationConfig,
    });

    const parts = response?.candidates?.[0]?.content?.parts;

    if (!parts) {
      throw new Error("Unexpected AI response");
    }

    let finalBuffer: Buffer | null = null;

    for (const part of parts) {
      if (part.inlineData) {
        finalBuffer = Buffer.from(part.inlineData.data, "base64");
      }
    }

    if (!finalBuffer) {
      throw new Error("Image generation failed");
    }

    const base64Image = `data:image/png;base64,${finalBuffer.toString(
      "base64"
    )}`;

    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      resource_type: "image",
    });

    await prisma.project.update({
      where: { id: project.id },
      data: {
        generatedImage: uploadResult.secure_url,
        isGenerating: false,
      },
    });

    res.json({ projectId: project.id });
  } catch (error: any) {
    if (tempProjectId) {
      await prisma.project.update({
        where: { id: tempProjectId },
        data: { isGenerating: false, error: error.message },
      });
    }

    if (isCreditDeducted) {
      const auth = req.auth();
      if (auth?.userId) {
        await prisma.user.update({
          where: { id: auth.userId },
          data: { credits: { increment: 5 } },
        });
      }
    }

    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};

/* -------------------------------------------------- */
/* CREATE VIDEO */
/* -------------------------------------------------- */

export const createVideo = async (req: Request, res: Response) => {
  let isCreditDeducted = false;

  try {
    const auth = req.auth();
    if (!auth?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = auth.userId;
    const { projectId } = req.body;

    if (!projectId || typeof projectId !== "string") {
      return res.status(400).json({ message: "Valid Project ID required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.credits < 10) {
      return res.status(401).json({ message: "Insufficient credits" });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.isGenerating)
      return res.status(400).json({ message: "Generation in progress" });

    if (project.generatedVideo)
      return res.status(400).json({ message: "Video already generated" });

    if (!project.generatedImage)
      return res.status(400).json({ message: "Generated image missing" });

    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: 10 } },
    });

    isCreditDeducted = true;

    await prisma.project.update({
      where: { id: projectId },
      data: { isGenerating: true },
    });

    const image = await axios.get(project.generatedImage, {
      responseType: "arraybuffer",
    });

    const imageBytes = Buffer.from(image.data);

    let operation: any = await ai.models.generateVideos({
      model: "veo-3.1-generate-preview",
      prompt: `Showcase the product ${project.productName}`,
      image: {
        imageBytes: imageBytes.toString("base64"),
        mimeType: "image/png",
      },
      config: {
        aspectRatio: project.aspectRatio || "9:16",
        numberOfVideos: 1,
        resolution: "720p",
      },
    });

    while (!operation.done) {
      await new Promise((r) => setTimeout(r, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    if (!operation.response.generatedVideos) {
      throw new Error("Video generation failed");
    }

    const filename = `${userId}-${Date.now()}.mp4`;
    const filePath = path.join("videos", filename);

    fs.mkdirSync("videos", { recursive: true });

    await ai.files.download({
      file: operation.response.generatedVideos[0].video,
      downloadPath: filePath,
    });

    const uploadResult = await cloudinary.uploader.upload(filePath, {
      resource_type: "video",
    });

    await prisma.project.update({
      where: { id: projectId },
      data: {
        generatedVideo: uploadResult.secure_url,
        isGenerating: false,
      },
    });

    fs.unlinkSync(filePath);

    res.json({
      message: "Video generation completed",
      videoUrl: uploadResult.secure_url,
    });
  } catch (error: any) {
    if (isCreditDeducted) {
      const auth = req.auth();
      if (auth?.userId) {
        await prisma.user.update({
          where: { id: auth.userId },
          data: { credits: { increment: 10 } },
        });
      }
    }

    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};

/* -------------------------------------------------- */
/* GET PUBLISHED PROJECTS */
/* -------------------------------------------------- */

export const getAllPublishedProjects = async (
  req: Request,
  res: Response
) => {
  try {
    const projects = await prisma.project.findMany({
      where: { isPublished: true },
    });

    res.json({ projects });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};

/* -------------------------------------------------- */
/* DELETE PROJECT */
/* -------------------------------------------------- */

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const auth = req.auth();
    if (!auth?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = auth.userId;
    const projectId = req.params.projectId;

    if (!projectId || typeof projectId !== "string") {
      return res.status(400).json({ message: "Valid Project ID required" });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      return res.status(404).json({ message: "Project not found" });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    res.json({ message: "Project deleted successfully" });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};