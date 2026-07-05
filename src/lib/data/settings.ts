import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Interrupteur global des frais de service (réglage admin). Par défaut activé
 * (et en mode démo sans backend).
 */
export async function getServiceFeesEnabled(): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("service_fees_enabled")
    .eq("id", true)
    .maybeSingle();
  return data?.service_fees_enabled ?? true;
}
