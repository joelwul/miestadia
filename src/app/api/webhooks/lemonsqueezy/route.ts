import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // 1. LEER EL CUERPO CRUDO (RAW) PARA VERIFICAR LA FIRMA
    // Esto es crucial: JSON.stringify altera el formato y rompe el hash.
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature");

    // 2. VERIFICAR LA FIRMA CON EL CUERPO CRUDO
    const hmac = crypto.createHmac("sha256", process.env.LS_WEBHOOK_SECRET!);
    hmac.update(rawBody);
    const digest = hmac.digest("hex");

    if (signature !== digest) {
      console.error("❌ Firma de webhook inválida. Posible ataque o secreto incorrecto.");
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    // 3. PARSEAR EL JSON SOLO DESPUÉS DE VERIFICAR LA SEGURIDAD
    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;
    console.log(`✅ Webhook recibido y verificado: ${eventName}`);

    switch (eventName) {
      case "order_created": {
        const order = payload.data?.attributes;
        const customData = order?.custom || {};
        const tenantId = customData.tenant_id;
        const plan = customData.plan;

        if (tenantId && plan) {
          const subscriptionEndsAt = new Date();
          if (plan === "yearly") {
            subscriptionEndsAt.setFullYear(subscriptionEndsAt.getFullYear() + 1);
          } else {
            subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1);
          }

          await supabase
            .from("tenants")
            .update({
              subscription_status: "active",
              subscription_plan: plan,
              subscription_ends_at: subscriptionEndsAt.toISOString(),
              payment_provider: "lemonsqueezy",
              payment_method: "card",
            })
            .eq("id", tenantId);

          await supabase.from("invoices").insert({
            tenant_id: tenantId,
            date: new Date().toISOString(),
            amount: plan === "yearly" ? 360 : 40,
            status: "paid",
            plan: plan,
            period: plan === "yearly" ? "Anual" : "Mensual",
            payment_provider: "lemonsqueezy",
          });

          console.log(`✅ Pedido LS completado y factura creada para tenant ${tenantId}`);
        }
        break;
      }

      case "subscription_created":
      case "subscription_updated": {
        const subscription = payload.data?.attributes;
        const customData = subscription?.custom_data || {};
        const tenantId = customData.tenant_id;
        const plan = customData.plan;

        if (tenantId && plan && subscription?.status === "active") {
          const subscriptionEndsAt = new Date(subscription.renews_at);

          await supabase
            .from("tenants")
            .update({
              subscription_status: "active",
              subscription_plan: plan,
              subscription_ends_at: subscriptionEndsAt.toISOString(),
              payment_provider: "lemonsqueezy",
              payment_method: "card",
            })
            .eq("id", tenantId);

          console.log(`✅ Suscripción LS activada para tenant ${tenantId}`);
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
          console.log(`⚠️ Suscripción LS cancelada para tenant ${tenantId}`);
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
          console.log(`❌ Suscripción LS expirada para tenant ${tenantId}`);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("❌ Error crítico en webhook LS:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}