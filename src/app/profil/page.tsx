import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ProfileForm } from "@/components/profile/profile-form";
import { TicketView, type TicketViewData } from "@/components/tickets/ticket-view";
import { LinkButton } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/data/auth";
import { getMyTickets } from "@/lib/data/tickets";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatDate } from "@/lib/format";
import { TICKET_TYPE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Mon profil" };

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === "tickets" ? "tickets" : "profil";

  if (!isSupabaseConfigured) {
    return (
      <Container className="max-w-xl py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Mon profil</h1>
        <p className="mt-3 text-slate-500">
          Cette page affiche vos informations et vos tickets. Configurez Supabase
          pour activer les comptes utilisateurs.
        </p>
        <LinkButton href="/" className="mt-6">
          Retour à l&apos;accueil
        </LinkButton>
      </Container>
    );
  }

  const user = await getCurrentUser();
  const tickets = await getMyTickets();

  const ticketData: TicketViewData[] = tickets.map((t) => ({
    id: t.id,
    eventTitle: t.event?.title ?? "Événement",
    date: t.event ? formatDate(t.event.starts_at) : "",
    location: t.event
      ? `${t.event.location}${t.event.city ? `, ${t.event.city}` : ""}`
      : "",
    holderName: t.holder_name ?? user?.profile?.full_name ?? "",
    ticketType: TICKET_TYPE_LABELS[t.ticket_type],
    qrToken: t.qr_token,
  }));

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold text-slate-900">Mon profil</h1>

      <div className="mt-6 flex gap-2 border-b border-slate-200">
        <TabLink href="/profil" label="Informations" active={activeTab === "profil"} />
        <TabLink
          href="/profil?tab=tickets"
          label={`Mes tickets (${tickets.length})`}
          active={activeTab === "tickets"}
        />
      </div>

      <div className="mt-8">
        {activeTab === "profil" ? (
          <ProfileForm
            fullName={user?.profile?.full_name ?? ""}
            phone={user?.profile?.phone ?? ""}
            email={user?.email ?? ""}
          />
        ) : ticketData.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center">
            <p className="font-medium text-slate-700">Aucun ticket</p>
            <p className="mt-1 text-sm text-slate-500">
              Vos tickets achetés apparaîtront ici.
            </p>
            <LinkButton href="/explorer" className="mt-5">
              Explorer les événements
            </LinkButton>
          </div>
        ) : (
          <div className="space-y-5">
            {ticketData.map((t) => (
              <TicketView key={t.id} ticket={t} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}

function TabLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
        active
          ? "border-brand-600 text-brand-700"
          : "border-transparent text-slate-500 hover:text-slate-700"
      )}
    >
      {label}
    </Link>
  );
}
