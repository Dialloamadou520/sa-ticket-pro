import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/constants";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Inscription", robots: NO_INDEX };

export default function InscriptionPage() {
  return (
    <AuthShell
      title="Créer un compte"
      subtitle="Rejoignez kaypass et lancez votre billetterie en quelques minutes."
    >
      <RegisterForm />
    </AuthShell>
  );
}
