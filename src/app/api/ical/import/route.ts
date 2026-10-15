import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Parser simple de iCal
function parseICal(content: string): Array<{
  startDate: string;
  endDate: string;
  summary: string;
  description: string;
  uid: string;
}> {
  const events: Array<{
    startDate: string;
    endDate: string;
    summary: string;
    description: string;
    uid: string;
  }> = [];

  const lines = content.split(/\r?\n/);
  let currentEvent: any = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      currentEvent = {
        startDate: "",
        endDate: "",
        summary: "",
        description: "",
        uid: "",
      };
    } else if (line === "END:VEVENT" && currentEvent) {
      events.push(currentEvent);
      currentEvent = null;
    } else if (currentEvent) {
      if (line.startsWith("DTSTART")) {
        const value = line.split(":")[1];
        currentEvent.startDate = value ? value.replace(/Z$/, "") : "";
      } else if (line.startsWith("DTEND")) {
        const value = line.split(":")[1];
        currentEvent.endDate = value ? value.replace(/Z$/, "") : "";
      } else if (line.startsWith("SUMMARY")) {
        const value = line.substring(line.indexOf(":") + 1);
        currentEvent.summary = unescapeICalText(value);
      } else if (line.startsWith("DESCRIPTION")) {
        const value = line.substring(line.indexOf(":") + 1);
        currentEvent.description = unescapeICalText(value);
      } else if (line.startsWith("UID")) {
        const value = line.substring(line.indexOf(":") + 1);
        currentEvent.uid = value;
      }
    }
  }

  return events;
}

function unescapeICalText(text: string): string {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function parseICalDate(dateStr: string): Date {
  // Formato: 20261115T000000 o 20261115
  const cleaned = dateStr.replace(/Z$/, "");
  if (cleaned.length === 8) {
    // Solo fecha: YYYYMMDD
    const year = parseInt(cleaned.substring(0, 4));
    const month = parseInt(cleaned.substring(4, 6)) - 1;
    const day = parseInt(cleaned.substring(6, 8));
    return new Date(year, month, day);
  }
  // Con hora: YYYYMMDDTHHMMSS
  const year = parseInt(cleaned.substring(0, 4));
  const month = parseInt(cleaned.substring(4, 6)) - 1;
  const day = parseInt(cleaned.substring(6, 8));
  const hour = parseInt(cleaned.substring(9, 11));
  const minute = parseInt(cleaned.substring(11, 13));
  const second = parseInt(cleaned.substring(13, 15));
  return new Date(year, month, day, hour, minute, second);
}

function formatDateForDB(date: Date): string {
  return date.toISOString().split("T")[0];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { syncId } = body;

    if (!syncId) {
      return NextResponse.json({ error: "Falta syncId" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Obtener la configuración de sync
    const { data: sync, error: syncError } = await supabase
      .from("calendar_sync")
      .select("*, tenants(id, name, slug)")
      .eq("id", syncId)
      .single();

    if (syncError || !sync) {
      return NextResponse.json({ error: "Configuración no encontrada" }, { status: 404 });
    }

    if (!sync.external_url) {
      return NextResponse.json({ error: "URL externa no configurada" }, { status: 400 });
    }

    // 2. Descargar el archivo iCal
    const response = await fetch(sync.external_url);
    if (!response.ok) {
      // Actualizar estado de error
      await supabase
        .from("calendar_sync")
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: "error",
          last_sync_error: `HTTP ${response.status}: No se pudo descargar el calendario`,
        })
        .eq("id", syncId);

      return NextResponse.json({
        error: `No se pudo descargar el calendario (HTTP ${response.status})`,
      }, { status: 500 });
    }

    const icalContent = await response.text();

    // 3. Parsear el iCal
    const events = parseICal(icalContent);

    // 4. Procesar cada evento
    let importedCount = 0;
    const processedUids: string[] = [];

    for (const event of events) {
      if (!event.startDate || !event.endDate) continue;

      const checkIn = parseICalDate(event.startDate);
      const checkOut = parseICalDate(event.endDate);
      const checkInStr = formatDateForDB(checkIn);
      const checkOutStr = formatDateForDB(checkOut);

      // Extraer nombre del huésped del SUMMARY (formato: "Reserved: Johnson")
      let guestName = "Huésped externo";
      if (event.summary) {
        const match = event.summary.match(/Reserved:\s*(.+)/i);
        if (match) guestName = match[1].trim();
        else guestName = event.summary;
      }

      processedUids.push(event.uid);

      // Buscar si ya existe una reserva importada con este UID
      const { data: existingReservation } = await supabase
        .from("reservations")
        .select("id")
        .eq("tenant_id", sync.tenant_id)
        .eq("unit_id", sync.unit_id)
        .eq("source", `ical_${sync.external_source || "external"}`)
        .eq("notes", `ICAL_UID:${event.uid}`)
        .maybeSingle();

      if (existingReservation) {
        // Actualizar reserva existente
        await supabase
          .from("reservations")
          .update({
            check_in: checkInStr,
            check_out: checkOutStr,
            notes: `ICAL_UID:${event.uid} | ${guestName}`,
          })
          .eq("id", existingReservation.id);
      } else {
        // Crear nueva reserva bloqueada
        const { error: insertError } = await supabase
          .from("reservations")
          .insert({
            tenant_id: sync.tenant_id,
            unit_id: sync.unit_id,
            check_in: checkInStr,
            check_out: checkOutStr,
            status: "booked",
            source: `ical_${sync.external_source || "external"}`,
            reservation_code: `EXT-${Date.now().toString(36).toUpperCase()}`,
            total_amount: 0,
            paid_amount: 0,
            payment_status: "pending",
            notes: `ICAL_UID:${event.uid} | ${guestName} | Importada de ${sync.external_source || "externo"}`,
          });

        if (insertError) {
          console.error("Error insertando reserva:", insertError);
          continue;
        }
      }

      importedCount++;
    }

    // 5. Eliminar reservas importadas que ya no están en el iCal
    if (processedUids.length > 0) {
      const uidConditions = processedUids.map((uid) => `notes LIKE 'ICAL_UID:${uid}%'`).join(" OR ");
      
      // Buscar reservas importadas que no están en el nuevo iCal
      const { data: staleReservations } = await supabase
        .from("reservations")
        .select("id, notes")
        .eq("tenant_id", sync.tenant_id)
        .eq("unit_id", sync.unit_id)
        .eq("source", `ical_${sync.external_source || "external"}`);

      if (staleReservations) {
        for (const res of staleReservations) {
          const uidMatch = res.notes?.match(/ICAL_UID:(.+)/);
          if (uidMatch && !processedUids.includes(uidMatch[1].split(" | ")[0].trim())) {
            // Esta reserva ya no está en el iCal, eliminarla
            await supabase
              .from("reservations")
              .delete()
              .eq("id", res.id);
          }
        }
      }
    }

    // 6. Actualizar estado de sync
    await supabase
      .from("calendar_sync")
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: "success",
        last_sync_error: null,
        events_imported: importedCount,
      })
      .eq("id", syncId);

    return NextResponse.json({
      success: true,
      imported: importedCount,
      message: `Sincronización completada. ${importedCount} eventos procesados.`,
    });
  } catch (error: any) {
    console.error("Error en importación iCal:", error);
    return NextResponse.json({
      error: "Error interno del servidor: " + error.message,
    }, { status: 500 });
  }
}