"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, LogOut, Shield, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";

interface Props {
  name: string;
  role: UserRole;
}

export function UserMenu({ name, role }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white"
        aria-label="Menu utilisateur"
      >
        {initials || <User className="h-5 w-5" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="truncate text-sm font-medium text-slate-900">{name}</p>
              <p className="text-xs capitalize text-slate-500">{role}</p>
            </div>
            <MenuLink href="/profil" icon={<User className="h-4 w-4" />}>
              Mon profil
            </MenuLink>
            <MenuLink href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>
              Tableau de bord
            </MenuLink>
            {role === "admin" && (
              <MenuLink href="/admin" icon={<Shield className="h-4 w-4" />}>
                Administration
              </MenuLink>
            )}
            <button
              onClick={signOut}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
    >
      {icon}
      {children}
    </Link>
  );
}
