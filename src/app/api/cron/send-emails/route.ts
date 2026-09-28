import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function replacePlaceholders(template: string, data: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }
  return result
}

export async function GET() {
  try {
    // 1. Obtener todos los tenants con email automático activado
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
      .eq('auto_email_enabled', true)

    if (tenantsError || !tenants) {
      return NextResponse.json({ error: 'No tenants found' }, { status: 500 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let processed = 0
    let errors = 0

    for (const tenant of tenants) {
      const settings = tenant.settings || {}
      const templates = tenant.email_templates || {
        preCheckin: '¡Hola {{guestName}}! Tu reserva en {{propertyName}} está confirmada...',
        postCheckout: '¡Hola {{guestName}}! Gracias por elegir {{propertyName}}...'
      }
      const preCheckinDays = tenant.pre_checkin_days || 4
      const postCheckoutDays = tenant.post_checkout_days || 1

      // 2. Pre-checkin: buscar reservas con check_in en N días
      const preCheckinDate = new Date(today)
      preCheckinDate.setDate(today.getDate() + preCheckinDays)
      const preCheckinDateStr = preCheckinDate.toISOString().split('T')[0]

      const { data: preCheckinReservations } = await supabase
        .from('reservations')
        .select(`*, guests (first_name, last_name, email), units (name)`)
        .eq('tenant_id', tenant.id)
        .in('status', ['booked', 'pre_checkin'])
        .eq('check_in', preCheckinDateStr)

      if (preCheckinReservations) {
        for (const res of preCheckinReservations) {
          // Verificar si ya se envió
          const { data: existing } = await supabase
            .from('message_logs')
            .select('id')
            .eq('reservation_id', res.id)
            .eq('type', 'pre_checkin_email')
            .eq('status', 'sent')
            .single()

          if (existing) continue

          const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${tenant.slug}?code=${res.reservation_code}&lastName=${encodeURIComponent(res.guests?.last_name || '')}`
          
          const emailBody = replacePlaceholders(templates.preCheckin, {
            guestName: res.guests?.first_name || 'Huésped',
            propertyName: tenant.name,
            checkIn: new Date(res.check_in).toLocaleDateString('es-AR'),
            checkOut: new Date(res.check_out).toLocaleDateString('es-AR'),
            unitName: res.units?.name || 'Tu unidad',
            reservationCode: res.reservation_code,
            loginUrl: loginUrl,
            reviewSection: ''
          })

          try {
            await resend.emails.send({
              from: `${tenant.name} <onboarding@resend.dev>`,
              to: [res.guests?.email],
              subject: `Recordatorio: tu estadía en ${tenant.name} comienza en ${preCheckinDays} días`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  ${tenant.branding?.logoUrl ? `<img src="${tenant.branding.logoUrl}" alt="${tenant.name}" style="max-height: 80px; margin-bottom: 20px;" />` : ''}
                  <h2 style="color: #0F766E;">¡Hola ${res.guests?.first_name}! 👋</h2>
                  <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; white-space: pre-line;">
                    ${emailBody.replace(/\n/g, '<br/>')}
                  </div>
                  <a href="${loginUrl}" style="display: inline-block; background: #0F766E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                    Acceder a mi panel →
                  </a>
                  <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                    ${tenant.name} • Gestionado con Mi Estadía
                  </p>
                </div>
              `,
            })

            await supabase.from('message_logs').insert({
              tenant_id: tenant.id,
              reservation_id: res.id,
              type: 'pre_checkin_email',
              channel: 'email',
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            processed++
          } catch (err: any) {
            await supabase.from('message_logs').insert({
              tenant_id: tenant.id,
              reservation_id: res.id,
              type: 'pre_checkin_email',
              channel: 'email',
              status: 'failed',
              error_message: err.message,
            })
            errors++
          }
        }
      }

      // 3. Post-checkout: buscar reservas con check_out hace N días
      const postCheckoutDate = new Date(today)
      postCheckoutDate.setDate(today.getDate() - postCheckoutDays)
      const postCheckoutDateStr = postCheckoutDate.toISOString().split('T')[0]

      const { data: postCheckoutReservations } = await supabase
        .from('reservations')
        .select(`*, guests (first_name, last_name, email), units (name)`)
        .eq('tenant_id', tenant.id)
        .eq('status', 'checked_out')
        .eq('check_out', postCheckoutDateStr)

      if (postCheckoutReservations) {
        for (const res of postCheckoutReservations) {
          const { data: existing } = await supabase
            .from('message_logs')
            .select('id')
            .eq('reservation_id', res.id)
            .eq('type', 'post_checkout_email')
            .eq('status', 'sent')
            .single()

          if (existing) continue

          const reviewUrl = settings.reviewUrl || settings.googleMapsUrl || ''
          const reviewSection = reviewUrl 
            ? `¿Podrías dejarnos una reseña? Nos ayudaría mucho:\n${reviewUrl}`
            : '¿Cómo fue tu experiencia? Contanos por WhatsApp.'

          const emailBody = replacePlaceholders(templates.postCheckout, {
            guestName: res.guests?.first_name || 'Huésped',
            propertyName: tenant.name,
            checkIn: new Date(res.check_in).toLocaleDateString('es-AR'),
            checkOut: new Date(res.check_out).toLocaleDateString('es-AR'),
            unitName: res.units?.name || 'Tu unidad',
            reservationCode: res.reservation_code,
            loginUrl: '',
            reviewSection: reviewSection
          })

          try {
            await resend.emails.send({
              from: `${tenant.name} <onboarding@resend.dev>`,
              to: [res.guests?.email],
              subject: `Gracias por tu estadía en ${tenant.name}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  ${tenant.branding?.logoUrl ? `<img src="${tenant.branding.logoUrl}" alt="${tenant.name}" style="max-height: 80px; margin-bottom: 20px;" />` : ''}
                  <h2 style="color: #0F766E;">¡Hola ${res.guests?.first_name}! 👋</h2>
                  <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; white-space: pre-line;">
                    ${emailBody.replace(/\n/g, '<br/>')}
                  </div>
                  ${reviewUrl ? `
                    <a href="${reviewUrl}" style="display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                      ${settings.reviewUrl ? 'Dejar reseña en Google ⭐' : 'Ver ubicación en Maps '}
                    </a>
                  ` : ''}
                  <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                    ${tenant.name} • Gestionado con Mi Estadía
                  </p>
                </div>
              `,
            })

            await supabase.from('message_logs').insert({
              tenant_id: tenant.id,
              reservation_id: res.id,
              type: 'post_checkout_email',
              channel: 'email',
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            processed++
          } catch (err: any) {
            await supabase.from('message_logs').insert({
              tenant_id: tenant.id,
              reservation_id: res.id,
              type: 'post_checkout_email',
              channel: 'email',
              status: 'failed',
              error_message: err.message,
            })
            errors++
          }
        }
      }
    }

    return NextResponse.json({ message: 'OK', processed, errors })
  } catch (err: any) {
    console.error('Error en cron job:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}