"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function ResetPasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error("Mode démo : configurez Supabase.");
      return;
    }
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    if (password !== String(form.get("confirm"))) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Mot de passe mis à jour !");
    router.push("/connexion");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="password">Nouveau mot de passe</Label>
        <PasswordInput id="password" name="password" required minLength={6} />
      </div>
      <div>
        <Label htmlFor="confirm">Confirmer le mot de passe</Label>
        <PasswordInput id="confirm" name="confirm" required minLength={6} />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Mise à jour..." : "Réinitialiser"}
      </Button>
    </form>
  );
}
