import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt } from '@fortawesome/free-solid-svg-icons';

export function ProcessButton({
  label,
  onClick,
  isDisabled = false
}: {
  label: string;
  onClick: () => void;
  isDisabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={`
        w-full mt-5 py-4 md:py-5 px-6 cursor-pointer
        flex items-center justify-center gap-3
        text-white font-bold text-lg md:text-xl rounded-2xl
        transition-all duration-200 active:scale-[0.98]
        ${isDisabled
          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
          : "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-200"
        }
      `}
    >
      <FontAwesomeIcon icon={faBolt} className="text-lg" />
      {label}
    </button>
  );
}
