// Configuración centralizada de la aplicación
// Todos los dominios y URLs se definen aquí para mantener consistencia

export const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://miestadia.online';

export const GUEST_BASE_URL = APP_DOMAIN.replace(/\/$/, '');

export const PLATFORM_NAME = 'Mi Estadía';

export const SUPPORT_EMAIL = 'soporte@miestadia.online';

/**
 * Genera la URL completa para el panel del huésped
 */
export function getGuestPanelUrl(tenantSlug: string, code: string, lastName?: string): string {
  const url = `${GUEST_BASE_URL}/${tenantSlug}?code=${code}`;
  return lastName ? `${url}&lastName=${encodeURIComponent(lastName)}` : url;
}

/**
 * Genera el mensaje de WhatsApp con firma del alojamiento
 */
export function formatWhatsAppMessage(tenantName: string, message: string): string {
  return `${message}\n\n— ${tenantName} (vía ${PLATFORM_NAME})`;
}

/**
 * Genera el asunto de email con nombre del alojamiento
 */
export function formatEmailSubject(tenantName: string, subject: string): string {
  return `[${tenantName}] ${subject}`;
}

/**
 * Genera la firma de email
 */
export function getEmailSignature(tenantName: string): string {
  return `—\n${tenantName}\nGestionado con ${PLATFORM_NAME}\n${APP_DOMAIN}`;
}