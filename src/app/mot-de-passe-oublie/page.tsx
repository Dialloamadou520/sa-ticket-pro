import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function MotDePasseOubliePage() {
  return (
    <AuthShell
      title="Mot de passe oublié ?"
      subtitle="Entrez votre email et nous vous enverrons un lien de réinitialisation."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
