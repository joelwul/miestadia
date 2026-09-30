// ============================================
// CONFIGURACIÓN GLOBAL
// ============================================

// Tipo de cambio USD → ARS
// ⚠️ CAMBIAR ESTE VALOR cuando el dólar cambie
export const USD_TO_ARS = 1600;

// Precios en USD
export const PRICES = {
  monthly: 40,    // USD 40/mes
  yearly: 360,    // USD 360/año (2 meses gratis)
};

// Precios calculados en ARS automáticamente
export const PRICES_ARS = {
  monthly: PRICES.monthly * USD_TO_ARS,
  yearly: PRICES.yearly * USD_TO_ARS,
};

// Dominio de la app
export const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || "https://miestadia.online";

// Formatear email subject
export function formatEmailSubject(propertyName: string, subject: string): string {
  return `[${propertyName}] ${subject}`;
}

// Firma de email
export function getEmailSignature(propertyName: string): string {
  return `— ${propertyName} • Gestionado con Mi Estadía`;
}