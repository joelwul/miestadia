'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, Eye, Users, FileText } from 'lucide-react'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default function PreCheckinsPage({ params }: Props) {
  const [tenantSlug, setTenantSlug] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [preCheckins, setPreCheckins] = useState<any[]>([])
  const [selectedPreCheckin, setSelectedPreCheckin] = useState<any>(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params
      setTenantSlug(resolvedParams.tenantSlug)
      
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', resolvedParams.tenantSlug)
        .single()

      if (tenant) {
        setTenantId(tenant.id)
        await loadPreCheckins(tenant.id)
      }
    }
    init()
  }, [params])

  async function loadPreCheckins(tid: string) {
    let query = supabase
      .from('pre_checkins')
      .select(`
        *,
        reservations (reservation_code, check_in, check_out, units (name)),
        guests (first_name, last_name, email, phone)
      `)
      .eq('tenant_id', tid)
      .order('created_at', { ascending: false })

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus)
    }

    const { data } = await query
    if (data) setPreCheckins(data)
    setLoading(false)
  }

  useEffect(() => {
    if (tenantId) {
      setLoading(true)
      loadPreCheckins(tenantId)
    }
  }, [filterStatus, tenantId])

  async function markAsReviewed(id: string) {
    await supabase
      .from('pre_checkins')
      .update({ status: 'reviewed' })
      .eq('id', id)
    await loadPreCheckins(tenantId)
  }

  function getStatusBadge(status: string) {
    const config: any = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Completado', color: 'bg-blue-100 text-blue-800' },
      reviewed: { label: 'Revisado', color: 'bg-green-100 text-green-800' },
    }
    const c = config[status] || config.pending
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.color}`}>{c.label}</span>
  }

  const stats = {
    pending: preCheckins.filter(p => p.status === 'pending').length,
    completed: preCheckins.filter(p => p.status === 'completed').length,
    reviewed: preCheckins.filter(p => p.status === 'reviewed').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pre-Checkins</h1>
        <p className="text-gray-500 mt-1">Gestioná los pre-checkins de tus huéspedes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Pendientes</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Completados</p>
            <p className="text-3xl font-bold text-blue-600">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Revisados</p>
            <p className="text-3xl font-bold text-green-600">{stats.reviewed}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filtros</CardTitle>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-10 px-3 border border-gray-300 rounded-lg bg-white"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="completed">Completados</option>
              <option value="reviewed">Revisados</option>
            </select>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{preCheckins.length} pre-checkins</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-12 text-gray-500">Cargando...</p>
          ) : preCheckins.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No hay pre-checkins</p>
            </div>
          ) : (
            <div className="space-y-3">
              {preCheckins.map((pc) => (
                <div key={pc.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">
                            {pc.guests?.first_name} {pc.guests?.last_name}
                          </p>
                          {getStatusBadge(pc.status)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          🏠 {pc.reservations?.units?.name} • 📋 {pc.reservations?.reservation_code}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>📧 {pc.guests?.email || 'Sin email'}</span>
                          <span>📱 {pc.guests?.phone || 'Sin teléfono'}</span>
                          {pc.arrival_time && <span>🕐 Llega: {pc.arrival_time}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-gray-900">
                        📅 {new Date(pc.reservations?.check_in).toLocaleDateString('es-AR')}
                      </p>
                      <p className="text-sm text-gray-500">
                        📅 {new Date(pc.reservations?.check_out).toLocaleDateString('es-AR')}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => setSelectedPreCheckin(pc)}
                      >
                        <Eye className="mr-1 h-3 w-3" /> Ver detalles
                      </Button>
                      {pc.status === 'completed' && (
                        <Button
                          size="sm"
                          className="mt-2 ml-2"
                          onClick={() => markAsReviewed(pc.id)}
                        >
                          <CheckCircle className="mr-1 h-3 w-3" /> Marcar revisado
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPreCheckin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Detalles del Pre-Checkin</h2>
              <button onClick={() => setSelectedPreCheckin(null)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Datos Personales</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-500">Nombre</p><p className="font-medium">{selectedPreCheckin.guests?.first_name} {selectedPreCheckin.guests?.last_name}</p></div>
                  <div><p className="text-gray-500">Email</p><p className="font-medium">{selectedPreCheckin.guests?.email || '—'}</p></div>
                  <div><p className="text-gray-500">Teléfono</p><p className="font-medium">{selectedPreCheckin.guests?.phone || '—'}</p></div>
                  <div><p className="text-gray-500">Documento</p><p className="font-medium">{selectedPreCheckin.document_type || '—'} {selectedPreCheckin.document_number || ''}</p></div>
                  <div><p className="text-gray-500">Fecha de Nacimiento</p><p className="font-medium">{selectedPreCheckin.birth_date || '—'}</p></div>
                  <div><p className="text-gray-500">Nacionalidad</p><p className="font-medium">{selectedPreCheckin.nationality || '—'}</p></div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Datos de Llegada</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-500">Hora de llegada</p><p className="font-medium">{selectedPreCheckin.arrival_time || '—'}</p></div>
                  <div><p className="text-gray-500">Transporte</p><p className="font-medium">{selectedPreCheckin.transport_type || '—'}</p></div>
                  {selectedPreCheckin.vehicle_plate && <div><p className="text-gray-500">Patente</p><p className="font-medium">{selectedPreCheckin.vehicle_plate}</p></div>}
                  <div><p className="text-gray-500">Acompañantes</p><p className="font-medium">{selectedPreCheckin.companion_count || 0}</p></div>
                </div>
                {selectedPreCheckin.companions?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Nombres:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedPreCheckin.companions.map((c: string, i: number) => (
                        <Badge key={i} variant="secondary">{c}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Preferencias</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Tipo de cama</span><span className="font-medium">{selectedPreCheckin.bed_preference || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Cama extra</span><span className="font-medium">{selectedPreCheckin.extra_bed ? 'Sí' : 'No'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Cuna</span><span className="font-medium">{selectedPreCheckin.crib ? 'Sí' : 'No'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Mascotas</span><span className="font-medium">{selectedPreCheckin.pets ? 'Sí' : 'No'}</span></div>
                  {selectedPreCheckin.allergies && <div className="flex justify-between"><span className="text-gray-500">Alergias</span><span className="font-medium text-red-600">{selectedPreCheckin.allergies}</span></div>}
                  {selectedPreCheckin.observations && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">Observaciones:</p>
                      <p className="text-sm text-gray-700">{selectedPreCheckin.observations}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                {selectedPreCheckin.status === 'completed' && (
                  <Button className="flex-1" onClick={() => { markAsReviewed(selectedPreCheckin.id); setSelectedPreCheckin(null); }}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Marcar como Revisado
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedPreCheckin(null)}>Cerrar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}