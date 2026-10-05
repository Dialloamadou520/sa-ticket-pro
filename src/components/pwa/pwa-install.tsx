"use client";

import { useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Share, SquarePlus, X } from "lucide-react";
import {
  dismissInstall,
  promptInstall,
  useInstallDismissed,
  useInstallState,
} from "./install-store";

const HIDDEN_PREFIXES = ["/evenements/", "/scanner", "/controle", "/paiement", "/hors-ligne"];

export function PwaInstall() {
  const pathname = usePathname();
  const state = useInstallState();
  const dismissed = useInstallDismissed();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {});
  }, []);

  const hidden =
    dismissed ||
    (state !== "prompt" && state !== "ios") ||
    HIDDEN_PREFIXES.some((p) => pathname.startsWith(p));
  if (hidden) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-40 md:hidden">
      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
        <Image
          src="/icon-192.png"
          alt=""
          width={44}
          height={44}
          className="shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">
            Installer l&apos;application kaypass
          </p>
          {state === "prompt" ? (
            <p className="text-xs text-slate-500">
              Accès direct à vos billets depuis l&apos;écran d&apos;accueil.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Touchez <Share className="inline h-3.5 w-3.5 align-[-2px]" />{" "}
              Partager, puis{" "}
              <span className="whitespace-nowrap font-medium text-slate-700">
                <SquarePlus className="inline h-3.5 w-3.5 align-[-2px]" /> Sur
                l&apos;écran d&apos;accueil
              </span>
              .
            </p>
          )}
          {state === "prompt" && (
            <button
              type="button"
              onClick={() => promptInstall()}
              className="mt-2 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Installer
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={dismissInstall}
          aria-label="Fermer"
          className="-m-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
