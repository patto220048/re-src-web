import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Initialize admin supabase client for webhook (needs service role to bypass RLS)
function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';

  return createServerClient(
    supabaseUrl,
    supabaseKey, // Needs service role key to update users without being logged in
    {
      cookies: {
        getAll() { return []; },
        setAll() { },
      },
    }
  );
}

export async function POST(req) {
  try {
    // Read the raw body text for signature validation (optional but recommended for production)
    const body = await req.json();
    const eventType = body.event_type;
    const resource = body.resource;

    if (!eventType || !resource || !resource.id) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const subscriptionID = resource.id;
    const supabase = getAdminSupabase();

    console.log(`[PayPal Webhook] Received ${eventType} for Subscription ${subscriptionID}`);

    // Fetch current subscription state to check auto_renew
    const { data: currentSub } = await supabase
      .from("subscriptions")
      .select("auto_renew, status")
      .eq("paypal_subscription_id", subscriptionID)
      .single();

    if (eventType.startsWith("BILLING.SUBSCRIPTION.")) {
      let status = resource.status; // ACTIVE, CANCELLED, EXPIRED, SUSPENDED
      const nextBillingTime = resource.billing_info?.next_billing_time;

      // DEFENSIVE CHECK: If our DB says auto_renew is OFF (status was cancelled), 
      // but we get a RENEWED event from PayPal, we update the time but keep status as CANCELLED.
      // This ensures the UI doesn't suddenly show "Auto-renew: ON" again.
      if (eventType === "BILLING.SUBSCRIPTION.RENEWED" && currentSub?.auto_renew === false) {
        console.warn(`[PayPal Webhook] Received RENEW for a cancelled sub ${subscriptionID}. Keeping status as CANCELLED.`);
        status = "CANCELLED";
      }

      const subUpdateData = {
        status: status,
        updated_at: new Date().toISOString()
      };
      
      if (nextBillingTime) {
        subUpdateData.current_period_end = nextBillingTime;
      }

      const { error: subError } = await supabase
        .from("subscriptions")
        .update(subUpdateData)
        .eq("paypal_subscription_id", subscriptionID)
        .select()
        .single();

      if (subError && subError.code !== 'PGRST116') {
        console.error("[PayPal Webhook] DB Update Error:", subError);
      }

      // Sync with profiles table
      const profileUpdateData = {
        subscription_status: status.toLowerCase(),
      };

      if (nextBillingTime) {
        profileUpdateData.subscription_expires_at = nextBillingTime;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdateData)
        .eq("subscription_id", subscriptionID);

      if (profileError) {
         console.error("[PayPal Webhook] Profile Update Error:", profileError);
      }

      return NextResponse.json({ success: true, updatedStatus: status });
    }

    // Handle Payment completions
    if (eventType === "PAYMENT.SALE.COMPLETED") {
      // payment sale usually has billing_agreement_id instead of just id
      const subId = resource.billing_agreement_id;
      if (subId) {
        // You could update last payment time here if needed
      }
    }

    // Acknowledge other events
    return NextResponse.json({ success: true, ignored: true });

  } catch (err) {
    console.error("[PayPal Webhook] Processing Error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
