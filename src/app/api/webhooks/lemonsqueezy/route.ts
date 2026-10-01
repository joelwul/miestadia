import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature");

    const hmac = crypto.createHmac("sha256", process.env.LS_WEBHOOK_SECRET!);
    hmac.update(rawBody);
    const digest = hmac.digest("hex");

    if (signature !== digest) {
      console.error("❌ Firma inválida");
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;
    
    console.log("=== WEBHOOK RECIBIDO ===");
    console.log("Evento:", eventName);
    console.log("Payload data.attributes:", JSON.stringify(payload.data?.attributes, null, 2));

    switch (eventName) {
      case "order_created": {
        const order = payload.data?.attributes;
        // Los datos custom están en order.custom (no en custom_data)
        const customData = order?.custom || {};
        const tenantId = customData.tenant_id;
        const plan = customData.plan;
        
        console.log("📦 Order custom data:", customData);

        if (tenantId && plan) {
          const subscriptionEndsAt = new Date();
          if (plan === "yearly") {
            subscriptionEndsAt.setFullYear(subscriptionEndsAt.getFullYear() + 1);
          } else {
            subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1);
          }

          const { error: updateError } = await supabase
            .from("tenants")
            .update({
              subscription_status: "active",
              subscription_plan: plan,
              subscription_ends_at: subscriptionEndsAt.toISOString(),
              payment_provider: "lemonsqueezy",
              payment_method: "card",
            })
            .eq("id", tenantId);

          if (updateError) {
            console.error("❌ Error actualizando tenant:", updateError);
          } else {
            console.log("✅ Tenant actualizado:", tenantId);
          }

          const { error: invoiceError } = await supabase.from("invoices").insert({
            tenant_id: tenantId,
            date: new Date().toISOString(),
            amount: plan === "yearly" ? 360 : 40,
            status: "paid",
            plan: plan,
            period: plan === "yearly" ? "Anual" : "Mensual",
            payment_provider: "lemonsqueezy",
          });

          if (invoiceError) {
            console.error("❌ Error creando factura:", invoiceError);
          } else {
            console.log("✅ Factura creada para tenant:", tenantId);
          }
        } else {
          console.error("❌ tenantId o plan no encontrados. customData:", customData);
          console.error("Order completo:", JSON.stringify(order, null, 2));
        }
        break;
      }

      case "subscription_created":
      case "subscription_updated": {
        const subscription = payload.data?.attributes;
        // Los datos custom están en subscription.custom_data (no en custom)
        const customData = subscription?.custom_data || {};
        const tenantId = customData.tenant_id;
        const plan = customData.plan;
        
        console.log("🔄 Subscription custom_data:", customData);
        console.log("Status:", subscription?.status);

        if (tenantId && plan && subscription?.status === "active") {
          const subscriptionEndsAt = new Date(subscription.renews_at);

          const { error } = await supabase
            .from("tenants")
            .update({
              subscription_status: "active",
              subscription_plan: plan,
              subscription_ends_at: subscriptionEndsAt.toISOString(),
              payment_provider: "lemonsqueezy",
              payment_method: "card",
            })
            .eq("id", tenantId);

          if (error) {
            console.error("❌ Error actualizando suscripción:", error);
          } else {
            console.log("✅ Suscripción activada para tenant:", tenantId);
          }
        } else {
          console.error("❌ Datos incompletos. tenantId:", tenantId, "plan:", plan, "status:", subscription?.status);
        }
        break;
      }

      case "subscription_cancelled": {
        const subscription = payload.data?.attributes;
        const customData = subscription?.custom_data || {};
        const tenantId = customData.tenant_id;

        if (tenantId) {
          await supabase
            .from("tenants")
            .update({ subscription_status: "cancelled" })
            .eq("id", tenantId);
          console.log("⚠️ Suscripción cancelada para tenant:", tenantId);
        }
        break;
      }

      case "subscription_expired": {
        const subscription = payload.data?.attributes;
        const customData = subscription?.custom_data || {};
        const tenantId = customData.tenant_id;

        if (tenantId) {
          await supabase
            .from("tenants")
            .update({ subscription_status: "expired" })
            .eq("id", tenantId);
          console.log("❌ Suscripción expirada para tenant:", tenantId);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("❌ Error crítico en webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}