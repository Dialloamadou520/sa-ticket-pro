import type { Metadata } from "next";
import { Search, TicketCheck } from "lucide-react";
import { TicketRecoveryResults } from "@/components/tickets/ticket-recovery-results";
import { searchMyEventTickets } from "@/lib/data/dashboard";

export const metadata: Metadata = { title: "Récupérer un ticket" };

export default async function DashboardTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const tickets = query ? await searchMyEventTickets(query) : [];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <TicketCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="font-semibold text-slate-900">
              Récupérer un ticket perdu
            </h1>
            <p className="text-xs text-slate-500">
              Retrouvez le billet d&apos;un participant à vos événements par son
              nom, son téléphone, son email ou la référence du ticket, puis
              renvoyez-lui le QR code, le PDF ou l&apos;image.
            </p>
          </div>
        </div>

        <form
          action="/dashboard/tickets"
          className="flex flex-col gap-2 p-5 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Nom, téléphone, email ou référence"
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            className="min-h-11 shrink-0 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Rechercher
          </button>
        </form>
      </section>

      <TicketRecoveryResults query={query} tickets={tickets} />
    </div>
  );
}
