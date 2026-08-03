"use client";

import { Download } from "lucide-react";
import type { OrganizerWithStats } from "@/lib/data/admin";

const HEADERS = [
  "Organisateur",
  "Responsable",
  "Email",
  "Téléphone",
  "Statut",
  "Événements",
  "Tickets vendus",
  "Revenus (FCFA)",
  "Commission (FCFA)",
];

function cell(value: string | number | null | undefined): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function status(o: OrganizerWithStats): string {
  if (o.disabled) return "Retiré";
  return o.verified ? "Vérifié" : "Actif";
}

/** Télécharge la liste des organisateurs (avec leurs numéros) au format CSV. */
export function OrganizersExport({
  organizers,
}: {
  organizers: OrganizerWithStats[];
}) {
  function download() {
    const rows = organizers.map((o) =>
      [
        o.company_name,
        o.owner?.full_name ?? "",
        o.owner?.email ?? "",
        o.owner?.phone ?? "",
        status(o),
        o.eventsCount,
        o.ticketsSold,
        o.revenue,
        o.commission,
      ]
        .map(cell)
        .join(";"),
    );

    // BOM UTF-8 pour qu'Excel affiche correctement les accents.
    const csv = `\ufeff${[HEADERS.map(cell).join(";"), ...rows].join("\r\n")}`;
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `organisateurs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={download}
      disabled={organizers.length === 0}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      <Download className="h-4 w-4" />
      Exporter (CSV)
    </button>
  );
}
