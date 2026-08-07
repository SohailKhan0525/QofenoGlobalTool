import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faLink } from '@fortawesome/free-solid-svg-icons';
import { faXTwitter, faLinkedin, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { toast } from 'sonner';

interface ShareButtonProps {
  toolName: string;
  toolSlug: string;
}

export function ShareButton({ toolName, toolSlug }: ShareButtonProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const baseUrl = window.location.origin || process.env.VITE_APP_URL || 'https://qofeno-labs.pages.dev';
  const url = `${baseUrl}/tools/${toolSlug}`;
  const text = `Try ${toolName} — free online tool on Qofeno`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = (platform: 'twitter' | 'linkedin' | 'whatsapp') => {
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`,
    };
    window.open(urls[platform], '_blank', 'noopener,noreferrer,width=600,height=450');
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-neutral-400">Share:</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleShare('twitter')}
          title="Share on X (Twitter)"
          className="w-8 h-8 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/60 flex items-center justify-center text-neutral-600 hover:text-purple-600 transition-colors cursor-pointer"
        >
          <FontAwesomeIcon icon={faXTwitter} className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleShare('linkedin')}
          title="Share on LinkedIn"
          className="w-8 h-8 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/60 flex items-center justify-center text-neutral-600 hover:text-purple-600 transition-colors cursor-pointer"
        >
          <FontAwesomeIcon icon={faLinkedin} className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleShare('whatsapp')}
          title="Share on WhatsApp"
          className="w-8 h-8 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/60 flex items-center justify-center text-neutral-600 hover:text-purple-600 transition-colors cursor-pointer"
        >
          <FontAwesomeIcon icon={faWhatsapp} className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy link"
          className="w-8 h-8 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/60 flex items-center justify-center text-neutral-600 hover:text-purple-600 transition-colors cursor-pointer"
        >
          <FontAwesomeIcon
            icon={copied ? faCheck : faLink}
            className={`w-3.5 h-3.5 ${copied ? 'text-emerald-500' : 'text-neutral-500'}`}
          />
        </button>
      </div>
    </div>
  );
}
