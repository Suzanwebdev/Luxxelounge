"use client";

import * as React from "react";

export function ProductVideoGallery({ title, videos }: { title: string; videos: string[] }) {
  const list = videos.filter(Boolean);
  if (list.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-2xl">Video</h2>
      <ul className="space-y-4">
        {list.map((src, i) => (
          <li
            key={`${src}-${i}`}
            className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
          >
            <video
              className="aspect-video w-full bg-black/90"
              controls
              playsInline
              preload="metadata"
              title={`${title} — clip ${i + 1}`}
            >
              <source src={src} />
              Your browser does not support embedded video.
            </video>
          </li>
        ))}
      </ul>
    </div>
  );
}
