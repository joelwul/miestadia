import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    console.log("Webhook MP recibido:", payload);

    // MP envía notificaciones con query params: type y data.id
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || payload.type;
    const dataId = url.searchParams.get("data.id") || payload.data?.id;

    if (type === "preapproval") {
      // Obtener detalles del preapproval
      const response = await fetch(`https://api.mercadopago.com/preapproval/${dataId}`, {
        headers: {
          "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      });

      const preapproval = await response.json();

      if (preapproval.status === "authorized") {
        const externalRef = preapproval.external_reference; // "tenant_id-plan"
        const [tenantId, plan] = externalRef.split("-");

        if (tenantId && plan) {
          // Calcular fecha de fin
          const subscriptionEndsAt = new Date();
          if (plan === "monthly") {
            subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1);
          } else if (plan === "yearly") {
            subscriptionEndsAt.setFullYear(subscriptionEndsAt.getFullYear() + 1);
          }

          // Actualizar tenant
          await supabase
            .from("tenants")
            .update({
              subscription_status: "active",
              subscription_plan: plan,
              subscription_ends_at: subscriptionEndsAt.toISOString(),
              payment_provider: "mercadopago",
              payment_method: "mercadopago",
            })
            .eq("id", tenantId);

          // Registrar pago inicial
          await supabase
            .from("payments")
            .insert({
              tenant_id: tenantId,
              amount: preapproval.auto_recurring.transaction_amount,
              method: "mercadopago",
              date: new Date().toISOString(),
              notes: `Suscripción ${plan} activada - Preapproval ID: ${dataId}`,
            });

          console.log(`✅ Suscripción activada para tenant ${tenantId}`);
        }
      } else if (preapproval.status === "cancelled" || preapproval.status === "paused") {
        const externalRef = preapproval.external_reference;
        const [tenantId] = externalRef.split("-");
        
        if (tenantId) {
          await supabase
            .from("tenants")
            .update({ subscription_status: "cancelled" })
            .eq("id", tenantId);
          
          console.log(`⚠️ Suscripción cancelada/pausada para tenant ${tenantId}`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error en webhook MP:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}