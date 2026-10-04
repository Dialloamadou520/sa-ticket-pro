"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import {
  Camera,
  CheckCircle2,
  ScanLine,
  XCircle,
  Clock,
  Keyboard,
  CameraOff,
  History,
  Ticket as TicketIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/format";

type Result = {
  result: "valid" | "already_used" | "invalid";
  holder?: string;
  event?: string;
  message?: string;
  usedAt?: string | null;
  usedBy?: string | null;
  ticketsTotal?: number;
  ticketsScanned?: number;
  ticketsRemaining?: number;
};

type Counter = {
  event: string;
  total: number;
  scanned: number;
  remaining: number;
};

type HistoryEntry = {
  id: number;
  at: Date;
  result: Result["result"];
  label: string;
};

const RESUME_DELAY_MS = 1800;
const FLASH_OK_MS = 1500;
const FLASH_KO_MS = 2600;
const DUPLICATE_WINDOW_MS = 4000;

function extractToken(value: string): string {
  const trimmed = value.trim();
  if (trimmed.includes("/verifier/")) {
    return trimmed.split("/verifier/").pop()?.split(/[?#]/)[0] ?? trimmed;
  }
  return trimmed;
}

function cameraErrorMessage(err: unknown): string {
  const name = err instanceof Error ? err.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Accès caméra refusé. Autorisez la caméra dans les réglages du navigateur (icône cadenas dans la barre d'adresse), puis réessayez.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "Aucune caméra détectée sur cet appareil. Utilisez la saisie manuelle.";
    case "NotReadableError":
      return "La caméra est déjà utilisée par une autre application. Fermez-la et réessayez.";
    default:
      return "Impossible d'accéder à la caméra. Vérifiez que vous êtes en https et que la caméra est autorisée, ou utilisez la saisie manuelle.";
  }
}

/** Vibration + bip court : le contrôleur n'a pas toujours l'écran sous les yeux. */
function feedback(ok: boolean) {
  navigator.vibrate?.(ok ? 60 : [50, 60, 50]);
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = ok ? 880 : 240;
    gain.gain.value = 0.05;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (ok ? 0.12 : 0.28));
    osc.onended = () => void ctx.close();
  } catch {
    /* audio indisponible */
  }
}

