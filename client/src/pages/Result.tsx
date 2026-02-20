import { useState, useEffect } from "react";
import type { Project } from "../types";
import {
  ImageIcon,
  Loader2Icon,
  RefreshCwIcon,
  SparkleIcon,
  VideoIcon,
} from "lucide-react";
import { GhostButton, PrimaryButton } from "../components/Buttons";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import api from "../configs/axios";
import { toast } from "react-hot-toast";

const Result = () => {
  const { projectId } = useParams();
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  const [project, setProjectData] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  /* ---------------- FETCH PROJECT ---------------- */

  const fetchProjectData = async () => {
    if (!projectId) return;

    try {
      const token = await getToken();

      const { data } = await api.get(
        `/api/user/projects/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProjectData(data.project);
      setIsGenerating(data.project.isGenerating);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || error.message
      );
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- GENERATE VIDEO ---------------- */

  const handleGenerateVideo = async () => {
    if (!projectId) return;

    setIsGenerating(true);

    try {
      const token = await getToken();

      const { data } = await api.post(
        "/api/project/video",
        { projectId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProjectData((prev) =>
        prev
          ? {
              ...prev,
              generatedVideo: data.videoUrl,
              isGenerating: false,
            }
          : prev
      );

      toast.success(data.message);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || error.message
      );
      console.log(error);
    } finally {
      setIsGenerating(false);
    }
  };

  /* ---------------- AUTH CHECK + INITIAL FETCH ---------------- */

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      navigate("/");
      return;
    }

    fetchProjectData();
  }, [user, isLoaded]);

  /* ---------------- AUTO REFRESH WHILE GENERATING ---------------- */

  useEffect(() => {
    if (!user || !isGenerating) return;

    const interval = setInterval(() => {
      fetchProjectData();
    }, 10000);

    return () => clearInterval(interval);
  }, [user, isGenerating]);

  /* ---------------- LOADING STATE ---------------- */

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2Icon className="animate-spin text-indigo-500 size-9" />
      </div>
    );
  }

  if (!project) return null;

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen text-white p-6 md:p-12 mt-20">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-medium">
            Generation Result
          </h1>

          <Link
            to="/generate"
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <RefreshCwIcon className="w-4 h-4" />
            <span className="max-sm:hidden">New Generation</span>
          </Link>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Display */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel inline-block p-2 rounded-2xl">
              <div
                className={`${
                  project.aspectRatio === "9:16"
                    ? "aspect-[9/16]"
                    : "aspect-video"
                } rounded-xl bg-gray-900 overflow-hidden`}
              >
                {project.generatedVideo ? (
                  <video
                    src={project.generatedVideo}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={project.generatedImage}
                    alt="Generated Result"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-xl font-semibold mb-4">Actions</h3>

              <div className="flex flex-col gap-3">
                <a href={project.generatedImage || "#"} download>
                  <GhostButton
                    disabled={!project.generatedImage}
                    className="w-full justify-center rounded-md py-3"
                  >
                    <ImageIcon className="size-4.5" />
                    Download Image
                  </GhostButton>
                </a>

                <a href={project.generatedVideo || "#"} download>
                  <GhostButton
                    disabled={!project.generatedVideo}
                    className="w-full justify-center rounded-md py-3"
                  >
                    <VideoIcon className="size-4.5" />
                    Download Video
                  </GhostButton>
                </a>
              </div>
            </div>

            {/* Video Generation */}
            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <VideoIcon className="size-24" />
              </div>

              <h3 className="text-xl font-semibold mb-2">
                Video Magic
              </h3>

              <p className="text-gray-400 text-sm mb-6">
                Turn this static image into a dynamic video for
                social media.
              </p>

              {!project.generatedVideo ? (
                <PrimaryButton
                  onClick={handleGenerateVideo}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    "Generating Video..."
                  ) : (
                    <>
                      <SparkleIcon className="size-4" />
                      Generate Video
                    </>
                  )}
                </PrimaryButton>
              ) : (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-center text-sm font-medium">
                  Video Generated Successfully!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Result;