"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ParticipantRow {
  name: string;
  type: string;
  status: string;
  reference: string;
  date: string;
}

export function DownloadParticipants({
  rows,
  filename,
}: {
  rows: ParticipantRow[];
  filename: string;
}) {
  function download() {
    const header = ["Nom", "Type", "Statut", "Référence", "Date"];
    const csv = [
      header.join(","),
      ...rows.map((r) =>
        [r.name, r.type, r.status, r.reference, r.date]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={download} disabled={rows.length === 0}>
      <Download className="h-4 w-4" />
      Télécharger la liste (CSV)
    </Button>
  );
}
