import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const signature = request.headers.get("x-signature");

    // Verificar firma del webhook
    const hmac = crypto.createHmac("sha256", process.env.LS_WEBHOOK_SECRET!);
    hmac.update(JSON.stringify(payload));
    const digest = hmac.digest("hex");

    if (signature !== digest) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    const eventName = payload.meta?.event_name;

    switch (eventName) {
      case "subscription_created":
      case "subscription_updated": {
        const subscription = payload.data?.attributes;
        const customData = subscription?.custom_data || {};
        const tenantId = customData.tenant_id;
        const plan = customData.plan;

        if (tenantId && plan && subscription?.status === "active") {
          // Calcular fecha de fin
          const subscriptionEndsAt = new Date(subscription.renews_at);

          // Actualizar tenant
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

          console.log(`Suscripción LS activada para tenant ${tenantId}`);
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
            .update({
              subscription_status: "cancelled",
            })
            .eq("id", tenantId);

          console.log(`Suscripción LS cancelada para tenant ${tenantId}`);
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
            .update({
              subscription_status: "expired",
            })
            .eq("id", tenantId);

          console.log(`Suscripción LS expirada para tenant ${tenantId}`);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error en webhook LS:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}