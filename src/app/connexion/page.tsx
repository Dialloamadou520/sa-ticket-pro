import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Connexion" };

export default function ConnexionPage() {
  return (
    <AuthShell title="Bon retour 👋" subtitle="Connectez-vous pour gérer vos événements et vos tickets.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
