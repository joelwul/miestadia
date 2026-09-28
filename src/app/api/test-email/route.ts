import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    const data = await resend.emails.send({
      from: 'Mi Estadía <onboarding@resend.dev>',
      to: ['joelwul@gmail.com'], // ← Cambiá por tu email
      subject: 'Prueba de email - Mi Estadía',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0F766E;">¡Hola!</h1>
          <p>Este es un email de prueba de <strong>Mi Estadía</strong>.</p>
          <p>Si recibiste este email, la configuración de Resend funciona correctamente.</p>
          <div style="background: #FDFBF7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #EA580C;">Detalles de prueba</h2>
            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-AR')}</p>
            <p><strong>Estado:</strong> ✅ Funcionando</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Este email fue enviado desde Mi Estadía - Tu alojamiento, más cerca.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Email enviado correctamente',
      data: data 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}