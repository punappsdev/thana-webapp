"use client";

import { Share2 } from "lucide-react";

interface ShareButtonProps {
  label: string;
}

export function ShareButton({ label }: ShareButtonProps) {
  const handleShare = async () => {
    const shareData = {
      title: document.title,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled or share failed — silent
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
      } catch {
        // clipboard unavailable — silent
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={label}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#c4e2f5] text-primary font-label-sm font-semibold hover:bg-primary/5 hover:border-primary/40 transition-all"
    >
      <Share2 className="h-4 w-4" />
      {label}
    </button>
  );
}