export function ScannerClient() {
  const [result, setResult] = useState<Result | null>(null);
  const [counter, setCounter] = useState<Counter | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [flash, setFlash] = useState<{ id: number; result: Result } | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [continuous, setContinuous] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const continuousRef = useRef(continuous);
  const lastScanRef = useRef<{ token: string; at: number } | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    continuousRef.current = continuous;
  }, [continuous]);

  useEffect(
    () => () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    []
  );

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(
      () => setFlash(null),
      flash.result.result === "valid" ? FLASH_OK_MS : FLASH_KO_MS
    );
    return () => clearTimeout(timer);
  }, [flash]);

  async function verify(token: string) {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tickets/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: extractToken(token) }),
      });
      const data = (await res.json()) as Result & { error?: string };
      const next: Result = data.result
        ? data
        : { result: "invalid", message: data.error ?? "Vérification impossible." };

      setResult(next);
      setFlash({ id: Date.now(), result: next });
      feedback(next.result === "valid");
      setHistory((prev) =>
        [
          {
            id: Date.now(),
            at: new Date(),
            result: next.result,
            label: next.holder ?? next.event ?? extractToken(token).slice(0, 8).toUpperCase(),
          },
          ...prev,
        ].slice(0, 6)
      );

      if (
        next.event &&
        typeof next.ticketsTotal === "number" &&
        typeof next.ticketsScanned === "number" &&
        typeof next.ticketsRemaining === "number"
      ) {
        setCounter({
          event: next.event,
          total: next.ticketsTotal,
          scanned: next.ticketsScanned,
          remaining: next.ticketsRemaining,
        });
      }
    } catch {
      const failed: Result = { result: "invalid", message: "Erreur réseau." };
      setResult(failed);
      setFlash({ id: Date.now(), result: failed });
      feedback(false);
    } finally {
      setLoading(false);
    }
  }

  async function startCamera() {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "L'accès caméra nécessite une connexion sécurisée (https) et un navigateur compatible. Utilisez la saisie manuelle."
      );
      return;
    }

    // Détecteur natif (rapide) si disponible, sinon repli jsQR (compatible iOS).
    const Detector = (
      globalThis as unknown as {
        BarcodeDetector?: new (o: { formats: string[] }) => {
          detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]>;
        };
      }
    ).BarcodeDetector;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        // "ideal" plutôt que strict : si la caméra arrière n'existe pas
        // (ex. ordinateur portable), on retombe sur la caméra frontale.
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
    } catch (err) {
      setCameraError(cameraErrorMessage(err));
      return;
    }

    streamRef.current = stream;
    // Important : on monte d'abord l'élément <video> (cameraOn=true) AVANT
    // d'attacher le flux, sinon videoRef.current est null au montage.
    setCameraOn(true);

    const detector = Detector ? new Detector({ formats: ["qr_code"] }) : null;

    const onCode = (raw: string) => {
      const token = extractToken(raw);
      const last = lastScanRef.current;
      if (last && last.token === token && Date.now() - last.at < DUPLICATE_WINDOW_MS) {
        return false;
      }
      lastScanRef.current = { token, at: Date.now() };
      stopCamera();
      verify(token);
      if (continuousRef.current) {
        resumeTimerRef.current = setTimeout(startCamera, RESUME_DELAY_MS);
      }
      return true;
    };

    const tick = async () => {
      const video = videoRef.current;
      if (!video || !streamRef.current) return;
      try {
        if (detector) {
          const codes = await detector.detect(video);
          if (codes[0]?.rawValue && onCode(codes[0].rawValue)) return;
        } else if (video.readyState === video.HAVE_ENOUGH_DATA) {
          const canvas = (canvasRef.current ??= document.createElement("canvas"));
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx && canvas.width && canvas.height) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(img.data, img.width, img.height, {
              inversionAttempts: "dontInvert",
            });
            if (code?.data && onCode(code.data)) return;
          }
        }
      } catch {
        /* ignore frame errors */
      }
      requestAnimationFrame(tick);
    };

    // Attache le flux et démarre la lecture une fois l'élément monté.
    requestAnimationFrame(async () => {
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      try {
        await video.play();
      } catch {
        /* la lecture démarrera via autoPlay/onLoadedMetadata */
      }
      requestAnimationFrame(tick);
    });
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }

  function stopScanning() {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = null;
    stopCamera();
  }

  return (
    <div className="space-y-4">
      {flash && (
        <StatusFlash
          key={flash.id}
          result={flash.result}
          onClose={() => setFlash(null)}
        />
      )}
      {result && <ResultCard result={result} />}
      {counter && <CounterCard counter={counter} />}

      <div className="overflow-hidden rounded-3xl bg-slate-950 shadow-xl ring-1 ring-slate-900/10">
        <div className="relative aspect-square overflow-hidden sm:aspect-video">
          {/* L'élément vidéo reste monté en permanence : sinon videoRef est
              null au moment d'attacher le flux et la caméra reste noire. */}
          <video
            ref={videoRef}
            className={`h-full w-full object-cover ${cameraOn ? "" : "hidden"}`}
            muted
            autoPlay
            playsInline
          />
          {cameraOn ? (
            <Viewfinder />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_50%_30%,#1e293b,#020617)] px-6 text-slate-400">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                <ScanLine className="h-8 w-8" />
              </span>
              <p className="text-sm font-semibold text-slate-200">
                {loading ? "Vérification…" : "Caméra en veille"}
              </p>
              <p className="max-w-xs text-center text-xs text-slate-500">
                {continuous
                  ? "Le scan reprend automatiquement après chaque ticket."
                  : "Activez la caméra pour scanner le QR code du ticket."}
              </p>
            </div>
          )}

          <span
            className={`absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur ${
              cameraOn
                ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/40"
                : "bg-white/10 text-slate-300 ring-1 ring-white/15"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                cameraOn ? "animate-pulse bg-emerald-400" : "bg-slate-400"
              }`}
            />
            {cameraOn ? "Scan en cours" : "En pause"}
          </span>
        </div>

        <div className="space-y-3 border-t border-white/5 p-3 sm:p-4">
          {cameraError && (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300 ring-1 ring-red-400/20">
              {cameraError}
            </p>
          )}
          {cameraOn ? (
            <Button variant="danger" size="lg" className="w-full" onClick={stopScanning}>
              <CameraOff className="h-4 w-4" />
              Arrêter la caméra
            </Button>
          ) : (
            <Button size="lg" className="w-full" onClick={startCamera}>
              <Camera className="h-4 w-4" />
              Scanner avec la caméra
            </Button>
          )}

          <label className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2.5 text-sm text-slate-300">
            <span>
              Scan continu
              <span className="block text-[11px] text-slate-500">
                Enchaîner les tickets sans rappuyer
              </span>
            </span>
            <input
              type="checkbox"
              checked={continuous}
              onChange={(e) => setContinuous(e.target.checked)}
              className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-slate-700 transition-colors before:block before:h-4 before:w-4 before:translate-x-0.5 before:rounded-full before:bg-white before:transition-transform checked:bg-brand-500 checked:before:translate-x-[1.125rem]"
            />
          </label>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const input = new FormData(e.currentTarget).get("token");
          verify(String(input));
        }}
        className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Keyboard className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-slate-800">
              Saisie manuelle du code
            </p>
            <p className="text-xs text-slate-400">
              « Référence » du ticket (ex. A1B2C3D4) ou lien du QR code.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input name="token" placeholder="Référence ou lien du ticket" />
          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="w-full sm:h-11 sm:w-auto"
          >
            {loading ? "..." : "Vérifier"}
          </Button>
        </div>
      </form>

      {history.length > 0 && <HistoryCard entries={history} />}
    </div>
  );
}

