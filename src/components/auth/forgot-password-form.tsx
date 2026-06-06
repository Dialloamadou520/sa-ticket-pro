"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SITE } from "@/lib/constants";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error("Mode démo : configurez Supabase pour réinitialiser le mot de passe.");
      return;
    }
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      String(form.get("email")),
      { redirectTo: `${SITE.url}/reinitialiser-mot-de-passe` }
    );
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Email envoyé !");
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-5 text-sm text-brand-800">
        Si un compte existe avec cet email, vous recevrez un lien de
        réinitialisation. Pensez à vérifier vos spams.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required placeholder="vous@exemple.com" />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Envoi..." : "Envoyer le lien"}
      </Button>
      <p className="text-center text-sm text-slate-500">
        <Link href="/connexion" className="font-medium text-brand-600 hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}
