"use client";

import { Sparkles, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import type { StreamPhase } from "@/hooks/use-streaming-visual";

export interface CanvasAIResponseProps {
  response?: string;
  question?: string;
  phase?: StreamPhase;
  error?: string | null;
  generatedCount?: number;
}

export interface AIResponseResult {
  response: string;
  question?: string;
}

export function CanvasAIResponse({
  response,
  question,
  phase = "idle",
  error = null,
  generatedCount = 0,
}: CanvasAIResponseProps) {
  if (!response && !error && phase === "idle") {
    return null;
  }

  const isBusy =
    phase === "planning" ||
    phase === "explaining" ||
    phase === "coding" ||
    phase === "generating" ||
    phase === "optimizing";

  return (
    <div className="pointer-events-none fixed bottom-28 left-1/2 z-[60] w-[min(92vw,44rem)] -translate-x-1/2">
      <div className="rounded-2xl border border-violet-400/20 bg-[linear-gradient(135deg,#101633_0%,#131d42_45%,#0e1530_100%)] px-4 py-3 text-white shadow-[0_10px_35px_rgba(10,14,36,0.28)] backdrop-blur">
        <div className="mb-2 flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-white/10 p-2 text-violet-200">
            {error ? (
              <AlertCircle className="h-4 w-4" />
            ) : isBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : generatedCount > 0 ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white/95">
              {error
                ? "AI request failed"
                : isBusy
                  ? "Generating your canvas response"
                  : generatedCount > 0
                    ? `Added ${generatedCount} AI visual${generatedCount === 1 ? "" : "s"} to the canvas`
                    : "AI canvas response"}
            </p>
            {question ? (
              <p className="mt-1 line-clamp-2 text-xs text-white/55">
                Prompt: {question}
              </p>
            ) : null}
          </div>
        </div>

        {error ? (
          <p className="text-sm leading-6 text-red-200">{error}</p>
        ) : response ? (
          <p className="line-clamp-4 text-sm leading-6 text-white/80">{response}</p>
        ) : (
          <p className="text-sm leading-6 text-white/65">
            The AI is preparing visual content and syncing it to the canvas.
          </p>
        )}
      </div>
    </div>
  );
}
