"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { EventFormState } from "@/app/dashboard/actions";
import { DEFAULT_EVENT_DURATION_HOURS } from "@/lib/format";
import type { Category, Event } from "@/lib/types";

interface TierRow {
  name: string;
  price: string;
  capacity: string;
}

interface Props {
  action: (prev: EventFormState, formData: FormData) => Promise<EventFormState>;
  categories: Category[];
  event?: Event;
  submitLabel: string;
}

export function EventForm({ action, categories, event, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const router = useRouter();
  const [bannerUrl, setBannerUrl] = useState(event?.banner_url ?? "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Échec de l'upload de l'image.");
        return;
      }
      setBannerUrl(json.url);
      toast.success("Image importée.");
    } catch {
      toast.error("Connexion impossible. Réessayez.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }
  const [tiers, setTiers] = useState<TierRow[]>(
    event?.tiers && event.tiers.length > 0
      ? event.tiers.map((t) => ({
          name: t.name,
          price: String(t.price),
          capacity: t.capacity ? String(t.capacity) : "",
        }))
      : []
  );

  function updateTier(i: number, field: keyof TierRow, value: string) {
    setTiers((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r))
    );
  }
  function addTier() {
    setTiers((rows) => [...rows, { name: "", price: "", capacity: "" }]);
  }
  function removeTier(i: number) {
    setTiers((rows) => rows.filter((_, idx) => idx !== i));
  }

  const tiersJson = JSON.stringify(
    tiers
      .filter((t) => t.name.trim())
      .map((t) => ({
        name: t.name.trim(),
        price: Number(t.price) || 0,
        capacity: Number(t.capacity) || 0,
      }))
  );
  const hasTiers = tiers.length > 0;

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
  const endTimeValue = event?.ends_at
    ? new Date(event.ends_at).toISOString().slice(11, 16)
    : "";

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
        <Label>Image de l&apos;événement</Label>
        <input type="hidden" name="banner_url" value={bannerUrl} />
        {bannerUrl && (
          <div className="relative mb-3 h-40 w-full overflow-hidden rounded-xl border border-slate-200">
            <Image
              src={bannerUrl}
              alt="Aperçu de la bannière"
              fill
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={() => setBannerUrl("")}
              className="absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-slate-600 shadow hover:text-red-600"
              aria-label="Retirer l'image"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onPickImage}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Import en cours…
              </>
            ) : (
              <>
                <ImagePlus className="h-4 w-4" /> Importer une image
              </>
            )}
          </Button>
          <span className="text-xs text-slate-400">JPG/PNG, 5 Mo max</span>
        </div>
        <Input
          className="mt-3"
          type="url"
          value={bannerUrl}
          onChange={(e) => setBannerUrl(e.target.value)}
          placeholder="…ou collez une URL d'image (https://)"
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

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="date">Date *</Label>
          <Input id="date" name="date" type="date" required defaultValue={dateValue} />
        </div>
        <div>
          <Label htmlFor="time">Heure de début</Label>
          <Input id="time" name="time" type="time" defaultValue={timeValue} />
        </div>
        <div>
          <Label htmlFor="end_time">Heure de fin</Label>
          <Input id="end_time" name="end_time" type="time" defaultValue={endTimeValue} />
          <p className="mt-1 text-xs text-slate-500">
            La vente de tickets reste ouverte jusqu&apos;à cette heure. Sans
            heure de fin : {DEFAULT_EVENT_DURATION_HOURS} h après le début.
          </p>
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
          {hasTiers && (
            <p className="mt-1 text-xs text-slate-400">
              Ignoré : la capacité est la somme des places par catégorie.
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="price">Prix (FCFA)</Label>
          <Input id="price" name="price" type="number" min={0} defaultValue={event?.price ?? 0} />
          {hasTiers && (
            <p className="mt-1 text-xs text-slate-400">
              Ignoré : le prix dépend des catégories ci-dessous.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="mb-0">Catégories de tickets (optionnel)</Label>
            <p className="text-xs text-slate-400">
              Ajoutez plusieurs catégories (ex. Standard, VIP, VVIP) avec leur
              prix. L&apos;acheteur choisira la sienne. Laissez vide pour
              utiliser le prix unique ci-dessus.
            </p>
          </div>
        </div>

        {tiers.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="hidden gap-2 text-xs font-medium text-slate-400 sm:grid sm:grid-cols-[1fr_120px_120px_40px]">
              <span>Nom</span>
              <span>Prix (FCFA)</span>
              <span>Places (0 = illimité)</span>
              <span />
            </div>
            {tiers.map((t, i) => (
              <div
                key={i}
                className="grid gap-2 sm:grid-cols-[1fr_120px_120px_40px]"
              >
                <Input
                  value={t.name}
                  onChange={(e) => updateTier(i, "name", e.target.value)}
                  placeholder="Ex: VIP"
                />
                <Input
                  type="number"
                  min={0}
                  value={t.price}
                  onChange={(e) => updateTier(i, "price", e.target.value)}
                  placeholder="Prix"
                />
                <Input
                  type="number"
                  min={0}
                  value={t.capacity}
                  onChange={(e) => updateTier(i, "capacity", e.target.value)}
                  placeholder="Places"
                />
                <button
                  type="button"
                  onClick={() => removeTier(i)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-slate-500 hover:bg-red-50 hover:text-red-600"
                  aria-label="Supprimer la catégorie"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addTier}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-brand-400 hover:text-brand-600"
        >
          <Plus className="h-4 w-4" />
          Ajouter une catégorie
        </button>
        <input type="hidden" name="tiers_json" value={tiersJson} />
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
