import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || "https://miestadia.online";

export async function POST(request: Request) {
  try {
    const { reservationId, tenantId } = await request.json();

    // 1. Obtener todos los datos necesarios
    const { data: reservation, error: resError } = await supabase
      .from("reservations")
      .select("*, guests(first_name, last_name, email), units(name)")
      .eq("id", reservationId)
      .single();

    if (resError || !reservation) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    const { data: tenant } = await supabase
      .from("tenants")
      .select("name, slug, branding")
      .eq("id", tenantId)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }

    const guest = reservation.guests;
    if (!guest?.email) {
      return NextResponse.json({ error: "El huésped no tiene email" }, { status: 400 });
    }

    // 2. Construir el link del panel
    const guestPanelUrl = `${APP_DOMAIN}/${tenant.slug}?code=${reservation.reservation_code}&lastName=${encodeURIComponent(guest.last_name || "")}`;
    const checkIn = new Date(reservation.check_in).toLocaleDateString("es-AR");
    const checkOut = new Date(reservation.check_out).toLocaleDateString("es-AR");
    const logoUrl = (tenant.branding as any)?.logoUrl || `${APP_DOMAIN}/mi-estadia-logo.png`;

    // 3. Enviar email con Resend
    const { data, error } = await resend.emails.send({
      from: `${tenant.name} <notificaciones@miestadia.online>`,
      to: [guest.email],
      subject: `Confirmación de tu reserva en ${tenant.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <!-- Header con Logo -->
          <div style="background: linear-gradient(135deg, #0F766E 0%, #166534 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            ${logoUrl ? `<img src="${logoUrl}" alt="${tenant.name}" style="max-height: 60px; margin-bottom: 15px; background: white; padding: 10px; border-radius: 8px;" />` : ''}
            <h1 style="color: white; margin: 0; font-size: 24px;">¡Hola ${guest.first_name}! 👋</h1>
          </div>
          
          <!-- Cuerpo -->
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Te recordamos tu próxima reserva en <strong>${tenant.name}</strong>:
            </p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <p style="margin: 8px 0;"><strong>📅 Check-in:</strong> ${checkIn}</p>
              <p style="margin: 8px 0;"><strong>📅 Check-out:</strong> ${checkOut}</p>
              <p style="margin: 8px 0;"><strong>🏠 Unidad:</strong> ${reservation.units?.name || "—"}</p>
              <p style="margin: 8px 0;"><strong>🔑 Código:</strong> <span style="font-family: monospace; font-size: 18px; color: #0F766E;">${reservation.reservation_code}</span></p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <p style="margin-bottom: 15px; font-size: 14px; color: #6b7280;">
                Accedé a tu panel de huésped para hacer el pre check-in, ver el Wi-Fi y más:
              </p>
              <a href="${guestPanelUrl}" style="background: #0F766E; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                Ir a mi Panel de Huésped
              </a>
              <p style="margin-top: 15px; font-size: 12px; color: #9ca3af; word-break: break-all;">
                O copiá este link: ${guestPanelUrl}
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              ¡Te esperamos!
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 10px;">
              — ${tenant.name}
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Error enviando email:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (err: any) {
    console.error("Error en send-confirmation-email:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}