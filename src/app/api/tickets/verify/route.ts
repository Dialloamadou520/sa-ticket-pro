import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Récupère le token brut depuis un lien /verifier/<token> ou une saisie. */
function extractToken(value: string): string {
  const trimmed = (value ?? "").trim();
  if (trimmed.includes("/verifier/")) {
    return trimmed.split("/verifier/").pop()?.split(/[?#]/)[0] ?? trimmed;
  }
  return trimmed;
}

/**
 * Valide un ticket au point d'entrée (réservé organisateur/admin).
 * Marque le ticket comme "used" et enregistre le scan. Renvoie un résultat:
 *   - valid        : ticket valide, première entrée
 *   - already_used : déjà scanné
 *   - invalid      : token inconnu
 *
 * Lecture/écriture via le client service-role : le RLS masquerait les tickets
 * d'invités ou ceux d'autres acheteurs. L'autorisation est vérifiée
 * explicitement (admin ou organisateur de l'événement).
 */
export async function POST(request: NextRequest) {
  const raw = ((await request.json()) as { token: string }).token;
  const token = extractToken(raw);

  if (!isSupabaseConfigured) {
    return NextResponse.json({
      result: "valid",
      demo: true,
      message: "Mode démo : ticket considéré valide.",
    });
  }

  if (!token) {
    return NextResponse.json({ result: "invalid", message: "Code vide." });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const admin = createAdminClient();
  const select = "*, event:events(title, starts_at, organizer_id)";

  // 1) Correspondance exacte sur le qr_token (cas du scan QR).
  let { data: ticket } = await admin
    .from("tickets")
    .select(select)
    .eq("qr_token", token)
    .maybeSingle();

  // 2) Repli : saisie manuelle de la référence (préfixe du qr_token affiché
  //    sur le ticket). On exige un préfixe d'au moins 6 caractères et une
  //    correspondance unique.
  if (!ticket && /^[0-9a-fA-F]{6,}$/.test(token)) {
    const { data: rows } = await admin
      .from("tickets")
      .select(select)
      .ilike("qr_token", `${token.toLowerCase()}%`)
      .limit(2);
    if (rows && rows.length === 1) ticket = rows[0];
  }

  if (!ticket) {
    return NextResponse.json({ result: "invalid", message: "Ticket inconnu." });
  }

  // Autorisation : admin, ou organisateur propriétaire de l'événement.
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  let allowed = profile?.role === "admin";
  if (!allowed) {
    const { data: organizer } = await admin
      .from("organizers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    allowed = Boolean(organizer && organizer.id === ticket.event?.organizer_id);
  }
  if (!allowed) {
    return NextResponse.json(
      {
        result: "invalid",
        message: "Vous n'êtes pas autorisé à scanner ce ticket.",
      },
      { status: 403 }
    );
  }

  if (ticket.status === "used") {
    await admin
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

  await admin.from("tickets").update({ status: "used" }).eq("id", ticket.id);
  await admin
    .from("scans")
    .insert({ ticket_id: ticket.id, scanned_by: user.id, result: "valid" });

  return NextResponse.json({
    result: "valid",
    holder: ticket.holder_name,
    event: ticket.event?.title,
    message: "Entrée autorisée.",
  });
}
