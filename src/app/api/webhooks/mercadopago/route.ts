import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.type === "payment") {
      const paymentId = body.data.id;

      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      });

      const payment = await response.json();

      if (payment.status === "approved") {
        const tenantId = payment.metadata?.tenant_id;
        const plan = payment.metadata?.plan;

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
            payment_method: "mercadopago",
            payment_provider: "mercadopago",
          })
          .eq("id", tenantId);

        await supabase.from("invoices").insert({
          tenant_id: tenantId,
          amount: payment.transaction_amount,
          currency: payment.currency_id,
          status: "paid",
          plan,
          period: `${new Date().toLocaleDateString("es-AR")} - ${endsAt.toLocaleDateString("es-AR")}`,
          provider: "mercadopago",
          provider_payment_id: paymentId,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Error processing MercadoPago webhook:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}