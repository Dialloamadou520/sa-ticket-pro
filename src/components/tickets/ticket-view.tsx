"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import {
  CalendarDays,
  Download,
  Maximize2,
  MapPin,
  Ticket as TicketIcon,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/constants";
import { getTierTheme } from "@/lib/tier-theme";

export interface TicketViewData {
  id: string;
  eventTitle: string;
  date: string;
  location: string;
  holderName: string;
  ticketType: string;
  qrToken: string;
}

const QR_SIZE = 1024;

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

  function downloadPdf() {
    const doc = new jsPDF({ unit: "mm", format: "a5" });
    doc.setFillColor(theme.pdf[0], theme.pdf[1], theme.pdf[2]);
    doc.rect(0, 0, 148, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(SITE.name, 12, 14);
    doc.setFontSize(11);
    doc.text(ticket.ticketType, 136, 14, { align: "right" });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.text(ticket.eventTitle, 12, 38, { maxWidth: 124 });

    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(`Date : ${ticket.date}`, 12, 52);
    doc.text(`Lieu : ${ticket.location}`, 12, 60);
    doc.text(`Participant : ${ticket.holderName}`, 12, 68);
    doc.text(`Catégorie : ${ticket.ticketType}`, 12, 76);
    doc.text(`Réf : ${reference}`, 12, 84);

    if (qr) doc.addImage(qr, "PNG", 83, 92, 54, 54);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("Présentez ce QR code à l'entrée.", 12, 110);

    doc.save(`ticket-${ticket.id.slice(0, 8)}.pdf`);
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
          <Button
            variant="outline"
            size="sm"
            onClick={downloadPdf}
            className="h-11 w-full"
          >
            <Download className="h-4 w-4" />
            Télécharger PDF
          </Button>
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

      {fullscreen && (
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
      )}
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
