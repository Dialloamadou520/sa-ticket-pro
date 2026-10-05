import { useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallState = "standalone" | "prompt" | "ios" | "none";

const DISMISS_KEY = "kaypass-install-dismissed";
const DISMISS_MS = 14 * 24 * 60 * 60 * 1000;

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    emit();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function isStandalone() {
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    installed ||
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

function getState(): InstallState {
  if (isStandalone()) return "standalone";
  if (deferred) return "prompt";
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return "ios";
  return "none";
}

function getDismissed(): boolean {
  const at = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
  return Date.now() - at < DISMISS_MS;
}

export function useInstallState(): InstallState {
  return useSyncExternalStore(subscribe, getState, () => "none");
}

export function useInstallDismissed(): boolean {
  return useSyncExternalStore(subscribe, getDismissed, () => true);
}

export function dismissInstall() {
  localStorage.setItem(DISMISS_KEY, String(Date.now()));
  emit();
}

export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const event = deferred;
  await event.prompt();
  const { outcome } = await event.userChoice;
  deferred = null;
  emit();
  return outcome === "accepted";
}
