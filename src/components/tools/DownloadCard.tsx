import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faDownload, faRotateLeft, faLock } from '@fortawesome/free-solid-svg-icons';

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

type DownloadCardProps = {
  result: {
    download_url?: string;
    downloadUrl?: string;
    output_filename?: string;
    output_size?: number;
    reduction_percent?: number;
  };
  onReset: () => void;
};

export function DownloadCard({ result, onReset }: DownloadCardProps) {
  const url = result?.download_url || result?.downloadUrl;
  const filename = result?.output_filename || 'download_result';

  useEffect(() => {
    if (url) {
      try {
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.warn('Auto-open download blocked by browser pop-up blocker:', e);
      }
    }
  }, [url]);

  return (
    <div className="w-full mt-5 p-5 sm:p-6 bg-green-50 border-2 border-green-200 rounded-3xl animate-slide-up">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-green-200">
          <FontAwesomeIcon icon={faCheck} className="text-white text-lg" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-green-800 text-sm sm:text-base">
            Your file is ready!
          </p>
          <p className="text-xs sm:text-sm text-green-600 mt-0.5 truncate">
            {filename}
            {result.output_size ? ` · ${formatBytes(result.output_size)}` : ''}
            {Boolean(result.reduction_percent && result.reduction_percent > 0) && (
              <span className="ml-2 font-semibold">
                ↓ {result.reduction_percent}% smaller
              </span>
            )}
          </p>
        </div>
      </div>

      <a
        href={url}
        download={filename}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-3 w-full py-4 sm:py-5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-base sm:text-xl rounded-2xl shadow-lg shadow-purple-200 transition-colors duration-150 active:scale-[0.98] mb-3"
      >
        <FontAwesomeIcon icon={faDownload} />
        Download {filename}
      </a>

      <button
        type="button"
        onClick={onReset}
        className="w-full py-2.5 text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        <FontAwesomeIcon icon={faRotateLeft} />
        Process another file
      </button>

      <p className="text-xs text-center text-gray-400 mt-3 flex items-center justify-center gap-1.5">
        <FontAwesomeIcon icon={faLock} className="text-green-500" />
        File permanently deleted from our servers after download
      </p>
    </div>
  );
}
