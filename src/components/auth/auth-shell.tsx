import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/constants";

const perks = [
  "Vendez vos tickets avec Wave & Orange Money",
  "QR codes sécurisés et anti-fraude",
  "Tableau de bord et statistiques en temps réel",
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
      <div className="gradient-hero hidden flex-col justify-between p-12 text-white lg:flex">
        <Link href="/" className="flex items-center" aria-label={SITE.name}>
          <Image
            src="/logo-kaypass-white.png"
            alt={SITE.name}
            width={2086}
            height={520}
            className="h-9 w-auto"
          />
        </Link>
        <div>
          <h2 className="max-w-sm text-3xl font-bold leading-tight">
            La billetterie qui propulse vos événements en Afrique.
          </h2>
          <ul className="mt-8 space-y-4">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-3 text-slate-200">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs">
                  ✓
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-slate-400">© {new Date().getFullYear()} {SITE.name}</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
