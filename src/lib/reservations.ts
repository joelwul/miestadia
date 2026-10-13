import { createClient } from '@/lib/supabase/client'

export async function isUnitAvailable(
  unitId: string,
  checkIn: string, // Formato 'YYYY-MM-DD'
  checkOut: string // Formato 'YYYY-MM-DD'
): Promise<boolean> {
  const supabase = createClient()

  // Busca cualquier reserva NO cancelada que se solape con las fechas solicitadas
  // Lógica de solapamiento: (InicioA <= FinB) Y (FinA >= InicioB)
  const { data, error } = await supabase
    .from('reservations')
    .select('id')
    .eq('unit_id', unitId)
    .neq('status', 'cancelled')
    .lte('check_in', checkOut)
    .gte('check_out', checkIn)
    .maybeSingle()

  if (error) {
    console.error('Error verificando disponibilidad:', error)
    return false // Ante la duda, bloqueamos por seguridad (Principio 33)
  }

  // Si data es null, significa que NO hay reservas solapadas. Está disponible.
  return data === null
}