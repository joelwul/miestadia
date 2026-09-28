'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X, AlertCircle, CheckCircle } from 'lucide-react'

interface Props {
  tenantSlug: string
  tenantId: string
  onClose: () => void
  onCreated: (reservation: any) => void
}

interface ParsedData {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  checkIn?: string
  checkOut?: string
  unitName?: string
  guests?: number
  confidence: number
  missingFields: string[]
}

function parseDate(dateStr: string): string | null {
  const match = dateStr.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/)
  if (!match) return null
  const day = parseInt(match[1])
  const month = parseInt(match[2]) - 1
  let year = parseInt(match[3])
  if (year < 100) {
    year += 2000
  }
  const date = new Date(year, month, day)
  if (isNaN(date.getTime())) {
    return null
  }
  return date.toISOString().split('T')[0]
}

export default function TextParser({ tenantSlug, tenantId, onClose, onCreated }: Props) {
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<ParsedData | null>(null)
  const [loading, setLoading] = useState(false)
  const [units, setUnits] = useState<any[]>([])
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadUnits()
  }, [tenantId])

  async function loadUnits() {
    const { data } = await supabase
      .from('units')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
    if (data) setUnits(data)
  }

  function parseText() {
    const result: ParsedData = {
      confidence: 0,
      missingFields: [],
    }

    let found = 0
    const total = 6

    const nameMatch = text.match(/(?:hola|nombre|name|huésped|guest)[:\s]+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/i)
    if (nameMatch) {
      const parts = nameMatch[1].split(' ')
      result.firstName = parts[0]
      result.lastName = parts.slice(1).join(' ')
      found++
    }

    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/)
    if (emailMatch) {
      result.email = emailMatch[0]
      found++
    }

    const phoneMatch = text.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/)
    if (phoneMatch) {
      result.phone = phoneMatch[0].replace(/\s/g, '').replace(/\-/g, '')
      found++
    }

    const checkInMatch = text.match(/(?:check[-\s]?in|ingresar|entrada|llegada)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
    if (checkInMatch) {
      const parsedDate = parseDate(checkInMatch[1])
      if (parsedDate) {
        result.checkIn = parsedDate
        found++
      }
    }

    const checkOutMatch = text.match(/(?:check[-\s]?out|salida)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
    if (checkOutMatch) {
      const parsedDate = parseDate(checkOutMatch[1])
      if (parsedDate) {
        result.checkOut = parsedDate
        found++
      }
    }

    if (!result.checkIn || !result.checkOut) {
      const allDates = text.matchAll(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g)
      const dates = Array.from(allDates).map(m => m[1])
      if (dates.length >= 1 && !result.checkIn) {
        const parsedDate = parseDate(dates[0])
        if (parsedDate) {
          result.checkIn = parsedDate
          found++
        }
      }
      if (dates.length >= 2 && !result.checkOut) {
        const parsedDate = parseDate(dates[1])
        if (parsedDate) {
          result.checkOut = parsedDate
          found++
        }
      }
    }

    const guestsMatch = text.match(/(\d+)\s*(?:huéspedes|personas|guests|people|huespedes)/i)
    if (guestsMatch) {
      result.guests = parseInt(guestsMatch[1])
      found++
    }

    result.confidence = Math.round((found / total) * 100)
    result.missingFields = []
    if (!result.firstName) result.missingFields.push('Nombre')
    if (!result.lastName) result.missingFields.push('Apellido')
    if (!result.email) result.missingFields.push('Email')
    if (!result.checkIn) result.missingFields.push('Check-in')
    if (!result.checkOut) result.missingFields.push('Check-out')

    setParsed(result)
  }

  function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = tenantSlug.substring(0, 3).toUpperCase() + '-'
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  async function handleConfirm() {
    if (!parsed || !selectedUnitId) return

    setLoading(true)

    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .insert({
        tenant_id: tenantId,
        first_name: parsed.firstName || 'Huésped',
        last_name: parsed.lastName || 'Sin apellido',
        email: parsed.email || '',
        phone: parsed.phone || '',
      })
      .select()
      .single()

    if (guestError || !guest) {
      setLoading(false)
      return
    }

    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .insert({
        tenant_id: tenantId,
        reservation_code: generateCode(),
        guest_id: guest.id,
        unit_id: selectedUnitId,
        check_in: parsed.checkIn || new Date().toISOString().split('T')[0],
        check_out: parsed.checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0],
        status: 'booked',
        source: 'text_parser',
      })
      .select()
      .single()

    if (!resError && reservation) {
      const { data: fullReservation } = await supabase
        .from('reservations')
        .select(`*, guests (first_name, last_name, email, phone), units (name, type)`)
        .eq('id', reservation.id)
        .single()

      onCreated(fullReservation || reservation)
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Pegar Confirmación</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Pegá el texto de la confirmación (WhatsApp, email, etc.)
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ej: Reserva confirmada para Juan Pérez, email juan@email.com, check-in 15/12/2024, check-out 20/12/2024, 2 huéspedes..."
              className="w-full min-h-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          <Button onClick={parseText} variant="outline" className="w-full">
            Analizar Texto
          </Button>

          {parsed && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Datos Detectados</h3>
                <Badge variant={parsed.confidence > 70 ? 'default' : 'secondary'}>
                  {parsed.confidence}% confianza
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Nombre</p>
                  <p className="font-medium">{parsed.firstName || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Apellido</p>
                  <p className="font-medium">{parsed.lastName || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{parsed.email || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Teléfono</p>
                  <p className="font-medium">{parsed.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Check-in</p>
                  <p className="font-medium">{parsed.checkIn || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Check-out</p>
                  <p className="font-medium">{parsed.checkOut || '—'}</p>
                </div>
              </div>

              {parsed.missingFields.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Faltan datos</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        {parsed.missingFields.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Seleccionar Unidad *
                </label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white">
                  <option value="">Seleccionar unidad</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleConfirm}
                  disabled={loading || !selectedUnitId}
                  className="flex-1">
                  {loading ? 'Creando...' : 'Confirmar Reserva'}
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}