function CounterCard({ counter }: { counter: Counter }) {
  const { event, total, scanned, remaining } = counter;
  const pct = total > 0 ? Math.round((scanned / total) * 100) : 0;
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-2 text-slate-800">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <TicketIcon className="h-4 w-4" />
        </span>
        <p className="truncate text-sm font-medium">{event}</p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-brand-50 py-3 ring-1 ring-brand-100">
          <p className="text-2xl font-bold text-brand-700">{remaining}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">Restants</p>
        </div>
        <div className="rounded-2xl bg-slate-50 py-3 ring-1 ring-slate-100">
          <p className="text-2xl font-bold text-slate-900">{scanned}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">Scannés</p>
        </div>
        <div className="rounded-2xl bg-slate-50 py-3 ring-1 ring-slate-100">
          <p className="text-2xl font-bold text-slate-900">{total}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">Total</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-slate-500">{pct} %</span>
      </div>
    </div>
  );
}

function Viewfinder() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />
      <div className="absolute left-1/2 top-1/2 h-3/5 w-3/5 -translate-x-1/2 -translate-y-1/2">
        <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-xl border-l-4 border-t-4 border-brand-300" />
        <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-xl border-r-4 border-t-4 border-brand-300" />
        <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-xl border-b-4 border-l-4 border-brand-300" />
        <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-xl border-b-4 border-r-4 border-brand-300" />
        <span className="animate-scan-line absolute left-2 right-2 h-0.5 rounded-full bg-brand-400 shadow-[0_0_12px_2px] shadow-brand-400/70" />
      </div>
      <p className="absolute inset-x-0 bottom-3 text-center text-xs font-medium text-white/80">
        Alignez le QR code dans le cadre
      </p>
    </div>
  );
}

