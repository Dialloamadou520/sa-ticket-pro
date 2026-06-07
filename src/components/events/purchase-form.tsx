"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { PAYMENT_PROVIDERS } from "@/lib/constants";
import type { Event, PaymentProvider } from "@/lib/types";

export function PurchaseForm({
  event,
  isAuthenticated = false,
}: {
  event: Event;
  isAuthenticated?: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const [provider, setProvider] = useState<PaymentProvider>("wave");
  const [loading, setLoading] = useState(false);
  const isFree = event.price <= 0;
  const total = event.price * quantity;

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
          email: String(form.get("email")),
          phone: String(form.get("phone")),
          provider,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Une erreur est survenue.");
        setLoading(false);
        return;
      }
      window.location.href = data.redirect;
    } catch {
      toast.error("Connexion impossible. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
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

      {!isAuthenticated && (
        <div>
          <Label htmlFor="email">Email (pour recevoir votre ticket)</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="vous@exemple.com"
          />
          <p className="mt-1 text-xs text-slate-400">
            Pas besoin de compte : votre ticket QR sera envoyé à cet email.
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="phone">Téléphone (pour le paiement mobile)</Label>
        <Input id="phone" name="phone" type="tel" placeholder="+221 77 000 00 00" />
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

      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-slate-600">Total</span>
        <span className="text-2xl font-bold text-brand-700">
          {formatPrice(total)}
        </span>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading
          ? "Traitement..."
          : isFree
            ? "Obtenir mon ticket"
            : `Payer ${formatPrice(total)}`}
      </Button>
      <p className="text-center text-xs text-slate-400">
        Paiement sécurisé via Wave & Orange Money. Vous recevrez vos tickets avec
        QR code par email.
      </p>
    </form>
  );
}
