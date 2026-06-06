import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Réinitialiser le mot de passe" };

export default function ReinitialiserPage() {
  return (
    <AuthShell
      title="Nouveau mot de passe"
      subtitle="Choisissez un nouveau mot de passe sécurisé pour votre compte."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
