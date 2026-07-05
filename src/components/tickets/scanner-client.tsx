"use client";

import { useRef, useState } from "react";
import jsQR from "jsqr";
import {
  Camera,
  CheckCircle2,
  ScanLine,
  XCircle,
  Clock,
  Keyboard,
  CameraOff,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Result = {
  result: "valid" | "already_used" | "invalid";
  holder?: string;
  event?: string;
  message?: string;
};

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

export function ScannerClient() {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
      if (!data.result) {
        setResult({ result: "invalid", message: data.error ?? "Vérification impossible." });
      } else {
        setResult(data);
      }
    } catch {
      setResult({ result: "invalid", message: "Erreur réseau." });
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

    const tick = async () => {
      const video = videoRef.current;
      if (!video || !streamRef.current) return;
      try {
        if (detector) {
          const codes = await detector.detect(video);
          if (codes[0]?.rawValue) {
            stopCamera();
            verify(codes[0].rawValue);
            return;
          }
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
            if (code?.data) {
              stopCamera();
              verify(code.data);
              return;
            }
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

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative aspect-square overflow-hidden bg-slate-950 sm:aspect-video">
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
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                <ScanLine className="h-8 w-8" />
              </span>
              <p className="text-sm font-medium">Caméra désactivée</p>
              <p className="max-w-xs text-center text-xs text-slate-500">
                Activez la caméra pour scanner le QR code du ticket.
              </p>
            </div>
          )}
        </div>
        <div className="p-4">
          {cameraError && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {cameraError}
            </p>
          )}
          {cameraOn ? (
            <Button variant="danger" className="w-full" onClick={stopCamera}>
              <CameraOff className="h-4 w-4" />
              Arrêter la caméra
            </Button>
          ) : (
            <Button className="w-full" onClick={startCamera}>
              <Camera className="h-4 w-4" />
              Scanner avec la caméra
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        ou
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const input = new FormData(e.currentTarget).get("token");
          verify(String(input));
        }}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
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
        <div className="flex gap-2">
          <Input name="token" placeholder="Référence ou lien du ticket" />
          <Button type="submit" disabled={loading}>
            {loading ? "..." : "Vérifier"}
          </Button>
        </div>
      </form>

      {result && <ResultCard result={result} />}
    </div>
  );
}

function Viewfinder() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30" />
      <div className="absolute left-1/2 top-1/2 h-3/5 w-3/5 -translate-x-1/2 -translate-y-1/2">
        <span className="absolute left-0 top-0 h-7 w-7 rounded-tl-lg border-l-4 border-t-4 border-white/90" />
        <span className="absolute right-0 top-0 h-7 w-7 rounded-tr-lg border-r-4 border-t-4 border-white/90" />
        <span className="absolute bottom-0 left-0 h-7 w-7 rounded-bl-lg border-b-4 border-l-4 border-white/90" />
        <span className="absolute bottom-0 right-0 h-7 w-7 rounded-br-lg border-b-4 border-r-4 border-white/90" />
        <span className="animate-scan-line absolute left-2 right-2 h-0.5 rounded-full bg-brand-400 shadow-[0_0_12px_2px] shadow-brand-400/70" />
      </div>
      <p className="absolute inset-x-0 bottom-3 text-center text-xs font-medium text-white/80">
        Alignez le QR code dans le cadre
      </p>
    </div>
  );
}

function ResultCard({ result }: { result: Result }) {
  const config = {
    valid: {
      icon: CheckCircle2,
      color: "text-brand-700",
      bg: "bg-brand-50 border-brand-200",
      tile: "bg-brand-600",
      title: "Entrée autorisée",
    },
    already_used: {
      icon: Clock,
      color: "text-amber-700",
      bg: "bg-amber-50 border-amber-200",
      tile: "bg-amber-500",
      title: "Déjà utilisé",
    },
    invalid: {
      icon: XCircle,
      color: "text-red-700",
      bg: "bg-red-50 border-red-200",
      tile: "bg-red-600",
      title: "Ticket invalide",
    },
  }[result.result];

  const Icon = config.icon;

  return (
    <div
      className={`animate-pop-in flex items-center gap-4 rounded-2xl border p-5 shadow-sm ${config.bg}`}
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white ${config.tile}`}
      >
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className={`font-semibold ${config.color}`}>{config.title}</p>
        {result.event && (
          <p className="truncate text-sm text-slate-700">{result.event}</p>
        )}
        {result.holder && (
          <p className="text-sm text-slate-500">Participant : {result.holder}</p>
        )}
        {result.message && (
          <p className="text-xs text-slate-500">{result.message}</p>
        )}
      </div>
    </div>
  );
}
