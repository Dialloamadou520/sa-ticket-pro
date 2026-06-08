import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Vérification du ticket" };

export default async function VerifierPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const status = await getStatus(token);
  const ok = status === "valid";

  return (
    <Container className="flex max-w-md flex-col items-center py-20 text-center">
      {ok ? (
        <CheckCircle2 className="h-16 w-16 text-brand-600" />
      ) : (
        <XCircle className="h-16 w-16 text-red-500" />
      )}
      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        {ok ? "Ticket valide" : "Ticket non valide"}
      </h1>
      <p className="mt-2 text-slate-500">
        {status === "valid" && "Ce ticket est authentique."}
        {status === "used" && "Ce ticket a déjà été utilisé."}
        {status === "invalid" && "Aucun ticket ne correspond à ce code."}
      </p>
      <p className="mt-6 max-w-xs text-xs text-slate-400">
        Cette page confirme l&apos;authenticité du QR code. La validation
        définitive à l&apos;entrée se fait via le scanner de l&apos;organisateur.
      </p>
      <LinkButton href="/scanner" variant="outline" className="mt-6">
        Scanner un autre ticket
      </LinkButton>
    </Container>
  );
}

async function getStatus(token: string): Promise<"valid" | "used" | "invalid"> {
  if (!isSupabaseConfigured) return "valid";
  // Le qr_token sert de jeton de capacité : on lit via le client service-role
  // pour que la page publique fonctionne même sans connexion (scan téléphone).
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("tickets")
    .select("status")
    .eq("qr_token", token)
    .maybeSingle();
  if (!data) return "invalid";
  return data.status === "used" ? "used" : data.status === "valid" ? "valid" : "invalid";
}
