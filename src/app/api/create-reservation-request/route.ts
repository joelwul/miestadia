import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tenantSlug,
      unitId,
      guestName,
      guestEmail,
      guestPhone,
      guestDocument,
      checkIn,
      checkOut,
      guestsCount,
      totalAmount,
      specialRequests,
    } = body;

    if (!tenantSlug || !unitId || !guestName || !guestEmail || !checkIn || !checkOut) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // Usar service role para evitar problemas de RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Obtener tenant y su configuración de timeout
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, name, reservation_timeout_hours")
      .eq("slug", tenantSlug)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: "Alojamiento no encontrado" }, { status: 404 });
    }

    // 2. Doble verificación de disponibilidad
    const { data: conflicts } = await supabase
      .from("reservations")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("unit_id", unitId)
      .neq("status", "cancelled")
      .lte("check_in", checkOut)
      .gte("check_out", checkIn);

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({
        error: "La unidad acaba de ser reservada. Por favor, elegí otras fechas."
      }, { status: 409 });
    }

    // 3. Calcular timeout
    const timeoutHours = tenant.reservation_timeout_hours || 24;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + timeoutHours);

    // 4. Crear la solicitud
    const { data, error } = await supabase
      .from("reservation_requests")
      .insert({
        tenant_id: tenant.id,
        unit_id: unitId,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone || null,
        guest_document: guestDocument || null,
        check_in: checkIn,
        check_out: checkOut,
        guests_count: guestsCount || 1,
        total_amount: totalAmount || 0,
        special_requests: specialRequests || null,
        status: "pending",
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creando solicitud:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Solicitud enviada correctamente",
      requestId: data.id
    });
  } catch (error: any) {
    console.error("Error en create-reservation-request:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}