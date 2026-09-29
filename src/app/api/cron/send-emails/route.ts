import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { APP_DOMAIN, formatEmailSubject, getEmailSignature } from "@/lib/config";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    const { data: reservations, error } = await supabase
      .from("reservations")
      .select("*, tenants(name, slug, owner_email)")
      .eq("status", "confirmed")
      .gte("check_in", new Date().toISOString())
      .lte("check_in", twoDaysFromNow.toISOString());

    if (error) {
      console.error("Error fetching reservations:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!reservations || reservations.length === 0) {
      return NextResponse.json({ message: "No reservations to process" });
    }

    for (const reservation of reservations) {
      const tenant = reservation.tenants;
      const checkInDate = new Date(reservation.check_in);
      const checkOutDate = new Date(reservation.check_out);

      const subject = formatEmailSubject(
        tenant.name,
        `Recordatorio: Tu check-in es el ${checkInDate.toLocaleDateString("es-AR")}`
      );

      const guestPanelUrl = `${APP_DOMAIN}/${tenant.slug}?code=${reservation.code}&lastName=${encodeURIComponent(reservation.guest_last_name)}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0F766E 0%, #166534 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">¡Hola ${reservation.guest_name}!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Tu check-in se acerca</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Te recordamos que tu check-in en <strong>${tenant.name}</strong> es el 
              <strong> ${checkInDate.toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</strong>.
            </p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0F766E; margin: 0 0 15px 0;">Detalles de tu reserva</h3>
              <p style="margin: 8px 0; color: #374151;"><strong>Código:</strong> ${reservation.code}</p>
              <p style="margin: 8px 0; color: #374151;"><strong>Check-in:</strong> ${checkInDate.toLocaleDateString("es-AR")}</p>
              <p style="margin: 8px 0; color: #374151;"><strong>Check-out:</strong> ${checkOutDate.toLocaleDateString("es-AR")}</p>
              <p style="margin: 8px 0; color: #374151;"><strong>Unidad:</strong> ${reservation.unit_name}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${guestPanelUrl}" style="background: #0F766E; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Acceder a mi panel de huésped
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              En tu panel podrás hacer el pre check-in, ver información del alojamiento, clima, mapa y más.
            </p>
          </div>

          <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              ${getEmailSignature(tenant.name)}
            </p>
          </div>
        </div>
      `;

      const { error: emailError } = await resend.emails.send({
        from: `${tenant.name} <notificaciones@miestadia.online>`,
        to: [reservation.guest_email],
        subject,
        html,
      });

      if (emailError) {
        console.error(`Error sending email to ${reservation.guest_email}:`, emailError);
      }
    }

    return NextResponse.json({ 
      message: `Processed ${reservations.length} reservations`,
      count: reservations.length 
    });
  } catch (err: any) {
    console.error("Error in send-emails route:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}