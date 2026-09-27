"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FaqItem {
  q: string;
  a: string;
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={cn(
              "overflow-hidden rounded-2xl border bg-white transition-colors",
              isOpen
                ? "border-brand-300 shadow-sm ring-1 ring-brand-100"
                : "border-slate-200 hover:border-brand-200"
            )}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5"
            >
              <span
                className={cn(
                  "font-semibold",
                  isOpen ? "text-brand-800" : "text-slate-900"
                )}
              >
                {item.q}
              </span>
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all",
                  isOpen
                    ? "rotate-45 bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                <Plus className="h-4 w-4" />
              </span>
            </button>
            {isOpen && (
              <p className="border-t border-slate-100 px-4 py-4 text-sm leading-relaxed text-slate-600 sm:px-5">
                {item.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
