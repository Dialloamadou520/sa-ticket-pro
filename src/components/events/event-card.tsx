import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { countdownLabel, formatDateShort, formatPrice } from "@/lib/format";
import type { Event } from "@/lib/types";

export function EventCard({ event }: { event: Event }) {
  const remaining = event.capacity - event.tickets_sold;
  const almostSoldOut = remaining > 0 && remaining <= event.capacity * 0.1;
  const soldOut = remaining <= 0;
  const countdown = countdownLabel(event.starts_at);
  const upcoming = countdown !== "Terminé";

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/evenements/${event.slug}`} className="block">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {event.banner_url ? (
          <Image
            src={event.banner_url}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            Sans image
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          {event.category && <Badge tone="brand">{event.category.name}</Badge>}
          {almostSoldOut && <Badge tone="amber">Bientôt complet</Badge>}
        </div>
        {upcoming && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            <Timer className="h-3.5 w-3.5" />
            {countdown}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold text-slate-900 group-hover:text-brand-700">
          {event.title}
        </h3>
        <div className="mt-3 space-y-1.5 text-sm text-slate-500">
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0" />
            {formatDateShort(event.starts_at)}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">
              {event.location}
              {event.city ? `, ${event.city}` : ""}
            </span>
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="font-bold text-brand-700">
            {formatPrice(event.price)}
          </span>
        </div>
      </div>
      </Link>
      <div className="px-4 pb-4">
        {soldOut ? (
          <Button size="sm" className="w-full" disabled>
            Complet
          </Button>
        ) : (
          <LinkButton
            href={`/evenements/${event.slug}/achat`}
            size="sm"
            className="w-full"
          >
            Acheter
          </LinkButton>
        )}
      </div>
    </div>
  );
}
