import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requestId, action, adminNotes, rejectionReason } = body;

    if (!requestId || !action) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    if (!["confirmed", "rejected"].includes(action)) {
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Obtener la solicitud con datos relacionados
    const { data: request, error: requestError } = await supabase
      .from("reservation_requests")
      .select(`
        *,
        tenants (id, name, slug, owner_email),
        units (id, name, type, capacity, price_per_night)
      `)
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      console.error("Error obteniendo solicitud:", requestError);
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    // 2. Si se confirma, crear el huésped primero y luego la reserva
    if (action === "confirmed") {
      // Verificar disponibilidad una última vez
      const { data: conflicts } = await supabase
        .from("reservations")
        .select("id")
        .eq("tenant_id", request.tenant_id)
        .eq("unit_id", request.unit_id)
        .neq("status", "cancelled")
        .lte("check_in", request.check_out)
        .gte("check_out", request.check_in);

      if (conflicts && conflicts.length > 0) {
        return NextResponse.json({
          error: "Hay una reserva confirmada en esas fechas. No se puede confirmar la solicitud.",
        }, { status: 409 });
      }

      // Crear o buscar huésped por email
      let guestId = null;

      if (request.guest_email) {
        const { data: existingGuest } = await supabase
          .from("guests")
          .select("id")
          .eq("tenant_id", request.tenant_id)
          .eq("email", request.guest_email)
          .maybeSingle();

        if (existingGuest) {
          guestId = existingGuest.id;
        } else {
          // Crear nuevo huésped
          const nameParts = (request.guest_name || "").split(" ");
          const firstName = nameParts[0] || "Huésped";
          const lastName = nameParts.slice(1).join(" ") || "";

          const { data: newGuest, error: guestError } = await supabase
            .from("guests")
            .insert({
              tenant_id: request.tenant_id,
              first_name: firstName,
              last_name: lastName,
              email: request.guest_email,
              phone: request.guest_phone || null,
              document_number: request.guest_document || null,
            })
            .select("id")
            .single();

          if (guestError) {
            console.error("Error creando huésped:", guestError);
            return NextResponse.json({ error: "Error al crear el huésped" }, { status: 500 });
          }

          guestId = newGuest.id;
        }
      }

      // Generar código de reserva
      const tenantSlug = request.tenants?.slug || "RES";
      const prefix = tenantSlug.substring(0, 3).toUpperCase();
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
      for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
      const reservationCode = `${prefix}-${code}`;

      // Crear la reserva con el guest_id ya definido
      const { data: newReservation, error: reservationError } = await supabase
        .from("reservations")
        .insert({
          tenant_id: request.tenant_id,
          reservation_code: reservationCode,
          guest_id: guestId,
          unit_id: request.unit_id,
          check_in: request.check_in,
          check_out: request.check_out,
          status: "booked",
          source: "public_request",
          total_amount: request.total_amount || 0,
          paid_amount: 0,
          payment_status: "pending",
          notes: request.special_requests || null,
        })
        .select()
        .single();

      if (reservationError) {
        console.error("Error creando reserva:", reservationError);
        return NextResponse.json({ 
          error: "Error al crear la reserva: " + reservationError.message 
        }, { status: 500 });
      }

      // Actualizar la solicitud
      const { error: updateError } = await supabase
        .from("reservation_requests")
        .update({
          status: "confirmed",
          admin_notes: adminNotes || null,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("Error actualizando solicitud:", updateError);
      }

      // Enviar email al huésped (sin bloquear si falla)
      try {
        await sendConfirmationEmail(request, adminNotes, reservationCode);
      } catch (emailError) {
        console.error("Error enviando email:", emailError);
      }

      return NextResponse.json({
        success: true,
        message: "Solicitud confirmada y reserva creada",
        reservationId: newReservation.id,
      });
    }

    // 3. Si se rechaza
    const { error: rejectError } = await supabase
      .from("reservation_requests")
      .update({
        status: "rejected",
        admin_notes: rejectionReason || adminNotes || null,
        rejected_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (rejectError) {
      console.error("Error rechazando solicitud:", rejectError);
      return NextResponse.json({ error: "Error al rechazar la solicitud" }, { status: 500 });
    }

    // Enviar email de rechazo
    try {
      await sendRejectionEmail(request, rejectionReason || adminNotes);
    } catch (emailError) {
      console.error("Error enviando email de rechazo:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Solicitud rechazada",
    });
  } catch (error: any) {
    console.error("Error en confirm-request:", error);
    return NextResponse.json({ 
      error: "Error interno del servidor: " + error.message 
    }, { status: 500 });
  }
}

async function sendConfirmationEmail(request: any, adminNotes: string | null, reservationCode: string) {
  const tenant = request.tenants;
  const unit = request.units;
  const checkInFormatted = new Date(request.check_in).toLocaleDateString("es-AR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const checkOutFormatted = new Date(request.check_out).toLocaleDateString("es-AR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const nights = Math.ceil(
    (new Date(request.check_out).getTime() - new Date(request.check_in).getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalFormatted = new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS", minimumFractionDigits: 0,
  }).format(request.total_amount || 0);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Mi Estadía <notificaciones@miestadia.online>",
      to: [request.guest_email],
      subject: `✅ ¡Reserva confirmada! - ${tenant?.name || "Alojamiento"}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">¡Reserva confirmada!</h1>
            <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">${tenant?.name || ""}</p>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Hola <strong>${request.guest_name}</strong>, tu reserva fue confirmada.
            </p>
            <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
              <p style="margin: 6px 0;"><strong>Código:</strong> ${reservationCode}</p>
              <p style="margin: 6px 0;"><strong>Unidad:</strong> ${unit?.name || "—"}</p>
              <p style="margin: 6px 0;"><strong>Check-in:</strong> ${checkInFormatted}</p>
              <p style="margin: 6px 0;"><strong>Check-out:</strong> ${checkOutFormatted}</p>
              <p style="margin: 6px 0;"><strong>Noches:</strong> ${nights}</p>
              <p style="margin: 6px 0;"><strong>Total:</strong> ${totalFormatted}</p>
            </div>
            ${adminNotes ? `<div style="background: #eff6ff; padding: 16px; border-radius: 4px; margin-bottom: 20px;"><p style="margin: 0;"><strong>Mensaje del anfitrión:</strong> ${adminNotes}</p></div>` : ""}
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
              Enviado por Mi Estadía
            </p>
          </div>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Resend error:", errorData);
    throw new Error("Error enviando email");
  }
}

async function sendRejectionEmail(request: any, reason: string | null) {
  const tenant = request.tenants;
  const unit = request.units;
  const checkInFormatted = new Date(request.check_in).toLocaleDateString("es-AR");
  const checkOutFormatted = new Date(request.check_out).toLocaleDateString("es-AR");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Mi Estadía <notificaciones@miestadia.online>",
      to: [request.guest_email],
      subject: `Sobre tu solicitud - ${tenant?.name || "Alojamiento"}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Sobre tu solicitud</h1>
            <p style="color: #fee2e2; margin: 10px 0 0 0; font-size: 16px;">${tenant?.name || ""}</p>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Hola <strong>${request.guest_name}</strong>, lamentamos informarte que tu solicitud no pudo ser confirmada.
            </p>
            <div style="background: #fef2f2; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
              <p style="margin: 6px 0;"><strong>Unidad:</strong> ${unit?.name || "—"}</p>
              <p style="margin: 6px 0;"><strong>Fechas:</strong> ${checkInFormatted} → ${checkOutFormatted}</p>
            </div>
            ${reason ? `<div style="background: #fef3c7; padding: 16px; border-radius: 4px; margin-bottom: 20px;"><p style="margin: 0;"><strong>Motivo:</strong> ${reason}</p></div>` : ""}
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
              Enviado por Mi Estadía
            </p>
          </div>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Resend error:", errorData);
  }
}