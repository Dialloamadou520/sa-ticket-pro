"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { Download, Ticket as TicketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/constants";

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
    doc.setFillColor(5, 150, 105);
    doc.rect(0, 0, 148, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(SITE.name, 12, 14);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.text(ticket.eventTitle, 12, 38, { maxWidth: 124 });

    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(`Date : ${ticket.date}`, 12, 52);
    doc.text(`Lieu : ${ticket.location}`, 12, 60);
    doc.text(`Participant : ${ticket.holderName}`, 12, 68);
    doc.text(`Type : ${ticket.ticketType}`, 12, 76);
    doc.text(`Réf : ${ticket.id.slice(0, 8).toUpperCase()}`, 12, 84);

    if (qr) doc.addImage(qr, "PNG", 95, 95, 42, 42);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("Présentez ce QR code à l'entrée.", 12, 110);

    doc.save(`ticket-${ticket.id.slice(0, 8)}.pdf`);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 bg-brand-600 px-6 py-4 text-white">
        <TicketIcon className="h-5 w-5" />
        <span className="font-semibold">{SITE.name}</span>
      </div>
      <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{ticket.eventTitle}</h3>
          <dl className="mt-3 space-y-1.5 text-sm text-slate-600">
            <Row label="Date" value={ticket.date} />
            <Row label="Lieu" value={ticket.location} />
            <Row label="Participant" value={ticket.holderName} />
            <Row label="Type" value={ticket.ticketType} />
            <Row label="Référence" value={ticket.id.slice(0, 8).toUpperCase()} />
          </dl>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-xl border border-dashed border-slate-300 p-2">
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 shrink-0 text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}
