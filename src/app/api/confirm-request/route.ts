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

    // 1. Obtener la solicitud con todos los datos relacionados
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
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    // 2. Verificar que no haya conflictos (solo para confirmación)
    if (action === "confirmed") {
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
    }

    // 3. Actualizar la solicitud
    const updateData: any = {
      status: action,
      admin_notes: adminNotes || rejectionReason || null,
    };

    if (action === "confirmed") {
      updateData.confirmed_at = new Date().toISOString();
    } else {
      updateData.rejected_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("reservation_requests")
      .update(updateData)
      .eq("id", requestId);

    if (updateError) {
      console.error("Error actualizando solicitud:", updateError);
      return NextResponse.json({ error: "Error al actualizar la solicitud" }, { status: 500 });
    }

    // 4. Si se confirma, crear la reserva real
    if (action === "confirmed") {
      const reservationCode = generateReservationCode(request.tenants.slug);
      
      const { data: newReservation, error: reservationError } = await supabase
        .from("reservations")
        .insert({
          tenant_id: request.tenant_id,
          reservation_code: reservationCode,
          guest_id: null, // Se creará el huésped si no existe
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
        return NextResponse.json({ error: "Error al crear la reserva" }, { status: 500 });
      }

      // Crear huésped si no existe (buscar por email)
      if (request.guest_email) {
        const { data: existingGuest } = await supabase
          .from("guests")
          .select("id")
          .eq("tenant_id", request.tenant_id)
          .eq("email", request.guest_email)
          .single();

        let guestId = existingGuest?.id;

        if (!guestId) {
          const { data: newGuest, error: guestError } = await supabase
            .from("guests")
            .insert({
              tenant_id: request.tenant_id,
              first_name: request.guest_name.split(" ")[0] || request.guest_name,
              last_name: request.guest_name.split(" ").slice(1).join(" ") || "",
              email: request.guest_email,
              phone: request.guest_phone || null,
              document_number: request.guest_document || null,
            })
            .select()
            .single();

          if (!guestError && newGuest) {
            guestId = newGuest.id;
          }
        }

        if (guestId) {
          await supabase
            .from("reservations")
            .update({ guest_id: guestId })
            .eq("id", newReservation.id);
        }
      }
    }

    // 5. Enviar email al huésped
    await sendGuestEmail(request, action, adminNotes, rejectionReason);

    return NextResponse.json({
      success: true,
      message: action === "confirmed" ? "Solicitud confirmada" : "Solicitud rechazada",
    });
  } catch (error: any) {
    console.error("Error en confirm-request:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

function generateReservationCode(slug: string): string {
  const prefix = slug.substring(0, 3).toUpperCase();
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return `${prefix}-${code}`;
}

async function sendGuestEmail(
  request: any,
  action: string,
  adminNotes: string | null,
  rejectionReason: string | null
) {
  const tenant = request.tenants;
  const unit = request.units;
  const checkInFormatted = new Date(request.check_in).toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const checkOutFormatted = new Date(request.check_out).toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const nights = Math.ceil(
    (new Date(request.check_out).getTime() - new Date(request.check_in).getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalFormatted = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(request.total_amount || 0);

  if (action === "confirmed") {
    // Email de confirmación
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Mi Estadía <notificaciones@miestadia.online>",
          to: [request.guest_email],
          subject: `✅ ¡Reserva confirmada! - ${tenant.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">✅ ¡Reserva confirmada!</h1>
                <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">${tenant.name}</p>
              </div>
              <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
                <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                  Hola <strong>${request.guest_name}</strong>,
                </p>
                <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                  ¡Excelentes noticias! Tu reserva ha sido <strong style="color: #059669;">confirmada</strong> por el anfitrión.
                </p>

                <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
                  <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 18px;">📋 Detalles de tu reserva</h2>
                  <p style="margin: 6px 0; color: #374151;"><strong>Código:</strong> ${generateReservationCode(tenant.slug)}</p>
                  <p style="margin: 6px 0; color: #374151;"><strong>Unidad:</strong> ${unit?.name || "—"}</p>
                  <p style="margin: 6px 0; color: #374151;"><strong>Check-in:</strong> ${checkInFormatted}</p>
                  <p style="margin: 6px 0; color: #374151;"><strong>Check-out:</strong> ${checkOutFormatted}</p>
                  <p style="margin: 6px 0; color: #374151;"><strong>Noches:</strong> ${nights}</p>
                  <p style="margin: 6px 0; color: #374151;"><strong>Huéspedes:</strong> ${request.guests_count || 1}</p>
                  <p style="margin: 6px 0; color: #374151;"><strong>Total:</strong> ${totalFormatted}</p>
                </div>

                ${adminNotes ? `
                  <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
                    <h2 style="margin: 0 0 8px 0; color: #1e40af; font-size: 16px;"> Mensaje del anfitrión</h2>
                    <p style="margin: 0; color: #1e3a8a; font-style: italic;">${adminNotes}</p>
                  </div>
                ` : ""}

                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
                  <h2 style="margin: 0 0 8px 0; color: #92400e; font-size: 16px;">💳 Información de pago</h2>
                  <p style="margin: 0; color: #78350f;">
                    El saldo pendiente de <strong>${totalFormatted}</strong> se abona al momento del check-in.
                    Podés ver el estado de tu pago en tu panel de huésped.
                  </p>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://miestadia.online/${tenant.slug}" 
                     style="background: #059669; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                    Acceder a mi panel de huésped →
                  </a>
                </div>

                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
                  Este email fue enviado automáticamente por Mi Estadía. Guardá este mensaje como comprobante de tu reserva.
                </p>
              </div>
            </div>
          `,
        }),
      });
    } catch (emailError) {
      console.error("Error enviando email de confirmación al huésped:", emailError);
    }
  } else {
    // Email de rechazo
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Mi Estadía <notificaciones@miestadia.online>",
          to: [request.guest_email],
          subject: `Sobre tu solicitud de reserva - ${tenant.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Sobre tu solicitud</h1>
                <p style="color: #fee2e2; margin: 10px 0 0 0; font-size: 16px;">${tenant.name}</p>
              </div>
              <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
                <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                  Hola <strong>${request.guest_name}</strong>,
                </p>
                <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                  Lamentamos informarte que tu solicitud de reserva <strong style="color: #dc2626;">no pudo ser confirmada</strong> en esta oportunidad.
                </p>

                <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
                  <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 18px;">📋 Detalles de la solicitud</h2>
                  <p style="margin: 6px 0; color: #374151;"><strong>Unidad:</strong> ${unit?.name || "—"}</p>
                  <p style="margin: 6px 0; color: #374151;"><strong>Fechas:</strong> ${checkInFormatted} → ${checkOutFormatted}</p>
                  <p style="margin: 6px 0; color: #374151;"><strong>Noches:</strong> ${nights}</p>
                </div>

                ${rejectionReason ? `
                  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
                    <h2 style="margin: 0 0 8px 0; color: #92400e; font-size: 16px;"> Motivo</h2>
                    <p style="margin: 0; color: #78350f; font-style: italic;">${rejectionReason}</p>
                  </div>
                ` : ""}

                <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
                  <h2 style="margin: 0 0 8px 0; color: #065f46; font-size: 16px;"> ¿Qué podés hacer?</h2>
                  <p style="margin: 0; color: #064e3b;">
                    Te invitamos a consultar otras fechas disponibles o contactarnos directamente para explorar alternativas.
                  </p>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://miestadia.online/${tenant.slug}/reservas" 
                     style="background: #059669; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                    Ver otras fechas disponibles →
                  </a>
                </div>

                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
                  Este email fue enviado automáticamente por Mi Estadía.
                </p>
              </div>
            </div>
          `,
        }),
      });
    } catch (emailError) {
      console.error("Error enviando email de rechazo al huésped:", emailError);
    }
  }
}