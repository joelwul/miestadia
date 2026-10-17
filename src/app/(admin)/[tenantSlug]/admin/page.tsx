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
  BarChart3,
  RefreshCw,
  Settings,
} from 'lucide-react'
import Link from 'next/link'

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
  const [refreshing, setRefreshing] = useState(false)
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
    setRefreshing(true)
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!tenant) {
      setLoading(false)
      setRefreshing(false)
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
    setRefreshing(false)
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
    <div className="space-y-4 lg:space-y-6">
      {/* Header con flex-wrap para móvil */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Resumen de tu alojamiento</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={() => loadData(tenantSlug)}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </Button>
          <Link href={`/${tenantSlug}/admin/reservations`}>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nueva Reserva</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats - 2 cols en móvil, 5 en desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        {[
          { label: 'Llegadas hoy', value: stats.todayArrivals, icon: Calendar, color: 'blue' },
          { label: 'Salidas hoy', value: stats.todayDepartures, icon: Clock, color: 'orange' },
          { label: 'Alojados', value: stats.currentGuests, icon: Users, color: 'green' },
          { label: 'Próximas', value: stats.upcomingReservations, icon: TrendingUp, color: 'purple' },
          { label: 'Ocupación', value: `${stats.occupancyRate}%`, icon: BarChart3, color: 'indigo' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-3 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs lg:text-sm text-gray-500 truncate">{stat.label}</p>
                    <p className="text-xl lg:text-3xl font-bold mt-1 lg:mt-2">{stat.value}</p>
                  </div>
                  <div className={`bg-${stat.color}-100 p-2 lg:p-3 rounded-lg flex-shrink-0`}>
                    <Icon className={`h-4 w-4 lg:h-6 lg:w-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content - 1 col en móvil, 2 en desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Próximas llegadas */}
        <Card>
          <CardHeader className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm lg:text-base flex items-center gap-2">
                  <UserPlus className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">Próximas llegadas</span>
                </CardTitle>
                <CardDescription className="text-xs hidden sm:block">Reservas confirmadas para los próximos días</CardDescription>
              </div>
              <Link href={`/${tenantSlug}/admin/reservations`}>
                <Button variant="ghost" size="sm" className="text-xs flex-shrink-0">
                  Ver todas
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4 lg:p-6 pt-0">
            {upcomingArrivals.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">No hay próximas llegadas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingArrivals.map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {reservation.guests?.first_name} {reservation.guests?.last_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{reservation.units?.name}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs font-medium text-gray-900">
                        {new Date(reservation.check_in).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                      </p>
                      {getStatusBadge(reservation.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Huéspedes alojados */}
        <Card>
          <CardHeader className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm lg:text-base flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Alojados ahora
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 lg:p-6 pt-0">
            {currentGuests.length === 0 ? (
              <div className="text-center py-6">
                <Users className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">Sin huéspedes alojados</p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentGuests.map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-9 w-9 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-green-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {reservation.guests?.first_name} {reservation.guests?.last_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{reservation.units?.name}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs font-medium text-gray-900">
                        Sale: {new Date(reservation.check_out).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas - 2 cols en móvil, 4 en desktop */}
      <Card>
        <CardHeader className="p-4 lg:p-6">
          <CardTitle className="text-sm lg:text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Acciones rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 lg:p-6 pt-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {[
              { href: `/${tenantSlug}/admin/reservations`, icon: Calendar, label: 'Reservas' },
              { href: `/${tenantSlug}/admin/units`, icon: Bed, label: 'Unidades' },
              { href: `/${tenantSlug}/admin/guests`, icon: Users, label: 'Huéspedes' },
              { href: `/${tenantSlug}/admin/settings`, icon: Settings, label: 'Config' },
            ].map((action, i) => {
              const Icon = action.icon
              return (
                <Link key={i} href={action.href}>
                  <Button variant="outline" className="w-full h-16 lg:h-20 flex flex-col items-center justify-center gap-1 lg:gap-2 text-xs lg:text-sm">
                    <Icon className="h-5 w-5 lg:h-6 lg:w-6" />
                    <span className="truncate">{action.label}</span>
                  </Button>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}