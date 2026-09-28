'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Search, Plus, User } from 'lucide-react'

interface Props {
  tenantSlug: string
  tenantId: string
  onClose: () => void
  onCreated: (reservation: any) => void
}

interface Guest {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
}

export default function AddReservationModal({ tenantSlug, tenantId, onClose, onCreated }: Props) {
  const [step, setStep] = useState<'guest' | 'details'>('guest')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Guest[]>([])
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [showNewGuestForm, setShowNewGuestForm] = useState(false)
  const [newGuest, setNewGuest] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  })
  const [units, setUnits] = useState<any[]>([])
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadUnits()
  }, [tenantId])

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchGuests(searchTerm)
    } else {
      setSearchResults([])
    }
  }, [searchTerm])

  async function loadUnits() {
    const { data } = await supabase
      .from('units')
      .select('id, name, type, capacity')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('name')

    if (data) setUnits(data)
  }

  async function searchGuests(term: string) {
    const { data } = await supabase
      .from('guests')
      .select('id, first_name, last_name, email, phone')
      .eq('tenant_id', tenantId)
      .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`)
      .limit(5)

    if (data) setSearchResults(data)
  }

  function generateReservationCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = tenantSlug.substring(0, 3).toUpperCase() + '-'
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  async function handleCreateGuest() {
    if (!newGuest.first_name || !newGuest.last_name) {
      setError('Nombre y apellido son obligatorios')
      return
    }

    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('guests')
      .insert({
        tenant_id: tenantId,
        first_name: newGuest.first_name,
        last_name: newGuest.last_name,
        email: newGuest.email || null,
        phone: newGuest.phone || null,
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSelectedGuest(data)
    setShowNewGuestForm(false)
    setStep('details')
    setLoading(false)
  }

  async function handleCreateReservation() {
    if (!selectedGuest || !selectedUnitId || !checkIn || !checkOut) {
      setError('Todos los campos son obligatorios')
      return
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      setError('El check-out debe ser posterior al check-in')
      return
    }

    setLoading(true)
    setError('')

    const reservationCode = generateReservationCode()

    // Crear la reserva
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        tenant_id: tenantId,
        reservation_code: reservationCode,
        guest_id: selectedGuest.id,
        unit_id: selectedUnitId,
        check_in: checkIn,
        check_out: checkOut,
        status: 'booked',
        source: 'manual',
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Hacer un segundo fetch para traer los datos completos con guest y unit
    const { data: fullReservation } = await supabase
      .from('reservations')
      .select(`*, guests (first_name, last_name, email, phone), units (name, type)`)
      .eq('id', data.id)
      .single()

    onCreated(fullReservation || data)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Agregar Reserva</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Paso 1: Huésped */}
          {step === 'guest' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">1. Seleccionar Huésped</h3>
                
                {!showNewGuestForm ? (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nombre, email o teléfono..."
                        className="pl-9"
                      />
                    </div>

                    {searchResults.length > 0 && (
                      <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                        {searchResults.map((guest) => (
                          <button
                            key={guest.id}
                            onClick={() => {
                              setSelectedGuest(guest)
                              setStep('details')
                            }}
                            className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                          >
                            <p className="font-medium text-gray-900">{guest.first_name} {guest.last_name}</p>
                            <p className="text-sm text-gray-500">{guest.email} • {guest.phone}</p>
                          </button>
                        ))}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      className="w-full mt-3"
                      onClick={() => setShowNewGuestForm(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Crear nuevo huésped
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3 border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Nombre *</label>
                        <Input
                          value={newGuest.first_name}
                          onChange={(e) => setNewGuest({ ...newGuest, first_name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Apellido *</label>
                        <Input
                          value={newGuest.last_name}
                          onChange={(e) => setNewGuest({ ...newGuest, last_name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <Input
                          type="email"
                          value={newGuest.email}
                          onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Teléfono</label>
                        <Input
                          value={newGuest.phone}
                          onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleCreateGuest} disabled={loading} size="sm">
                        {loading ? 'Creando...' : 'Crear Huésped'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowNewGuestForm(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paso 2: Detalles de la reserva */}
          {step === 'details' && selectedGuest && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">Huésped seleccionado</h4>
                </div>
                <p className="text-sm text-green-800">
                  {selectedGuest.first_name} {selectedGuest.last_name}
                </p>
                {selectedGuest.email && (
                  <p className="text-sm text-green-700">{selectedGuest.email}</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">2. Detalles de la Reserva</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Unidad *</label>
                    <select
                      value={selectedUnitId}
                      onChange={(e) => setSelectedUnitId(e.target.value)}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="">Seleccionar unidad</option>
                      {units.map(unit => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name} ({unit.type === 'cabin' ? 'Cabaña' : unit.type === 'room' ? 'Habitación' : unit.type}) - {unit.capacity} personas
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Check-in *</label>
                      <Input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Check-out *</label>
                      <Input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleCreateReservation} disabled={loading} className="flex-1">
                  {loading ? 'Creando...' : 'Crear Reserva'}
                </Button>
                <Button variant="outline" onClick={() => setStep('guest')}>
                  Volver
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}