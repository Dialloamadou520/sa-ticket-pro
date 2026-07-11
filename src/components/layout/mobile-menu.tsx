"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  Compass,
  HelpCircle,
  Home,
  Mail,
  Menu,
  PlusCircle,
  X,
  type LucideIcon,
} from "lucide-react";
import { SITE } from "@/lib/constants";

interface NavLink {
  label: string;
  href: string;
}

const ICONS: Record<string, LucideIcon> = {
  "/": Home,
  "/explorer": Compass,
  "/dashboard/evenements/nouveau": PlusCircle,
  "/contact": Mail,
  "/faq": HelpCircle,
};

export function MobileMenu({
  links,
  isAuthed,
}: {
  links: NavLink[];
  isAuthed: boolean;
}) {
  const [open, setOpen] = useState(false);
  // true uniquement côté client (sans setState dans un effet) → permet le portail.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const overlay = (
    <>
      {/* Fond assombri */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panneau coulissant */}
      <div
        role="dialog"
        aria-modal="true"
        className={`fixed right-0 top-0 z-50 flex h-full w-80 max-w-[85%] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center"
            aria-label={SITE.name}
          >
            <Image
              src="/logo-kaypass.png"
              alt={SITE.name}
              width={2086}
              height={520}
              className="h-7 w-auto"
            />
          </Link>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fermer le menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {links.map((link) => {
            const Icon = ICONS[link.href] ?? ChevronRight;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium text-slate-800 transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Icon className="h-5 w-5" />
                </span>
                {link.label}
                <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
              </Link>
            );
          })}
        </nav>

        {!isAuthed && (
          <div className="flex flex-col gap-2 border-t border-slate-200 p-4">
            <Link
              href="/connexion"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-3 text-center font-medium text-slate-700 hover:bg-slate-50"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              onClick={() => setOpen(false)}
              className="rounded-xl bg-brand-600 px-4 py-3 text-center font-medium text-white hover:bg-brand-700"
            >
              Inscription
            </Link>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Rendu via portail pour échapper au containing-block créé par le backdrop-blur du header */}
      {mounted && createPortal(overlay, document.body)}
    </div>
  );
}