const RESULT_STYLE = {
  valid: {
    icon: CheckCircle2,
    card: "from-emerald-500 to-brand-600",
    title: "Entrée autorisée",
  },
  already_used: {
    icon: Clock,
    card: "from-rose-500 to-red-600",
    title: "Déjà utilisé",
  },
  invalid: {
    icon: XCircle,
    card: "from-rose-500 to-red-600",
    title: "Ticket invalide",
  },
} as const;

/** Écran plein vert / rouge : lisible à bout de bras, sans regarder le détail. */
function StatusFlash({
  result,
  onClose,
}: {
  result: Result;
  onClose: () => void;
}) {
  const ok = result.result === "valid";
  const Icon = RESULT_STYLE[result.result].icon;
  return (
    <button
      type="button"
      onClick={onClose}
      aria-live="assertive"
      className={`animate-flash-in fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 px-6 text-center text-white ${
        ok ? "bg-emerald-500" : "bg-red-600"
      }`}
    >
      <span className="flex h-32 w-32 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/40">
        <Icon className="h-20 w-20" strokeWidth={2.5} />
      </span>
      <span className="text-5xl font-black tracking-tight sm:text-6xl">
        {ok ? "VALIDE" : "REFUSÉ"}
      </span>
      <span className="text-xl font-semibold">
        {RESULT_STYLE[result.result].title}
      </span>
      {result.holder && (
        <span className="max-w-full truncate text-lg text-white/90">
          {result.holder}
        </span>
      )}
      {result.usedAt ? (
        <span className="rounded-xl bg-black/20 px-3 py-1.5 text-sm font-semibold">
          Utilisé le {formatDate(result.usedAt, "d MMMM yyyy")} à{" "}
          {formatTime(result.usedAt)}
        </span>
      ) : (
        !ok &&
        result.message && (
          <span className="text-sm text-white/85">{result.message}</span>
        )
      )}
      <span className="absolute inset-x-0 bottom-8 text-xs font-medium text-white/70">
        Touchez l&apos;écran pour fermer
      </span>
    </button>
  );
}

function ResultCard({ result }: { result: Result }) {
  const config = RESULT_STYLE[result.result];
  const Icon = config.icon;

  return (
    <div
      className={`animate-pop-in flex items-center gap-3 rounded-3xl bg-gradient-to-r p-4 text-white shadow-lg sm:gap-4 sm:p-5 ${config.card}`}
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30">
        <Icon className="h-7 w-7" />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight">{config.title}</p>
        {result.event && (
          <p className="truncate text-sm text-white/90">{result.event}</p>
        )}
        {result.holder && (
          <p className="truncate text-sm font-medium text-white/80">
            {result.holder}
          </p>
        )}
        {result.usedAt ? (
          <p className="mt-1.5 inline-block rounded-lg bg-black/20 px-2 py-1 text-xs font-semibold">
            Utilisé le {formatDate(result.usedAt, "d MMMM yyyy")} à{" "}
            {formatTime(result.usedAt)}
            {result.usedBy ? ` · par ${result.usedBy}` : ""}
          </p>
        ) : (
          result.message && (
            <p className="mt-1 text-xs text-white/80">{result.message}</p>
          )
        )}
      </div>
    </div>
  );
}

function HistoryCard({ entries }: { entries: HistoryEntry[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-2 text-slate-800">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <History className="h-4 w-4" />
        </span>
        <p className="text-sm font-medium">Derniers scans</p>
      </div>
      <ul className="mt-3 divide-y divide-slate-100">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-center gap-3 py-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                entry.result === "valid"
                  ? "bg-emerald-500"
                  : "bg-red-500"
              }`}
            />
            <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
              {entry.label}
            </span>
            <span className="shrink-0 font-mono text-xs text-slate-400">
              {entry.at.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
