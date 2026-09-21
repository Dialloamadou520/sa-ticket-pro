/**
 * Jauge de remplissage affichée au public. `percent` est la valeur marketing
 * choisie par l'organisateur : aucune donnée de vente réelle n'est exposée.
 */
export function fillTone(percent: number) {
  if (percent >= 90)
    return {
      bar: "from-red-500 to-red-600",
      text: "text-red-600",
      solid: "bg-red-600",
      message: "Dernières places disponibles !",
    };
  if (percent >= 70)
    return {
      bar: "from-amber-400 to-red-500",
      text: "text-amber-600",
      solid: "bg-amber-500",
      message: "Il ne reste plus beaucoup de places.",
    };
  return {
    bar: "from-brand-400 to-brand-600",
    text: "text-brand-700",
    solid: "bg-brand-600",
    message: "Réservez votre place dès maintenant.",
  };
}

export function FillGauge({
  percent,
  soldOut,
}: {
  percent: number;
  soldOut: boolean;
}) {
  const value = soldOut ? 100 : percent;
  const tone = fillTone(value);

  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-end justify-between">
        <span className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Remplissage
        </span>
        <span className={`text-3xl font-extrabold leading-none ${tone.text}`}>
          {soldOut ? "Complet" : `${value} %`}
        </span>
      </div>
      <div className="mt-3 h-4 overflow-hidden rounded-full bg-white ring-1 ring-inset ring-slate-200">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${tone.bar}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className={`mt-2 text-sm font-semibold ${tone.text}`}>
        {soldOut ? "Événement complet" : `${value} % des places sont vendues`}
      </p>
      {!soldOut && (
        <p className="mt-0.5 text-xs text-slate-500">{tone.message}</p>
      )}
    </div>
  );
}
