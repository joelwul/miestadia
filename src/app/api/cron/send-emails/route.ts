import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || "https://miestadia.online";

export async function GET(request: Request) {
  try {
    // Verificar autorización
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Obtener todos los tenants con emails automáticos activados
    const { data: tenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("id, name, slug, owner_email, settings, auto_email_enabled, pre_checkin_days, post_checkout_days, email_templates")
      .eq("auto_email_enabled", true);

    if (tenantsError) {
      console.error("Error fetching tenants:", tenantsError);
      return NextResponse.json({ error: tenantsError.message }, { status: 500 });
    }

    let emailsSent = 0;
    let emailsFailed = 0;
    const logs: string[] = [];

    for (const tenant of tenants || []) {
      const settings = typeof tenant.settings === "string" ? JSON.parse(tenant.settings) : tenant.settings;
      const emailTemplates = typeof tenant.email_templates === "string" ? JSON.parse(tenant.email_templates) : tenant.email_templates;

      const preCheckinDays = tenant.pre_checkin_days || 1;
      const postCheckoutDays = tenant.post_checkout_days || 1;

      // Calcular fechas objetivo
      const preCheckinDate = new Date(today);
      preCheckinDate.setDate(preCheckinDate.getDate() + preCheckinDays);
      const preCheckinDateStr = preCheckinDate.toISOString().split("T")[0];

      const postCheckoutDate = new Date(today);
      postCheckoutDate.setDate(postCheckoutDate.getDate() - postCheckoutDays);
      const postCheckoutDateStr = postCheckoutDate.toISOString().split("T")[0];

      // 2. Recordatorios pre-checkin
      const { data: preCheckinReservations, error: preError } = await supabase
        .from("reservations")
        .select("id, reservation_code, check_in, check_out, guest_id, unit_id")
        .eq("tenant_id", tenant.id)
        .eq("check_in", preCheckinDateStr)
        .in("status", ["booked", "pre_checkin"]);

      if (preError) {
        logs.push(` Error fetching pre-checkin reservations for ${tenant.name}: ${preError.message}`);
        continue;
      }

      for (const res of preCheckinReservations || []) {
        // Cargar datos del huésped
        const { data: guest } = await supabase
          .from("guests")
          .select("first_name, last_name, email")
          .eq("id", res.guest_id)
          .single();

        // Cargar datos de la unidad
        const { data: unit } = await supabase
          .from("units")
          .select("name")
          .eq("id", res.unit_id)
          .single();

        if (!guest?.email) {
          logs.push(`⚠️ Sin email para reserva ${res.reservation_code} en ${tenant.name}`);
          continue;
        }

        const template = emailTemplates?.preCheckin || "¡Hola {{guestName}}! Tu reserva en {{propertyName}} está confirmada para el {{checkIn}}.";
        const subject = `Recordatorio: Tu check-in en ${tenant.name} es el ${new Date(res.check_in).toLocaleDateString("es-AR")}`;
        const guestPanelUrl = `${APP_DOMAIN}/${tenant.slug}?code=${res.reservation_code}&lastName=${encodeURIComponent(guest.last_name || "")}`;

        const body = template
          .replace(/\{\{guestName\}\}/g, guest.first_name || "huésped")
          .replace(/\{\{propertyName\}\}/g, tenant.name)
          .replace(/\{\{checkIn\}\}/g, new Date(res.check_in).toLocaleDateString("es-AR"))
          .replace(/\{\{checkOut\}\}/g, new Date(res.check_out).toLocaleDateString("es-AR"))
          .replace(/\{\{unitName\}\}/g, unit?.name || "")
          .replace(/\{\{reservationCode\}\}/g, res.reservation_code)
          .replace(/\{\{loginUrl\}\}/g, guestPanelUrl);

        try {
          await resend.emails.send({
            from: `${tenant.name} <notificaciones@miestadia.online>`,
            to: [guest.email],
            subject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #0F766E 0%, #166534 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">¡Hola ${guest.first_name}!</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Tu check-in se acerca</p>
                </div>
                <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${body}</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${guestPanelUrl}" style="background: #0F766E; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                      Acceder a mi panel de huésped
                    </a>
                  </div>
                </div>
                <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">
                    Enviado por Mi Estadía • ${tenant.name}
                  </p>
                </div>
              </div>
            `,
          });
          emailsSent++;
          logs.push(`✅ Recordatorio enviado a ${guest.email} para reserva ${res.reservation_code} en ${tenant.name}`);
        } catch (emailError: any) {
          emailsFailed++;
          logs.push(`❌ Error enviando a ${guest.email}: ${emailError.message}`);
        }
      }

      // 3. Agradecimientos post-checkout
      const { data: postCheckoutReservations, error: postError } = await supabase
        .from("reservations")
        .select("id, reservation_code, check_in, check_out, guest_id, unit_id")
        .eq("tenant_id", tenant.id)
        .eq("check_out", postCheckoutDateStr)
        .eq("status", "checked_out");

      if (postError) {
        logs.push(`❌ Error fetching post-checkout reservations for ${tenant.name}: ${postError.message}`);
        continue;
      }

      for (const res of postCheckoutReservations || []) {
        const { data: guest } = await supabase
          .from("guests")
          .select("first_name, last_name, email")
          .eq("id", res.guest_id)
          .single();

        if (!guest?.email) continue;

        const template = emailTemplates?.postCheckout || "¡Hola {{guestName}}! Gracias por elegir {{propertyName}}.";
        const subject = `Gracias por tu estadía en ${tenant.name}`;
        const guestPanelUrl = `${APP_DOMAIN}/${tenant.slug}?code=${res.reservation_code}&lastName=${encodeURIComponent(guest.last_name || "")}`;

        const body = template
          .replace(/\{\{guestName\}\}/g, guest.first_name || "huésped")
          .replace(/\{\{propertyName\}\}/g, tenant.name)
          .replace(/\{\{checkIn\}\}/g, new Date(res.check_in).toLocaleDateString("es-AR"))
          .replace(/\{\{checkOut\}\}/g, new Date(res.check_out).toLocaleDateString("es-AR"))
          .replace(/\{\{unitName\}\}/g, "")
          .replace(/\{\{reservationCode\}\}/g, res.reservation_code)
          .replace(/\{\{loginUrl\}\}/g, guestPanelUrl);

        try {
          await resend.emails.send({
            from: `${tenant.name} <notificaciones@miestadia.online>`,
            to: [guest.email],
            subject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #0F766E 0%, #166534 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">¡Gracias ${guest.first_name}!</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Esperamos que hayas disfrutado tu estadía</p>
                </div>
                <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
                  <p style="color: #374151; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${body}</p>
                </div>
                <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">
                    Enviado por Mi Estadía • ${tenant.name}
                  </p>
                </div>
              </div>
            `,
          });
          emailsSent++;
          logs.push(`✅ Agradecimiento enviado a ${guest.email} para reserva ${res.reservation_code} en ${tenant.name}`);
        } catch (emailError: any) {
          emailsFailed++;
          logs.push(`❌ Error enviando a ${guest.email}: ${emailError.message}`);
        }
      }
    }

    return NextResponse.json({
      message: "Envío automático completado",
      emailsSent,
      emailsFailed,
      logs,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error en send-automatic-emails:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}