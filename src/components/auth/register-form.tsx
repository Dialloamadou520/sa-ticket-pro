"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "./google-button";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error("Mode démo : configurez Supabase pour activer l'inscription.");
      return;
    }
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const role = String(form.get("role"));
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        fullName: String(form.get("full_name")),
        role,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      toast.error(data.error || "Inscription impossible.");
      return;
    }

    // Compte confirmé côté serveur : on connecte directement l'utilisateur.
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      toast.success("Compte créé ! Vous pouvez vous connecter.");
      router.push("/connexion");
      return;
    }
    toast.success("Compte créé ! Bienvenue 🎉");
    router.push(role === "organizer" ? "/dashboard" : "/");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <GoogleButton />
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        ou
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="full_name">Nom complet</Label>
          <Input id="full_name" name="full_name" required placeholder="Awa Ndiaye" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="vous@exemple.com" />
        </div>
        <div>
          <Label htmlFor="role">Je suis</Label>
          <Select id="role" name="role" defaultValue="participant">
            <option value="participant">Participant (j&apos;achète des tickets)</option>
            <option value="organizer">Organisateur (je vends des tickets)</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Au moins 6 caractères"
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Création..." : "Créer mon compte"}
        </Button>
      </form>
      <p className="text-center text-sm text-slate-500">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-medium text-brand-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
