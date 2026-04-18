import { supabaseAdmin } from "@/app/lib/supabase-admin";
import { getServerUser } from "@/app/lib/supabase-server";
import SubscriptionsClient from "./SubscriptionsClient";
import { redirect } from "next/navigation";

export const metadata = { title: "Admin — Subscriptions" };

export default async function AdminSubscriptionsPage() {
  const { user } = await getServerUser();
  if (!user) redirect("/admin/login");

  // Join subscriptions with profiles for user email
  const { data: subscriptions, error } = await supabaseAdmin
    .from("subscriptions")
    .select(`
      id,
      paypal_subscription_id,
      plan_id,
      status,
      current_period_start,
      current_period_end,
      created_at,
      user_id,
      profiles:user_id ( email, full_name )
    `)
    .order("created_at", { ascending: false });

  if (error) console.error("Error fetching subscriptions:", error);

  return <SubscriptionsClient subscriptions={subscriptions || []} />;
}
