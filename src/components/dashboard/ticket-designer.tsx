"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { FileDown, ImageUp, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { deleteTicketDesign, saveTicketDesign } from "@/app/dashboard/actions";
import { categoryKey, type SavedTicketDesign } from "@/lib/tickets/ticket-design";
import {
  CUSTOM_MAX_H_MM,
  CUSTOM_MAX_W_MM,
  customTicketGrid,
  verifyUrl,
  type CustomTicketDesign,
} from "@/lib/tickets/print-sheet";

const MAX_EDGE_PX = 2400;
const MIN_QR_MM = 18;
const MIN_W_MM = 30;
const MIN_H_MM = 20;
const A4_W_MM = 210;
const A4_H_MM = 297;

function storageKey(eventId: string, category: string) {
  return `kaypass:ticket-design:${eventId}:${categoryKey(category)}`;
}

function loadTicketDesign(eventId: string, category: string): CustomTicketDesign | null {
  try {
    const raw = window.localStorage.getItem(storageKey(eventId, category));
    if (!raw) return null;
    const d = JSON.parse(raw) as CustomTicketDesign;
    const k = Math.min(1, CUSTOM_MAX_W_MM / d.widthMm, CUSTOM_MAX_H_MM / d.heightMm);
    return k < 1 ? { ...d, widthMm: round1(d.widthMm * k), heightMm: round1(d.heightMm * k) } : d;
  } catch {
    return null;
  }
}

async function urlToDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("image"));
    reader.readAsDataURL(blob);
  });
}

/** Envoie l'image vers le stockage et enregistre le design pour la catégorie. */
async function persistDesign(
  eventId: string,
  category: string,
  design: CustomTicketDesign
): Promise<{ imageUrl?: string; error?: string }> {
  let imageUrl = design.imageUrl;
  if (!imageUrl) {
    const form = new FormData();
    form.append("file", await (await fetch(design.image)).blob(), "billet.jpg");
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!res.ok || !json.url) return { error: json.error ?? "Envoi de l'image impossible." };
    imageUrl = json.url;
  }
  const saved: SavedTicketDesign = {
    imageUrl,
    widthMm: design.widthMm,
    heightMm: design.heightMm,
    qr: design.qr,
    number: design.number,
  };
  const res = await saveTicketDesign(eventId, category, saved);
  return res.error ? { error: res.error, imageUrl } : { imageUrl };
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
const round1 = (v: number) => Math.round(v * 10) / 10;

/** Plus grand côté de QR (fraction de la largeur) qui tient dans le billet. */
function maxQrFraction(d: { widthMm: number; heightMm: number }) {
  return Math.min(0.85, (0.85 * d.heightMm) / d.widthMm);
}

/** Taille du billet ramenée dans les limites d'une A4 portrait, en gardant un ratio si demandé. */
function fitSize(widthMm: number, heightMm: number, ratio: number | null) {
  let w = clamp(widthMm, MIN_W_MM, CUSTOM_MAX_W_MM);
  let h = ratio ? w * ratio : clamp(heightMm, MIN_H_MM, CUSTOM_MAX_H_MM);
  if (ratio && h > CUSTOM_MAX_H_MM) {
    h = CUSTOM_MAX_H_MM;
    w = h / ratio;
  }
  if (ratio && h < MIN_H_MM) {
    h = MIN_H_MM;
    w = Math.min(CUSTOM_MAX_W_MM, h / ratio);
  }
  return { widthMm: round1(w), heightMm: round1(h) };
}

