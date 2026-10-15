import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function generateCode(slug: string): string {
  const prefix = slug.substring(0, 3).toUpperCase();
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return `${prefix}-${code}`;
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getLastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : fullName;
}

function buildGuestPanelUrl(tenantSlug: string, reservationCode: string, lastName: string): string {
  return `https://miestadia.online/${tenantSlug}?code=${reservationCode}&lastName=${encodeURIComponent(lastName)}`;
}

function buildQrCodeUrl(data: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Mi Estadía <notificaciones@miestadia.online>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Resend error:", errorData);
    throw new Error("Error enviando email");
  }
}

async function sendConfirmationEmail(
  guestEmail: string,
  guestName: string,
  tenantName: string,
  tenantSlug: string,
  unitName: string,
  checkIn: string,
  checkOut: string,
  nights: number,
  totalAmount: number,
  reservationCode: string,
  adminNotes: string | null
): Promise<void> {
  const lastName = getLastName(guestName);
  const guestPanelUrl = buildGuestPanelUrl(tenantSlug, reservationCode, lastName);
  const qrCodeUrl = buildQrCodeUrl(guestPanelUrl);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">¡Reserva confirmada!</h1>
        <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">${tenantName}</p>
      </div>
      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          Hola <strong>${guestName}</strong>, tu reserva fue confirmada.
        </p>
        <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
          <p style="margin: 6px 0;"><strong>Código de reserva:</strong> ${reservationCode}</p>
          <p style="margin: 6px 0;"><strong>Unidad:</strong> ${unitName}</p>
          <p style="margin: 6px 0;"><strong>Check-in:</strong> ${formatDate(checkIn)}</p>
          <p style="margin: 6px 0;"><strong>Check-out:</strong> ${formatDate(checkOut)}</p>
          <p style="margin: 6px 0;"><strong>Noches:</strong> ${nights}</p>
          <p style="margin: 6px 0;"><strong>Total:</strong> ${formatMoney(totalAmount)}</p>
        </div>
        ${adminNotes ? `<div style="background: #eff6ff; padding: 16px; border-radius: 4px; margin-bottom: 20px;"><p style="margin: 0;"><strong>Mensaje del anfitrión:</strong> ${adminNotes}</p></div>` : ""}
        
        <!-- PANEL DEL HUÉSPED + QR -->
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 4px; margin-bottom: 20px; text-align: center;">
          <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 18px;">📱 Tu panel de huésped</h3>
          <p style="margin: 0 0 16px 0; color: #78350f; font-size: 14px;">
            Accedé a tu panel personal para ver toda la información de tu estadía, clima, inventario y más.
          </p>
          
          <!-- QR Code -->
          <div style="background: white; padding: 16px; border-radius: 8px; display: inline-block; margin-bottom: 16px;">
            <img src="${qrCodeUrl}" alt="QR Code" style="width: 200px; height: 200px; display: block;" />
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">Escaneá este código para acceder</p>
          </div>
          
          <br/>
          
          <!-- Botón de acceso -->
          <a href="${guestPanelUrl}" 
             style="background: #059669; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; margin-top: 12px;">
            Acceder a mi panel →
          </a>
          
          <p style="margin: 12px 0 0 0; font-size: 12px; color: #92400e;">
            <strong>URL directa:</strong><br/>
            <a href="${guestPanelUrl}" style="color: #059669; word-break: break-all;">${guestPanelUrl}</a>
          </p>
        </div>

        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
          Enviado por Mi Estadía
        </p>
      </div>
    </div>
  `;

  await sendEmail(guestEmail, `✅ ¡Reserva confirmada! - ${tenantName}`, html);
}

async function sendRejectionEmail(
  guestEmail: string,
  guestName: string,
  tenantName: string,
  unitName: string,
  checkIn: string,
  checkOut: string,
  reason: string | null
): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Sobre tu solicitud</h1>
        <p style="color: #fee2e2; margin: 10px 0 0 0; font-size: 16px;">${tenantName}</p>
      </div>
      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          Hola <strong>${guestName}</strong>, lamentamos informarte que tu solicitud no pudo ser confirmada.
        </p>
        <div style="background: #fef2f2; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
          <p style="margin: 6px 0;"><strong>Unidad:</strong> ${unitName}</p>
          <p style="margin: 6px 0;"><strong>Fechas:</strong> ${formatDate(checkIn)} → ${formatDate(checkOut)}</p>
        </div>
        ${reason ? `<div style="background: #fef3c7; padding: 16px; border-radius: 4px; margin-bottom: 20px;"><p style="margin: 0;"><strong>Motivo:</strong> ${reason}</p></div>` : ""}
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
          Enviado por Mi Estadía
        </p>
      </div>
    </div>
  `;

  await sendEmail(guestEmail, `Sobre tu solicitud - ${tenantName}`, html);
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

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

    // 1. Obtener la solicitud
    const { data: requestData, error: requestError } = await supabase
      .from("reservation_requests")
      .select(`
        *,
        tenants (id, name, slug, owner_email),
        units (id, name, type, capacity, price_per_night)
      `)
      .eq("id", requestId)
      .single();

    if (requestError || !requestData) {
      console.error("Error obteniendo solicitud:", requestError);
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    const tenant = requestData.tenants;
    const unit = requestData.units;

    if (!tenant || !unit) {
      return NextResponse.json({ error: "Datos de tenant o unidad faltantes" }, { status: 400 });
    }

    // 2. Si se confirma
    if (action === "confirmed") {
      // Verificar disponibilidad
      const { data: conflicts } = await supabase
        .from("reservations")
        .select("id")
        .eq("tenant_id", tenant.id)
        .eq("unit_id", unit.id)
        .neq("status", "cancelled")
        .lte("check_in", requestData.check_out)
        .gte("check_out", requestData.check_in);

      if (conflicts && conflicts.length > 0) {
        return NextResponse.json({
          error: "Hay una reserva confirmada en esas fechas.",
        }, { status: 409 });
      }

      // Crear o buscar huésped
      let guestId = null;

      if (requestData.guest_email) {
        const { data: existingGuest } = await supabase
          .from("guests")
          .select("id")
          .eq("tenant_id", tenant.id)
          .eq("email", requestData.guest_email)
          .maybeSingle();

        if (existingGuest) {
          guestId = existingGuest.id;
        } else {
          const nameParts = (requestData.guest_name || "").split(" ");
          const firstName = nameParts[0] || "Huésped";
          const lastName = nameParts.slice(1).join(" ") || "";

          const { data: newGuest, error: guestError } = await supabase
            .from("guests")
            .insert({
              tenant_id: tenant.id,
              first_name: firstName,
              last_name: lastName,
              email: requestData.guest_email,
              phone: requestData.guest_phone || null,
              document_number: requestData.guest_document || null,
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

      // Generar código
      const reservationCode = generateCode(tenant.slug);

      // Calcular noches
      const nights = Math.ceil(
        (new Date(requestData.check_out).getTime() - new Date(requestData.check_in).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      // Crear reserva
      const { data: newReservation, error: reservationError } = await supabase
        .from("reservations")
        .insert({
          tenant_id: tenant.id,
          reservation_code: reservationCode,
          guest_id: guestId,
          unit_id: unit.id,
          check_in: requestData.check_in,
          check_out: requestData.check_out,
          status: "booked",
          source: "public_request",
          total_amount: requestData.total_amount || 0,
          paid_amount: 0,
          payment_status: "pending",
          notes: requestData.special_requests || null,
        })
        .select()
        .single();

      if (reservationError) {
        console.error("Error creando reserva:", reservationError);
        return NextResponse.json({
          error: "Error al crear la reserva: " + reservationError.message,
        }, { status: 500 });
      }

      // Actualizar solicitud
      await supabase
        .from("reservation_requests")
        .update({
          status: "confirmed",
          admin_notes: adminNotes || null,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      // Enviar email con QR y link al panel
      try {
        await sendConfirmationEmail(
          requestData.guest_email,
          requestData.guest_name,
          tenant.name,
          tenant.slug,
          unit.name,
          requestData.check_in,
          requestData.check_out,
          nights,
          requestData.total_amount || 0,
          reservationCode,
          adminNotes
        );
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
    await supabase
      .from("reservation_requests")
      .update({
        status: "rejected",
        admin_notes: rejectionReason || adminNotes || null,
        rejected_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    // Enviar email de rechazo
    try {
      await sendRejectionEmail(
        requestData.guest_email,
        requestData.guest_name,
        tenant.name,
        unit.name,
        requestData.check_in,
        requestData.check_out,
        rejectionReason || adminNotes
      );
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
      error: "Error interno del servidor: " + error.message,
    }, { status: 500 });
  }
}