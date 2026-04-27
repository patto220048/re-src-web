/**
 * Script to simulate various PayPal Webhook scenarios for local testing.
 * 
 * Usage: node scripts/simulate-paypal-webhook.mjs [SUBSCRIPTION_ID] [SCENARIO]
 * 
 * Scenarios:
 *   - renew   : Simulate successful renewal (extends expiration)
 *   - cancel  : Simulate user cancellation
 *   - expire  : Simulate subscription expiration
 *   - suspend : Simulate payment failure or suspension
 */

const subscriptionID = process.argv[2];
const scenario = process.argv[3] || "renew";

if (!subscriptionID) {
  console.error("❌ Error: Please provide a Subscription ID (e.g., I-XXXXX)");
  console.log("Usage: node scripts/simulate-paypal-webhook.mjs I-123456789 [renew|cancel|expire|suspend]");
  process.exit(1);
}

const WEBHOOK_URL = "http://localhost:3000/api/webhooks/paypal";

let eventType = "";
let status = "";
let nextBillingTime = null;

switch (scenario.toLowerCase()) {
  case "renew":
    eventType = "BILLING.SUBSCRIPTION.RENEWED";
    status = "ACTIVE";
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    nextBillingTime = nextMonth.toISOString();
    break;
  
  case "cancel":
    eventType = "BILLING.SUBSCRIPTION.CANCELLED";
    status = "CANCELLED";
    break;

  case "expire":
    eventType = "BILLING.SUBSCRIPTION.EXPIRED";
    status = "EXPIRED";
    break;

  case "suspend":
    eventType = "BILLING.SUBSCRIPTION.SUSPENDED";
    status = "SUSPENDED";
    break;

  default:
    console.error(`❌ Unknown scenario: ${scenario}`);
    process.exit(1);
}

const mockPayload = {
  event_type: eventType,
  resource: {
    id: subscriptionID,
    status: status,
    billing_info: nextBillingTime ? { next_billing_time: nextBillingTime } : undefined
  }
};

async function simulateWebhook() {
  console.log(`🚀 [SIMULATION] Scenario: ${scenario.toUpperCase()}`);
  console.log(`📡 Event: ${eventType}`);
  console.log(`🆔 Subscription: ${subscriptionID}`);
  if (nextBillingTime) console.log(`📅 Next billing time: ${nextBillingTime}`);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockPayload),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Success! Server response:", data);
      console.log("--------------------------------------------------");
      console.log("Verification checks:");
      
      if (scenario === "renew") {
        console.log("- Profiles table: 'subscription_expires_at' should be updated.");
        console.log("- Profiles table: 'subscription_status' should be 'active'.");
      } else {
        console.log(`- Profiles table: 'subscription_status' should be '${status.toLowerCase()}'.`);
      }
    } else {
      console.error("❌ Failed! Server response:", data);
    }
  } catch (error) {
    console.error("❌ Error connecting to server:", error.message);
  }
}

simulateWebhook();
