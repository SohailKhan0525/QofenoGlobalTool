import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSliders, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ToolSettingsProps = {
  toolSlug: string;
  onChange: (settings: Record<string, any>) => void;
};

// PDF Compress Settings
function PDFCompressSettings({ onChange }: { onChange: (s: any) => void }) {
  const [level, setLevel] = useState('medium');

  const levels = [
    { value: 'low', label: 'Low', sub: 'Best quality, slight reduction' },
    { value: 'medium', label: 'Medium', sub: 'Balanced — recommended' },
    { value: 'high', label: 'High', sub: 'Smaller file, lower quality' },
    { value: 'maximum', label: 'Maximum', sub: 'Smallest possible file' },
  ];

  useEffect(() => {
    onChange({ compression_level: level });
  }, [level, onChange]);

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-xs font-semibold text-gray-600">Compression Level</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <FontAwesomeIcon icon={faCircleInfo} className="text-gray-300 text-xs cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-[200px] leading-relaxed">
                Higher compression = smaller file size, but slightly lower visual detail. Medium works best for most PDFs.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {levels.map(l => (
          <button
            key={l.value}
            type="button"
            onClick={() => setLevel(l.value)}
            className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
              level === l.value ? 'border-purple-500 bg-purple-50' : 'border-gray-100 hover:border-purple-200'
            }`}
          >
            <p className={`text-sm font-semibold ${level === l.value ? 'text-purple-700' : 'text-gray-700'}`}>
              {l.label}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">{l.sub}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// Image Resize Settings
function ImageResizeSettings({ onChange }: { onChange: (s: any) => void }) {
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [maintainAspect, setMaintainAspect] = useState(true);

  useEffect(() => {
    onChange({ width, height, maintain_aspect_ratio: maintainAspect });
  }, [width, height, maintainAspect, onChange]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Width (px)</label>
          <input
            type="number"
            value={width}
            onChange={e => setWidth(parseInt(e.target.value) || 0)}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Height (px)</label>
          <input
            type="number"
            value={height}
            onChange={e => setHeight(parseInt(e.target.value) || 0)}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={maintainAspect}
          onChange={e => setMaintainAspect(e.target.checked)}
          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300"
        />
        <span className="text-xs font-medium text-gray-600">Maintain Aspect Ratio</span>
      </label>
    </div>
  );
}

// Video Compress Settings
function VideoCompressSettings({ onChange }: { onChange: (s: any) => void }) {
  const [quality, setQuality] = useState('medium');

  useEffect(() => {
    onChange({ quality });
  }, [quality, onChange]);

  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 mb-2 block">Target Video Quality</label>
      <div className="grid grid-cols-3 gap-2">
        {['low', 'medium', 'high'].map(q => (
          <button
            key={q}
            type="button"
            onClick={() => setQuality(q)}
            className={`py-2.5 px-3 rounded-xl border-2 text-sm font-semibold capitalize transition-all cursor-pointer ${
              quality === q ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-100 text-gray-700 hover:border-purple-200'
            }`}
          >
            {q} Quality
          </button>
        ))}
      </div>
    </div>
  );
}

export function ToolSettings({ toolSlug, onChange }: ToolSettingsProps) {
  const settingsMap: Record<string, React.ComponentType<{ onChange: (s: any) => void }>> = {
    'pdf-compress': PDFCompressSettings,
    'pdf-compressor': PDFCompressSettings,
    'image-resize': ImageResizeSettings,
    'image-resizer': ImageResizeSettings,
    'video-compress': VideoCompressSettings,
    'video-compressor': VideoCompressSettings,
  };

  const SettingsComponent = settingsMap[toolSlug];
  if (!SettingsComponent) return null;

  return (
    <div className="p-4 sm:p-5 bg-white border border-gray-100 rounded-2xl shadow-sm animate-slide-up">
      <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <FontAwesomeIcon icon={faSliders} className="text-purple-500" />
        Tool Settings
      </p>
      <SettingsComponent onChange={onChange} />
    </div>
  );
}
