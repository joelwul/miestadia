import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-signature");

    if (signature) {
      const hmac = crypto.createHmac("sha256", process.env.LEMONSQUEEZY_WEBHOOK_SECRET!);
      hmac.update(body);
      const digest = hmac.digest("hex");

      if (signature !== digest) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(body);
    const eventName = event.meta?.event_name;

    if (eventName === "subscription_created" || eventName === "subscription_updated") {
      const subscription = event.data.attributes;
      const tenantId = subscription.custom_data?.tenant_id;
      const plan = subscription.custom_data?.plan;

      if (!tenantId || !plan) {
        return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
      }

      const endsAt = new Date();
      if (plan === "yearly") {
        endsAt.setFullYear(endsAt.getFullYear() + 1);
      } else {
        endsAt.setMonth(endsAt.getMonth() + 1);
      }

      await supabase
        .from("tenants")
        .update({
          subscription_status: "active",
          subscription_plan: plan,
          subscription_ends_at: endsAt.toISOString(),
          payment_method: "lemonsqueezy",
          payment_provider: "lemonsqueezy",
        })
        .eq("id", tenantId);

      await supabase.from("invoices").insert({
        tenant_id: tenantId,
        amount: subscription.price / 100,
        currency: subscription.currency,
        status: "paid",
        plan,
        period: `${new Date().toLocaleDateString("es-AR")} - ${endsAt.toLocaleDateString("es-AR")}`,
        provider: "lemonsqueezy",
        provider_subscription_id: subscription.id,
      });
    }

    if (eventName === "subscription_cancelled") {
      const subscription = event.data.attributes;
      const tenantId = subscription.custom_data?.tenant_id;

      if (tenantId) {
        await supabase
          .from("tenants")
          .update({
            subscription_status: "cancelled",
          })
          .eq("id", tenantId);
      }
    }

    if (eventName === "subscription_expired") {
      const subscription = event.data.attributes;
      const tenantId = subscription.custom_data?.tenant_id;

      if (tenantId) {
        await supabase
          .from("tenants")
          .update({
            subscription_status: "expired",
          })
          .eq("id", tenantId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Error processing LemonSqueezy webhook:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}