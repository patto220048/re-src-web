import { createServerSupabaseClient } from "@/app/lib/supabase-server";
import PricingClient from "./PricingClient";

export const metadata = {
  title: "Premium Subscriptions - Stark Monochrome",
  description: "Get unlimited access to all resources",
};

export default async function PricingPage() {
  const supabase = await createServerSupabaseClient();
  
  // Lấy config từ bảng system_settings
  const { data: settings } = await supabase
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", "paypal_config")
    .single();

  // Dữ liệu mặc định nếu người dùng chưa chạy SQL hoặc chưa setup.
  const config = settings?.setting_value || {
    env: "sandbox",
    sandbox: {
      client_id: "test",
      monthly_plan_id: "",
      monthly_price: 2,
      yearly_plan_id: "",
      yearly_price: 18,
    },
    live: {
      client_id: "live",
      monthly_plan_id: "",
      monthly_price: 2,
      yearly_plan_id: "",
      yearly_price: 18,
    }
  };

  return <PricingClient config={config} />;
}
