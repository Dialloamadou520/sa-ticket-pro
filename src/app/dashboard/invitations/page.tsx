import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Gift } from "lucide-react";
import { getManageableEvents } from "@/lib/data/dashboard";
import { formatDate, isEventPast } from "@/lib/format";

export const metadata: Metadata = { title: "Invitations" };

export default async function DashboardInvitationsPage() {
  const { owned, collaborated } = await getManageableEvents();
  const events = [...owned, ...collaborated]
    .filter((e) => !isEventPast(e))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  return (
    <div className="space-y-6">
      <section className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Gift className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h1 className="font-semibold text-slate-900">Invitations</h1>
          <p className="text-xs text-slate-500">
            Générez des billets gratuits pour vos invités et la presse, sans
            paiement. Choisissez l&apos;événement.
          </p>
        </div>
      </section>

      {events.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500">
          Aucun événement à venir.
        </p>
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.id}>
              <Link
                href={`/dashboard/evenements/${e.id}/invitations`}
                className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:border-brand-300 hover:bg-brand-50/40"
              >
                <div className="min-w-0">
                  <p className="font-medium break-words text-slate-900">{e.title}</p>
                  <p className="text-xs text-slate-500">{formatDate(e.starts_at)}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
