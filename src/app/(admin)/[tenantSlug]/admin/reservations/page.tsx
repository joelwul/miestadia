'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Filter, Edit2, MessageCircle, CheckCircle, XCircle, Users, Upload, FileText, X, LogIn, LogOut, DollarSign, History, Link2, QrCode, Copy, Download } from 'lucide-react'
import AddReservationModal from '@/components/reservations/AddReservationModal'
import ReservationSuccessModal from '@/components/reservations/ReservationSuccessModal'
import CSVImport from '@/components/reservations/CSVImport'
import TextParser from '@/components/reservations/TextParser'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

interface CheckinModalData {
  type: 'checkin' | 'checkout'
  reservation: any
  performedBy: string
  notes: string
  keysDelivered: boolean
  unitCondition: string
  paymentReceived: number
  paymentMethod: string
}

export default function ReservationsPage({ params }: Props) {
  const [tenantSlug, setTenantSlug] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [tenantSettings, setTenantSettings] = useState<any>({})
  const [reservations, setReservations] = useState<any[]>([])
  const [filteredReservations, setFilteredReservations] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [unitFilter, setUnitFilter] = useState('all')
  const [editingReservation, setEditingReservation] = useState<any>(null)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<any>(null)
  const [whatsappMessage, setWhatsappMessage] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [addModalType, setAddModalType] = useState<'manual' | 'csv' | 'text' | null>(null)
  const [createdReservation, setCreatedReservation] = useState<any>(null)
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [checkinData, setCheckinData] = useState<CheckinModalData | null>(null)
  const [checkinLoading, setCheckinLoading] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historyReservation, setHistoryReservation] = useState<any>(null)
  const [historyLogs, setHistoryLogs] = useState<any[]>([])
  
  // NUEVO: Modal de Link/QR
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkReservation, setLinkReservation] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params
      setTenantSlug(resolvedParams.tenantSlug)
      await loadData(resolvedParams.tenantSlug)
    }
    init()
  }, [params])

  useEffect(() => {
    applyFilters()
  }, [reservations, searchTerm, statusFilter, dateFrom, dateTo, unitFilter])

  async function loadData(slug: string) {
    setLoading(true)
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, settings')
      .eq('slug', slug)
      .single()
    if (!tenant) {
      setLoading(false)
      return
    }
    setTenantId(tenant.id)
    setTenantSettings(tenant.settings || {})
    const { data: unitsData } = await supabase
      .from('units')
      .select('id, name')
      .eq('tenant_id', tenant.id)
      .eq('status', 'active')
    if (unitsData) setUnits(unitsData)
    const { data } = await supabase
      .from('reservations')
      .select(`*, guests (first_name, last_name, email, phone), units (name, type)`)
      .eq('tenant_id', tenant.id)
      .order('check_in', { ascending: false })
    if (data) setReservations(data)
    setLoading(false)
  }

  function applyFilters() {
    let filtered = [...reservations]
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(r => 
        r.reservation_code?.toLowerCase().includes(term) ||
        r.guests?.first_name?.toLowerCase().includes(term) ||
        r.guests?.last_name?.toLowerCase().includes(term) ||
        r.guests?.email?.toLowerCase().includes(term)
      )
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter)
    }
    if (dateFrom) {
      filtered = filtered.filter(r => r.check_in >= dateFrom)
    }
    if (dateTo) {
      filtered = filtered.filter(r => r.check_in <= dateTo)
    }
    if (unitFilter !== 'all') {
      filtered = filtered.filter(r => r.unit_id === unitFilter)
    }
    setFilteredReservations(filtered)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('reservations').update({ status }).eq('id', id)
    loadData(tenantSlug)
  }

  function openCheckinModal(reservation: any, type: 'checkin' | 'checkout') {
    setCheckinData({
      type,
      reservation,
      performedBy: '',
      notes: '',
      keysDelivered: false,
      unitCondition: '',
      paymentReceived: 0,
      paymentMethod: 'cash',
    })
    setShowCheckinModal(true)
  }

  async function saveCheckin() {
    if (!checkinData) return
    setCheckinLoading(true)
    try {
      const { error: logError } = await supabase
        .from('checkin_logs')
        .insert({
          tenant_id: tenantId,
          reservation_id: checkinData.reservation.id,
          type: checkinData.type,
          performed_by: checkinData.performedBy || null,
          notes: checkinData.notes || null,
          keys_delivered: checkinData.keysDelivered,
          unit_condition: checkinData.unitCondition || null,
          payment_received: checkinData.paymentReceived || 0,
          payment_method: checkinData.paymentMethod || null,
        })
      if (logError) throw logError
      const newStatus = checkinData.type === 'checkin' ? 'checked_in' : 'checked_out'
      await supabase
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', checkinData.reservation.id)
      if (checkinData.paymentReceived > 0) {
        const currentPaid = checkinData.reservation.paid_amount || 0
        const newPaid = currentPaid + checkinData.paymentReceived
        const total = checkinData.reservation.total_amount || 0
        let paymentStatus = 'partial'
        if (newPaid >= total) paymentStatus = 'paid'
        await supabase
          .from('reservations')
          .update({
            paid_amount: newPaid,
            payment_status: paymentStatus,
            payment_method: checkinData.paymentMethod,
            paid_at: new Date().toISOString(),
          })
          .eq('id', checkinData.reservation.id)
      }
      setShowCheckinModal(false)
      setCheckinData(null)
      await loadData(tenantSlug)
      alert(`✅ ${checkinData.type === 'checkin' ? 'Check-in' : 'Check-out'} registrado correctamente`)
    } catch (err: any) {
      console.error('Error:', err)
      alert('Error: ' + err.message)
    } finally {
      setCheckinLoading(false)
    }
  }

  async function openHistory(reservation: any) {
    setHistoryReservation(reservation)
    setShowHistoryModal(true)
    const { data } = await supabase
      .from('checkin_logs')
      .select('*')
      .eq('reservation_id', reservation.id)
      .order('performed_at', { ascending: false })
    if (data) setHistoryLogs(data)
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editingReservation) return
    const total = parseFloat(editingReservation.total_amount) || 0
    const paid = parseFloat(editingReservation.paid_amount) || 0
    let paymentStatus = 'pending'
    if (paid > 0 && paid < total) paymentStatus = 'partial'
    if (paid >= total && total > 0) paymentStatus = 'paid'
    await supabase
      .from('reservations')
      .update({
        check_in: editingReservation.check_in,
        check_out: editingReservation.check_out,
        unit_id: editingReservation.unit_id,
        total_amount: total,
        paid_amount: paid,
        payment_status: paymentStatus,
        payment_method: editingReservation.payment_method || null,
      })
      .eq('id', editingReservation.id)
    await supabase
      .from('guests')
      .update({
        first_name: editingReservation.guests.first_name,
        last_name: editingReservation.guests.last_name,
        email: editingReservation.guests.email,
        phone: editingReservation.guests.phone,
      })
      .eq('id', editingReservation.guest_id)
    setEditingReservation(null)
    loadData(tenantSlug)
  }

  // NUEVA: Función para generar la URL de login del huésped
  function buildGuestLoginUrl(reservation: any): string {
    const code = reservation.reservation_code
    const lastName = encodeURIComponent(reservation.guests?.last_name || '')
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/${tenantSlug}?code=${code}&lastName=${lastName}`
    }
    return `/${tenantSlug}?code=${code}&lastName=${lastName}`
  }

  // NUEVA: Abrir modal de Link/QR
  function openLinkModal(reservation: any) {
    setLinkReservation(reservation)
    setShowLinkModal(true)
    setCopied(false)
  }

  // NUEVA: Copiar link al portapapeles
  function copyLinkToClipboard() {
    if (!linkReservation) return
    const url = buildGuestLoginUrl(linkReservation)
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // NUEVA: Descargar QR como imagen
  function downloadQR() {
    if (!linkReservation) return
    const url = buildGuestLoginUrl(linkReservation)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}&margin=10`
    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `qr-${linkReservation.reservation_code}.png`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function openWhatsApp(reservation: any) {
    setSelectedReservation(reservation)
    setShowWhatsAppModal(true)
    const guestName = reservation.guests?.first_name
    const checkIn = new Date(reservation.check_in).toLocaleDateString('es-AR')
    const checkOut = new Date(reservation.check_out).toLocaleDateString('es-AR')
    const unitName = reservation.units?.name
    const loginUrl = buildGuestLoginUrl(reservation)
    let defaultMessage = ''
    if (reservation.status === 'booked') {
      defaultMessage = `¡Hola ${guestName}! 👋\n\nTu reserva en ${tenantSlug} está confirmada:\n📅 Check-in: ${checkIn}\n📅 Check-out: ${checkOut}\n🏠 Unidad: ${unitName}\n\nCódigo de reserva: ${reservation.reservation_code}\n\n👉 Accedé a tu panel de huésped:\n${loginUrl}\n\n¡Esperamos que disfrutes tu estadía!`
    } else if (reservation.status === 'pre_checkin') {
      defaultMessage = `¡Hola ${guestName}! 👋\n\nYa casi es tiempo de tu llegada:\n📅 Check-in: ${checkIn}\n🏠 ${unitName}\n\n👉 Completá tu pre-checkin y accedé a toda la info:\n${loginUrl}\n\n¿Tenés alguna consulta? Estamos acá para ayudarte.`
    } else if (reservation.status === 'checked_in') {
      defaultMessage = `¡Hola ${guestName}! 👋\n\nEsperamos que estés disfrutando tu estadía en ${tenantSlug}.\n\n👉 Accedé a tu panel para ver info útil, clima, lugares recomendados y más:\n${loginUrl}\n\n¿Necesitás algo? Estamos a tu disposición.\n\n¡Que la pases genial!`
    } else {
      defaultMessage = `¡Hola ${guestName}! \n\nGracias por elegirnos.\n\nEsperamos que hayas disfrutado tu estadía.\n\n¡Te esperamos la próxima!`
    }
    setWhatsappMessage(defaultMessage)
  }

  function sendWhatsApp() {
    if (!selectedReservation || !whatsappMessage) return
    const phone = selectedReservation.guests?.phone?.replace(/\D/g, '') || ''
    if (!phone) {
      alert('El huésped no tiene teléfono registrado')
      return
    }
    const encodedMessage = encodeURIComponent(whatsappMessage)
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank')
    setShowWhatsAppModal(false)
    setSelectedReservation(null)
  }

  function resetFilters() {
    setSearchTerm('')
    setStatusFilter('all')
    setDateFrom('')
    setDateTo('')
    setUnitFilter('all')
  }

  const stats = {
    today: reservations.filter(r => r.check_in === new Date().toISOString().split('T')[0]).length,
    upcoming: reservations.filter(r => r.check_in > new Date().toISOString().split('T')[0] && r.status === 'booked').length,
    pending: reservations.filter(r => r.status === 'pre_checkin').length,
    total: reservations.length,
  }

  const whatsappTemplates = [
    {
      name: 'Pre Check-in (Confirmación)',
      template: (r: any) => {
        const loginUrl = buildGuestLoginUrl(r)
        return `¡Hola ${r.guests?.first_name}! 👋\n\nTu reserva en ${tenantSlug} está confirmada:\n📅 Check-in: ${new Date(r.check_in).toLocaleDateString('es-AR')}\n📅 Check-out: ${new Date(r.check_out).toLocaleDateString('es-AR')}\n🏠 Unidad: ${r.units?.name}\n\nCódigo de reserva: ${r.reservation_code}\n\n👉 Accedé a tu panel de huésped:\n${loginUrl}\n\n¡Esperamos que disfrutes tu estadía!`
      }
    },
    {
      name: 'Pre Check-in (Recordatorio)',
      template: (r: any) => {
        const loginUrl = buildGuestLoginUrl(r)
        return `¡Hola ${r.guests?.first_name}! 👋\n\nTe recordamos tu reserva:\n📅 Check-in: ${new Date(r.check_in).toLocaleDateString('es-AR')}\n ${r.units?.name}\n\n Completá tu pre-checkin y accedé a toda la info:\n${loginUrl}\n\n¿Tenés alguna consulta? Estamos acá para ayudarte.`
      }
    },
    {
      name: 'Durante la Estadía',
      template: (r: any) => {
        const loginUrl = buildGuestLoginUrl(r)
        return `¡Hola ${r.guests?.first_name}! 👋\n\nEsperamos que estés disfrutando tu estadía en ${tenantSlug}.\n\n Accedé a tu panel para ver info útil, clima, lugares recomendados y más:\n${loginUrl}\n\n¿Necesitás algo? Estamos a tu disposición.\n\n¡Que la pases genial!`
      }
    },
    {
      name: 'Post Check-out (Gracias)',
      template: (r: any) => `¡Hola ${r.guests?.first_name}! 👋\n\nGracias por elegirnos.\n\nEsperamos que hayas disfrutado tu estadía.\n\n¡Te esperamos la próxima!`
    },
    {
      name: 'Post Check-out (Reseña)',
      template: (r: any) => `¡Hola ${r.guests?.first_name}! 👋\n\nGracias por tu visita.\n\n¿Podrías dejarnos una reseña en Google? Nos ayudaría mucho:\n\n${tenantSettings?.reviewUrl || '[Link de reseña]'}\n\n¡Gracias!`
    }
  ]

  function closeAddModals() {
    setShowAddModal(false)
    setAddModalType(null)
  }

  function getPaymentBadge(status: string, total: number, paid: number) {
    if (!total || total === 0) return <Badge variant="outline" className="text-xs">Sin monto</Badge>
    if (status === 'paid') return <Badge className="bg-green-600 text-xs">Pagado</Badge>
    if (status === 'partial') return <Badge className="bg-yellow-600 text-xs">${paid} / ${total}</Badge>
    return <Badge variant="destructive" className="text-xs">Pendiente ${total}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reservas</h1>
          <p className="text-gray-500 mt-1">Gestioná las reservas de tu alojamiento</p>
        </div>
        <Button size="lg" onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Reserva
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Llegadas hoy</p><p className="text-3xl font-bold">{stats.today}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Próximas</p><p className="text-3xl font-bold">{stats.upcoming}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Pre check-in</p><p className="text-3xl font-bold">{stats.pending}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Total</p><p className="text-3xl font-bold">{stats.total}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
              <CardDescription>Buscá y filtrá reservas</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Limpiar filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Código, nombre, email..."
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Estado</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white"
              >
                <option value="all">Todos</option>
                <option value="booked">Confirmadas</option>
                <option value="pre_checkin">Pre check-in</option>
                <option value="checked_in">Alojados</option>
                <option value="checked_out">Finalizadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Check-in desde</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Check-in hasta</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
          <div className="mt-3">
            <label className="text-xs text-gray-500 mb-1 block">Unidad</label>
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white"
            >
              <option value="all">Todas las unidades</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {filteredReservations.length} {filteredReservations.length === 1 ? 'reserva encontrada' : 'reservas encontradas'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-12 text-gray-500">Cargando...</p>
          ) : filteredReservations.length === 0 ? (
            <p className="text-center py-12 text-gray-500">No hay reservas que coincidan</p>
          ) : (
            <div className="space-y-3">
              {filteredReservations.map((r) => (
                <div key={r.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{r.guests?.first_name} {r.guests?.last_name}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            r.status === 'booked' ? 'bg-blue-100 text-blue-800' :
                            r.status === 'pre_checkin' ? 'bg-yellow-100 text-yellow-800' :
                            r.status === 'checked_in' ? 'bg-green-100 text-green-800' :
                            r.status === 'checked_out' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>{r.status}</span>
                          {getPaymentBadge(r.payment_status, r.total_amount, r.paid_amount)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1"> {r.units?.name} • {r.reservation_code}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span> {r.guests?.email || 'Sin email'}</span>
                          <span> {r.guests?.phone || 'Sin teléfono'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-gray-900">📥 {new Date(r.check_in).toLocaleDateString('es-AR')}</p>
                      <p className="text-sm text-gray-500">📤 {new Date(r.check_out).toLocaleDateString('es-AR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => setEditingReservation(r)}>
                      <Edit2 className="mr-1 h-3 w-3" /> Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openWhatsApp(r)}>
                      <MessageCircle className="mr-1 h-3 w-3" /> WhatsApp
                    </Button>
                    {/* NUEVO: Botón Link/QR */}
                    <Button size="sm" variant="outline" onClick={() => openLinkModal(r)} className="border-purple-300 text-purple-700 hover:bg-purple-50">
                      <QrCode className="mr-1 h-3 w-3" /> Link/QR
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openHistory(r)}>
                      <History className="mr-1 h-3 w-3" /> Historial
                    </Button>
                    {r.status === 'booked' && (
                      <Button size="sm" onClick={() => updateStatus(r.id, 'pre_checkin')}>Pre Check-in</Button>
                    )}
                    {r.status === 'pre_checkin' && (
                      <Button size="sm" onClick={() => openCheckinModal(r, 'checkin')}>
                        <LogIn className="mr-1 h-3 w-3" /> Check-in
                      </Button>
                    )}
                    {r.status === 'checked_in' && (
                      <Button size="sm" variant="secondary" onClick={() => openCheckinModal(r, 'checkout')}>
                        <LogOut className="mr-1 h-3 w-3" /> Check-out
                      </Button>
                    )}
                    {r.status !== 'cancelled' && r.status !== 'checked_out' && (
                      <Button size="sm" variant="destructive" onClick={() => { if(confirm('¿Cancelar?')) updateStatus(r.id, 'cancelled') }}>Cancelar</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* NUEVO: Modal de Link/QR */}
      {showLinkModal && linkReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <QrCode className="h-6 w-6 text-purple-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Link de acceso del huésped</h2>
                  <p className="text-sm text-gray-500">{linkReservation.guests?.first_name} {linkReservation.guests?.last_name}</p>
                </div>
              </div>
              <button onClick={() => setShowLinkModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(buildGuestLoginUrl(linkReservation))}&margin=10`}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>
              
              {/* Link */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">URL de acceso (código y apellido precargados)</label>
                <div className="flex gap-2">
                  <Input 
                    value={buildGuestLoginUrl(linkReservation)} 
                    readOnly 
                    className="text-xs font-mono bg-gray-50"
                  />
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={copyLinkToClipboard}
                    className="flex-shrink-0"
                  >
                    {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                {copied && <p className="text-xs text-green-600 mt-1">✅ Link copiado al portapapeles</p>}
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                   Al escanear el QR o abrir el link, el huésped ingresa directamente a su panel con su código y apellido ya cargados.
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <Button onClick={downloadQR} className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar QR
                </Button>
                <Button variant="outline" onClick={() => setShowLinkModal(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Check-in/Check-out */}
      {showCheckinModal && checkinData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {checkinData.type === 'checkin' ? (
                  <LogIn className="h-6 w-6 text-green-600" />
                ) : (
                  <LogOut className="h-6 w-6 text-orange-600" />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {checkinData.type === 'checkin' ? 'Registrar Check-in' : 'Registrar Check-out'}
                  </h2>
                  <p className="text-sm text-gray-500">{checkinData.reservation.guests?.first_name} {checkinData.reservation.guests?.last_name}</p>
                </div>
              </div>
              <button onClick={() => setShowCheckinModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <strong>Reserva:</strong> {checkinData.reservation.reservation_code} • {checkinData.reservation.units?.name}
                </p>
                <p className="text-sm text-blue-900">
                  <strong>Fechas:</strong> {new Date(checkinData.reservation.check_in).toLocaleDateString('es-AR')} → {new Date(checkinData.reservation.check_out).toLocaleDateString('es-AR')}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Quién atendió</label>
                  <Input
                    value={checkinData.performedBy}
                    onChange={(e) => setCheckinData({ ...checkinData, performedBy: e.target.value })}
                    placeholder="Nombre del staff"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    {checkinData.type === 'checkin' ? 'Entrega de llaves/código' : 'Devolución de llaves'}
                  </label>
                  <div className="flex items-center gap-2 h-10">
                    <input
                      type="checkbox"
                      checked={checkinData.keysDelivered}
                      onChange={(e) => setCheckinData({ ...checkinData, keysDelivered: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span className="text-sm text-gray-700">
                      {checkinData.type === 'checkin' ? 'Llaves entregadas' : 'Llaves devueltas'}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {checkinData.type === 'checkin' ? 'Estado inicial de la unidad' : 'Estado final de la unidad'}
                </label>
                <textarea
                  value={checkinData.unitCondition}
                  onChange={(e) => setCheckinData({ ...checkinData, unitCondition: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder={checkinData.type === 'checkin' ? 'Ej: Unidad en perfectas condiciones' : 'Ej: Todo en orden, sin daños'}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Observaciones</label>
                <textarea
                  value={checkinData.notes}
                  onChange={(e) => setCheckinData({ ...checkinData, notes: e.target.value })}
                  className="w-full min-h-[60px] px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Notas opcionales..."
                />
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Pago en este momento (opcional)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Monto cobrado</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={checkinData.paymentReceived}
                      onChange={(e) => setCheckinData({ ...checkinData, paymentReceived: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Medio de pago</label>
                    <select
                      value={checkinData.paymentMethod}
                      onChange={(e) => setCheckinData({ ...checkinData, paymentMethod: e.target.value })}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="cash">💵 Efectivo</option>
                      <option value="transfer">🏦 Transferencia</option>
                      <option value="card">💳 Tarjeta</option>
                      <option value="mercadopago"> Mercado Pago</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={saveCheckin} className="flex-1" disabled={checkinLoading}>
                  {checkinLoading ? 'Guardando...' : `Registrar ${checkinData.type === 'checkin' ? 'Check-in' : 'Check-out'}`}
                </Button>
                <Button variant="outline" onClick={() => setShowCheckinModal(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Historial */}
      {showHistoryModal && historyReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Historial de Check-in/Check-out</h2>
                <p className="text-sm text-gray-500">{historyReservation.guests?.first_name} {historyReservation.guests?.last_name}</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              {historyLogs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay registros de check-in/check-out</p>
              ) : (
                <div className="space-y-3">
                  {historyLogs.map((log) => (
                    <div key={log.id} className={`border rounded-lg p-4 ${log.type === 'checkin' ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {log.type === 'checkin' ? (
                            <LogIn className="h-5 w-5 text-green-600" />
                          ) : (
                            <LogOut className="h-5 w-5 text-orange-600" />
                          )}
                          <span className="font-semibold text-gray-900">
                            {log.type === 'checkin' ? 'Check-in' : 'Check-out'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(log.performed_at).toLocaleString('es-AR')}
                        </span>
                      </div>
                      {log.performed_by && <p className="text-sm text-gray-700">👤 {log.performed_by}</p>}
                      {log.notes && <p className="text-sm text-gray-700">📝 {log.notes}</p>}
                      {log.keys_delivered && <p className="text-sm text-gray-700">🔑 Llaves entregadas/devueltas</p>}
                      {log.unit_condition && <p className="text-sm text-gray-700">🏠 {log.unit_condition}</p>}
                      {log.payment_received > 0 && (
                        <p className="text-sm text-green-700 font-medium">
                           Cobrado: ${log.payment_received} ({log.payment_method})
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {editingReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Editar Reserva</h2>
              <button onClick={() => setEditingReservation(null)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleEditSave} className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Datos del Huésped</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Nombre</label>
                    <Input 
                      value={editingReservation.guests?.first_name || ''} 
                      onChange={(e) => setEditingReservation({
                        ...editingReservation,
                        guests: { ...editingReservation.guests, first_name: e.target.value }
                      })} 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Apellido</label>
                    <Input 
                      value={editingReservation.guests?.last_name || ''} 
                      onChange={(e) => setEditingReservation({
                        ...editingReservation,
                        guests: { ...editingReservation.guests, last_name: e.target.value }
                      })} 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Email</label>
                    <Input 
                      type="email"
                      value={editingReservation.guests?.email || ''} 
                      onChange={(e) => setEditingReservation({
                        ...editingReservation,
                        guests: { ...editingReservation.guests, email: e.target.value }
                      })} 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Teléfono</label>
                    <Input 
                      value={editingReservation.guests?.phone || ''} 
                      onChange={(e) => setEditingReservation({
                        ...editingReservation,
                        guests: { ...editingReservation.guests, phone: e.target.value }
                      })} 
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Detalles de la Reserva</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Unidad</label>
                    <select
                      value={editingReservation.unit_id || ''}
                      onChange={(e) => setEditingReservation({ ...editingReservation, unit_id: e.target.value })}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="">Seleccionar</option>
                      {units.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">Check-in</label>
                      <Input 
                        type="date" 
                        value={editingReservation.check_in?.split('T')[0] || ''} 
                        onChange={(e) => setEditingReservation({ ...editingReservation, check_in: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Check-out</label>
                      <Input 
                        type="date" 
                        value={editingReservation.check_out?.split('T')[0] || ''} 
                        onChange={(e) => setEditingReservation({ ...editingReservation, check_out: e.target.value })} 
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Gestión de Pagos
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Monto Total</label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={editingReservation.total_amount || 0} 
                      onChange={(e) => setEditingReservation({ ...editingReservation, total_amount: parseFloat(e.target.value) || 0 })} 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Monto Pagado</label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={editingReservation.paid_amount || 0} 
                      onChange={(e) => setEditingReservation({ ...editingReservation, paid_amount: parseFloat(e.target.value) || 0 })} 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500">Medio de Pago</label>
                    <select
                      value={editingReservation.payment_method || ''}
                      onChange={(e) => setEditingReservation({ ...editingReservation, payment_method: e.target.value })}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="">Seleccionar</option>
                      <option value="cash">💵 Efectivo</option>
                      <option value="transfer">🏦 Transferencia</option>
                      <option value="card">💳 Tarjeta</option>
                      <option value="mercadopago">📱 Mercado Pago</option>
                    </select>
                  </div>
                </div>
                {editingReservation.total_amount > 0 && (
                  <div className="mt-3 p-2 bg-white rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Saldo pendiente:</span>
                      <span className={`font-semibold ${(editingReservation.total_amount - (editingReservation.paid_amount || 0)) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${((editingReservation.total_amount || 0) - (editingReservation.paid_amount || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">Guardar Cambios</Button>
                <Button type="button" variant="outline" onClick={() => setEditingReservation(null)}>Cancelar</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de WhatsApp */}
      {showWhatsAppModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Enviar WhatsApp</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedReservation.guests?.first_name} {selectedReservation.guests?.last_name}</p>
              </div>
              <button onClick={() => setShowWhatsAppModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Plantillas de mensajes</h3>
                <div className="space-y-2">
                  {whatsappTemplates.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => setWhatsappMessage(template.template(selectedReservation))}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <p className="font-medium text-sm text-gray-900">{template.name}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Mensaje</h3>
                <textarea
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  className="w-full min-h-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="Escribí tu mensaje..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={sendWhatsApp} className="flex-1">
                  Enviar por WhatsApp
                </Button>
                <Button variant="outline" onClick={() => setShowWhatsAppModal(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Selección de Tipo de Carga */}
      {showAddModal && !addModalType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Agregar Reserva</h2>
              <p className="text-gray-500 mt-1">Elegí cómo querés crear la reserva</p>
            </div>
            <div className="p-6 space-y-4">
              <button
                onClick={() => setAddModalType('manual')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
              >
                <div className="bg-green-100 p-3 rounded-lg">
                  <Plus className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Carga Manual</p>
                  <p className="text-sm text-gray-500">Completar todos los datos manualmente</p>
                </div>
              </button>
              <button
                onClick={() => setAddModalType('csv')}
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
                onClick={() => setAddModalType('text')}
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
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Carga Manual */}
      {showAddModal && addModalType === 'manual' && tenantId && (
        <AddReservationModal
          tenantSlug={tenantSlug}
          tenantId={tenantId}
          onClose={closeAddModals}
          onCreated={(reservation) => {
            setCreatedReservation(reservation)
            closeAddModals()
            loadData(tenantSlug)
          }}
        />
      )}

      {/* Modal de Importar CSV */}
      {showAddModal && addModalType === 'csv' && tenantId && (
        <CSVImport
          tenantSlug={tenantSlug}
          tenantId={tenantId}
          onClose={closeAddModals}
          onImported={() => {
            closeAddModals()
            loadData(tenantSlug)
          }}
        />
      )}

      {/* Modal de Parser de Texto */}
      {showAddModal && addModalType === 'text' && tenantId && (
        <TextParser
          tenantSlug={tenantSlug}
          tenantId={tenantId}
          onClose={closeAddModals}
          onCreated={(reservation) => {
            setCreatedReservation(reservation)
            closeAddModals()
            loadData(tenantSlug)
          }}
        />
      )}

      {/* Modal de Éxito */}
      {createdReservation && (
        <ReservationSuccessModal
          reservation={createdReservation}
          tenantSlug={tenantSlug}
          onClose={() => {
            setCreatedReservation(null)
            loadData(tenantSlug)
          }}
        />
      )}
    </div>
  )
}