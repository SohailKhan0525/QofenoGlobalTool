import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark, faRotateLeft } from '@fortawesome/free-solid-svg-icons';

export function ErrorCard({ message, onReset }: { message?: string; onReset: () => void }) {
  return (
    <div className="w-full mt-5 p-5 bg-red-50 border-2 border-red-200 rounded-3xl animate-slide-up">
      <div className="flex items-start gap-3 mb-4">
        <FontAwesomeIcon
          icon={faCircleXmark}
          className="text-red-500 text-xl flex-shrink-0 mt-0.5"
        />
        <div>
          <p className="font-bold text-red-800 text-sm sm:text-base">
            Processing failed
          </p>
          <p className="text-sm text-red-600 mt-1 leading-relaxed">
            {message || 'An unexpected error occurred while processing your file. Please try again.'}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
      >
        <FontAwesomeIcon icon={faRotateLeft} />
        Try again with a different file
      </button>
    </div>
  );
}
