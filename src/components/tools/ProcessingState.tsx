import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';

export function ProcessingState({ message = 'Processing your file' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 gap-5 w-full">
      <div className="relative w-16 h-16 sm:w-20 sm:h-20">
        <div className="absolute inset-0 rounded-full border-[3px] border-purple-100" />
        <div
          className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-purple-600"
          style={{ animation: 'spin 0.85s linear infinite' }}
        />
        <div className="absolute inset-[6px] rounded-full bg-purple-50 flex items-center justify-center">
          <FontAwesomeIcon
            icon={faGear}
            className="text-purple-500 text-base"
            style={{ animation: 'spin 3s linear infinite reverse' }}
          />
        </div>
      </div>

      <div className="text-center">
        <p className="font-semibold text-gray-800 text-base sm:text-lg">
          {message}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Running on our servers — won't take long
        </p>
      </div>
    </div>
  );
}
