import React, { useRef, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowUp, faCircleXmark } from '@fortawesome/free-solid-svg-icons';

type UploadZoneProps = {
  tool: {
    input_label?: string;
    accepted_extensions?: string[];
    accepted_types?: string[];
    maxSizeLabel?: string;
  };
  onFileSelect: (file: File | File[] | null, error?: string | null) => void;
  error?: string | null;
  multiple?: boolean;
};

export function UploadZone({ tool, onFileSelect, error, multiple = false }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (!fileArray.length) return;

    const file = fileArray[0];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const acceptedExts = tool.accepted_extensions || [];

    if (acceptedExts.length > 0 && !acceptedExts.includes(ext)) {
      onFileSelect(null, `Wrong file type. This tool accepts: ${acceptedExts.join(', ')}`);
      return;
    }

    onFileSelect(multiple ? fileArray : file, null);
  }, [tool, onFileSelect, multiple]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  return (
    <div className="w-full">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragEnter={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        className={`
          flex flex-col items-center justify-center
          w-full min-h-[240px] sm:min-h-[280px]
          rounded-3xl border-2 border-dashed
          cursor-pointer select-none
          transition-all duration-200 ease-out
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
          ${dragging
            ? 'border-purple-500 bg-purple-50 scale-[1.01] shadow-lg shadow-purple-100'
            : 'border-gray-200 bg-gray-50 hover:border-purple-400 hover:bg-purple-50'
          }
        `}
      >
        <div className={`
          w-16 h-16 sm:w-20 sm:h-20 rounded-2xl mb-4
          flex items-center justify-center
          transition-all duration-200
          ${dragging ? 'bg-purple-200 scale-110' : 'bg-purple-100'}
        `}>
          <FontAwesomeIcon
            icon={faCloudArrowUp}
            className={`text-2xl sm:text-3xl transition-colors ${dragging ? 'text-purple-700' : 'text-purple-500'}`}
          />
        </div>

        <p className="text-base sm:text-lg font-semibold text-gray-700 mb-1 text-center px-6">
          {dragging ? 'Drop your file here' : `Choose ${tool.input_label || 'a file'}`}
        </p>
        <p className="text-sm text-gray-400 mb-6 text-center px-6">
          or drag and drop {tool.input_label || 'your file'} here
        </p>

        <button
          type="button"
          tabIndex={-1}
          className="px-6 sm:px-8 py-2.5 sm:py-3
                     bg-purple-600 hover:bg-purple-700
                     text-white font-semibold text-sm sm:text-base
                     rounded-xl transition-colors duration-150
                     active:scale-[0.97]"
        >
          Browse {tool.input_label || 'Files'}
        </button>

        <p className="text-xs text-gray-400 mt-4 text-center px-6">
          {tool.accepted_extensions?.join(', ')} — up to {tool.maxSizeLabel || '50MB'}
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={tool.accepted_types?.join(',') || '*'}
          multiple={multiple}
          className="hidden"
          onChange={e => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2.5 mt-3 p-3.5 bg-red-50 border border-red-200 rounded-2xl">
          <FontAwesomeIcon icon={faCircleXmark} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}
