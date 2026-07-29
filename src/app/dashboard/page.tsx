"use client";

import dynamic from "next/dynamic";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Onboarding, useOnboarding } from "@/components/dashboard/onboarding";
import { AIChat } from "@/components/dashboard/ai-chat";
import { CanvasAIResponse } from "@/components/dashboard/canvas-ai-response";
import { useStreamingVisual } from "@/hooks/use-streaming-visual";

const ExcalidrawCanvas = dynamic(
  () =>
    import("@/components/dashboard/excalidraw-canvas").then((mod) => ({
      default: mod.ExcalidrawCanvas,
    })),
  {
    loading: () => (
      <div className="flex h-full items-center justify-center bg-white">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
          <p className="text-lg text-gray-600">Loading Canvas...</p>
        </div>
      </div>
    ),
    ssr: false,
  },
);

export default function DashboardPage() {
  const { showOnboarding, isLoaded, completeOnboarding } = useOnboarding();
  const {
    phase,
    explanation,
    code,
    elements,
    error,
    startStream,
    isStreaming,
  } = useStreamingVisual();

  const [aiResponse, setAIResponse] = useState("");
  const [activeQuestion, setActiveQuestion] = useState("");
  const [generatedCount, setGeneratedCount] = useState(0);

  useEffect(() => {
    setGeneratedCount(elements.length);
  }, [elements.length]);

  useEffect(() => {
    if (phase === "complete" && elements.length > 0) {
      setAIResponse(
        `Generated ${elements.length} visual${elements.length === 1 ? "" : "s"} and placed them on your canvas.`,
      );
    }
  }, [elements.length, phase]);

  const handleStreamingQuery = async (query: string) => {
    setActiveQuestion(query);
    setAIResponse("");
    setGeneratedCount(0);
    await startStream(query, {
      style: "modern",
      audience: "adult",
      format: "react",
      enableProgressive: true,
    });
  };

  const handleCanvasAction = (response: string, question?: string) => {
    if (question) {
      setActiveQuestion(question);
    }
    setAIResponse(response);
  };

  const responsePhase = useMemo(() => {
    if (error) {
      return "error" as const;
    }
    return phase;
  }, [error, phase]);

  return (
    <Suspense fallback={null}>
      <div className="relative h-[100dvh] w-full overflow-hidden bg-white">
        <ExcalidrawCanvas
          className="h-full w-full"
          aiPhase={phase}
          aiExplanation={explanation}
          aiCode={code}
          aiError={error}
          visualItems={elements}
          canvasResponse={aiResponse}
          canvasQuestion={activeQuestion}
        />

        <CanvasAIResponse
          response={aiResponse}
          question={activeQuestion}
          phase={responsePhase}
          error={error}
          generatedCount={generatedCount}
        />

        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[70] flex justify-center px-4">
          <div className="pointer-events-auto w-[min(92vw,40rem)]">
            <AIChat
              enableVisualMode={true}
              onStreamingQuery={handleStreamingQuery}
              onCanvasAction={handleCanvasAction}
              isStreaming={isStreaming}
            />
          </div>
        </div>

        {isLoaded && showOnboarding ? (
          <Onboarding onComplete={completeOnboarding} />
        ) : null}
      </div>
    </Suspense>
  );
}
