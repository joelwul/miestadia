import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PRICES, PRICES_ARS } from "@/lib/config";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { tenant_id, plan, provider } = await request.json();

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, name, slug, owner_email, owner_name")
      .eq("id", tenant_id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }

    if (provider === "mercadopago") {
      const amountARS = plan === "monthly" ? PRICES_ARS.monthly : PRICES_ARS.yearly;
      const title = plan === "monthly" 
        ? `Mi Estadía - Plan Mensual (USD ${PRICES.monthly})`
        : `Mi Estadía - Plan Anual (USD ${PRICES.yearly})`;

      // ⚠️ IMPORTANTE: start_date debe ser en el FUTURO (mañana)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0); // Mediodía para evitar problemas de timezone
      const startDate = tomorrow.toISOString();

      const response = await fetch("https://api.mercadopago.com/preapproval", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `${tenant_id}-${plan}-${Date.now()}`,
        },
        body: JSON.stringify({
          payer_email: tenant.owner_email,
          back_url: `${process.env.NEXT_PUBLIC_APP_URL}/${tenant.slug}/admin/billing?success=true&provider=mercadopago`,
          external_reference: `${tenant_id}-${plan}`,
          reason: title,
          status: "pending",
          auto_recurring: {
            frequency: plan === "monthly" ? 1 : 12,
            frequency_type: "months",
            transaction_amount: amountARS,
            currency_id: "ARS",
            start_date: startDate, // ✅ Fecha de mañana al mediodía
          },
          metadata: {
            tenant_id: tenant.id,
            plan: plan,
            provider: "mercadopago",
            amount_usd: plan === "monthly" ? PRICES.monthly : PRICES.yearly,
            amount_ars: amountARS,
            exchange_rate: String(process.env.USD_TO_ARS || "1600"),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error MP:", data);
        return NextResponse.json({ error: data.message || "Error creando suscripción" }, { status: 500 });
      }

      return NextResponse.json({ url: data.init_point });

    } else if (provider === "lemonsqueezy") {
      const variantId = plan === "monthly"
        ? process.env.LS_MONTHLY_VARIANT_ID
        : process.env.LS_YEARLY_VARIANT_ID;

      const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.LS_API_KEY}`,
          "Content-Type": "application/vnd.api+json",
          "Accept": "application/vnd.api+json",
        },
        body: JSON.stringify({
          data: {
            type: "checkouts",
            attributes: {
              custom_price: null,
              product_options: {
                redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/${tenant.slug}/admin/billing?success=true&provider=lemonsqueezy`,
                receipt_button_text: "Volver a Mi Estadía",
                receipt_link_url: `${process.env.NEXT_PUBLIC_APP_URL}/${tenant.slug}/admin/billing`,
                receipt_thank_you_note: "¡Gracias por suscribirte a Mi Estadía!",
              },
              checkout_data: {
                email: tenant.owner_email,
                custom: {
                  tenant_id: tenant.id,
                  plan: plan,
                  provider: "lemonsqueezy",
                },
              },
              expires_at: null,
              preview: false,
            },
            relationships: {
              store: {
                data: {
                  type: "stores",
                  id: process.env.LS_STORE_ID,
                },
              },
              variant: {
                data: {
                  type: "variants",
                  id: variantId,
                },
              },
            },
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json({ error: data.error?.message || "Error creando checkout LS" }, { status: 500 });
      }

      return NextResponse.json({ url: data.data.attributes.url });
    }

    return NextResponse.json({ error: "Provider no soportado" }, { status: 400 });
  } catch (error: any) {
    console.error("Error en create-checkout:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}