"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createPromoCode } from "@/app/admin/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { DiscountType } from "@/lib/types";

/** Création d'un code de vente pour un collaborateur / ambassadeur. */
export function PromoCodeForm({
  events,
}: {
  events: { id: string; title: string }[];
}) {
  const [code, setCode] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [eventId, setEventId] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("percent");
  const [discountValue, setDiscountValue] = useState("0");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error("Mode démo : codes promo désactivés.");
      return;
    }
    startTransition(async () => {
      try {
        await createPromoCode({
          code,
          ownerName,
          eventId,
          discountType,
          discountValue: Number(discountValue) || 0,
        });
        toast.success(`Code ${code.toUpperCase()} créé.`);
        setCode("");
        setOwnerName("");
        setDiscountValue("0");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Création impossible.",
        );
      }
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div>
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="AMBA10"
          required
          disabled={pending}
        />
      </div>
      <div>
        <Label htmlFor="owner">Collaborateur</Label>
        <Input
          id="owner"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          placeholder="Nom de l'ambassadeur"
          required
          disabled={pending}
        />
      </div>
      <div>
        <Label htmlFor="event">Événement</Label>
        <Select
          id="event"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          disabled={pending}
        >
          <option value="">Tous les événements</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="discount">Réduction par ticket (0 = suivi seul)</Label>
        <div className="flex gap-2">
          <Input
            id="discount"
            type="number"
            min={0}
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            disabled={pending}
          />
          <Select
            aria-label="Type de réduction"
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as DiscountType)}
            disabled={pending}
            className="w-24"
          >
            <option value="percent">%</option>
            <option value="amount">FCFA</option>
          </Select>
        </div>
      </div>
      <div className="flex items-end">
        <Button type="submit" className="w-full" disabled={pending}>
          <Plus className="h-4 w-4" />
          Créer le code
        </Button>
      </div>
    </form>
  );
}
