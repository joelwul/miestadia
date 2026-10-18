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

    // Cancelar en el proveedor externo si es necesario (ej: LemonSqueezy)
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
        // No fallamos si el error es externo, igual actualizamos la BD
      }
    }

    // Actualizar el tenant: marcar como "cancelled" pero mantener subscription_ends_at
    // para que siga activo hasta el final del período pagado
    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        subscription_status: 'cancelled',
        subscription_cancelled_at: new Date().toISOString(),
        // NO tocar subscription_ends_at - sigue vigente hasta esa fecha
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
      message: 'Suscripción cancelada. Acceso mantenido hasta el final del período pagado.',
      ends_at: tenant.subscription_ends_at,
    });
  } catch (err: any) {
    console.error('Error en cancel-subscription:', err);
    return NextResponse.json(
      { error: err.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}