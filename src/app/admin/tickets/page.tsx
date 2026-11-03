import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Search, TicketCheck } from "lucide-react";
import { TicketRecoveryResults } from "@/components/tickets/ticket-recovery-results";
import { searchTickets, type TicketKindFilter } from "@/lib/data/admin";

const KINDS: { key: TicketKindFilter; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "online", label: "Numériques" },
  { key: "physical", label: "Physiques" },
];

export const metadata: Metadata = { title: "Récupérer un ticket" };

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;
  const query = (q ?? "").trim();
  const kind: TicketKindFilter =
    type === "online" || type === "physical" ? type : "all";
  const tickets = query ? await searchTickets(query, kind) : [];

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;administration
      </Link>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <TicketCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-semibold text-slate-900">
              Récupérer un ticket perdu
            </h1>
            <p className="text-xs text-slate-500">
              Retrouvez le billet d&apos;un participant par son nom, son email
              ou la référence du ticket, puis renvoyez-lui le QR code ou le PDF.
            </p>
          </div>
        </div>

        <div className="flex gap-2 px-5 pt-5">
          {KINDS.map(({ key, label }) => {
            const params = new URLSearchParams();
            if (query) params.set("q", query);
            if (key !== "all") params.set("type", key);
            const qs = params.toString();
            return (
              <Link
                key={key}
                href={`/admin/tickets${qs ? `?${qs}` : ""}`}
                className={`inline-flex min-h-9 items-center rounded-full px-3 text-xs font-semibold transition-colors ${
                  kind === key
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <form action="/admin/tickets" className="flex gap-2 p-5">
          {kind !== "all" && <input type="hidden" name="type" value={kind} />}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Nom, email, référence ou N° de billet papier"
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Rechercher
          </button>
        </form>
      </section>

      <TicketRecoveryResults query={query} tickets={tickets} />
    </div>
  );
}
