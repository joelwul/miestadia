// Configuración de LemonSqueezy
const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY || '';
const LEMONSQUEEZY_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID || '';
const LEMONSQUEEZY_BASE_URL = 'https://api.lemonsqueezy.com/v1';

// IDs de productos (reemplazar con los reales de LemonSqueezy)
export const LEMONSQUEEZY_PRODUCT_IDS = {
  monthly: process.env.LEMONSQUEEZY_MONTHLY_VARIANT_ID || '',
  yearly: process.env.LEMONSQUEEZY_YEARLY_VARIANT_ID || '',
};

export async function cancelLemonSqueezySubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
  if (!LEMONSQUEEZY_API_KEY) {
    return { success: false, error: 'LEMONSQUEEZY_API_KEY no configurada' };
  }

  try {
    const response = await fetch(
      `${LEMONSQUEEZY_BASE_URL}/subscriptions/${subscriptionId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${LEMONSQUEEZY_API_KEY}`,
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        success: false,
        error: errorData?.error?.message || `Error ${response.status}: ${response.statusText}`,
      };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error de conexión con LemonSqueezy' };
  }
}

export async function getLemonSqueezySubscription(subscriptionId: string) {
  if (!LEMONSQUEEZY_API_KEY) return null;

  try {
    const response = await fetch(
      `${LEMONSQUEEZY_BASE_URL}/subscriptions/${subscriptionId}`,
      {
        headers: {
          'Authorization': `Bearer ${LEMONSQUEEZY_API_KEY}`,
          'Accept': 'application/vnd.api+json',
        },
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    return data.data;
  } catch {
    return null;
  }
}

export async function listLemonSqueezySubscriptions(customerId?: string) {
  if (!LEMONSQUEEZY_API_KEY) return [];

  try {
    let url = `${LEMONSQUEEZY_BASE_URL}/subscriptions`;
    if (customerId) {
      url += `?filter[store_id]=${LEMONSQUEEZY_STORE_ID}&filter[customer_id]=${customerId}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${LEMONSQUEEZY_API_KEY}`,
        'Accept': 'application/vnd.api+json',
      },
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.data || [];
  } catch {
    return [];
  }
}