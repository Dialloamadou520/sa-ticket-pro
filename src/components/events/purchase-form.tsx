"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Loader2, Smartphone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Input, Label } from "@/components/ui/input";
import { Button, LinkButton } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { feeForUnitPrice } from "@/lib/payments/commission";
import { getTierTheme } from "@/lib/tier-theme";
import { PAYMENT_PROVIDERS } from "@/lib/constants";
import type { Event, FeeMode, PaymentProvider } from "@/lib/types";

interface Pending {
  provider: PaymentProvider;
  paymentId: string;
  cashoutUrl: string | null;
  confirmUrl: string;
}

export function PurchaseForm({
  event,
  feeMode = "service_fee",
}: {
  event: Event;
  feeMode?: FeeMode;
}) {
  const tiers = event.tiers ?? [];
  const [quantity, setQuantity] = useState(1);
  const [provider, setProvider] = useState<PaymentProvider>("wave");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [tierId, setTierId] = useState<string>(tiers[0]?.id ?? "");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedTier = tiers.find((t) => t.id === tierId) ?? null;
  const unitPrice = selectedTier ? selectedTier.price : event.price;
  const isFree = unitPrice <= 0;
  const unitFee = feeForUnitPrice(unitPrice, feeMode);
  const subtotal = unitPrice * quantity;
  const fee = unitFee * quantity;
  const total = subtotal + fee;

  useEffect(() => {
    if (!pending) return;
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      if (attempts > 60) {
        if (pollRef.current) clearInterval(pollRef.current);
        return;
      }
      try {
        const res = await fetch(
          `/api/payments/status?ref=${pending.paymentId}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (data.status === "paid") {
          if (pollRef.current) clearInterval(pollRef.current);
          window.location.href = pending.confirmUrl;
        } else if (data.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          toast.error("Paiement échoué ou annulé. Réessayez.");
          setPending(null);
          setLoading(false);
        }
      } catch {
        /* on réessaie au prochain tick */
      }
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pending]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug: event.slug,
          quantity,
          ticketType: event.ticket_type,
          holderName: String(form.get("holderName")),
          phone: String(form.get("phone")),
          provider,
          tierId: tierId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Une erreur est survenue.");
        setLoading(false);
        return;
      }
      if (data.mode === "integrated") {
        setPending({
          provider: data.provider,
          paymentId: data.paymentId,
          cashoutUrl: data.cashoutUrl ?? null,
          confirmUrl: data.confirmUrl,
        });
        if (data.cashoutUrl) window.open(data.cashoutUrl, "_blank");
        return;
      }
      window.location.href = data.redirect;
    } catch {
      toast.error("Connexion impossible. Réessayez.");
      setLoading(false);
    }
  }

  if (pending) {
    const isWave = pending.provider === "wave";
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
          <Smartphone className="h-7 w-7 text-brand-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">
          Validez le paiement sur votre téléphone
        </h3>
        {isWave ? (
          <p className="text-slate-500">
            Ouvrez Wave pour confirmer le paiement de{" "}
            <strong>{formatPrice(total)}</strong>. Si l&apos;onglet Wave ne
            s&apos;est pas ouvert, utilisez le bouton ci-dessous.
          </p>
        ) : (
          <p className="text-slate-500">
            Une demande de paiement de <strong>{formatPrice(total)}</strong> a
            été envoyée à votre numéro Orange Money. Confirmez-la sur votre
            téléphone (notification ou code USSD).
          </p>
        )}

        {isWave && pending.cashoutUrl && (
          <LinkButton
            href={pending.cashoutUrl}
            target="_blank"
            size="lg"
            className="w-full"
          >
            Ouvrir Wave pour payer
          </LinkButton>
        )}

        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          En attente de confirmation…
        </div>
        <p className="text-xs text-slate-400">
          Cette page se met à jour automatiquement dès le paiement validé.
        </p>
        <button
          type="button"
          onClick={() => {
            if (pollRef.current) clearInterval(pollRef.current);
            setPending(null);
            setLoading(false);
          }}
          className="text-sm text-slate-400 underline hover:text-slate-600"
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {tiers.length > 0 && (
        <div>
          <Label>Catégorie de ticket</Label>
          <div className="space-y-2">
            {tiers.map((t) => {
              const tt = getTierTheme(t.name);
              const active = tierId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTierId(t.id)}
                  className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                    active ? tt.ring : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="flex items-center gap-2.5 font-medium text-slate-800">
                    <span className={`h-3 w-3 rounded-full ${tt.dot}`} />
                    {t.name}
                  </span>
                  <span className={`font-semibold ${active ? tt.text : "text-slate-700"}`}>
                    {t.price > 0 ? formatPrice(t.price) : "Gratuit"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <Label>Quantité</Label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 hover:bg-slate-50"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-lg font-semibold">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(10, q + 1))}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div>
        <Label htmlFor="holderName">Nom du participant</Label>
        <Input id="holderName" name="holderName" required placeholder="Nom complet" />
      </div>

      <div>
        <Label htmlFor="phone">
          Numéro de téléphone {isFree ? "(facultatif)" : "(mobile money)"}
        </Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          required={!isFree}
          placeholder="77 000 00 00"
        />
      </div>

      {!isFree && (
        <div>
          <Label>Moyen de paiement</Label>
          <div className="grid grid-cols-2 gap-3">
            {PAYMENT_PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id)}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                  provider === p.id
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100/60 px-5 py-4">
        <div>
          <span className="block text-sm font-medium text-brand-700">
            {isFree ? "Total" : "À payer"}
          </span>
          {quantity > 1 && (
            <span className="text-xs text-brand-600/80">
              {quantity} tickets
            </span>
          )}
        </div>
        <span className="text-2xl font-bold text-brand-700">
          {formatPrice(total)}
        </span>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Traitement...
          </>
        ) : isFree ? (
          "Obtenir mon ticket"
        ) : (
          `Payer ${formatPrice(total)}`
        )}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5" />
        Paiement sécurisé via Wave &amp; Orange Money.
      </p>
    </form>
  );
}
