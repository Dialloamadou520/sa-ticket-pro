import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Inscription" };

export default function InscriptionPage() {
  return (
    <AuthShell
      title="Créer un compte"
      subtitle="Rejoignez Sa Ticket Pro et lancez votre billetterie en quelques minutes."
    >
      <RegisterForm />
    </AuthShell>
  );
}
