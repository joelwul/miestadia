Write-Host "🚀 Creando sistema de reservas (versión estable)..." -ForegroundColor Cyan

$root = Get-Location

# Solo actualizar lo esencial - página principal simplificada
$pageContent = @'
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Filter, Edit2, MessageCircle, CheckCircle, XCircle } from 'lucide-react'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default function ReservationsPage({ params }: Props) {
  const [tenantSlug, setTenantSlug] = useState('')
  const [reservations, setReservations] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params
      setTenantSlug(resolvedParams.tenantSlug)
      await loadReservations(resolvedParams.tenantSlug)
    }
    init()
  }, [params])

  async function loadReservations(slug: string) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!tenant) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('reservations')
      .select(`*, guests (first_name, last_name, email, phone), units (name)`)
      .eq('tenant_id', tenant.id)
      .order('check_in', { ascending: false })

    if (data) setReservations(data)
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('reservations').update({ status }).eq('id', id)
    loadReservations(tenantSlug)
  }

  const filtered = reservations.filter(r => {
    const matchesSearch = !searchTerm || 
      r.reservation_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.guests?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.guests?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const stats = {
    today: reservations.filter(r => r.check_in === new Date().toISOString().split('T')[0]).length,
    upcoming: reservations.filter(r => r.check_in > new Date().toISOString().split('T')[0] && r.status === 'booked').length,
    pending: reservations.filter(r => r.status === 'pre_checkin').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reservas</h1>
          <p className="text-gray-500 mt-1">Gestioná las reservas de tu alojamiento</p>
        </div>
        <Button size="lg" onClick={() => alert('Próximamente: formulario de creación')}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Reserva
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Llegadas hoy</p><p className="text-3xl font-bold">{stats.today}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Próximas</p><p className="text-3xl font-bold">{stats.upcoming}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Pre check-in</p><p className="text-3xl font-bold">{stats.pending}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por código, nombre o email..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">Todos los estados</option>
              <option value="booked">Confirmadas</option>
              <option value="pre_checkin">Pre check-in</option>
              <option value="checked_in">Alojados</option>
              <option value="checked_out">Finalizadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>

          {loading ? (
            <p className="text-center py-8 text-gray-500">Cargando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No hay reservas</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((r) => (
                <div key={r.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{r.guests?.first_name} {r.guests?.last_name}</span>
                        <Badge variant={r.status === 'booked' ? 'info' : r.status === 'pre_checkin' ? 'warning' : 'default'}>
                          {r.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{r.units?.name} • {r.reservation_code}</p>
                      <p className="text-xs text-gray-500">{r.guests?.email} • {r.guests?.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">📥 {new Date(r.check_in).toLocaleDateString('es-AR')}</p>
                      <p className="text-sm text-gray-500">📤 {new Date(r.check_out).toLocaleDateString('es-AR')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
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
Write-Host "✅ Página de reservas creada (versión ligera)" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora ejecutá: npm run dev" -ForegroundColor Cyan