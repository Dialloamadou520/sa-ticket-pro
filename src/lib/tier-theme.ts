/**
 * Thème couleur par catégorie de ticket (Standard, VIP, VVIP, …).
 * Donne une couleur stable et lisible à chaque catégorie pour différencier
 * visuellement les tickets et les sélecteurs. Les catégories connues (VIP,
 * VVIP, gratuit…) ont une couleur dédiée ; les autres sont réparties de façon
 * déterministe sur une palette (même nom -> même couleur).
 *
 * NB : les classes Tailwind sont écrites en toutes lettres (et non construites
 * dynamiquement) pour être détectées au build.
 */

export interface TierTheme {
  /** Dégradé pour un bandeau/en-tête coloré. */
  gradient: string;
  /** Pastille de catégorie (fond + texte). */
  badge: string;
  /** Petit point de couleur. */
  dot: string;
  /** Bordure + fond léger (carte sélectionnée). */
  ring: string;
  /** Texte accentué. */
  text: string;
  /** Triplet RVB pour l'en-tête du PDF. */
  pdf: [number, number, number];
}

const THEMES: Record<string, TierTheme> = {
  emerald: {
    gradient: "from-emerald-500 to-teal-600",
    badge: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
    ring: "border-emerald-500 bg-emerald-50",
    text: "text-emerald-700",
    pdf: [5, 150, 105],
  },
  amber: {
    gradient: "from-amber-400 to-orange-500",
    badge: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
    ring: "border-amber-500 bg-amber-50",
    text: "text-amber-700",
    pdf: [217, 119, 6],
  },
  purple: {
    gradient: "from-fuchsia-500 to-purple-600",
    badge: "bg-purple-100 text-purple-800",
    dot: "bg-purple-500",
    ring: "border-purple-500 bg-purple-50",
    text: "text-purple-700",
    pdf: [147, 51, 234],
  },
  sky: {
    gradient: "from-sky-500 to-blue-600",
    badge: "bg-sky-100 text-sky-800",
    dot: "bg-sky-500",
    ring: "border-sky-500 bg-sky-50",
    text: "text-sky-700",
    pdf: [2, 132, 199],
  },
  rose: {
    gradient: "from-rose-500 to-pink-600",
    badge: "bg-rose-100 text-rose-800",
    dot: "bg-rose-500",
    ring: "border-rose-500 bg-rose-50",
    text: "text-rose-700",
    pdf: [225, 29, 72],
  },
  indigo: {
    gradient: "from-indigo-500 to-violet-600",
    badge: "bg-indigo-100 text-indigo-800",
    dot: "bg-indigo-500",
    ring: "border-indigo-500 bg-indigo-50",
    text: "text-indigo-700",
    pdf: [79, 70, 229],
  },
  slate: {
    gradient: "from-slate-500 to-slate-700",
    badge: "bg-slate-200 text-slate-700",
    dot: "bg-slate-400",
    ring: "border-slate-500 bg-slate-50",
    text: "text-slate-700",
    pdf: [71, 85, 105],
  },
};

const ROTATION = ["emerald", "amber", "purple", "sky", "rose", "indigo"];

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

export function getTierTheme(label?: string | null): TierTheme {
  const name = (label ?? "").trim().toLowerCase();
  if (!name || /gratuit|free/.test(name)) return THEMES.slate;
  if (/vvip|platine|platinum|diamant/.test(name)) return THEMES.purple;
  if (/vip|\bor\b|gold|premium|carr[ée]/.test(name)) return THEMES.amber;
  if (/standard|normal|simple|basique|tribune/.test(name)) return THEMES.emerald;
  return THEMES[ROTATION[hash(name) % ROTATION.length]];
}
