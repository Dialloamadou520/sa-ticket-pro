"use client";

import { useState } from "react";

export function ExpandableText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const long = text.length > 320 || text.split("\n").length > 6;

  return (
    <div>
      <p
        className={`whitespace-pre-line ${long && !open ? "line-clamp-6" : ""} ${className}`}
      >
        {text}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="mt-2 text-sm font-semibold text-brand-700 hover:underline"
        >
          {open ? "Voir moins" : "Lire la suite"}
        </button>
      )}
    </div>
  );
}
