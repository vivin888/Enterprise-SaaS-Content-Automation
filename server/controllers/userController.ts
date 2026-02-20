import { Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { prisma } from "../configs/prisma.js";

// ===============================
// Get User Credits
// ===============================
export const getUserCredits = async (req: Request, res: Response) => {
  try {
    const auth = req.auth?.();
    const userId = auth?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return res.json({ credits: user?.credits ?? 0 });

  } catch (error: any) {
    Sentry.captureException(error);
    return res.status(500).json({
      message: error?.code || error?.message || "Internal server error",
    });
  }
};

// ===============================
// Get All Projects
// ===============================
export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const auth = req.auth?.();
    const userId = auth?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const projects = await prisma.project.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ projects });

  } catch (error: any) {
    Sentry.captureException(error);
    return res.status(500).json({
      message: error?.code || error?.message || "Internal server error",
    });
  }
};

// ===============================
// Get Project By ID
// ===============================
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const auth = req.auth?.();
    const userId = auth?.userId;
    const projectIdParam = req.params.projectId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!projectIdParam || Array.isArray(projectIdParam)) {
      return res.status(400).json({ message: "Invalid Project ID" });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectIdParam,
        userId: userId,
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.json({ project });

  } catch (error: any) {
    Sentry.captureException(error);
    return res.status(500).json({
      message: error?.code || error?.message || "Internal server error",
    });
  }
};

// ===============================
// Toggle Publish / Unpublish
// ===============================
export const toggleProjectPublic = async (
  req: Request,
  res: Response
) => {
  try {
    const auth = req.auth?.();
    const userId = auth?.userId;
    const projectIdParam = req.params.projectId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!projectIdParam || Array.isArray(projectIdParam)) {
      return res.status(400).json({ message: "Invalid Project ID" });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectIdParam,
        userId: userId,
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.generatedImage && !project.generatedVideo) {
      return res.status(400).json({
        message: "Image or video not generated",
      });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectIdParam },
      data: {
        isPublished: !project.isPublished,
      },
    });

    return res.json({
      published: updatedProject.isPublished,
    });

  } catch (error: any) {
    Sentry.captureException(error);
    return res.status(500).json({
      message: error?.code || error?.message || "Internal server error",
    });
  }
};
