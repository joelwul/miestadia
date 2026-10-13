import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function POST(request: Request) {
  try {
    const { tenantSlug, unitId, checkIn, checkOut } = await request.json();

    if (!tenantSlug || !unitId || !checkIn || !checkOut) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const supabase = createClient();

    // 1. Obtener tenant_id
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", tenantSlug)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: "Alojamiento no encontrado" }, { status: 404 });
    }

    // 2. Verificar reservas confirmadas
    const { data: confirmedReservations } = await supabase
      .from("reservations")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("unit_id", unitId)
      .neq("status", "cancelled")
      .lte("check_in", checkOut)
      .gte("check_out", checkIn);

    if (confirmedReservations && confirmedReservations.length > 0) {
      return NextResponse.json({ 
        available: false, 
        message: "La unidad ya está reservada en esas fechas." 
      });
    }

    // 3. Verificar solicitudes pendientes (soft block para evitar dobles reservas)
    const { data: pendingRequests } = await supabase
      .from("reservation_requests")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("unit_id", unitId)
      .in("status", ["pending", "confirmed"])
      .lte("check_in", checkOut)
      .gte("check_out", checkIn);

    if (pendingRequests && pendingRequests.length > 0) {
      return NextResponse.json({ 
        available: false, 
        message: "Hay una solicitud pendiente para estas fechas. El anfitrión la está revisando." 
      });
    }

    return NextResponse.json({ available: true });
  } catch (error: any) {
    console.error("Error verificando disponibilidad:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}