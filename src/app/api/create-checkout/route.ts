import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { tenant_id, plan, provider, return_url } = await request.json();

    if (!tenant_id || !plan || !provider) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenant_id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const prices = {
      monthly: {
        lemonsqueezy: process.env.LEMONSQUEEZY_MONTHLY_VARIANT_ID,
        mercadopago: {
          title: "Mi Estadía - Plan Mensual",
          price: 45000,
          currency: "ARS",
        },
      },
      yearly: {
        lemonsqueezy: process.env.LEMONSQUEEZY_YEARLY_VARIANT_ID,
        mercadopago: {
          title: "Mi Estadía - Plan Anual",
          price: 450000,
          currency: "ARS",
        },
      },
    };

    if (provider === "lemonsqueezy") {
      const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: {
            type: "checkouts",
            attributes: {
              variant_id: prices[plan].lemonsqueezy,
              custom_price: null,
              product_options: {
                redirect_url: return_url,
                receipt_button_text: "Volver a Mi Estadía",
                receipt_link_url: return_url,
              },
              checkout_data: {
                email: tenant.owner_email,
                custom: {
                  tenant_id,
                  plan,
                },
              },
            },
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Error creating checkout");
      }

      return NextResponse.json({ url: data.data.attributes.url });
    } else if (provider === "mercadopago") {
      const mpConfig = prices[plan].mercadopago;

      const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              title: mpConfig.title,
              quantity: 1,
              unit_price: mpConfig.price,
              currency_id: mpConfig.currency,
            },
          ],
          payer: {
            email: tenant.owner_email,
            name: tenant.owner_name,
          },
          back_urls: {
            success: return_url,
            failure: return_url,
            pending: return_url,
          },
          auto_return: "approved",
          metadata: {
            tenant_id,
            plan,
          },
          notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error creating preference");
      }

      return NextResponse.json({ url: data.init_point });
    }

    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  } catch (err: any) {
    console.error("Error creating checkout:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}