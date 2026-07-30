import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';

type ProcessButtonProps = {
  onClick: () => void;
  label?: string;
  icon?: IconDefinition;
  disabled?: boolean;
};

export function ProcessButton({ onClick, label = 'Process File Now', icon = faBolt, disabled = false }: ProcessButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full mt-5 py-4 sm:py-5
        flex items-center justify-center gap-3
        bg-gradient-to-r from-purple-600 to-purple-500
        hover:from-purple-700 hover:to-purple-600
        text-white font-bold text-lg sm:text-xl
        rounded-2xl shadow-lg shadow-purple-200/60
        transition-all duration-150 active:scale-[0.98]
        cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      <FontAwesomeIcon icon={icon} />
      {label}
    </button>
  );
}
