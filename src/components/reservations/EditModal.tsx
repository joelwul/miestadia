'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

interface Props {
  reservation: any
  tenantSlug: string
  units: any[]
  onClose: () => void
  onSaved: () => void
}

export default function EditReservationModal({ reservation, tenantSlug, units, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: reservation.guests?.first_name || '',
    lastName: reservation.guests?.last_name || '',
    email: reservation.guests?.email || '',
    phone: reservation.guests?.phone || '',
    unitId: reservation.unit_id || '',
    checkIn: reservation.check_in?.split('T')[0] || '',
    checkOut: reservation.check_out?.split('T')[0] || '',
    notes: reservation.notes || '',
  })
  const supabase = createClient()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    // Actualizar huésped
    await supabase
      .from('guests')
      .update({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      })
      .eq('id', reservation.guest_id)

    // Actualizar reserva
    const { error } = await supabase
      .from('reservations')
      .update({
        unit_id: formData.unitId,
        check_in: formData.checkIn,
        check_out: formData.checkOut,
        notes: formData.notes,
      })
      .eq('id', reservation.id)

    if (!error) {
      onSaved()
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Editar Reserva</h2>
            <p className="text-sm text-gray-500 mt-1">Código: {reservation.reservation_code}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Datos del Huésped</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Nombre *</label>
                <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
              </div>
              <div>
                <label className="text-xs text-gray-500">Apellido *</label>
                <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
              </div>
              <div>
                <label className="text-xs text-gray-500">Email</label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Teléfono</label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Detalles de la Reserva</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Unidad *</label>
                <select
                  value={formData.unitId}
                  onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                  required
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white">
                  <option value="">Seleccionar</option>
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Check-in *</label>
                  <Input type="date" value={formData.checkIn} onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })} required />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Check-out *</label>
                  <Input type="date" value={formData.checkOut} onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })} required />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Notas Internas</h3>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas solo visibles para el administrador..."
              className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
