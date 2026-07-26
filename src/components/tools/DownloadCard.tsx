import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faDownload, faRotateLeft, faLock, faClock } from '@fortawesome/free-solid-svg-icons';
import { trackDownload } from '../../lib/analytics';
import { usePlan } from '../../hooks/usePlan';

function formatBytes(bytes: number, decimals = 2) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function DownloadCard({
  result,
  onReset
}: {
  result: {
    download_url?: string;
    output_filename?: string;
    output_size?: number;
    reduction_percent?: number;
    tool_slug?: string;
  };
  onReset: () => void;
}) {
  const [clicked, setClicked] = useState(false);
  const { isPro, isTeams } = usePlan();

  const handleDownload = () => {
    setClicked(true);
    if (result.download_url) {
      window.open(result.download_url, "_blank");
    }
    trackDownload(result.tool_slug || 'general-tool', result.output_size || 0);
  };

  return (
    <div className="w-full mt-5 p-5 md:p-6 rounded-3xl bg-green-50 border-2 border-green-200 shadow-sm">
      {/* Success header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
          <FontAwesomeIcon icon={faCheck} className="text-white text-lg" />
        </div>
        <div>
          <p className="font-bold text-green-800 text-base">
            Your file is ready!
          </p>
          <p className="text-sm text-green-600 mt-0.5">
            {result.output_filename || 'Processed File'} · {formatBytes(result.output_size || 0)}
            {result.reduction_percent && result.reduction_percent > 0 ? (
              <span className="ml-2 text-green-700 font-medium">
                ({result.reduction_percent}% smaller)
              </span>
            ) : null}
          </p>
        </div>
      </div>

      {/* Download button */}
      <button
        type="button"
        onClick={handleDownload}
        className={`
          w-full py-4 md:py-5 rounded-2xl font-bold text-lg md:text-xl cursor-pointer
          flex items-center justify-center gap-3 transition-all duration-200
          active:scale-[0.98] mb-3
          ${clicked
            ? "bg-green-600 text-white"
            : "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200"
          }
        `}
      >
        <FontAwesomeIcon icon={faDownload} />
        {clicked ? "Downloading..." : `Download ${result.output_filename || 'File'}`}
      </button>

      {/* Process another */}
      <button
        type="button"
        onClick={onReset}
        className="w-full py-2.5 text-sm text-purple-600 font-bold cursor-pointer hover:text-purple-800 transition-colors"
      >
        <FontAwesomeIcon icon={faRotateLeft} className="mr-1.5" />
        Process another file
      </button>

      {/* Retention policy note */}
      <div className="mt-3 pt-3 border-t border-green-200/60 flex items-center justify-center text-xs text-green-800 font-medium gap-1.5">
        <FontAwesomeIcon icon={faClock} className={isPro || isTeams ? "text-purple-600" : "text-amber-600"} />
        {isPro || isTeams ? (
          <span><strong>Pro Retention:</strong> Input kept for 6 days • Result kept for 7 days</span>
        ) : (
          <span><strong>Free Plan:</strong> Result auto-deleted after download</span>
        )}
      </div>
    </div>
  );
}
