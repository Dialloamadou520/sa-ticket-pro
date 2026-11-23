import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { verifyTicketToken } from "@/lib/tickets/verify-ticket";

/** Valide un ticket au point d'entrée (admin, organisateur ou contrôleur). */
export async function POST(request: NextRequest) {
  const raw = ((await request.json()) as { token: string }).token;

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

  const { status, body } = await verifyTicketToken(createAdminClient(), user, raw);
  return NextResponse.json(body, { status });
}
