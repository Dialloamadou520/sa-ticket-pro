"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import {
  CalendarDays,
  Download,
  MapPin,
  Ticket as TicketIcon,
  User,
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

export function TicketView({ ticket }: { ticket: TicketViewData }) {
  const [qr, setQr] = useState<string>("");
  const reference = ticket.qrToken.slice(0, 8).toUpperCase();
  const theme = getTierTheme(ticket.ticketType);

  useEffect(() => {
    QRCode.toDataURL(`${SITE.url}/verifier/${ticket.qrToken}`, {
      width: 512,
      margin: 1,
      errorCorrectionLevel: "H",
      color: { dark: "#0f172a", light: "#ffffff" },
    }).then(setQr);
  }, [ticket.qrToken]);

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

    if (qr) doc.addImage(qr, "PNG", 95, 95, 42, 42);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("Présentez ce QR code à l'entrée.", 12, 110);

    doc.save(`ticket-${ticket.id.slice(0, 8)}.pdf`);
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-200/70">
      {/* Bandeau coloré selon la catégorie */}
      <div
        className={`relative flex items-center justify-between bg-gradient-to-r ${theme.gradient} px-6 py-4 text-white`}
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
        {/* Corps principal */}
        <div className="p-6">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
            Billet d&apos;entrée
          </p>
          <h3 className="mt-1 text-xl font-bold leading-snug text-slate-900">
            {ticket.eventTitle}
          </h3>

          <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Field icon={<CalendarDays className="h-4 w-4" />} label="Date" value={ticket.date} />
            <Field icon={<MapPin className="h-4 w-4" />} label="Lieu" value={ticket.location} />
            <Field icon={<User className="h-4 w-4" />} label="Participant" value={ticket.holderName} />
            <Field
              icon={<span className={`h-3 w-3 rounded-full ${theme.dot}`} />}
              label="Catégorie"
              value={ticket.ticketType}
            />
          </dl>

          <div className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white">
            <span className="text-slate-400">RÉF.</span>
            <span className="font-mono font-semibold tracking-[0.2em]">{reference}</span>
          </div>
        </div>

        {/* Talon perforé avec le QR */}
        <div className="relative flex flex-col items-center justify-center gap-3 px-6 py-6 sm:px-8">
          {/* ligne de perforation + encoches */}
          <span
            aria-hidden
            className="absolute left-0 top-0 hidden h-full border-l-2 border-dashed border-slate-200 sm:block"
          />
          <span
            aria-hidden
            className="absolute -left-3 -top-3 hidden h-6 w-6 rounded-full bg-white ring-1 ring-slate-200/70 sm:block"
          />
          <span
            aria-hidden
            className="absolute -bottom-3 -left-3 hidden h-6 w-6 rounded-full bg-white ring-1 ring-slate-200/70 sm:block"
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="QR code du ticket" className="h-36 w-36" />
            ) : (
              <div className="h-36 w-36 animate-pulse rounded bg-slate-100" />
            )}
          </div>
          <p className="text-center text-xs text-slate-400">
            Présentez ce QR à l&apos;entrée
          </p>
          <Button variant="outline" size="sm" onClick={downloadPdf} className="w-full">
            <Download className="h-4 w-4" />
            Télécharger PDF
          </Button>
        </div>
      </div>
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
