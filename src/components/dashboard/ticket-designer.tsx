"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { FileDown, ImageUp, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  customTicketsPerPage,
  verifyUrl,
  type CustomTicketDesign,
} from "@/lib/tickets/print-sheet";

const MAX_EDGE_PX = 2400;
const MIN_QR_MM = 18;

function storageKey(eventId: string) {
  return `kaypass:ticket-design:${eventId}`;
}

export function loadTicketDesign(eventId: string): CustomTicketDesign | null {
  try {
    const raw = window.localStorage.getItem(storageKey(eventId));
    return raw ? (JSON.parse(raw) as CustomTicketDesign) : null;
  } catch {
    return null;
  }
}

/** Réduit l'image et la convertit en JPEG (fond blanc) pour un PDF léger. */
function normalizeImage(file: File): Promise<{ data: string; ratio: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_EDGE_PX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas"));
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve({ data: canvas.toDataURL("image/jpeg", 0.9), ratio: img.height / img.width });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Garde le QR et sa marge blanche à l'intérieur du billet. */
function placeQr(d: CustomTicketDesign, x: number, y: number, size: number) {
  const quietMm = Math.max(1, size * d.widthMm * 0.06);
  const qx = quietMm / d.widthMm;
  const qy = quietMm / d.heightMm;
  const sizeY = (size * d.widthMm) / d.heightMm;
  return {
    size,
    x: clamp(x, qx, Math.max(qx, 1 - size - qx)),
    y: clamp(y, qy, Math.max(qy, 1 - sizeY - qy)),
  };
}

type Drag = { target: "qr" | "number"; dx: number; dy: number } | null;

/**
 * Éditeur de design de billet physique : l'organisateur importe son visuel,
 * place le QR code (et le numéro) par glisser-déposer, puis génère le PDF.
 */
export function TicketDesigner({
  eventId,
  busy,
  progress,
  onGenerate,
  onClose,
}: {
  eventId: string;
  busy: boolean;
  progress?: string;
  onGenerate: (design: CustomTicketDesign) => void;
  onClose: () => void;
}) {
  // Monté uniquement après un clic (jamais rendu côté serveur) : lecture directe du stockage local.
  const [design, setDesign] = useState<CustomTicketDesign | null>(() => loadTicketDesign(eventId));
  const [ratio, setRatio] = useState(() => (design ? design.heightMm / design.widthMm : 0.4));
  const [scale, setScale] = useState(1);
  const [sampleQr, setSampleQr] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag>(null);

  useEffect(() => {
    QRCode.toDataURL(verifyUrl("exemple"), { margin: 0, width: 240 }).then(
      setSampleQr
    );
  }, []);

  useEffect(() => {
    if (!design) return;
    try {
      window.localStorage.setItem(storageKey(eventId), JSON.stringify(design));
    } catch {
      // image trop lourde pour le stockage local : le design reste valable pour cette session
    }
  }, [design, eventId]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || !design) return;
    const observer = new ResizeObserver(() => setScale(el.clientWidth / design.widthMm));
    observer.observe(el);
    return () => observer.disconnect();
  }, [design]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choisissez une image (PNG ou JPG).");
      return;
    }
    try {
      const { data, ratio: r } = await normalizeImage(file);
      const widthMm = design?.widthMm ?? 150;
      setRatio(r);
      setDesign({
        image: data,
        widthMm,
        heightMm: Math.round(widthMm * r * 10) / 10,
        qr: design?.qr ?? { x: 0.74, y: 0.15, size: 0.2 },
        number: design?.number ?? { show: true, x: 0.84, y: 0.88, sizePt: 10, light: false },
      });
    } catch {
      toast.error("Impossible de lire cette image.");
    }
  }

  function update(patch: Partial<CustomTicketDesign>) {
    setDesign((d) => (d ? { ...d, ...patch } : d));
  }

  function setWidth(widthMm: number) {
    if (!Number.isFinite(widthMm)) return;
    const w = clamp(widthMm, 40, 400);
    update({ widthMm: w, heightMm: Math.round(w * ratio * 10) / 10 });
  }

  function pointerPos(e: ReactPointerEvent) {
    const rect = boxRef.current!.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  }

  function startDrag(target: "qr" | "number", e: ReactPointerEvent<HTMLDivElement>) {
    if (!design) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = pointerPos(e);
    const origin = target === "qr" ? design.qr : design.number;
    drag.current = { target, dx: p.x - origin.x, dy: p.y - origin.y };
  }

  function moveDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current || !design) return;
    const p = pointerPos(e);
    const x = p.x - drag.current.dx;
    const y = p.y - drag.current.dy;
    if (drag.current.target === "qr") {
      update({ qr: placeQr(design, x, y, design.qr.size) });
    } else {
      update({ number: { ...design.number, x: clamp(x, 0, 1), y: clamp(y, 0, 1) } });
    }
  }

  function endDrag() {
    drag.current = null;
  }

  const qrMm = design ? Math.round(design.qr.size * design.widthMm) : 0;
  const maxQrSize = design ? Math.min(0.85, (0.85 * design.heightMm) / design.widthMm) : 0.85;
  const perPage = design ? customTicketsPerPage(design.widthMm, design.heightMm) : 0;

  return (
    <div className="space-y-4 rounded-2xl border border-brand-200 bg-brand-50/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">Mon design de billet</p>
          <p className="text-xs text-slate-500">
            Importez votre visuel (Canva, Photoshop…), placez le QR code, puis générez le PDF :
            chaque billet reçoit son propre QR.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-300 bg-white px-4 py-3 text-sm font-medium text-brand-700 hover:bg-brand-50">
        <ImageUp className="h-4 w-4" />
        {design ? "Changer d'image" : "Importer mon design (PNG ou JPG)"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>

      {design && (
        <>
          <div
            ref={boxRef}
            className="relative w-full touch-none select-none overflow-hidden rounded-lg shadow-sm ring-1 ring-slate-200"
            style={{ aspectRatio: `${design.widthMm} / ${design.heightMm}` }}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={design.image} alt="Design du billet" className="absolute inset-0 h-full w-full" draggable={false} />
            <div
              role="button"
              aria-label="Déplacer le QR code"
              onPointerDown={(e) => startDrag("qr", e)}
              className="absolute cursor-move bg-white outline-2 outline-offset-2 outline-brand-500 outline-dashed"
              style={{
                left: `${design.qr.x * 100}%`,
                top: `${design.qr.y * 100}%`,
                width: `${design.qr.size * 100}%`,
                aspectRatio: "1",
                padding: `${Math.max(1, design.qr.size * design.widthMm * 0.06) * scale}px`,
                boxSizing: "content-box",
                marginLeft: `-${Math.max(1, design.qr.size * design.widthMm * 0.06) * scale}px`,
                marginTop: `-${Math.max(1, design.qr.size * design.widthMm * 0.06) * scale}px`,
              }}
            >
              {sampleQr && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sampleQr} alt="" className="h-full w-full" draggable={false} />
              )}
            </div>
            {design.number.show && (
              <div
                role="button"
                aria-label="Déplacer le numéro"
                onPointerDown={(e) => startDrag("number", e)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-move whitespace-nowrap rounded px-1 font-mono font-bold outline-1 outline-dashed ${
                  design.number.light ? "text-white outline-white/70" : "text-slate-900 outline-slate-500"
                }`}
                style={{
                  left: `${design.number.x * 100}%`,
                  top: `${design.number.y * 100}%`,
                  fontSize: `${design.number.sizePt * 0.3528 * scale}px`,
                }}
              >
                N° 0001
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Faites glisser le QR code et le numéro à l&apos;endroit voulu.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="design-width">Largeur du billet (mm)</Label>
              <Input
                id="design-width"
                type="number"
                inputMode="numeric"
                min={40}
                max={400}
                value={design.widthMm}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="text-base sm:text-sm"
              />
              <p className="mt-1 text-xs text-slate-500">
                Hauteur : {design.heightMm} mm · {perPage} billet{perPage > 1 ? "s" : ""} par page
                {perPage > 1 ? " A4" : ""}
              </p>
            </div>
            <div>
              <Label htmlFor="design-qr">Taille du QR code : {qrMm} mm</Label>
              <input
                id="design-qr"
                type="range"
                min={0.08}
                max={maxQrSize}
                step={0.005}
                value={design.qr.size}
                onChange={(e) => {
                  update({ qr: placeQr(design, design.qr.x, design.qr.y, Number(e.target.value)) });
                }}
                className="mt-3 w-full accent-brand-600"
              />
              {qrMm < MIN_QR_MM && (
                <p className="mt-1 text-xs text-amber-600">
                  QR petit : visez au moins {MIN_QR_MM} mm pour un scan rapide.
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={design.number.show}
                  onChange={(e) => update({ number: { ...design.number, show: e.target.checked } })}
                  className="h-4 w-4 accent-brand-600"
                />
                Imprimer le numéro (N° 0001…)
              </label>
              {design.number.show && (
                <>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={design.number.light}
                      onChange={(e) => update({ number: { ...design.number, light: e.target.checked } })}
                      className="h-4 w-4 accent-brand-600"
                    />
                    En blanc
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    Taille
                    <input
                      type="range"
                      min={6}
                      max={28}
                      step={1}
                      value={design.number.sizePt}
                      onChange={(e) =>
                        update({ number: { ...design.number, sizePt: Number(e.target.value) } })
                      }
                      className="w-28 accent-brand-600"
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={() => onGenerate(design)} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              {busy ? progress ?? "Préparation…" : "Générer le PDF avec mon design"}
            </Button>
            <button
              type="button"
              onClick={() => {
                window.localStorage.removeItem(storageKey(eventId));
                setDesign(null);
              }}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-sm text-slate-500 hover:bg-white hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Retirer le design
            </button>
          </div>
        </>
      )}
    </div>
  );
}
