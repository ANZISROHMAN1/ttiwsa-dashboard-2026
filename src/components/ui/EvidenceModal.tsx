"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

export interface EvidenceItem {
  url: string;
  label: string;
}

interface EvidenceModalProps {
  /** Array of evidence items. Empty/falsy items should be pre-filtered. */
  evidenceList: EvidenceItem[];
  onClose: () => void;
}

/** Convert GDrive links to preview iframe URL */
function getDrivePreviewUrl(url: string): string {
  let id = "";
  const matchD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD) id = matchD[1];
  else {
    const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchId) id = matchId[1];
  }
  if (id) return `https://drive.google.com/file/d/${id}/preview`;
  return url;
}

export function EvidenceModal({ evidenceList, onClose }: EvidenceModalProps) {
  // Filter to only valid URLs just in case
  const items = evidenceList.filter((item) => item.url && item.url.startsWith("http"));
  const [currentIndex, setCurrentIndex] = useState(0);
  const total = items.length;

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev]);

  if (total === 0 || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-[var(--surface)] rounded-xl shadow-2xl p-4 w-full max-w-4xl h-[85vh] flex flex-col border border-[var(--border)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-foreground text-lg">
              Evidence Preview
            </h3>
            {total > 0 && (
              <span className="text-sm text-foreground-secondary font-medium bg-[var(--surface-hover)] px-3 py-1 rounded-md">
                {items[currentIndex].label}
              </span>
            )}
            {total > 1 && (
              <span className="text-sm text-foreground-muted font-medium bg-[var(--surface-hover)] px-3 py-1 rounded-full">
                {currentIndex + 1} / {total}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--surface-hover)] rounded-lg text-foreground-muted hover:text-foreground transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Iframe Content */}
        <div className="relative flex-1 min-h-0">
          <iframe
            key={currentIndex}
            src={getDrivePreviewUrl(items[currentIndex].url)}
            className="w-full h-full rounded-lg border border-[var(--border)] bg-white"
            allow="autoplay"
          />

          {/* Left Arrow */}
          {total > 1 && (
            <button
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-all shadow-lg backdrop-blur-sm"
              aria-label="Previous evidence"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          )}

          {/* Right Arrow */}
          {total > 1 && (
            <button
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-all shadow-lg backdrop-blur-sm"
              aria-label="Next evidence"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          )}
        </div>

        {/* Dot Indicators */}
        {total > 1 && (
          <div className="flex items-center justify-center gap-2 mt-3">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                  i === currentIndex
                    ? "bg-accent-blue scale-125 shadow-sm shadow-blue-500/30"
                    : "bg-[var(--surface-active)] hover:bg-[var(--foreground-muted)]"
                }`}
                aria-label={`Go to evidence ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
