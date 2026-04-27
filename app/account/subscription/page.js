import { createServerSupabaseClient, getServerUser } from "@/app/lib/supabase-server";
import SubscriptionClient from "./SubscriptionClient";
import { redirect } from "next/navigation";
import { getPaypalConfig } from "@/app/lib/api";

export const metadata = {
  title: "My Subscription",
  description: "Manage your Premium subscription",
};

export default async function SubscriptionPage() {
  const { user } = await getServerUser();
  if (!user) redirect("/");

  const supabase = await createServerSupabaseClient();

  // Fetch the user's active (or most recent) subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Fetch the plan label from cached config
  const configData = await getPaypalConfig();
  
  // Use environment variables for Plan IDs to ensure consistency with pricing page
  const finalConfig = {
    env: process.env.PAYPAL_MODE || configData?.env || 'sandbox',
    sandbox: {
      monthly_plan_id: process.env.PAYPAL_MONTHLY_PLAN_ID || configData?.sandbox?.monthly_plan_id,
      yearly_plan_id: process.env.PAYPAL_YEARLY_PLAN_ID || configData?.sandbox?.yearly_plan_id,
      monthly_price: configData?.sandbox?.monthly_price || "1.80",
      yearly_price: configData?.sandbox?.yearly_price || "18.00"
    },
    live: {
      monthly_plan_id: process.env.PAYPAL_MONTHLY_PLAN_ID || configData?.live?.monthly_plan_id,
      yearly_plan_id: process.env.PAYPAL_YEARLY_PLAN_ID || configData?.live?.yearly_plan_id,
      monthly_price: configData?.live?.monthly_price || "1.80",
      yearly_price: configData?.live?.yearly_price || "18.00"
    }
  };

  const activeParams = finalConfig.env === "live" ? finalConfig.live : finalConfig.sandbox;

  // Map plan_id to a human-readable label
  let planLabel = "Premium";
  const subPlanId = subscription?.plan_id;
  const monthlyId = activeParams?.monthly_plan_id;
  const yearlyId = activeParams?.yearly_plan_id;

  if (subPlanId) {
    if (subPlanId === monthlyId) {
      planLabel = `Premium Monthly — $${activeParams?.monthly_price}/mo`;
    } else if (subPlanId === yearlyId) {
      planLabel = `Premium Yearly — $${activeParams?.yearly_price}/yr`;
    } else {
      planLabel = "Premium (Legacy Plan)";
    }
  }

  const isMonthly = subPlanId === monthlyId || (subPlanId && subPlanId !== yearlyId);
  const isYearly = subPlanId === yearlyId;

  return (
    <SubscriptionClient
      subscription={subscription || null}
      planLabel={planLabel}
      userEmail={user.email}
      isMonthly={isMonthly}
      isYearly={isYearly}
    />
  );
}
