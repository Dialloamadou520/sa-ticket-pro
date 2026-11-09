"use client";

import { useMemo, useState } from "react";
import {
  Mail,
  MessageCircle,
  Phone,
  Search,
  ShieldPlus,
  Users,
} from "lucide-react";
import { AddAdminForm } from "@/components/admin/add-admin-form";
import {
  ROLE_LABELS,
  UserRoleEditor,
} from "@/components/admin/user-role-editor";
import { formatDateShort } from "@/lib/format";
import type { Profile, UserRole } from "@/lib/types";

type Filter = "all" | UserRole;

const ROLE_BADGE: Record<UserRole, string> = {
  participant: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  organizer: "bg-violet-100 text-violet-700 ring-1 ring-violet-200",
  admin: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
};

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "participant", label: "Participants" },
  { key: "organizer", label: "Organisateurs" },
  { key: "admin", label: "Admins" },
];

const AVATAR_COLORS = [
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
];

const PAGE_SIZE = 12;

function initials(u: Profile): string {
  const source = u.full_name?.trim() || u.email || "?";
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function avatarColor(id: string): string {
  let hash = 0;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function whatsappUrl(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.length === 9 ? `221${digits}` : digits}`;
}

const ICON_BUTTON =
  "flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-brand-200 hover:text-brand-700 sm:h-8 sm:w-8";

function UserRow({ u, self }: { u: Profile; self: boolean }) {
  return (
    <li className="grid min-w-0 gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-4 sm:px-5 sm:py-3">
      <div className="flex min-w-0 items-center gap-3">
        {u.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={u.avatar_url}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColor(u.id)}`}
          >
            {initials(u)}
          </span>
        )}
        <div className="min-w-0">
          <p className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium text-slate-900">
              {u.full_name || "Sans nom"}
            </span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_BADGE[u.role]}`}
            >
              {ROLE_LABELS[u.role]}
            </span>
          </p>
          <p className="truncate text-xs text-slate-500">
            {u.email ?? "Email non renseigné"}
            {u.phone ? ` · ${u.phone}` : ""}
          </p>
          <p className="text-[11px] text-slate-400">
            Inscrit le {formatDateShort(u.created_at)}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-2 sm:contents">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {u.phone && (
            <>
              <a
                href={`tel:${u.phone.replace(/\s/g, "")}`}
                aria-label={`Appeler ${u.full_name ?? ""}`}
                title="Appeler"
                className={ICON_BUTTON}
              >
                <Phone className="h-4 w-4" />
              </a>
              <a
                href={whatsappUrl(u.phone)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`WhatsApp ${u.full_name ?? ""}`}
                title="WhatsApp"
                className={ICON_BUTTON}
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </>
          )}
          {u.email && (
            <a
              href={`mailto:${u.email}`}
              aria-label={`Écrire à ${u.full_name ?? u.email}`}
              title="Email"
              className={ICON_BUTTON}
            >
              <Mail className="h-4 w-4" />
            </a>
          )}
        </div>

        <div className="flex items-center text-sm sm:justify-end">
          <UserRoleEditor userId={u.id} role={u.role} self={self} />
        </div>
      </div>
    </li>
  );
}

/** Section admin « Utilisateurs récents » : ajout de rôle, recherche, filtres. */
export function AdminUsers({
  users,
  currentUserId,
}: {
  users: Profile[];
  currentUserId: string | null;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      all: users.length,
      participant: 0,
      organizer: 0,
      admin: 0,
    };
    for (const u of users) base[u.role] += 1;
    return base;
  }, [users]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter((u) => {
      if (filter !== "all" && u.role !== filter) return false;
      if (!needle) return true;
      return [u.full_name, u.email, u.phone].some((v) =>
        v?.toLowerCase().includes(needle),
      );
    });
  }, [users, filter, query]);

  const visible = filtered.slice(0, limit);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 p-4 sm:items-center sm:p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <Users className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center font-semibold text-slate-900">
            Utilisateurs récents
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {users.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Les 50 derniers inscrits. Attribuez un rôle à un compte existant :
            un administrateur a accès à tout (événements, organisateurs, revenus
            et rôles).
          </p>
        </div>
      </div>

      <div className="space-y-4 bg-slate-50/50 p-4 sm:p-5">
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 sm:p-4">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-900">
            <ShieldPlus className="h-4 w-4" />
            Donner un rôle par email
          </p>
          <AddAdminForm />
        </div>

        {users.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
            {`La liste des utilisateurs s'affichera ici une fois Supabase configuré.`}
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setLimit(PAGE_SIZE);
                  }}
                  placeholder="Nom, email ou téléphone"
                  aria-label="Rechercher un utilisateur"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-base outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 sm:h-10 sm:text-sm"
                />
              </label>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
                {FILTERS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setFilter(key);
                      setLimit(PAGE_SIZE);
                    }}
                    aria-pressed={filter === key}
                    className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors ${
                      filter === key
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                        filter === key
                          ? "bg-white/25 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {counts[key]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
                Aucun utilisateur ne correspond à cette recherche.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <ul className="divide-y divide-slate-100">
                  {visible.map((u) => (
                    <UserRow key={u.id} u={u} self={u.id === currentUserId} />
                  ))}
                </ul>
                {filtered.length > visible.length && (
                  <button
                    type="button"
                    onClick={() => setLimit((l) => l + PAGE_SIZE)}
                    className="flex min-h-11 w-full items-center justify-center border-t border-slate-100 text-sm font-semibold text-brand-700 hover:bg-slate-50"
                  >
                    Voir plus ({filtered.length - visible.length})
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
