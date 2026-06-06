"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { EventFormState } from "@/app/dashboard/actions";
import type { Category, Event } from "@/lib/types";

interface Props {
  action: (prev: EventFormState, formData: FormData) => Promise<EventFormState>;
  categories: Category[];
  event?: Event;
  submitLabel: string;
}

export function EventForm({ action, categories, event, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success("Événement enregistré !");
      router.push("/dashboard/evenements");
      router.refresh();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  const startDate = event ? new Date(event.starts_at) : null;
  const dateValue = startDate ? startDate.toISOString().slice(0, 10) : "";
  const timeValue = startDate ? startDate.toISOString().slice(11, 16) : "20:00";

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <Label htmlFor="title">Titre de l&apos;événement *</Label>
        <Input id="title" name="title" required defaultValue={event?.title} placeholder="Ex: Dakar Music Night" />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={event?.description ?? ""}
          placeholder="Décrivez votre événement..."
        />
      </div>

      <div>
        <Label htmlFor="banner_url">URL de la bannière</Label>
        <Input
          id="banner_url"
          name="banner_url"
          type="url"
          defaultValue={event?.banner_url ?? ""}
          placeholder="https://..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="category_id">Catégorie</Label>
          <Select id="category_id" name="category_id" defaultValue={event?.category_id ?? ""}>
            <option value="">— Choisir —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="ticket_type">Type de ticket</Label>
          <Select id="ticket_type" name="ticket_type" defaultValue={event?.ticket_type ?? "standard"}>
            <option value="standard">Standard</option>
            <option value="vip">VIP</option>
            <option value="gratuit">Gratuit</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="date">Date *</Label>
          <Input id="date" name="date" type="date" required defaultValue={dateValue} />
        </div>
        <div>
          <Label htmlFor="time">Heure</Label>
          <Input id="time" name="time" type="time" defaultValue={timeValue} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="location">Lieu *</Label>
          <Input id="location" name="location" required defaultValue={event?.location} placeholder="Grand Théâtre" />
        </div>
        <div>
          <Label htmlFor="city">Ville</Label>
          <Input id="city" name="city" defaultValue={event?.city ?? ""} placeholder="Dakar" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="capacity">Nombre de places</Label>
          <Input id="capacity" name="capacity" type="number" min={0} defaultValue={event?.capacity ?? 100} />
        </div>
        <div>
          <Label htmlFor="price">Prix (FCFA)</Label>
          <Input id="price" name="price" type="number" min={0} defaultValue={event?.price ?? 0} />
        </div>
      </div>

      <div>
        <Label htmlFor="status">Statut</Label>
        <Select id="status" name="status" defaultValue={event?.status ?? "pending"}>
          <option value="draft">Brouillon</option>
          <option value="pending">Soumettre pour validation</option>
        </Select>
        <p className="mt-1 text-xs text-slate-400">
          Les événements doivent être validés par un administrateur avant
          publication.
        </p>
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Enregistrement..." : submitLabel}
      </Button>
    </form>
  );
}
