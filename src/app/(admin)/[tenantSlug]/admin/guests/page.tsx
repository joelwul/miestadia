'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Users, Mail, Phone, Calendar } from 'lucide-react'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default function GuestsPage({ params }: Props) {
  const [tenantSlug, setTenantSlug] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [guests, setGuests] = useState<any[]>([])
  const [filteredGuests, setFilteredGuests] = useState<any[]>([])
  const [search, setSearch] = useState('')
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
        await loadGuests(tenant.id)
      }
    }
    init()
  }, [params])

  async function loadGuests(tid: string) {
    const { data } = await supabase
      .from('guests')
      .select(`
        *,
        reservations (
          id,
          reservation_code,
          check_in,
          check_out,
          status,
          units (name)
        )
      `)
      .eq('tenant_id', tid)
      .order('created_at', { ascending: false })

    if (data) {
      setGuests(data)
      setFilteredGuests(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredGuests(guests)
    } else {
      const q = search.toLowerCase()
      setFilteredGuests(
        guests.filter(g => 
          g.first_name?.toLowerCase().includes(q) ||
          g.last_name?.toLowerCase().includes(q) ||
          g.email?.toLowerCase().includes(q) ||
          g.phone?.includes(q)
        )
      )
    }
  }, [search, guests])

  function getReservationsCount(guest: any) {
    return guest.reservations?.length || 0
  }

  function getLastReservation(guest: any) {
    if (!guest.reservations || guest.reservations.length === 0) return null
    return guest.reservations.sort((a: any, b: any) => 
      new Date(b.check_in).getTime() - new Date(a.check_in).getTime()
    )[0]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Huéspedes</h1>
          <p className="text-gray-500 mt-1">{guests.length} huéspedes registrados</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{filteredGuests.length} huéspedes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-12 text-gray-500">Cargando...</p>
          ) : filteredGuests.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No hay huéspedes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGuests.map((guest) => {
                const lastRes = getLastReservation(guest)
                return (
                  <div key={guest.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">
                            {guest.first_name} {guest.last_name}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            {guest.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {guest.email}
                              </span>
                            )}
                            {guest.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {guest.phone}
                              </span>
                            )}
                          </div>
                          {lastRes && (
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                <Calendar className="mr-1 h-3 w-3" />
                                Última: {new Date(lastRes.check_in).toLocaleDateString('es-AR')}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {getReservationsCount(guest)} reserva(s)
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}