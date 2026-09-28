'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default function CalendarPage({ params }: Props) {
  const [tenantSlug, setTenantSlug] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [reservations, setReservations] = useState<any[]>([])
  const [units, setUnits] = useState<any[]>([])
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
        await loadData(tenant.id)
      }
    }
    init()
  }, [params])

  async function loadData(tid: string) {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).toISOString()
    const lastDay = new Date(year, month + 1, 0).toISOString()

    const [resData, unitData] = await Promise.all([
      supabase
        .from('reservations')
        .select(`*, guests (first_name, last_name), units (name)`)
        .eq('tenant_id', tid)
        .neq('status', 'cancelled')
        .lte('check_in', lastDay)
        .gte('check_out', firstDay),
      supabase
        .from('units')
        .select('id, name, type')
        .eq('tenant_id', tid)
        .eq('status', 'active')
        .order('name'),
    ])

    if (resData.data) setReservations(resData.data)
    if (unitData.data) setUnits(unitData.data)
    setLoading(false)
  }

  useEffect(() => {
    if (tenantId) loadData(tenantId)
  }, [currentDate, tenantId])

  function getDaysInMonth() {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    
    const days = []
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  function getReservationsForDay(unitId: string, date: Date) {
    const dateStr = date.toISOString().split('T')[0]
    return reservations.filter(r => {
      const checkIn = new Date(r.check_in)
      const checkOut = new Date(r.check_out)
      const current = new Date(dateStr)
      return r.unit_id === unitId && current >= checkIn && current < checkOut
    })
  }

  function getStatusColor(status: string) {
    const colors: any = {
      booked: 'bg-blue-200 text-blue-800',
      pre_checkin: 'bg-yellow-200 text-yellow-800',
      checked_in: 'bg-green-200 text-green-800',
      checked_out: 'bg-gray-200 text-gray-800',
    }
    return colors[status] || 'bg-gray-200 text-gray-800'
  }

  const days = getDaysInMonth()
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendario</h1>
          <p className="text-gray-500 mt-1">Vista mensual de reservas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Hoy
          </Button>
        </div>
      </div>

      {loading ? (
        <Card><CardContent className="p-12 text-center text-gray-500">Cargando...</CardContent></Card>
      ) : units.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-gray-500">No hay unidades activas</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header de unidades */}
                <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: `100px repeat(${days.length}, minmax(30px, 1fr))` }}>
                  <div className="text-xs font-medium text-gray-500">Unidad</div>
                  {days.map((day, i) => (
                    <div key={i} className={`text-center text-xs ${day ? 'text-gray-700' : ''}`}>
                      {day ? day.getDate() : ''}
                    </div>
                  ))}
                </div>

                {/* Filas de unidades */}
                {units.map(unit => (
                  <div key={unit.id} className="grid gap-2 mb-2 items-center" style={{ gridTemplateColumns: `100px repeat(${days.length}, minmax(30px, 1fr))` }}>
                    <div className="text-sm font-medium text-gray-900 truncate" title={unit.name}>
                      {unit.name}
                    </div>
                    {days.map((day, i) => {
                      if (!day) return <div key={i}></div>
                      const dayReservations = getReservationsForDay(unit.id, day)
                      const hasReservation = dayReservations.length > 0
                      const isToday = day.toDateString() === new Date().toDateString()
                      
                      return (
                        <div 
                          key={i} 
                          className={`h-8 rounded text-xs flex items-center justify-center cursor-pointer transition-colors ${
                            hasReservation 
                              ? getStatusColor(dayReservations[0].status)
                              : isToday 
                                ? 'bg-green-100 text-green-700 font-bold'
                                : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          title={hasReservation ? `${dayReservations[0].guests?.first_name} ${dayReservations[0].guests?.last_name}` : ''}
                        >
                          {hasReservation && dayReservations[0].guests?.first_name?.charAt(0)}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Leyenda */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Leyenda:</p>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-200"></span> Confirmada</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-200"></span> Pre check-in</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200"></span> Alojado</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200"></span> Finalizada</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de reservas del mes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Reservas de {monthNames[currentDate.getMonth()]} ({reservations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reservations.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No hay reservas este mes</p>
          ) : (
            <div className="space-y-2">
              {reservations.sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime()).map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-green-700">
                        {r.guests?.first_name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{r.guests?.first_name} {r.guests?.last_name}</p>
                      <p className="text-xs text-gray-500">{r.units?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">
                      {new Date(r.check_in).toLocaleDateString('es-AR')} → {new Date(r.check_out).toLocaleDateString('es-AR')}
                    </p>
                    <Badge className={`text-xs ${getStatusColor(r.status)}`}>
                      {r.status}
                    </Badge>
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