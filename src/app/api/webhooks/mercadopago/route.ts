import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || '';

function verifyWebhookSignature(request: Request, body: string): boolean {
  if (!MP_WEBHOOK_SECRET) return true;
  
  const xSignature = request.headers.get('x-signature');
  const xRequestId = request.headers.get('x-request-id');
  
  if (!xSignature || !xRequestId) return false;
  
  const hmac = crypto.createHmac('sha256', MP_WEBHOOK_SECRET);
  hmac.update(xRequestId);
  const expectedSignature = hmac.digest('hex');
  
  return xSignature === expectedSignature;
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    
    // Verificar firma del webhook
    if (MP_WEBHOOK_SECRET && !verifyWebhookSignature(request, body)) {
      console.error('Webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    const data = JSON.parse(body);
    const { type, data: eventData } = data;
    
    console.log('MercadoPago webhook received:', type, eventData);
    
    if (type === 'payment') {
      const paymentId = eventData?.id;
      
      // Obtener detalles del pago desde MP
      const response = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          },
        }
      );
      
      const payment = await response.json();
      const status = payment?.status;
      const externalReference = payment?.external_reference;
      
      console.log('Payment status:', status, 'External ref:', externalReference);
      
      if (externalReference && status === 'approved') {
        // external_reference contiene el tenant_id
        const { data: tenant } = await supabase
          .from('tenants')
          .select('id')
          .eq('id', externalReference)
          .single();
        
        if (tenant?.id) {
          await supabase
            .from('tenants')
            .update({
              subscription_status: 'active',
              subscription_provider: 'mercadopago',
              payment_method: 'card',
              subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq('id', tenant.id);
          
          await supabase
            .from('invoices')
            .insert({
              tenant_id: tenant.id,
              mercadopago_payment_id: paymentId,
              amount: payment?.transaction_amount || 0,
              status: 'paid',
              plan: 'monthly',
              period: new Date().toLocaleDateString('es-AR'),
              date: new Date().toISOString(),
            });
          
          console.log('Tenant updated:', tenant.id);
        }
      }
    }
    
    if (type === 'subscription') {
      const subscriptionId = eventData?.id;
      
      const response = await fetch(
        `https://api.mercadopago.com/preapproval/${subscriptionId}`,
        {
          headers: {
            'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          },
        }
      );
      
      const subscription = await response.json();
      const status = subscription?.status;
      const externalReference = subscription?.external_reference;
      
      console.log('Subscription status:', status, 'External ref:', externalReference);
      
      if (externalReference) {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('id')
          .eq('id', externalReference)
          .single();
        
        if (tenant?.id) {
          const subStatus = status === 'authorized' ? 'active' : 
                           status === 'cancelled' ? 'cancelled' : 
                           status === 'paused' ? 'paused' : 'active';
          
          await supabase
            .from('tenants')
            .update({
              subscription_status: subStatus,
              subscription_provider: 'mercadopago',
              subscription_id: subscriptionId,
            })
            .eq('id', tenant.id);
          
          console.log('Subscription updated:', tenant.id);
        }
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error processing MercadoPago webhook:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}