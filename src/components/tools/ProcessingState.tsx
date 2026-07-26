import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';

export function ProcessingState({ progressMessage = "Processing your file..." }: { progressMessage?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 md:py-20 gap-5 w-full">
      {/* Animated ring */}
      <div className="relative w-16 h-16 md:w-20 md:h-20">
        <div className="absolute inset-0 rounded-full border-4 border-purple-100" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent
                        border-t-purple-600 animate-spin" />
        <div className="absolute inset-2 rounded-full bg-purple-50
                        flex items-center justify-center">
          <FontAwesomeIcon
            icon={faGear}
            className="text-purple-400 text-lg animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "3s" }}
          />
        </div>
      </div>
      <div className="text-center">
        <p className="font-semibold text-gray-800 text-base md:text-lg">
          {progressMessage}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Running on our servers — just a moment
        </p>
      </div>
    </div>
  );
}
