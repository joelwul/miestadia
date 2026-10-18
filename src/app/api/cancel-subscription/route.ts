import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cancelLemonSqueezySubscription } from '@/lib/lemonsqueezy';

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

    // Cancelar según el proveedor
    if (provider === 'lemonsqueezy' && subscription_id) {
      const result = await cancelLemonSqueezySubscription(subscription_id);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Error al cancelar en LemonSqueezy' },
          { status: 500 }
        );
      }
    } else if (provider === 'mercadopago') {
      // TODO: Implementar cancelación de Mercado Pago
      // Por ahora, solo marcamos como cancelado en la BD
      console.log('Cancelación de Mercado Pago pendiente de implementación');
    }

    // Actualizar el tenant en la base de datos
    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        subscription_status: 'cancelled',
        subscription_cancelled_at: new Date().toISOString(),
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
      message: 'Suscripción cancelada exitosamente',
    });
  } catch (err: any) {
    console.error('Error en cancel-subscription:', err);
    return NextResponse.json(
      { error: err.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}