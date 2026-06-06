import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Valide un ticket au point d'entrée (réservé organisateur/admin).
 * Marque le ticket comme "used" et enregistre le scan. Renvoie un résultat:
 *   - valid        : ticket valide, première entrée
 *   - already_used : déjà scanné
 *   - invalid      : token inconnu
 */
export async function POST(request: NextRequest) {
  const { token } = (await request.json()) as { token: string };

  if (!isSupabaseConfigured) {
    return NextResponse.json({
      result: "valid",
      demo: true,
      message: "Mode démo : ticket considéré valide.",
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*, event:events(title, starts_at)")
    .eq("qr_token", token)
    .maybeSingle();

  if (!ticket) {
    return NextResponse.json({ result: "invalid", message: "Ticket inconnu." });
  }

  if (ticket.status === "used") {
    await supabase
      .from("scans")
      .insert({ ticket_id: ticket.id, scanned_by: user.id, result: "already_used" });
    return NextResponse.json({
      result: "already_used",
      holder: ticket.holder_name,
      event: ticket.event?.title,
      message: "Ce ticket a déjà été utilisé.",
    });
  }

  if (ticket.status !== "valid") {
    return NextResponse.json({
      result: "invalid",
      message: "Ticket annulé ou remboursé.",
    });
  }

  await supabase.from("tickets").update({ status: "used" }).eq("id", ticket.id);
  await supabase
    .from("scans")
    .insert({ ticket_id: ticket.id, scanned_by: user.id, result: "valid" });

  return NextResponse.json({
    result: "valid",
    holder: ticket.holder_name,
    event: ticket.event?.title,
    message: "Entrée autorisée.",
  });
}
