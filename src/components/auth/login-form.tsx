"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error("Mode démo : configurez Supabase pour activer la connexion.");
      return;
    }
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setLoading(false);
    if (error) {
      toast.error("Identifiants incorrects.");
      return;
    }
    toast.success("Connexion réussie !");
    router.push(searchParams.get("redirect") || "/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="vous@exemple.com"
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mot de passe</Label>
            <Link
              href="/mot-de-passe-oublie"
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <PasswordInput id="password" name="password" required placeholder="••••••••" />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
      </form>
      <p className="text-center text-sm text-slate-500">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-medium text-brand-600 hover:underline">
          S&apos;inscrire
        </Link>
      </p>
    </div>
  );
}
