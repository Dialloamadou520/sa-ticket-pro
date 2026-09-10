import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getEventBySlug } from "@/lib/data/events";
import { findPromoCode } from "@/lib/payments/promo";

/** Vérifie un code promo saisi à l'achat et renvoie la réduction applicable. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code") ?? "";
  const slug = searchParams.get("event") ?? "";

  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Mode démo." }, { status: 400 });
  }
  const event = await getEventBySlug(slug);
  if (!event) {
    return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
  }
  const promo = await findPromoCode(code, event.id);
  if (!promo) {
    return NextResponse.json({ error: "Code invalide." }, { status: 404 });
  }
  return NextResponse.json({
    code: promo.code,
    ownerName: promo.owner_name,
    discountType: promo.discount_type,
    discountValue: promo.discount_value,
  });
}
