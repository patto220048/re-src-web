import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json()
    const eventType = body.event_type
    const resource = body.resource

    console.log(`[PayPal Webhook] Received ${eventType} event`)

    if (!eventType || !resource || !resource.id) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const subscriptionID = resource.id

    // Fetch current subscription state to check auto_renew
    const { data: currentSub } = await supabase
      .from("subscriptions")
      .select("auto_renew, status")
      .eq("paypal_subscription_id", subscriptionID)
      .single()

    if (eventType.startsWith("BILLING.SUBSCRIPTION.")) {
      let status = resource.status // ACTIVE, CANCELLED, EXPIRED, SUSPENDED
      const nextBillingTime = resource.billing_info?.next_billing_time

      // Defensive check for renewed event on cancelled sub
      if (eventType === "BILLING.SUBSCRIPTION.RENEWED" && currentSub?.auto_renew === false) {
        console.warn(`[PayPal Webhook] Received RENEW for a cancelled sub ${subscriptionID}. Keeping status as CANCELLED.`)
        status = "CANCELLED"
      }

      const subUpdateData: any = {
        status: status,
        updated_at: new Date().toISOString()
      }
      
      if (nextBillingTime) {
        subUpdateData.current_period_end = nextBillingTime
      }

      await supabase
        .from("subscriptions")
        .update(subUpdateData)
        .eq("paypal_subscription_id", subscriptionID)

      // Sync with profiles table
      const profileUpdateData: any = {
        subscription_status: status.toLowerCase(),
      }

      if (nextBillingTime) {
        profileUpdateData.subscription_expires_at = nextBillingTime
      }

      await supabase
        .from("profiles")
        .update(profileUpdateData)
        .eq("subscription_id", subscriptionID)

      return new Response(JSON.stringify({ success: true, updatedStatus: status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    return new Response(JSON.stringify({ success: true, ignored: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (err) {
    console.error("[PayPal Webhook] Processing Error:", err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
