import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";

export type ProcessingStage = "waking" | "uploading" | "processing" | "finalizing";

export function ProProcessingState({ stage }: { stage: ProcessingStage }) {
  const messages: Record<ProcessingStage, string> = {
    waking: "Starting pro processor...",
    uploading: "Uploading your file...",
    processing: "Processing with heavy open-source stack...",
    finalizing: "Finalizing output...",
  };

  const stages: ProcessingStage[] = ["waking", "uploading", "processing", "finalizing"];
  const currentIdx = stages.indexOf(stage);

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-purple-100" />
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-600 animate-spin"
        />
        <div className="absolute inset-3 rounded-full bg-purple-50 flex items-center justify-center">
          <FontAwesomeIcon icon={faGear} className="text-purple-400 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
      </div>

      <div className="text-center max-w-xs">
        <p className="font-semibold text-gray-800 text-lg">
          {messages[stage] || "Processing..."}
        </p>

        {stage === "waking" && (
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">
            Pro processing uses a dedicated container server.
            Cold startup takes 15–20s on first use, after which subsequent tools run instantly.
          </p>
        )}

        {stage === "processing" && (
          <p className="text-sm text-gray-400 mt-2">
            Running Ghostscript / LibreOffice / FFmpeg processing on your file.
          </p>
        )}
      </div>

      <div className="flex gap-1.5 mt-2">
        {stages.map((s, i) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentIdx >= i ? "bg-purple-500 scale-110" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
