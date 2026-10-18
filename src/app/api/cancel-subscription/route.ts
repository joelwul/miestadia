import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { tenant_id, subscription_id, provider } = await request.json();

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'tenant_id es requerido' },
        { status: 400 }
      );
    }

    // Obtener datos del tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenant_id)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant no encontrado' },
        { status: 404 }
      );
    }

    // Calcular fecha de fin: 30 días desde HOY (o desde la última factura)
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30); // 30 días de acceso

    // Si hay una suscripción activa, usar su fecha de fin si es posterior
    if (tenant.subscription_ends_at) {
      const currentEnd = new Date(tenant.subscription_ends_at);
      if (currentEnd > endDate) {
        endDate.setTime(currentEnd.getTime());
      }
    }

    // Cancelar en el proveedor externo si es necesario
    if (provider === 'lemonsqueezy' && subscription_id) {
      try {
        const LS_API_KEY = process.env.LS_API_KEY;
        if (LS_API_KEY) {
          await fetch(
            `https://api.lemonsqueezy.com/v1/subscriptions/${subscription_id}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${LS_API_KEY}`,
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
              },
            }
          );
        }
      } catch (err) {
        console.error('Error cancelando en LemonSqueezy:', err);
      }
    }

    // Actualizar el tenant
    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        subscription_status: 'cancelled',
        subscription_cancelled_at: today.toISOString(),
        subscription_ends_at: endDate.toISOString(), // ← 30 días desde hoy
      })
      .eq('id', tenant_id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Error al actualizar el tenant: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Suscripción cancelada. Acceso mantenido por 30 días.',
      ends_at: endDate.toISOString(),
    });
  } catch (err: any) {
    console.error('Error en cancel-subscription:', err);
    return NextResponse.json(
      { error: err.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}