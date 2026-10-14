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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Obtener tenant y su configuración
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, name, owner_email, reservation_timeout_hours")
      .eq("slug", tenantSlug)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: "Alojamiento no encontrado" }, { status: 404 });
    }

    // 2. Obtener nombre de la unidad
    const { data: unit } = await supabase
      .from("units")
      .select("name")
      .eq("id", unitId)
      .single();

    // 3. Doble verificación de disponibilidad
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

    // 4. Calcular timeout
    const timeoutHours = tenant.reservation_timeout_hours || 24;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + timeoutHours);

    // 5. Crear la solicitud
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

    // Datos formateados para emails
    const checkInFormatted = new Date(checkIn).toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const checkOutFormatted = new Date(checkOut).toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const nights = Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalFormatted = new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(totalAmount || 0);
    const expiresFormatted = expiresAt.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const expiresTimeFormatted = expiresAt.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // ============================================
    // EMAIL 1: Al admin (notificación de nueva solicitud)
    // ============================================
    if (tenant.owner_email) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Mi Estadía <notificaciones@miestadia.online>",
            to: [tenant.owner_email],
            subject: `🔔 Nueva solicitud de reserva - ${tenant.name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">🔔 Nueva solicitud de reserva</h1>
                  <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">${tenant.name}</p>
                </div>
                <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
                  <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                    Tenés una nueva solicitud de reserva que requiere tu atención:
                  </p>
                  
                  <div style="background: #f9fafb; border-left: 4px solid #059669; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
                    <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 18px;">👤 Datos del huésped</h2>
                    <p style="margin: 6px 0; color: #374151;"><strong>Nombre:</strong> ${guestName}</p>
                    <p style="margin: 6px 0; color: #374151;"><strong>Email:</strong> ${guestEmail}</p>
                    ${guestPhone ? `<p style="margin: 6px 0; color: #374151;"><strong>Teléfono:</strong> ${guestPhone}</p>` : ""}
                    ${guestDocument ? `<p style="margin: 6px 0; color: #374151;"><strong>Documento:</strong> ${guestDocument}</p>` : ""}
                  </div>

                  <div style="background: #f9fafb; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
                    <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 18px;">📅 Detalles de la reserva</h2>
                    <p style="margin: 6px 0; color: #374151;"><strong>Unidad:</strong> ${unit?.name || "—"}</p>
                    <p style="margin: 6px 0; color: #374151;"><strong>Check-in:</strong> ${checkInFormatted}</p>
                    <p style="margin: 6px 0; color: #374151;"><strong>Check-out:</strong> ${checkOutFormatted}</p>
                    <p style="margin: 6px 0; color: #374151;"><strong>Noches:</strong> ${nights}</p>
                    <p style="margin: 6px 0; color: #374151;"><strong>Huéspedes:</strong> ${guestsCount || 1}</p>
                    <p style="margin: 6px 0; color: #374151;"><strong>Total:</strong> ${totalFormatted}</p>
                  </div>

                  ${specialRequests ? `
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
                      <h2 style="margin: 0 0 8px 0; color: #92400e; font-size: 16px;">💬 Solicitudes especiales</h2>
                      <p style="margin: 0; color: #78350f; font-style: italic;">${specialRequests}</p>
                    </div>
                  ` : ""}

                  <div style="background: #fee2e2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #991b1b; font-size: 14px;">
                      ⏰ <strong>Atención:</strong> Esta solicitud expira el ${expiresFormatted} a las ${expiresTimeFormatted}. 
                      Después de ese tiempo se marcará como expirada automáticamente.
                    </p>
                  </div>

                  <div style="text-align: center; margin-top: 30px;">
                    <a href="https://miestadia.online/${tenantSlug}/admin/reservations" 
                       style="background: #059669; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                      Ver solicitud en el panel →
                    </a>
                  </div>

                  <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
                    Este email fue enviado automáticamente por Mi Estadía. No respondas a este mensaje.
                  </p>
                </div>
              </div>
            `,
          }),
        });
      } catch (emailError) {
        console.error("Error enviando email al admin:", emailError);
      }
    }

    // ============================================
    // EMAIL 2: Al huésped (confirmación de solicitud recibida)
    // ============================================
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Mi Estadía <notificaciones@miestadia.online>",
          to: [guestEmail],
          subject: `✅ Solicitud de reserva recibida - ${tenant.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">✅ Solicitud recibida</h1>
                <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">${tenant.name}</p>
              </div>
              <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
                <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                  Hola <strong>${guestName}</strong>,
                </p>
                <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                  Tu solicitud de reserva fue recibida correctamente. El anfitrión la revisará y te enviará una confirmación en las próximas ${timeoutHours} horas.
                </p>

                <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
                  <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 18px;">📋 Resumen de tu solicitud</h2>
                  <p style="margin: 6px 0; color: #374151;"><strong>Unidad:</strong> ${unit?.name || "—"}</p>
                  <p style="margin: 6px 0; color: #374151;"><strong>Check-in:</strong> ${checkInFormatted}</p>
                  <p style="margin: 6px 0; color: #374151;"><strong>Check-out:</strong> ${checkOutFormatted}</p>
                  <p style="margin: 6px 0; color: #374151;"><strong>Noches:</strong> ${nights}</p>
                  <p style="margin: 6px 0; color: #374151;"><strong>Huéspedes:</strong> ${guestsCount || 1}</p>
                  <p style="margin: 6px 0; color: #374151;"><strong>Total estimado:</strong> ${totalFormatted}</p>
                </div>

                <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
                  <h2 style="margin: 0 0 8px 0; color: #1e40af; font-size: 16px;"> ¿Qué pasa ahora?</h2>
                  <p style="margin: 0; color: #1e3a8a; font-size: 14px;">
                    El anfitrión revisará tu solicitud y te confirmará la reserva por email. 
                    Si no recibís respuesta en ${timeoutHours} horas, la solicitud se marcará como expirada automáticamente.
                  </p>
                </div>

                ${specialRequests ? `
                  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
                    <h2 style="margin: 0 0 8px 0; color: #92400e; font-size: 16px;">💬 Tus solicitudes especiales</h2>
                    <p style="margin: 0; color: #78350f; font-style: italic;">${specialRequests}</p>
                  </div>
                ` : ""}

                <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">
                    📧 <strong>Importante:</strong> Revisá tu bandeja de entrada (y spam) en los próximos días. 
                    Te enviaremos la confirmación definitiva a este email: <strong>${guestEmail}</strong>
                  </p>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://miestadia.online/${tenantSlug}" 
                     style="background: #059669; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                    Volver al sitio de ${tenant.name} →
                  </a>
                </div>

                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
                  Este email fue enviado automáticamente por Mi Estadía. Si tenés alguna consulta, contactá directamente al anfitrión.
                </p>
              </div>
            </div>
          `,
        }),
      });
    } catch (emailError) {
      console.error("Error enviando email al huésped:", emailError);
      // No fallamos la solicitud si el email falla
    }

    return NextResponse.json({
      success: true,
      message: "Solicitud enviada correctamente",
      requestId: data.id,
    });
  } catch (error: any) {
    console.error("Error en create-reservation-request:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}