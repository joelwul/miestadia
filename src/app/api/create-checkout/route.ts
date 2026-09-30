import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
      // Configurar montos según plan
      const config = plan === "monthly" 
        ? { title: "Mi Estadía - Plan Mensual", amount: 40, frequency: 1, frequency_type: "months" }
        : { title: "Mi Estadía - Plan Anual", amount: 360, frequency: 12, frequency_type: "months" };

      // Crear Preapproval (suscripción recurrente)
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
          reason: config.title,
          status: "pending",
          auto_recurring: {
            frequency: config.frequency,
            frequency_type: config.frequency_type,
            transaction_amount: config.amount,
            currency_id: "USD",
            start_date: new Date().toISOString(),
          },
          metadata: {
            tenant_id: tenant.id,
            plan: plan,
            provider: "mercadopago",
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error MP:", data);
        return NextResponse.json({ error: data.message || "Error creando suscripción" }, { status: 500 });
      }

      // Redirigir al usuario a la página de pago de MP
      return NextResponse.json({ url: data.init_point });

    } else if (provider === "lemonsqueezy") {
      // ... (código LS que ya tenías)
      return NextResponse.json({ error: "LS pendiente de configurar" }, { status: 500 });
    }

    return NextResponse.json({ error: "Provider no soportado" }, { status: 400 });
  } catch (error: any) {
    console.error("Error en create-checkout:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}