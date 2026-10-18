import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.LS_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret no configurado' }, { status: 500 });
    }

    const body = await request.text();
    const event = JSON.parse(body);
    const eventName = event.meta?.event_name;

    console.log('LemonSqueezy webhook received:', eventName);

    switch (eventName) {
      case 'subscription_created':
      case 'subscription_resumed':
      case 'subscription_updated': {
        const subscription = event.data?.attributes;
        const subscriptionId = event.data?.id;
        const customerId = subscription?.customer_id;
        const status = subscription?.status;

        // Buscar tenant por customer_id
        const { data: customer } = await supabase
          .from('lemonsqueezy_customers')
          .select('tenant_id')
          .eq('lemonsqueezy_id', customerId)
          .single();

        if (customer?.tenant_id) {
          // Calcular fecha de fin según el plan
          const endsAt = subscription?.renews_at || subscription?.ends_at;
          const plan = subscription?.variant_id === process.env.LS_YEARLY_VARIANT_ID ? 'yearly' : 'monthly';

          await supabase
            .from('tenants')
            .update({
              subscription_status: status === 'active' ? 'active' : status,
              subscription_id: subscriptionId,
              subscription_provider: 'lemonsqueezy',
              subscription_ends_at: endsAt,
              subscription_plan: plan,
              subscription_cancelled_at: null, // Limpiar cancelación si reactiva
            })
            .eq('id', customer.tenant_id);

          console.log('Tenant updated:', customer.tenant_id, 'Status:', status);
        }
        break;
      }

      case 'subscription_cancelled': {
        const subscriptionId = event.data?.id;
        const subscription = event.data?.attributes;

        const { data: tenant } = await supabase
          .from('tenants')
          .select('id')
          .eq('subscription_id', subscriptionId)
          .single();

        if (tenant?.id) {
          await supabase
            .from('tenants')
            .update({
              subscription_status: 'cancelled',
              subscription_cancelled_at: new Date().toISOString(),
              // NO tocar subscription_ends_at - sigue vigente hasta esa fecha
            })
            .eq('id', tenant.id);
        }
        break;
      }

      case 'subscription_expired': {
        const subscriptionId = event.data?.id;

        const { data: tenant } = await supabase
          .from('tenants')
          .select('id')
          .eq('subscription_id', subscriptionId)
          .single();

        if (tenant?.id) {
          await supabase
            .from('tenants')
            .update({
              subscription_status: 'expired',
            })
            .eq('id', tenant.id);
        }
        break;
      }

      case 'order_created': {
        const order = event.data?.attributes;
        const orderId = event.data?.id;
        const customerId = order?.customer_id;

        if (customerId) {
          const { data: customer } = await supabase
            .from('lemonsqueezy_customers')
            .select('tenant_id')
            .eq('lemonsqueezy_id', customerId)
            .single();

          if (customer?.tenant_id) {
            await supabase
              .from('invoices')
              .insert({
                tenant_id: customer.tenant_id,
                lemonsqueezy_order_id: orderId,
                amount: (order?.total || 0) / 100,
                status: order?.status === 'paid' ? 'paid' : 'pending',
                plan: order?.variant_id === process.env.LS_YEARLY_VARIANT_ID ? 'yearly' : 'monthly',
                period: order?.created_at ? new Date(order.created_at).toLocaleDateString('es-AR') : '',
                date: order?.created_at || new Date().toISOString(),
              });
          }
        }
        break;
      }

      default:
        console.log('Unhandled event:', eventName);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error processing LemonSqueezy webhook:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}