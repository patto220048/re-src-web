import { createServerSupabaseClient } from "@/app/lib/supabase-server";
import PaypalSettingsClient from "./PaypalSettingsClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin - PayPal Config",
};

export default async function AdminPaypalSettings() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Protect route
  if (!user) {
    redirect("/");
  }

  // Fetch current config
  const { data: settings } = await supabase
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", "paypal_config")
    .single();

  const config = settings?.setting_value || {
    env: "sandbox",
    sandbox: {
      client_id: "",
      monthly_plan_id: "",
      monthly_price: 2,
      yearly_plan_id: "",
      yearly_price: 18,
    },
    live: {
      client_id: "",
      monthly_plan_id: "",
      monthly_price: 2,
      yearly_plan_id: "",
      yearly_price: 18,
    }
  };

  return <PaypalSettingsClient initialConfig={config} />;
}
