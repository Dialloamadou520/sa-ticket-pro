import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  DEFAULT_FEE_PERCENT,
  normalizeFeePercent,
} from "@/lib/payments/commission";

/**
 * Pourcentage global des frais de service (réglage admin). 1,5 % par défaut
 * (et en mode démo sans backend).
 */
export async function getServiceFeePercent(): Promise<number> {
  if (!isSupabaseConfigured) return DEFAULT_FEE_PERCENT;
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("service_fee_percent")
    .eq("id", true)
    .maybeSingle();
  return normalizeFeePercent(data?.service_fee_percent);
}
