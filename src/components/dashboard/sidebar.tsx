"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarPlus,
  LayoutDashboard,
  ScanLine,
  Tag,
  Ticket,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Item {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

const defaultItems: Item[] = [
  { label: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Mes événements", href: "/dashboard/evenements", icon: Ticket },
  { label: "Créer un événement", href: "/dashboard/evenements/nouveau", icon: CalendarPlus },
  { label: "Codes promo", href: "/dashboard/codes-promo", icon: Tag },
  { label: "Reversements", href: "/dashboard/reversements", icon: Wallet },
  { label: "Scanner les tickets", href: "/scanner", icon: ScanLine },
];

export function DashboardSidebar({ items = defaultItems }: { items?: Item[] }) {
  const pathname = usePathname();

  return (
    <nav className="-mx-4 flex snap-x snap-mandatory gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-xl border px-3.5 text-sm font-medium transition-colors lg:w-full lg:gap-3 lg:px-4",
              active
                ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 lg:border-transparent lg:bg-transparent"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
