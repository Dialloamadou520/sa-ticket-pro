import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { UserRole } from "@/lib/types";

interface Body {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Inscription côté serveur. On crée le compte directement confirmé via le
 * client service-role : l'utilisateur peut se connecter immédiatement sans
 * dépendre de la livraison d'un email de confirmation (SMTP non configuré).
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "Mode démo : configurez Supabase pour activer l'inscription." },
      { status: 503 }
    );
  }

  const body = (await request.json()) as Body;
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const fullName = (body.fullName ?? "").trim();
  const role: UserRole = body.role === "organizer" ? "organizer" : "participant";

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir au moins 6 caractères." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });

  if (error) {
    const already =
      error.status === 422 ||
      /already|exist|registered/i.test(error.message);
    return NextResponse.json(
      {
        error: already
          ? "Un compte existe déjà avec cet email. Connectez-vous."
          : error.message,
      },
      { status: already ? 409 : 400 }
    );
  }

  return NextResponse.json({ ok: true, role });
}
