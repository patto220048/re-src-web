"use server";

import { createServerClient } from "@supabase/ssr";

function getAdminSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() { return []; },
        setAll() { },
      },
    }
  );
}

export async function updatePaypalConfig(config) {
  try {
    const supabase = getAdminSupabase();

    const { error } = await supabase
      .from("system_settings")
      .upsert({
        setting_key: "paypal_config",
        setting_value: config,
        updated_at: new Date().toISOString()
      }, { onConflict: "setting_key" });

    if (error) {
      console.error("DB Error updating config:", error);
      return { success: false, error: "Failed to update settings" };
    }

    return { success: true };
  } catch (err) {
    console.error("Error in updatePaypalConfig:", err);
    return { success: false, error: err.message };
  }
}
