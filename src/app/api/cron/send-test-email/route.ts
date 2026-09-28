import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { tenantId, email, template } = await request.json()

    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single()

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const templates = tenant.email_templates || {}
    const templateText = template === 'preCheckin' ? templates.preCheckin : templates.postCheckout

    const emailBody = templateText
      .replace(/\{\{guestName\}\}/g, 'Huésped de prueba')
      .replace(/\{\{propertyName\}\}/g, tenant.name)
      .replace(/\{\{checkIn\}\}/g, '15/11/2026')
      .replace(/\{\{checkOut\}\}/g, '18/11/2026')
      .replace(/\{\{unitName\}\}/g, 'Cabaña 1')
      .replace(/\{\{reservationCode\}\}/g, 'TEST-123')
      .replace(/\{\{loginUrl\}\}/g, 'https://miestadia.com/ejemplo?code=TEST-123&lastName=Prueba')
      .replace(/\{\{reviewSection\}\}/g, '¿Podrías dejarnos una reseña?')

    await resend.emails.send({
      from: `${tenant.name} <onboarding@resend.dev>`,
      to: [email],
      subject: `Email de prueba - ${tenant.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${tenant.branding?.logoUrl ? `<img src="${tenant.branding.logoUrl}" alt="${tenant.name}" style="max-height: 80px; margin-bottom: 20px;" />` : ''}
          <h2 style="color: #0F766E;">Email de prueba</h2>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; white-space: pre-line;">
            ${emailBody.replace(/\n/g, '<br/>')}
          </div>
          <p style="color: #6b7280; font-size: 12px;">
            Este es un email de prueba de ${tenant.name}
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}