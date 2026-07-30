import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faFileImage, faFileVideo, faFileAudio, faFileLines, faXmark } from '@fortawesome/free-solid-svg-icons';

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getIconForMime(mimeType?: string) {
  if (!mimeType) return faFileLines;
  if (mimeType.includes('pdf')) return faFilePdf;
  if (mimeType.includes('image')) return faFileImage;
  if (mimeType.includes('video')) return faFileVideo;
  if (mimeType.includes('audio')) return faFileAudio;
  return faFileLines;
}

export function SelectedFileCard({ file, onRemove }: { file: File | File[]; onRemove: () => void }) {
  const isArray = Array.isArray(file);
  const firstFile = isArray ? file[0] : file;
  const totalSize = isArray ? file.reduce((acc, curr) => acc + (curr.size || 0), 0) : firstFile?.size || 0;
  const name = isArray ? `${file.length} files selected` : firstFile?.name || 'Selected file';
  const sizeLabel = formatBytes(totalSize);

  return (
    <div className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm animate-slide-up">
      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
        <FontAwesomeIcon
          icon={getIconForMime(firstFile?.type)}
          className="text-purple-500 text-lg"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sizeLabel}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove file"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 cursor-pointer"
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </div>
  );
}
