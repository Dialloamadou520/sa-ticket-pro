"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import {
  CalendarDays,
  Download,
  ImageDown,
  Maximize2,
  MapPin,
  Ticket as TicketIcon,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/constants";
import { getTierTheme } from "@/lib/tier-theme";
import type { SavedTicketDesign } from "@/lib/tickets/ticket-design";

export interface TicketViewData {
  id: string;
  eventTitle: string;
  date: string;
  location: string;
  holderName: string;
  ticketType: string;
  qrToken: string;
  /** Design de l'organisateur pour cette catégorie (le même que sur papier). */
  design?: SavedTicketDesign;
}

const QR_SIZE = 1024;

function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  return img.decode().then(() => img);
}

/** Marge blanche autour du QR, comme sur les billets papier (mm). */
function quietMm(design: SavedTicketDesign) {
  return Math.max(1, design.qr.size * design.widthMm * 0.06);
}

/** QR (correction H) avec la pastille kaypass au centre. */
async function buildQrWithLogo(url: string): Promise<string> {
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, url, {
    width: QR_SIZE,
    margin: 1,
    errorCorrectionLevel: "H",
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.toDataURL("image/png");

  try {
    const logo = new Image();
    logo.src = "/logo-kaypass-mark.png";
    await logo.decode();

    const badge = canvas.width * 0.24;
    const logoSize = badge * 0.78;
    const center = canvas.width / 2;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(
      center - badge / 2,
      center - badge / 2,
      badge,
      badge,
      badge * 0.28
    );
    ctx.fill();
    ctx.drawImage(
      logo,
      center - logoSize / 2,
      center - logoSize / 2,
      logoSize,
      logoSize
    );
  } catch {
    // logo indisponible : on garde le QR nu
  }

  return canvas.toDataURL("image/png");
}

export function TicketView({ ticket }: { ticket: TicketViewData }) {
  const [qr, setQr] = useState<string>("");
  const [fullscreen, setFullscreen] = useState(false);
  const reference = ticket.qrToken.slice(0, 8).toUpperCase();
  const theme = getTierTheme(ticket.ticketType);

  useEffect(() => {
    let cancelled = false;
    buildQrWithLogo(`${SITE.url}/verifier/${ticket.qrToken}`).then((url) => {
      if (!cancelled) setQr(url);
    });
    return () => {
      cancelled = true;
    };
  }, [ticket.qrToken]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [fullscreen]);

  async function downloadDesignPdf(design: SavedTicketDesign) {
    const img = await loadImage(design.imageUrl);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d")?.drawImage(img, 0, 0);
    const image = canvas.toDataURL("image/jpeg", 0.92);

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const PW = 210;
    const k = Math.min(1, 186 / design.widthMm, 150 / design.heightMm);
    const w = design.widthMm * k;
    const h = design.heightMm * k;
    const x = (PW - w) / 2;
    const y = 20;
    doc.addImage(image, "JPEG", x, y, w, h);

    const qrSize = design.qr.size * w;
    const quiet = quietMm(design) * k;
    const qx = x + design.qr.x * w;
    const qy = y + design.qr.y * h;
    doc.setFillColor(255, 255, 255);
    doc.rect(qx - quiet, qy - quiet, qrSize + 2 * quiet, qrSize + 2 * quiet, "F");
    if (qr) doc.addImage(qr, "PNG", qx, qy, qrSize, qrSize);

    if (design.number.show) {
      const light = design.number.light;
      doc.setTextColor(light ? 255 : 15, light ? 255 : 23, light ? 255 : 42);
      doc.setFont("courier", "bold");
      doc.setFontSize(design.number.sizePt * k);
      doc.text(`RÉF. ${reference}`, x + design.number.x * w, y + design.number.y * h, {
        align: "center",
        baseline: "middle",
      });
    }

    let ty = y + h + 14;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(ticket.eventTitle, x, ty, { maxWidth: w });
    ty += 9;
    const fields: [string, string][] = [
      ["DATE", ticket.date],
      ["LIEU", ticket.location],
      ["PARTICIPANT", ticket.holderName],
      ["CATÉGORIE", ticket.ticketType],
      ["RÉFÉRENCE", reference],
    ];
    for (const [label, value] of fields) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(label, x, ty);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(value, x, ty + 5, { maxWidth: w });
      ty += 11;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Présentez ce QR code à l'entrée · ${SITE.url.replace(/^https?:\/\//, "")}`,
      PW / 2,
      ty + 6,
      { align: "center" }
    );
    doc.save(`ticket-${ticket.id.slice(0, 8)}.pdf`);
  }

  /** Le design avec le QR, puis un bandeau avec le participant et la référence. */
  async function downloadDesignImage(design: SavedTicketDesign) {
    const img = await loadImage(design.imageUrl);
    const S = img.naturalWidth / design.widthMm; // px par mm
    const W = img.naturalWidth;
    const H = img.naturalHeight;
    const band = Math.round(16 * S);
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H + band;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H + band);
    ctx.drawImage(img, 0, 0, W, H);

    const qrSize = design.qr.size * W;
    const quiet = quietMm(design) * S;
    const qx = design.qr.x * W;
    const qy = design.qr.y * H;
    ctx.fillRect(qx - quiet, qy - quiet, qrSize + 2 * quiet, qrSize + 2 * quiet);
    if (qr) ctx.drawImage(await loadImage(qr), qx, qy, qrSize, qrSize);

    const pt = S * 0.3528;
    if (design.number.show) {
      ctx.fillStyle = design.number.light ? "#ffffff" : "#0f172a";
      ctx.font = `700 ${design.number.sizePt * pt}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`RÉF. ${reference}`, design.number.x * W, design.number.y * H);
    }

    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillStyle = "#0f172a";
    ctx.font = `700 ${11 * pt}px sans-serif`;
    ctx.fillText(`${ticket.holderName} · ${ticket.ticketType}`, 6 * S, H + band / 2, W * 0.6);
    ctx.textAlign = "right";
    ctx.fillStyle = "#64748b";
    ctx.font = `700 ${10 * pt}px monospace`;
    ctx.fillText(`RÉF. ${reference}`, W - 6 * S, H + band / 2);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `ticket-${ticket.id.slice(0, 8)}.png`;
    link.click();
  }

  function downloadPdf() {
    if (ticket.design) {
      downloadDesignPdf(ticket.design).catch(() => downloadDefaultPdf());
      return;
    }
    downloadDefaultPdf();
  }

  function downloadImage() {
    if (ticket.design) {
      downloadDesignImage(ticket.design).catch(() => downloadDefaultImage());
      return;
    }
    downloadDefaultImage();
  }

  function downloadDefaultPdf() {
    const doc = new jsPDF({ unit: "mm", format: "a5" });
    const W = 148;
    const M = 12;

    // fond
    doc.setFillColor(241, 245, 249);
    doc.rect(0, 0, W, 210, "F");

    // carte
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(M, 14, W - M * 2, 184, 5, 5, "F");

    // bandeau coloré
    doc.setFillColor(theme.pdf[0], theme.pdf[1], theme.pdf[2]);
    doc.roundedRect(M, 14, W - M * 2, 20, 5, 5, "F");
    doc.rect(M, 26, W - M * 2, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(SITE.name, M + 8, 27);
    doc.setFontSize(10);
    doc.text(ticket.ticketType.toUpperCase(), W - M - 8, 27, { align: "right" });

    // QR centré
    const qrSize = 62;
    if (qr) doc.addImage(qr, "PNG", (W - qrSize) / 2, 42, qrSize, qrSize);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("Présentez ce QR code à l'entrée", W / 2, 112, { align: "center" });

    // perforation
    doc.setDrawColor(203, 213, 225);
    doc.setLineDashPattern([1.6, 1.6], 0);
    doc.line(M + 8, 119, W - M - 8, 119);
    doc.setLineDashPattern([], 0);

    // infos
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(ticket.eventTitle, M + 8, 130, { maxWidth: W - M * 2 - 16 });

    const fields: [string, string][] = [
      ["DATE", ticket.date],
      ["LIEU", ticket.location],
      ["PARTICIPANT", ticket.holderName],
      ["CATÉGORIE", ticket.ticketType],
    ];
    let y = 142;
    for (const [label, value] of fields) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(label, M + 8, y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(value, M + 8, y + 5, { maxWidth: W - M * 2 - 16 });
      y += 11;
    }

    // référence
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(M + 8, y - 1, 58, 9, 2, 2, "F");
    doc.setFont("courier", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`RÉF. ${reference}`, M + 12, y + 5.2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(SITE.url.replace(/^https?:\/\//, ""), W / 2, 204, {
      align: "center",
    });

    doc.save(`ticket-${ticket.id.slice(0, 8)}.pdf`);
  }

  /** Même mise en page que le PDF, rendue en PNG (mesures en mm × échelle). */
  async function downloadDefaultImage() {
    const W = 148;
    const H = 210;
    const M = 12;
    const S = 6; // px par mm

    const canvas = document.createElement("canvas");
    canvas.width = W * S;
    canvas.height = H * S;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(S, S);

    const font = (size: number, weight = "400", family = "sans-serif") => {
      ctx.font = `${weight} ${size * 0.3528}px ${family}`;
    };
    const roundRect = (
      x: number,
      y: number,
      w: number,
      h: number,
      r: number,
      color: string
    ) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
    };

    roundRect(0, 0, W, H, 0, "#f1f5f9");
    roundRect(M, 14, W - M * 2, 184, 5, "#ffffff");

    const [r, g, b] = theme.pdf;
    roundRect(M, 14, W - M * 2, 20, 5, `rgb(${r}, ${g}, ${b})`);
    ctx.fillRect(M, 26, W - M * 2, 8);

    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "alphabetic";
    font(16, "700");
    ctx.fillText(SITE.name, M + 8, 27);
    font(10, "700");
    ctx.textAlign = "right";
    ctx.fillText(ticket.ticketType.toUpperCase(), W - M - 8, 27);

    const qrSize = 62;
    if (qr) {
      const img = new Image();
      img.src = qr;
      await img.decode();
      ctx.drawImage(img, (W - qrSize) / 2, 42, qrSize, qrSize);
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#64748b";
    font(9);
    ctx.fillText("Présentez ce QR code à l'entrée", W / 2, 112);

    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 0.3;
    ctx.setLineDash([1.6, 1.6]);
    ctx.beginPath();
    ctx.moveTo(M + 8, 119);
    ctx.lineTo(W - M - 8, 119);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.textAlign = "left";
    const maxWidth = W - M * 2 - 16;
    const clip = (text: string) => {
      let out = text;
      while (out.length > 4 && ctx.measureText(out).width > maxWidth) {
        out = out.slice(0, -1);
      }
      return out === text ? text : `${out.trimEnd()}…`;
    };

    ctx.fillStyle = "#0f172a";
    font(14, "700");
    ctx.fillText(clip(ticket.eventTitle), M + 8, 130);

    const fields: [string, string][] = [
      ["DATE", ticket.date],
      ["LIEU", ticket.location],
      ["PARTICIPANT", ticket.holderName],
      ["CATÉGORIE", ticket.ticketType],
    ];
    let y = 142;
    for (const [label, value] of fields) {
      font(7.5);
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(label, M + 8, y);
      font(10, "700");
      ctx.fillStyle = "#1e293b";
      ctx.fillText(clip(value), M + 8, y + 5);
      y += 11;
    }

    roundRect(M + 8, y - 1, 58, 9, 2, "#0f172a");
    ctx.fillStyle = "#ffffff";
    font(10, "700", "monospace");
    ctx.fillText(`RÉF. ${reference}`, M + 12, y + 5.2);

    ctx.textAlign = "center";
    ctx.fillStyle = "#94a3b8";
    font(8);
    ctx.fillText(SITE.url.replace(/^https?:\/\//, ""), W / 2, 204);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `ticket-${ticket.id.slice(0, 8)}.png`;
    link.click();
  }

  const fullscreenQr = (

        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-white p-4"
          onClick={() => setFullscreen(false)}
        >
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setFullscreen(false)}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qr}
              alt="QR code du ticket"
              className="h-[min(92vw,70vh)] w-[min(92vw,70vh)]"
            />
          )}
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-900">{ticket.eventTitle}</p>
            <p className="mt-1 font-mono text-xs tracking-[0.2em] text-slate-500">
              RÉF. {reference}
            </p>
          </div>
        </div>
  );

  const downloads = (
    <div className="grid w-full grid-cols-2 gap-2">
      <Button variant="outline" size="sm" onClick={downloadPdf} className="h-11 w-full">
        <Download className="h-4 w-4" />
        PDF
      </Button>
      <Button variant="outline" size="sm" onClick={downloadImage} className="h-11 w-full">
        <ImageDown className="h-4 w-4" />
        Image
      </Button>
    </div>
  );

  const design = ticket.design;
  if (design) {
    const quiet = (quietMm(design) / design.widthMm) * 100;
    return (
      <div className="relative overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-200/70">
        <div
          className="relative w-full"
          style={{ aspectRatio: `${design.widthMm} / ${design.heightMm}`, containerType: "inline-size" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={design.imageUrl}
            alt={`Billet ${ticket.eventTitle}`}
            className="absolute inset-0 h-full w-full"
          />
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            aria-label="Agrandir le QR code"
            className="absolute bg-white"
            style={{
              left: `${design.qr.x * 100}%`,
              top: `${design.qr.y * 100}%`,
              width: `${design.qr.size * 100}%`,
              aspectRatio: "1",
              boxSizing: "content-box",
              padding: `${quiet}%`,
              marginLeft: `-${quiet}%`,
              marginTop: `-${quiet}%`,
            }}
          >
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="QR code du ticket" className="h-full w-full" />
            ) : (
              <span className="block h-full w-full animate-pulse bg-slate-100" />
            )}
          </button>
          {design.number.show && (
            <span
              className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-mono font-bold ${
                design.number.light ? "text-white" : "text-slate-900"
              }`}
              style={{
                left: `${design.number.x * 100}%`,
                top: `${design.number.y * 100}%`,
                fontSize: `${((design.number.sizePt * 0.3528) / design.widthMm) * 100}cqw`,
              }}
            >
              RÉF. {reference}
            </span>
          )}
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white active:scale-[0.99]"
          >
            <Maximize2 className="h-4 w-4" />
            Afficher le QR en grand à l&apos;entrée
          </button>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Field icon={<CalendarDays className="h-4 w-4" />} label="Date" value={ticket.date} />
            <Field icon={<MapPin className="h-4 w-4" />} label="Lieu" value={ticket.location} />
            <Field icon={<User className="h-4 w-4" />} label="Participant" value={ticket.holderName} />
            <Field
              icon={<span className={`h-3 w-3 rounded-full ${theme.dot}`} />}
              label="Catégorie"
              value={ticket.ticketType}
            />
          </dl>
          {downloads}
        </div>

        {fullscreen && fullscreenQr}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-200/70">
      {/* Bandeau coloré selon la catégorie */}
      <div
        className={`relative flex items-center justify-between bg-gradient-to-r ${theme.gradient} px-4 py-3.5 text-white sm:px-6 sm:py-4`}
      >
        {/* motif décoratif subtil */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
            backgroundSize: "16px 16px",
          }}
        />
        <span className="relative flex items-center gap-2 font-semibold tracking-tight">
          <TicketIcon className="h-5 w-5" />
          {SITE.name}
        </span>
        <span className="relative rounded-full bg-white/25 px-3 py-1 text-xs font-bold uppercase tracking-widest ring-1 ring-white/30 backdrop-blur">
          {ticket.ticketType}
        </span>
      </div>

      <div className="grid sm:grid-cols-[1fr_auto]">
        {/* Talon avec le QR — en premier sur mobile */}
        <div className="relative order-1 flex flex-col items-center justify-center gap-3 px-5 pb-6 pt-6 sm:order-2 sm:px-8 sm:py-6">
          {/* ligne de perforation + encoches */}
          <span
            aria-hidden
            className="absolute inset-x-5 bottom-0 border-t-2 border-dashed border-slate-200 sm:inset-x-auto sm:left-0 sm:top-0 sm:h-full sm:border-l-2 sm:border-t-0"
          />
          <span
            aria-hidden
            className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-white ring-1 ring-slate-200/70 sm:-top-3 sm:bottom-auto"
          />
          <span
            aria-hidden
            className="absolute -bottom-3 -right-3 h-6 w-6 rounded-full bg-white ring-1 ring-slate-200/70 sm:-left-3 sm:right-auto"
          />

          <button
            type="button"
            onClick={() => setFullscreen(true)}
            aria-label="Agrandir le QR code"
            className="relative rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition active:scale-[0.98]"
          >
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qr}
                alt="QR code du ticket"
                className="h-[min(64vw,15rem)] w-[min(64vw,15rem)] sm:h-44 sm:w-44"
              />
            ) : (
              <div className="h-[min(64vw,15rem)] w-[min(64vw,15rem)] animate-pulse rounded bg-slate-100 sm:h-44 sm:w-44" />
            )}
            <span className="absolute bottom-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/80 text-white">
              <Maximize2 className="h-3.5 w-3.5" />
            </span>
          </button>
          <p className="text-center text-xs text-slate-500">
            Touchez le QR pour l&apos;agrandir · à présenter à l&apos;entrée
          </p>
          {downloads}
        </div>

        {/* Corps principal */}
        <div className="order-2 px-5 py-5 sm:order-1 sm:p-6">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
            Billet d&apos;entrée
          </p>
          <h3 className="mt-1 text-lg font-bold leading-snug text-slate-900 sm:text-xl">
            {ticket.eventTitle}
          </h3>

          <dl className="mt-4 grid gap-x-6 gap-y-3 sm:mt-5 sm:grid-cols-2">
            <Field icon={<CalendarDays className="h-4 w-4" />} label="Date" value={ticket.date} />
            <Field icon={<MapPin className="h-4 w-4" />} label="Lieu" value={ticket.location} />
            <Field icon={<User className="h-4 w-4" />} label="Participant" value={ticket.holderName} />
            <Field
              icon={<span className={`h-3 w-3 rounded-full ${theme.dot}`} />}
              label="Catégorie"
              value={ticket.ticketType}
            />
          </dl>

          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white sm:mt-5">
            <span className="text-slate-400">RÉF.</span>
            <span className="font-mono font-semibold tracking-[0.2em]">{reference}</span>
          </div>
        </div>
      </div>

      {fullscreen && fullscreenQr}
    </div>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-4 w-4 items-center justify-center text-slate-400">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] uppercase tracking-wide text-slate-400">{label}</dt>
        <dd className="truncate text-sm font-semibold text-slate-800">{value}</dd>
      </div>
    </div>
  );
}
