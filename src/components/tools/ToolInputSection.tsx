import React, { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { usePlan } from '../../hooks/usePlan';

export interface ToolInputSectionProps {
  tool: {
    slug: string;
    name: string;
    category: string;
    faIcon: any;
    input_label: string;
    accepted_extensions: string[];
    accepted_types: string[];
  };
  onFileSelect: (file: File) => void;
  error?: string | null;
}

export function ToolInputSection({ tool, onFileSelect, error }: ToolInputSectionProps) {
  const { maxFileSizeLabel } = usePlan();
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-full">
      {/* Upload zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) onFileSelect(file);
        }}
        className={`
          relative flex flex-col items-center justify-center
          w-full min-h-[220px] md:min-h-[260px] p-6 md:p-8
          rounded-3xl border-2 border-dashed cursor-pointer
          transition-all duration-200 select-none text-center
          ${isDragging
            ? "border-purple-500 bg-purple-50 scale-[1.01]"
            : "border-purple-200 bg-white hover:border-purple-400 hover:bg-purple-50"
          }
        `}
      >
        {/* Category icon */}
        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center
                         justify-center mb-4 transition-transform duration-200 mx-auto
                         ${isDragging ? "scale-110" : ""}
                         bg-purple-100`}>
          <FontAwesomeIcon
            icon={tool.faIcon}
            className="text-purple-600 text-2xl md:text-3xl"
          />
        </div>

        {/* Labels */}
        <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-1 text-center px-4">
          {isDragging ? "Drop it here!" : `Select ${tool.input_label}`}
        </h2>
        <p className="text-sm text-gray-400 mb-5 text-center px-4">
          or drop {tool.input_label} here
        </p>

        {/* Select button */}
        <button
          type="button"
          className="px-6 md:px-8 py-2.5 md:py-3 bg-purple-600 hover:bg-purple-700
                     text-white font-semibold text-sm md:text-base rounded-xl
                     transition-colors duration-200 active:scale-[0.97]"
        >
          Select {tool.input_label}
        </button>

        {/* File type + size hint */}
        <p className="text-xs text-gray-400 mt-4 text-center px-4">
          {tool.accepted_extensions.join(", ")} — up to {maxFileSizeLabel}
        </p>

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept={tool.accepted_types.join(",")}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelect(file);
            e.target.value = "";
          }}
        />
      </div>

      {/* Wrong file type error */}
      {error && (
        <div className="mt-3 flex items-center gap-2.5 p-3.5 bg-red-50
                        border border-red-200 rounded-xl">
          <FontAwesomeIcon icon={faCircleXmark} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
