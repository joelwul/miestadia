Write-Host "📊 Actualizando Dashboard..." -ForegroundColor Cyan

$dashboardContent = @'
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, Bed, TrendingUp, Clock, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default function AdminDashboardPage({ params }: Props) {
  const [tenantSlug, setTenantSlug] = useState('')
  const [stats, setStats] = useState({
    todayArrivals: 0,
    todayDepartures: 0,
    currentGuests: 0,
    pendingRequests: 0,
    upcomingReservations: 0,
  })
  const [upcomingArrivals, setUpcomingArrivals] = useState<any[]>([])
  const [currentStays, setCurrentStays] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params
      setTenantSlug(resolvedParams.tenantSlug)
      await loadData(resolvedParams.tenantSlug)
    }
    init()
  }, [params])

  async function loadData(slug: string) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!tenant) {
      setLoading(false)
      return
    }

    const today = new Date().toISOString().split('T')[0]

    const { data: todayArrivals } = await supabase
      .from('reservations')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('check_in', today)
      .in('status', ['booked', 'pre_checkin'])

    const { data: todayDepartures } = await supabase
      .from('reservations')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('check_out', today)
      .eq('status', 'checked_in')

    const { data: currentGuests } = await supabase
      .from('reservations')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('status', 'checked_in')

    const { data: pendingRequests } = await supabase
      .from('service_requests')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('status', 'pending')

    const { data: upcoming } = await supabase
      .from('reservations')
      .select('id')
      .eq('tenant_id', tenant.id)
      .gt('check_in', today)
      .eq('status', 'booked')

    const { data: arrivals } = await supabase
      .from('reservations')
      .select(`*, guests (first_name, last_name), units (name)`)
      .eq('tenant_id', tenant.id)
      .gte('check_in', today)
      .in('status', ['booked', 'pre_checkin'])
      .order('check_in', { ascending: true })
      .limit(5)

    const { data: stays } = await supabase
      .from('reservations')
      .select(`*, guests (first_name, last_name), units (name)`)
      .eq('tenant_id', tenant.id)
      .eq('status', 'checked_in')
      .order('check_in', { ascending: true })
      .limit(5)

    setStats({
      todayArrivals: todayArrivals?.length || 0,
      todayDepartures: todayDepartures?.length || 0,
      currentGuests: currentGuests?.length || 0,
      pendingRequests: pendingRequests?.length || 0,
      upcomingReservations: upcoming?.length || 0,
    })

    setUpcomingArrivals(arrivals || [])
    setCurrentStays(stays || [])
    setLoading(false)
  }

  if (loading) {
    return <div className="p-8">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Resumen de tu alojamiento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Llegadas hoy</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.todayArrivals}</p>
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
                <p className="text-sm font-medium text-gray-500">Salidas hoy</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.todayDepartures}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Huéspedes alojados</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.currentGuests}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Próximas reservas</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.upcomingReservations}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Solicitudes pendientes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingRequests}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximas llegadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingArrivals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No hay llegadas próximas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingArrivals.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{r.guests?.first_name} {r.guests?.last_name}</p>
                        <p className="text-sm text-gray-500">{r.units?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{new Date(r.check_in).toLocaleDateString('es-AR')}</p>
                      <Badge variant={r.status === 'pre_checkin' ? 'warning' : 'info'} className="mt-1">
                        {r.status === 'pre_checkin' ? 'Pre check-in' : 'Confirmada'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Huéspedes alojados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentStays.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No hay huéspedes alojados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentStays.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-200 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-700" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{r.guests?.first_name} {r.guests?.last_name}</p>
                        <p className="text-sm text-gray-500">{r.units?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">Sale: {new Date(r.check_out).toLocaleDateString('es-AR')}</p>
                      <Badge variant="default" className="mt-1">Alojado</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
'@

$dashboardContent | Out-File -FilePath "src\app\(admin)\[tenantSlug]\admin\page.tsx" -Encoding UTF8 -Force
Write-Host "✅ Dashboard actualizado" -ForegroundColor Green