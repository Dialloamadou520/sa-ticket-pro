import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const BUCKET = "event-images";
const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo

/**
 * Upload d'une image (bannière d'événement) depuis l'appareil de l'organisateur
 * vers Supabase Storage (bucket public). Renvoie l'URL publique à enregistrer
 * dans `events.banner_url`. Réservé aux utilisateurs connectés.
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "Stockage non configuré (mode démo)." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Le fichier doit être une image." },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Image trop lourde (5 Mo maximum)." },
      { status: 413 }
    );
  }

  const admin = createAdminClient();
  // Crée le bucket public au premier upload (idempotent : on ignore l'erreur
  // « déjà existant »).
  await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_SIZE,
  });

  const ext = (file.name.split(".").pop() || "jpg")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 5);
  const path = `${user.id}/${randomUUID()}.${ext || "jpg"}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (error) {
    return NextResponse.json(
      { error: `Échec de l'upload : ${error.message}` },
      { status: 500 }
    );
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
