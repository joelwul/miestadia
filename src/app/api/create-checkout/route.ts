import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRICES = {
  monthly: 40,
  yearly: 360,
};

const PRICES_ARS = {
  monthly: 64000,
  yearly: 576000,
};

export async function POST(request: Request) {
  try {
    const { tenant_id, plan, provider, payer_email, payer_name } = await request.json();

    if (!tenant_id || !plan || !provider) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
    }

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenant_id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    const finalEmail = payer_email || tenant.owner_email || tenant.settings?.email;
    const finalName = payer_name || tenant.owner_name || tenant.name || 'Usuario';

    if (!finalEmail) {
      return NextResponse.json({ error: 'No hay email configurado' }, { status: 400 });
    }

    const amount = plan === 'monthly' ? PRICES.monthly : PRICES.yearly;
    const amountARS = plan === 'monthly' ? PRICES_ARS.monthly : PRICES_ARS.yearly;

    if (provider === 'mercadopago') {
      const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
      if (!MP_ACCESS_TOKEN) {
        return NextResponse.json({ error: 'MP_ACCESS_TOKEN no configurado' }, { status: 500 });
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const backUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://miestadia.online'}/${tenant.slug}/admin/billing`;

      // ✅ ESTRUCTURA CORRECTA: payer_email a nivel raíz
      const preference = {
        reason: `Mi Estadía - Plan ${plan === 'monthly' ? 'Mensual' : 'Anual'}`,
        external_reference: tenant_id,
        payer_email: finalEmail,  // ← A NIVEL RAÍZ, NO DENTRO DE "payer"
        auto_recurring: {
          frequency: plan === 'monthly' ? 1 : 12,
          frequency_type: plan === 'monthly' ? 'month' : 'year',
          transaction_amount: amountARS,
          currency_id: 'ARS',
          start_date: tomorrow.toISOString(),
        },
        back_url: backUrl,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://miestadia.online'}/api/webhooks/mercadopago`,
      };

      const response = await fetch('https://api.mercadopago.com/preapproval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'X-Idempotency-Key': `${tenant_id}-${plan}-${Date.now()}`,
        },
        body: JSON.stringify(preference),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error Mercado Pago:', data);
        return NextResponse.json(
          { error: data.message || 'Error creando suscripción en Mercado Pago' },
          { status: response.status }
        );
      }

      await supabase
        .from('tenants')
        .update({
          subscription_provider: 'mercadopago',
          subscription_id: data.id,
          subscription_plan: plan,
          subscription_status: 'pending',
        })
        .eq('id', tenant_id);

      return NextResponse.json({ url: data.init_point });
    }

    if (provider === 'lemonsqueezy') {
      const LS_API_KEY = process.env.LS_API_KEY;
      const LS_STORE_ID = process.env.LS_STORE_ID;
      const LS_MONTHLY_VARIANT_ID = process.env.LS_MONTHLY_VARIANT_ID;
      const LS_YEARLY_VARIANT_ID = process.env.LS_YEARLY_VARIANT_ID;

      if (!LS_API_KEY || !LS_STORE_ID) {
        return NextResponse.json({ error: 'Variables de LemonSqueezy no configuradas' }, { status: 500 });
      }

      const variantId = plan === 'monthly' ? LS_MONTHLY_VARIANT_ID : LS_YEARLY_VARIANT_ID;

      if (!variantId) {
        return NextResponse.json({ error: `Variant ID no configurado para plan ${plan}` }, { status: 500 });
      }

      const checkoutData = {
        data: {
          type: 'checkouts',
          attributes: {
            custom_price: amount * 100,
            product_options: {
              redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://miestadia.online'}/${tenant.slug}/admin/billing?success=true`,
              receipt_button_text: 'Volver a Mi Estadía',
              receipt_link_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://miestadia.online'}/${tenant.slug}/admin/billing`,
              receipt_thank_you_note: '¡Gracias por suscribirte a Mi Estadía!',
            },
            checkout_data: {
              email: finalEmail,
              name: finalName,
              custom: [
                { key: 'tenant_id', value: tenant_id },
                { key: 'tenant_slug', value: tenant.slug },
              ],
            },
            test_mode: process.env.NODE_ENV !== 'production',
          },
          relationships: {
            store: { data: { type: 'stores', id: LS_STORE_ID } },
            variant: { data: { type: 'variants', id: variantId } },
          },
        },
      };

      const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LS_API_KEY}`,
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
        body: JSON.stringify(checkoutData),
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { error: data.error?.message || 'Error creando checkout en LemonSqueezy' },
          { status: response.status }
        );
      }

      return NextResponse.json({ url: data.data.attributes.url });
    }

    return NextResponse.json({ error: 'Proveedor no soportado' }, { status: 400 });
  } catch (err: any) {
    console.error('Error en create-checkout:', err);
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
  }
}