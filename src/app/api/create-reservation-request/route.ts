import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

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

    const supabase = createClient();

    // 1. Obtener tenant y su configuración de timeout
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, name, reservation_timeout_hours")
      .eq("slug", tenantSlug)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: "Alojamiento no encontrado" }, { status: 404 });
    }

    // 2. Doble verificación de disponibilidad (prevención de race conditions)
    const timeoutHours = tenant.reservation_timeout_hours || 24;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + timeoutHours);

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

    // 3. Crear la solicitud
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
      return NextResponse.json({ error: "No se pudo crear la solicitud" }, { status: 500 });
    }

    // TODO: Paso 5 - Aquí iremos el envío de emails (al admin y al huésped)

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