/** Champ numérique en mm : on peut taper librement, la valeur est validée en sortie du champ. */
function MmField({
  id,
  label,
  value,
  min,
  max,
  onCommit,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onCommit: (v: number) => void;
}) {
  const [text, setText] = useState(String(value));
  const [shown, setShown] = useState(value);
  if (shown !== value) {
    setShown(value);
    setText(String(value));
  }
  const parse = (t: string) => Number(t.replace(",", "."));
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const n = parse(e.target.value);
          if (Number.isFinite(n) && n >= min && n <= max) onCommit(n);
        }}
        onBlur={() => {
          const n = parse(text);
          if (Number.isFinite(n) && n > 0) onCommit(clamp(n, min, max));
          setText(String(value));
        }}
        className="text-base sm:text-sm"
      />
    </div>
  );
}

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
  category,
  saved,
  busy,
  progress,
  onGenerate,
  onClose,
}: {
  eventId: string;
  /** Catégorie du lot : le design s'affiche aussi sur ses billets numériques. */
  category: string;
  saved?: SavedTicketDesign;
  busy: boolean;
  progress?: string;
  onGenerate: (design: CustomTicketDesign) => void;
  onClose: () => void;
}) {
  // Monté uniquement après un clic (jamais rendu côté serveur) : lecture directe du stockage local.
  const [design, setDesign] = useState<CustomTicketDesign | null>(() =>
    loadTicketDesign(eventId, category)
  );
  const [saving, setSaving] = useState(false);
  const [ratio, setRatio] = useState(() => (design ? design.heightMm / design.widthMm : 0.4));
  const [lockRatio, setLockRatio] = useState(true);
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
    if (!saved || loadTicketDesign(eventId, category)) return;
    let cancelled = false;
    urlToDataUrl(saved.imageUrl)
      .then((image) => {
        if (cancelled) return;
        setRatio(saved.heightMm / saved.widthMm);
        setDesign({ ...saved, image });
      })
      .catch(() => toast.error("Impossible de charger le design enregistré."));
    return () => {
      cancelled = true;
    };
  }, [saved, eventId, category]);

  useEffect(() => {
    if (!design) return;
    try {
      window.localStorage.setItem(storageKey(eventId, category), JSON.stringify(design));
    } catch {
      // image trop lourde pour le stockage local : le design reste valable pour cette session
    }
  }, [design, eventId, category]);

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
      const size = fitSize(design?.widthMm ?? 150, 0, r);
      setRatio(r);
      setLockRatio(true);
      setDesign({
        image: data,
        imageUrl: undefined,
        ...size,
        qr: design?.qr ?? { x: 0.74, y: 0.15, size: 0.2 },
        number: design?.number ?? { show: true, x: 0.84, y: 0.88, sizePt: 10, light: false },
      });
    } catch {
      toast.error("Impossible de lire cette image.");
    }
  }

  async function generate(d: CustomTicketDesign) {
    setSaving(true);
    try {
      const res = await persistDesign(eventId, category, d);
      if (res.imageUrl) update({ imageUrl: res.imageUrl });
      if (res.error) toast.error(res.error);
      else toast.success(`Design enregistré : il s'affiche aussi sur les billets numériques « ${category} ».`);
    } catch {
      toast.error("Design non enregistré pour les billets numériques.");
    } finally {
      setSaving(false);
    }
    onGenerate(d);
  }

  function update(patch: Partial<CustomTicketDesign>) {
    setDesign((d) => (d ? { ...d, ...patch } : d));
  }

  function setSize(widthMm: number, heightMm: number, from: "width" | "height") {
    setDesign((d) => {
      if (!d) return d;
      let size;
      if (!lockRatio) size = fitSize(widthMm, heightMm, null);
      else if (from === "width") size = fitSize(widthMm, 0, ratio);
      else size = fitSize(heightMm / ratio, 0, ratio);
      const next = { ...d, ...size };
      return { ...next, qr: placeQr(next, d.qr.x, d.qr.y, Math.min(d.qr.size, maxQrFraction(next))) };
    });
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
  const maxQrSize = design ? maxQrFraction(design) : 0.85;
  const grid = design ? customTicketGrid(design.widthMm, design.heightMm) : null;
  const perPage = grid ? grid.cols * grid.rows : 0;
  const stretched = design ? Math.abs(design.heightMm / design.widthMm - ratio) / ratio > 0.02 : false;

  return (
    <div className="space-y-4 rounded-2xl border border-brand-200 bg-brand-50/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">Mon design de billet</p>
          <p className="text-xs text-slate-500">
            Importez votre visuel (Canva, Photoshop…), placez le QR code, puis générez le PDF :
            chaque billet reçoit son propre QR. Le design est aussi appliqué aux billets
            numériques « {category} ».
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
            <div className="space-y-3 sm:col-span-2">
              <div className="grid grid-cols-2 gap-3">
                <MmField
                  id="design-width"
                  label="Largeur (mm)"
                  value={design.widthMm}
                  min={MIN_W_MM}
                  max={CUSTOM_MAX_W_MM}
                  onCommit={(w) => setSize(w, design.heightMm, "width")}
                />
                <MmField
                  id="design-height"
                  label="Hauteur (mm)"
                  value={design.heightMm}
                  min={MIN_H_MM}
                  max={CUSTOM_MAX_H_MM}
                  onCommit={(h) => setSize(design.widthMm, h, "height")}
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={lockRatio}
                  onChange={(e) => {
                    setLockRatio(e.target.checked);
                    if (e.target.checked) {
                      setDesign((d) => {
                        if (!d) return d;
                        const next = { ...d, ...fitSize(d.widthMm, 0, ratio) };
                        return { ...next, qr: placeQr(next, d.qr.x, d.qr.y, Math.min(d.qr.size, maxQrFraction(next))) };
                      });
                    }
                  }}
                  className="h-4 w-4 accent-brand-600"
                />
                Garder les proportions de l&apos;image
              </label>
              {stretched && (
                <p className="text-xs text-amber-600">
                  L&apos;image est étirée pour remplir {design.widthMm} × {design.heightMm} mm.
                </p>
              )}
              {grid && (
                <div className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200">
                  <div
                    className="relative w-16 shrink-0 bg-white shadow-sm ring-1 ring-slate-300"
                    style={{ aspectRatio: `${A4_W_MM} / ${A4_H_MM}` }}
                    aria-hidden
                  >
                    {Array.from({ length: perPage }, (_, i) => (
                      <div
                        key={i}
                        className="absolute border border-white bg-brand-500/70"
                        style={{
                          left: `${((grid.offsetX + (i % grid.cols) * design.widthMm) / A4_W_MM) * 100}%`,
                          top: `${((grid.offsetY + Math.floor(i / grid.cols) * design.heightMm) / A4_H_MM) * 100}%`,
                          width: `${(design.widthMm / A4_W_MM) * 100}%`,
                          height: `${(design.heightMm / A4_H_MM) * 100}%`,
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">
                      {perPage} billet{perPage > 1 ? "s" : ""} par page A4 portrait
                    </span>
                    <br />
                    <span className="text-xs text-slate-500">
                      {grid.cols} colonne{grid.cols > 1 ? "s" : ""} × {grid.rows} ligne{grid.rows > 1 ? "s" : ""} · max{" "}
                      {CUSTOM_MAX_W_MM} × {CUSTOM_MAX_H_MM} mm
                    </span>
                  </p>
                </div>
              )}
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
            <Button type="button" onClick={() => generate(design)} disabled={busy || saving}>
              {busy || saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              {saving ? "Enregistrement…" : busy ? progress ?? "Préparation…" : "Générer le PDF avec mon design"}
            </Button>
            <button
              type="button"
              onClick={() => {
                window.localStorage.removeItem(storageKey(eventId, category));
                setDesign(null);
                deleteTicketDesign(eventId, category);
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
