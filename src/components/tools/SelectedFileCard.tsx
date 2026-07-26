import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines, faFileImage, faFileVideo, faFileAudio, faFilePdf, faXmark } from '@fortawesome/free-solid-svg-icons';

function formatBytes(bytes: number, decimals = 2) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function getFileIcon(type: string) {
  if (type.includes('pdf')) return faFilePdf;
  if (type.includes('image')) return faFileImage;
  if (type.includes('video')) return faFileVideo;
  if (type.includes('audio')) return faFileAudio;
  return faFileLines;
}

export function SelectedFileCard({ file, onRemove }: { file: File; onRemove: () => void }) {
  const icon = getFileIcon(file.type);

  return (
    <div className="flex items-center gap-3 p-4 bg-white border border-gray-200
                    rounded-2xl shadow-xs w-full">
      {/* File type icon */}
      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center
                      justify-center flex-shrink-0">
        <FontAwesomeIcon icon={icon} className="text-purple-600" />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 truncate text-sm">
          {file.name}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatBytes(file.size)} · {file.type || "file"}
        </p>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="w-8 h-8 flex items-center justify-center rounded-lg
                   text-gray-400 hover:text-red-500 hover:bg-red-50
                   transition-colors flex-shrink-0 cursor-pointer"
        aria-label="Remove file"
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </div>
  );
}
