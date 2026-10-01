'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Plus,
  ArrowUpRight,
  Bed,
  UserCheck,
  UserPlus,
  BarChart3
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default function DashboardPage({ params }: Props) {
  const [tenantSlug, setTenantSlug] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [stats, setStats] = useState({
    todayArrivals: 0,
    todayDepartures: 0,
    currentGuests: 0,
    upcomingReservations: 0,
    pendingRequests: 0,
    totalReservations: 0,
    occupancyRate: 0,
  })
  const [upcomingArrivals, setUpcomingArrivals] = useState<any[]>([])
  const [currentGuests, setCurrentGuests] = useState<any[]>([])
  const [recentReservations, setRecentReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
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

    const today = new Date().toISOString().split('T')[0]

    const { data: arrivalsToday } = await supabase
      .from('reservations')
      .select(`*, guests (first_name, last_name), units (name)`)
      .eq('tenant_id', tenant.id)
      .eq('check_in', today)
      .neq('status', 'cancelled')

    const { data: departuresToday } = await supabase
      .from('reservations')
      .select(`*, guests (first_name, last_name), units (name)`)
      .eq('tenant_id', tenant.id)
      .eq('check_out', today)
      .neq('status', 'cancelled')

    const { data: currentGuestsData } = await supabase
      .from('reservations')
      .select(`*, guests (first_name, last_name), units (name)`)
      .eq('tenant_id', tenant.id)
      .lte('check_in', today)
      .gt('check_out', today)
      .neq('status', 'cancelled')

    const { data: upcomingData } = await supabase
      .from('reservations')
      .select(`*, guests (first_name, last_name), units (name)`)
      .eq('tenant_id', tenant.id)
      .gt('check_in', today)
      .neq('status', 'cancelled')
      .order('check_in', { ascending: true })
      .limit(10)

    const { count: totalReservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .neq('status', 'cancelled')

    const { data: activeUnits } = await supabase
      .from('units')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('status', 'active')

    const occupancyRate = activeUnits && activeUnits.length > 0 
      ? Math.round((currentGuestsData?.length || 0) / activeUnits.length * 100)
      : 0

    setStats({
      todayArrivals: arrivalsToday?.length || 0,
      todayDepartures: departuresToday?.length || 0,
      currentGuests: currentGuestsData?.length || 0,
      upcomingReservations: upcomingData?.length || 0,
      pendingRequests: 0,
      totalReservations: totalReservations || 0,
      occupancyRate,
    })

    setUpcomingArrivals(upcomingData?.slice(0, 5) || [])
    setCurrentGuests(currentGuestsData || [])
    setRecentReservations(upcomingData?.slice(0, 5) || [])
    setLoading(false)
  }

  function getStatusBadge(status: string) {
    const config: any = {
      booked: { label: 'Confirmada', color: 'bg-blue-100 text-blue-800' },
      pre_checkin: { label: 'Pre check-in', color: 'bg-yellow-100 text-yellow-800' },
      checked_in: { label: 'Alojado', color: 'bg-green-100 text-green-800' },
      checked_out: { label: 'Finalizada', color: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
    }
    const c = config[status] || config.booked
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.color}`}>{c.label}</span>
  }

  function navigateTo(path: string) {
    router.push(path)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Resumen de tu alojamiento</p>
        </div>
        <Button size="lg" onClick={() => navigateTo(`/${tenantSlug}/admin/reservations`)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Reserva
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Llegadas hoy</p>
                <p className="text-3xl font-bold mt-2">{stats.todayArrivals}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Salidas hoy</p>
                <p className="text-3xl font-bold mt-2">{stats.todayDepartures}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Huéspedes alojados</p>
                <p className="text-3xl font-bold mt-2">{stats.currentGuests}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Próximas reservas</p>
                <p className="text-3xl font-bold mt-2">{stats.upcomingReservations}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ocupación</p>
                <p className="text-3xl font-bold mt-2">{stats.occupancyRate}%</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Próximas llegadas
                </CardTitle>
                <CardDescription>Reservas confirmadas para los próximos días</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigateTo(`/${tenantSlug}/admin/reservations`)}>
                Ver todas
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingArrivals.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No hay próximas llegadas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingArrivals.map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {reservation.guests?.first_name} {reservation.guests?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{reservation.units?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(reservation.check_in).toLocaleDateString('es-AR')}
                      </p>
                      {getStatusBadge(reservation.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Huéspedes alojados
                </CardTitle>
                <CardDescription>Huéspedes actualmente en el alojamiento</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigateTo(`/${tenantSlug}/admin/reservations?status=checked_in`)}>
                Ver todos
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {currentGuests.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No hay huéspedes alojados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentGuests.map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-200 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-700" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {reservation.guests?.first_name} {reservation.guests?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{reservation.units?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        Sale: {new Date(reservation.check_out).toLocaleDateString('es-AR')}
                      </p>
                      <Badge className="bg-green-100 text-green-800">Alojado</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Acciones rápidas
          </CardTitle>
          <CardDescription>Accesos directos a las funciones más usadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2" onClick={() => navigateTo(`/${tenantSlug}/admin/reservations`)}>
              <Calendar className="h-6 w-6" />
              <span>Gestionar Reservas</span>
            </Button>
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2" onClick={() => navigateTo(`/${tenantSlug}/admin/units`)}>
              <Bed className="h-6 w-6" />
              <span>Ver Unidades</span>
            </Button>
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2" onClick={() => navigateTo(`/${tenantSlug}/admin/guests`)}>
              <Users className="h-6 w-6" />
              <span>Ver Huéspedes</span>
            </Button>
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center gap-2" onClick={() => navigateTo(`/${tenantSlug}/admin/settings`)}>
              <AlertCircle className="h-6 w-6" />
              <span>Configuración</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}