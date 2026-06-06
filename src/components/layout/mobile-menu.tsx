"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface NavLink {
  label: string;
  href: string;
}

export function MobileMenu({
  links,
  isAuthed,
}: {
  links: NavLink[];
  isAuthed: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
      >
        <Menu className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            <span className="font-bold text-slate-900">Menu</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer le menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex flex-col gap-1 p-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-100"
              >
                {link.label}
              </Link>
            ))}
            {!isAuthed && (
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/connexion"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-center font-medium"
                >
                  Connexion
                </Link>
                <Link
                  href="/inscription"
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-brand-600 px-4 py-3 text-center font-medium text-white"
                >
                  Inscription
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
