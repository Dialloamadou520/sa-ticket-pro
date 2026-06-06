"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarPlus,
  LayoutDashboard,
  ScanLine,
  Ticket,
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
  { label: "Scanner les tickets", href: "/scanner", icon: ScanLine },
];

export function DashboardSidebar({ items = defaultItems }: { items?: Item[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-1.5">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-brand-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
