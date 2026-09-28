Write-Host "🔄 Actualizando reservas con filtros..." -ForegroundColor Cyan

$pageContent = @'
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Filter, Edit2, MessageCircle, CheckCircle, XCircle, Calendar, Clock, AlertCircle, Users } from 'lucide-react'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default function ReservationsPage({ params }: Props) {
  const [tenantSlug, setTenantSlug] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [reservations, setReservations] = useState<any[]>([])
  const [filteredReservations, setFilteredReservations] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [unitFilter, setUnitFilter] = useState('all')
  
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
      .select('id')
      .eq('slug', slug)
      .single()

    if (!tenant) {
      setLoading(false)
      return
    }

    setTenantId(tenant.id)

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reservas</h1>
          <p className="text-gray-500 mt-1">Gestioná las reservas de tu alojamiento</p>
        </div>
        <Button size="lg" onClick={() => alert('Próximamente')}>
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
                        </div>
                        <p className="text-sm text-gray-600 mt-1">🏠 {r.units?.name} • 📋 {r.reservation_code}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>📧 {r.guests?.email || 'Sin email'}</span>
                          <span>📱 {r.guests?.phone || 'Sin teléfono'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-gray-900"> {new Date(r.check_in).toLocaleDateString('es-AR')}</p>
                      <p className="text-sm text-gray-500">📤 {new Date(r.check_out).toLocaleDateString('es-AR')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => alert('Editar: ' + r.reservation_code)}>
                      <Edit2 className="mr-1 h-3 w-3" /> Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => alert('WhatsApp a: ' + r.guests?.phone)}>
                      <MessageCircle className="mr-1 h-3 w-3" /> WhatsApp
                    </Button>
                    {r.status === 'booked' && (
                      <Button size="sm" onClick={() => updateStatus(r.id, 'pre_checkin')}>Pre Check-in</Button>
                    )}
                    {r.status === 'pre_checkin' && (
                      <Button size="sm" onClick={() => updateStatus(r.id, 'checked_in')}><CheckCircle className="mr-1 h-3 w-3" /> Check-in</Button>
                    )}
                    {r.status === 'checked_in' && (
                      <Button size="sm" variant="secondary" onClick={() => updateStatus(r.id, 'checked_out')}><XCircle className="mr-1 h-3 w-3" /> Check-out</Button>
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
    </div>
  )
}
'@

$pageContent | Out-File -FilePath "$root\src\app\(admin)\[tenantSlug]\admin\reservations\page.tsx" -Encoding UTF8 -Force
Write-Host "✅ Reservas actualizada con filtros completos" -ForegroundColor Green
Write-Host ""
Write-Host "Recargá: http://localhost:3000/centroelprogreso/admin/reservations" -ForegroundColor Cyan