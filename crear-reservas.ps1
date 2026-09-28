Write-Host " Creando sistema de reservas..." -ForegroundColor Cyan

# 1. CREAR PÁGINA PRINCIPAL DE RESERVAS
$reservationsPage = @'
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Upload, FileText, Calendar, Users, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import ManualReservationForm from '@/components/reservations/ManualForm'
import CSVImport from '@/components/reservations/CSVImport'
import TextParser from '@/components/reservations/TextParser'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default function ReservationsPage({ params }: Props) {
  const [tenantSlug, setTenantSlug] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'manual' | 'csv' | 'text' | null>(null)
  const [reservations, setReservations] = useState<any[]>([])
  const [stats, setStats] = useState({
    today: 0,
    upcoming: 0,
    pending: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setTenantSlug(resolvedParams.tenantSlug)
      loadReservations(resolvedParams.tenantSlug)
    }
    loadParams()
  }, [params])

  async function loadReservations(slug: string) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!tenant) return

    const today = new Date().toISOString().split('T')[0]

    // Cargar reservas
    const { data } = await supabase
      .from('reservations')
      .select(`
        *,
        guests (first_name, last_name, email, phone),
        units (name, type)
      `)
      .eq('tenant_id', tenant.id)
      .order('check_in', { ascending: true })
      .limit(50)

    if (data) {
      setReservations(data)

      // Calcular estadísticas
      const todayCount = data.filter(r => r.check_in === today && r.status === 'booked').length
      const upcomingCount = data.filter(r => r.check_in > today && r.status === 'booked').length
      const pendingCount = data.filter(r => r.status === 'pre_checkin').length

      setStats({
        today: todayCount,
        upcoming: upcomingCount,
        pending: pendingCount,
      })
    }
  }

  function getStatusBadge(status: string) {
    const statusConfig = {
      booked: { label: 'Confirmada', variant: 'default' as const },
      pre_checkin: { label: 'Pre Check-in', variant: 'info' as const },
      checked_in: { label: 'Alojado', variant: 'default' as const },
      checked_out: { label: 'Finalizada', variant: 'secondary' as const },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.booked
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reservas</h1>
          <p className="text-gray-500 mt-1">Gestioná las reservas de tu alojamiento</p>
        </div>
        <Button size="lg" onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Reserva
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Llegadas hoy</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.today}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Próximas reservas</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.upcoming}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pre check-in pendientes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pending}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Reservas */}
      <Card>
        <CardHeader>
          <CardTitle>Reservas Recientes</CardTitle>
          <CardDescription>Últimas 50 reservas</CardDescription>
        </CardHeader>
        <CardContent>
          {reservations.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No hay reservas aún</p>
              <Button className="mt-4" onClick={() => setShowModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear primera reserva
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {reservation.guests?.first_name} {reservation.guests?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {reservation.units?.name} • {reservation.reservation_code}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(reservation.check_in).toLocaleDateString('es-AR')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(reservation.check_out).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    {getStatusBadge(reservation.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Agregar Reserva</h2>
              <p className="text-gray-500 mt-1">Elegí cómo querés crear la reserva</p>
            </div>

            <div className="p-6 space-y-4">
              <button
                onClick={() => setModalType('manual')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
              >
                <div className="bg-green-100 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Carga Manual</p>
                  <p className="text-sm text-gray-500">Completar todos los datos manualmente</p>
                </div>
              </button>

              <button
                onClick={() => setModalType('csv')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Upload className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Importar CSV</p>
                  <p className="text-sm text-gray-500">Subir archivo CSV con múltiples reservas</p>
                </div>
              </button>

              <button
                onClick={() => setModalType('text')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
              >
                <div className="bg-purple-100 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Pegar Confirmación</p>
                  <p className="text-sm text-gray-500">Pegar texto de WhatsApp o email y analizar automáticamente</p>
                </div>
              </button>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <Button variant="outline" onClick={() => { setShowModal(false); setModalType(null); }}>
                Cancelar
              </Button>
            </div>
          </div>

          {modalType === 'manual' && (
            <ManualReservationForm
              tenantSlug={tenantSlug}
              onClose={() => { setShowModal(false); setModalType(null); }}
              onSaved={() => loadReservations(tenantSlug)}
            />
          )}

          {modalType === 'csv' && (
            <CSVImport
              tenantSlug={tenantSlug}
              onClose={() => { setShowModal(false); setModalType(null); }}
              onSaved={() => loadReservations(tenantSlug)}
            />
          )}

          {modalType === 'text' && (
            <TextParser
              tenantSlug={tenantSlug}
              onClose={() => { setShowModal(false); setModalType(null); }}
              onSaved={() => loadReservations(tenantSlug)}
            />
          )}
        </div>
      )}
    </div>
  )
}
'@

New-Item -ItemType Directory -Path "src\app\(admin)\[tenantSlug]\admin\reservations" -Force | Out-Null
$reservationsPage | Out-File -FilePath "src\app\(admin)\[tenantSlug]\admin\reservations\page.tsx" -Encoding UTF8 -Force
Write-Host "✓ Página de reservas creada" -ForegroundColor Green

# 2. CREAR COMPONENTES
New-Item -ItemType Directory -Path "src\components\reservations" -Force | Out-Null

# Manual Form
$manualForm = @'
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
              className="w-full h-10 px-3 border border-gray-300 rounded-lg"
            >
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
'@

$manualForm | Out-File -FilePath "src\components\reservations\ManualForm.tsx" -Encoding UTF8 -Force
Write-Host "✓ Formulario manual creado" -ForegroundColor Green

# Text Parser
$textParser = @'
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X, AlertCircle, CheckCircle } from 'lucide-react'

interface Props {
  tenantSlug: string
  onClose: () => void
  onSaved: () => void
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

export default function TextParser({ tenantSlug, onClose, onSaved }: Props) {
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<ParsedData | null>(null)
  const [loading, setLoading] = useState(false)
  const [units, setUnits] = useState<any[]>([])
  const [selectedUnitId, setSelectedUnitId] = useState('')
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

  function parseText() {
    const result: ParsedData = {
      confidence: 0,
      missingFields: [],
    }

    const lines = text.split('\n')
    let found = 0
    let total = 6

    // Nombre
    const nameMatch = text.match(/(?:nombre|name|huésped|guest)[:\s]+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/i)
    if (nameMatch) {
      const parts = nameMatch[1].split(' ')
      result.firstName = parts[0]
      result.lastName = parts.slice(1).join(' ')
      found++
    }

    // Email
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/)
    if (emailMatch) {
      result.email = emailMatch[0]
      found++
    }

    // Teléfono
    const phoneMatch = text.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/)
    if (phoneMatch) {
      result.phone = phoneMatch[0].replace(/\s/g, '')
      found++
    }

    // Fechas
    const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/)
    if (dateMatch) {
      const date = new Date(dateMatch[1])
      result.checkIn = date.toISOString().split('T')[0]
      found++
    }

    const checkoutMatch = text.match(/(?:checkout|check-out|salida)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
    if (checkoutMatch) {
      const date = new Date(checkoutMatch[1])
      result.checkOut = date.toISOString().split('T')[0]
      found++
    }

    // Cantidad de huéspedes
    const guestsMatch = text.match(/(\d+)\s*(?:huéspedes|personas|guests|people)/i)
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
    let code = 'CEP-'
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  async function handleConfirm() {
    if (!parsed || !selectedUnitId) return

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

    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .insert({
        tenant_id: tenant.id,
        first_name: parsed.firstName || 'Huésped',
        last_name: parsed.lastName || 'Sin apellido',
        email: parsed.email || '',
        phone: parsed.phone || '',
        country: 'Argentina',
      })
      .select()
      .single()

    if (guestError || !guest) {
      setLoading(false)
      return
    }

    const { error: resError } = await supabase
      .from('reservations')
      .insert({
        tenant_id: tenant.id,
        reservation_code: generateCode(),
        guest_id: guest.id,
        unit_id: selectedUnitId,
        check_in: parsed.checkIn || new Date().toISOString().split('T')[0],
        check_out: parsed.checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0],
        status: 'booked',
        source: 'imported',
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
                <Badge variant={parsed.confidence > 70 ? 'default' : 'warning'}>
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
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg"
                >
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
                  className="flex-1"
                >
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
'@

$textParser | Out-File -FilePath "src\components\reservations\TextParser.tsx" -Encoding UTF8 -Force
Write-Host "✓ Parser de texto creado" -ForegroundColor Green

# CSV Import
$csvImport = @'
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X, Upload, AlertCircle } from 'lucide-react'

interface Props {
  tenantSlug: string
  onClose: () => void
  onSaved: () => void
}

export default function CSVImport({ tenantSlug, onClose, onSaved }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [units, setUnits] = useState<any[]>([])
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

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFile(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.trim())
      
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim())
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index]
        })
        return row
      })

      setPreview(data)
    }
    reader.readAsText(file)
  }

  function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = 'CEP-'
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  async function handleImport() {
    if (!file || preview.length === 0) return

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

    let successCount = 0

    for (const row of preview) {
      const { data: guest } = await supabase
        .from('guests')
        .insert({
          tenant_id: tenant.id,
          first_name: row.nombre || row.firstName || 'Huésped',
          last_name: row.apellido || row.lastName || 'Sin apellido',
          email: row.email || '',
          phone: row.telefono || row.phone || '',
          country: 'Argentina',
        })
        .select()
        .single()

      if (guest) {
        await supabase
          .from('reservations')
          .insert({
            tenant_id: tenant.id,
            reservation_code: generateCode(),
            guest_id: guest.id,
            unit_id: units[0]?.id,
            check_in: row.checkIn || new Date().toISOString().split('T')[0],
            check_out: row.checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0],
            status: 'booked',
            source: 'csv_import',
          })
        
        successCount++
      }
    }

    if (successCount > 0) {
      onSaved()
      onClose()
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Importar CSV</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium text-gray-700 mb-2">
              Arrastrá un archivo CSV o hacé clic para seleccionar
            </p>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <Button type="button" variant="outline" onClick={() => document.getElementById('csv-upload')?.click()}>
              Seleccionar Archivo
            </Button>
          </div>

          {preview.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Previsualización ({preview.length} reservas)
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Nombre</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Check-in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((row, index) => (
                      <tr key={index} className="border-t border-gray-200">
                        <td className="px-4 py-2">{row.nombre || row.firstName || '—'}</td>
                        <td className="px-4 py-2">{row.email || '—'}</td>
                        <td className="px-4 py-2">{row.checkIn || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 5 && (
                  <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500">
                    ... y {preview.length - 5} más
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleImport} disabled={loading} className="flex-1">
                  {loading ? 'Importando...' : `Importar ${preview.length} Reservas`}
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
'@

$csvImport | Out-File -FilePath "src\components\reservations\CSVImport.tsx" -Encoding UTF8 -Force
Write-Host "✓ Importador CSV creado" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   ✅ Sistema de reservas creado!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Recargá: http://localhost:3000/centroelprogreso/admin/reservations" -ForegroundColor Cyan