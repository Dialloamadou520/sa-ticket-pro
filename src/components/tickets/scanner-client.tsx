"use client";

import { useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, CheckCircle2, ScanLine, XCircle, Clock } from "lucide-react";
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
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-900">
          {/* L'élément vidéo reste monté en permanence : sinon videoRef est
              null au moment d'attacher le flux et la caméra reste noire. */}
          <video
            ref={videoRef}
            className={`h-full w-full object-cover ${cameraOn ? "" : "hidden"}`}
            muted
            autoPlay
            playsInline
          />
          {!cameraOn && (
            <div className="flex h-full flex-col items-center justify-center text-slate-400">
              <ScanLine className="h-10 w-10" />
              <p className="mt-2 text-sm">Caméra désactivée</p>
            </div>
          )}
        </div>
        {cameraError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {cameraError}
          </p>
        )}
        <div className="mt-4 flex gap-3">
          {cameraOn ? (
            <Button variant="danger" className="flex-1" onClick={stopCamera}>
              Arrêter la caméra
            </Button>
          ) : (
            <Button className="flex-1" onClick={startCamera}>
              <Camera className="h-4 w-4" />
              Scanner avec la caméra
            </Button>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const input = new FormData(e.currentTarget).get("token");
          verify(String(input));
        }}
        className="rounded-2xl border border-slate-200 bg-white p-6"
      >
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Saisie manuelle du code
        </label>
        <p className="mb-2 text-xs text-slate-400">
          Entrez la « Référence » affichée sur le ticket (ex. A1B2C3D4) ou collez
          le lien du QR code.
        </p>
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

function ResultCard({ result }: { result: Result }) {
  const config = {
    valid: { icon: CheckCircle2, color: "text-brand-600", bg: "bg-brand-50 border-brand-200", title: "Entrée autorisée" },
    already_used: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", title: "Déjà utilisé" },
    invalid: { icon: XCircle, color: "text-red-600", bg: "bg-red-50 border-red-200", title: "Ticket invalide" },
  }[result.result];

  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-4 rounded-2xl border p-5 ${config.bg}`}>
      <Icon className={`h-10 w-10 shrink-0 ${config.color}`} />
      <div>
        <p className={`font-semibold ${config.color}`}>{config.title}</p>
        {result.event && <p className="text-sm text-slate-700">{result.event}</p>}
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
