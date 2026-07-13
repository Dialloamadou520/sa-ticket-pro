import Link from "next/link";
import Image from "next/image";
import { BarChart3, ShieldCheck, Ticket } from "lucide-react";
import { SITE } from "@/lib/constants";

const perks = [
  { icon: Ticket, text: "Vendez vos tickets avec Wave & Orange Money" },
  { icon: ShieldCheck, text: "QR codes sécurisés et anti-fraude" },
  { icon: BarChart3, text: "Tableau de bord et statistiques en temps réel" },
];

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="gradient-hero relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-accent-500/10 blur-3xl" />

        <Link
          href="/"
          className="relative flex items-center"
          aria-label={SITE.name}
        >
          <Image
            src="/logo-kaypass-white.png"
            alt={SITE.name}
            width={2086}
            height={520}
            className="h-9 w-auto"
          />
        </Link>
        <div className="relative">
          <h2 className="max-w-sm text-3xl font-bold leading-tight">
            La billetterie qui propulse vos événements en Afrique.
          </h2>
          <ul className="mt-8 space-y-4">
            {perks.map((p) => (
              <li key={p.text} className="flex items-center gap-3 text-slate-100">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
                  <p.icon className="h-4 w-4" />
                </span>
                {p.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-slate-400">
          © {new Date().getFullYear()} {SITE.name}
        </p>
      </div>

      <div className="flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-8 lg:bg-white">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 flex items-center justify-center lg:hidden"
            aria-label={SITE.name}
          >
            <Image
              src="/logo-kaypass.png"
              alt={SITE.name}
              width={2086}
              height={520}
              className="h-9 w-auto"
            />
          </Link>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:border-0 lg:p-0 lg:shadow-none">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
