"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { CalendarDays, Download, MapPin, Ticket as TicketIcon, User } from "lucide-react";
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
    <div className="overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200">
      {/* En-tête coloré selon la catégorie */}
      <div
        className={`flex items-center justify-between bg-gradient-to-r ${theme.gradient} px-6 py-4 text-white`}
      >
        <span className="flex items-center gap-2 font-semibold">
          <TicketIcon className="h-5 w-5" />
          {SITE.name}
        </span>
        <span className="rounded-full bg-white/25 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur">
          {ticket.ticketType}
        </span>
      </div>

      <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{ticket.eventTitle}</h3>
          <dl className="mt-4 space-y-2.5 text-sm">
            <Row icon={<CalendarDays className="h-4 w-4" />} value={ticket.date} />
            <Row icon={<MapPin className="h-4 w-4" />} value={ticket.location} />
            <Row icon={<User className="h-4 w-4" />} value={ticket.holderName} />
          </dl>
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs">
            <span className="text-slate-400">Réf.</span>
            <span className="font-mono font-semibold tracking-wider text-slate-700">
              {reference}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 sm:border-l sm:border-dashed sm:border-slate-200 sm:pl-6">
          <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="QR code du ticket" className="h-36 w-36" />
            ) : (
              <div className="h-36 w-36 animate-pulse rounded bg-slate-100" />
            )}
          </div>
          <Button variant="outline" size="sm" onClick={downloadPdf}>
            <Download className="h-4 w-4" />
            Télécharger PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2.5 text-slate-600">
      <span className="text-slate-400">{icon}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
