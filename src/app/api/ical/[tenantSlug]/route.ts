import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Función para formatear fecha en formato iCal (YYYYMMDDTHHMMSSZ)
function formatDateToICal(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

// Función para escapar texto en iCal
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Obtener tenant
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, name, slug")
      .eq("slug", tenantSlug)
      .single();

    if (tenantError || !tenant) {
      return new NextResponse("Alojamiento no encontrado", { status: 404 });
    }

    // 2. Obtener todas las reservas confirmadas y bloqueadas
    const { data: reservations, error: resError } = await supabase
      .from("reservations")
      .select(`
        id,
        check_in,
        check_out,
        status,
        source,
        reservation_code,
        guests (first_name, last_name),
        units (name)
      `)
      .eq("tenant_id", tenant.id)
      .in("status", ["booked", "pre_checkin", "checked_in"]);

    if (resError) {
      console.error("Error obteniendo reservas:", resError);
      return new NextResponse("Error interno", { status: 500 });
    }

    // 3. Obtener solicitudes confirmadas (también bloquean fechas)
    const { data: requests, error: reqError } = await supabase
      .from("reservation_requests")
      .select(`
        id,
        check_in,
        check_out,
        guest_name,
        units (name)
      `)
      .eq("tenant_id", tenant.id)
      .eq("status", "confirmed");

    if (reqError) {
      console.error("Error obteniendo solicitudes:", reqError);
    }

    // 4. Construir el archivo iCal
    const lines: string[] = [];
    
    lines.push("BEGIN:VCALENDAR");
    lines.push("VERSION:2.0");
    lines.push("PRODID:-//Mi Estadía//Reservas//ES");
    lines.push(`X-WR-CALNAME:${escapeICalText(tenant.name)}`);
    lines.push(`X-WR-TIMEZONE:America/Argentina/Buenos_Aires`);
    lines.push("CALSCALE:GREGORIAN");
    lines.push("METHOD:PUBLISH");

    // Agregar reservas
    if (reservations) {
      for (const res of reservations) {
        const checkIn = new Date(res.check_in);
        const checkOut = new Date(res.check_out);
        const guestName = res.guests 
          ? `${res.guests.first_name} ${res.guests.last_name}`.trim()
          : "Huésped";
        const unitName = res.units?.name || "Unidad";

        lines.push("BEGIN:VEVENT");
        lines.push(`UID:res-${res.id}@miestadia.online`);
        lines.push(`DTSTART:${formatDateToICal(checkIn)}`);
        lines.push(`DTEND:${formatDateToICal(checkOut)}`);
        lines.push(`SUMMARY:${escapeICalText(`Reservado: ${guestName}`)}`);
        lines.push(`DESCRIPTION:${escapeICalText(`Unidad: ${unitName} | Código: ${res.reservation_code || "N/A"}`)}`);
        lines.push(`LOCATION:${escapeICalText(tenant.name)}`);
        lines.push("STATUS:CONFIRMED");
        lines.push("END:VEVENT");
      }
    }

    // Agregar solicitudes confirmadas
    if (requests) {
      for (const req of requests) {
        const checkIn = new Date(req.check_in);
        const checkOut = new Date(req.check_out);
        const guestName = req.guest_name || "Huésped";
        const unitName = req.units?.name || "Unidad";

        lines.push("BEGIN:VEVENT");
        lines.push(`UID:req-${req.id}@miestadia.online`);
        lines.push(`DTSTART:${formatDateToICal(checkIn)}`);
        lines.push(`DTEND:${formatDateToICal(checkOut)}`);
        lines.push(`SUMMARY:${escapeICalText(`Reservado: ${guestName}`)}`);
        lines.push(`DESCRIPTION:${escapeICalText(`Unidad: ${unitName} | Fuente: Mi Estadía (solicitud confirmada)`)}`);
        lines.push(`LOCATION:${escapeICalText(tenant.name)}`);
        lines.push("STATUS:CONFIRMED");
        lines.push("END:VEVENT");
      }
    }

    lines.push("END:VCALENDAR");

    const icalContent = lines.join("\r\n");

    return new NextResponse(icalContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${tenantSlug}.ics"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Error generando iCal:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}