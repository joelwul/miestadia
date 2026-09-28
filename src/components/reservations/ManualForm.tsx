'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

interface Props {
  tenantSlug: string
  onClose: () => void
  onSaved: () => void
}

export default function ManualReservationForm({ tenantSlug, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const [units, setUnits] = useState<any[]>([])
  const [formData, setFormData] = useState({
    guestFirstName: '',
    guestLastName: '',
    guestEmail: '',
    guestPhone: '',
    unitId: '',
    checkIn: '',
    checkOut: '',
    source: 'direct',
  })
  const supabase = createClient()

  useEffect(() => {
    loadUnits()
  }, [tenantSlug])

  async function loadUnits() {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single()

    if (tenant) {
      const { data } = await supabase
        .from('units')
        .select('id, name')
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
      
      if (data) setUnits(data)
    }
  }

  function generateReservationCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = 'CEP-'
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single()

    if (!tenant) {
      setLoading(false)
      return
    }

    // Crear huésped
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .insert({
        tenant_id: tenant.id,
        first_name: formData.guestFirstName,
        last_name: formData.guestLastName,
        email: formData.guestEmail,
        phone: formData.guestPhone,
        country: 'Argentina',
      })
      .select()
      .single()

    if (guestError || !guest) {
      setLoading(false)
      return
    }

    // Crear reserva
    const { error: resError } = await supabase
      .from('reservations')
      .insert({
        tenant_id: tenant.id,
        reservation_code: generateReservationCode(),
        guest_id: guest.id,
        unit_id: formData.unitId,
        check_in: formData.checkIn,
        check_out: formData.checkOut,
        status: 'booked',
        source: formData.source,
      })

    if (!resError) {
      onSaved()
      onClose()
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Carga Manual</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nombre *</label>
              <Input
                value={formData.guestFirstName}
                onChange={(e) => setFormData({ ...formData, guestFirstName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Apellido *</label>
              <Input
                value={formData.guestLastName}
                onChange={(e) => setFormData({ ...formData, guestLastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <Input
              type="email"
              value={formData.guestEmail}
              onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Teléfono</label>
            <Input
              value={formData.guestPhone}
              onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Unidad *</label>
            <select
              value={formData.unitId}
              onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
              required
              className="w-full h-10 px-3 border border-gray-300 rounded-lg">
              <option value="">Seleccionar unidad</option>
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>{unit.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Check-in *</label>
              <Input
                type="date"
                value={formData.checkIn}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Check-out *</label>
              <Input
                type="date"
                value={formData.checkOut}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creando...' : 'Crear Reserva'}
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
