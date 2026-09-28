'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Wifi, MessageCircle, FileText, CheckCircle, ClipboardList, AlertCircle } from 'lucide-react'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default function GuestStayPage({ params }: Props) {
  const [tenantSlug, setTenantSlug] = useState('')
  const [reservation, setReservation] = useState<any>(null)
  const [tenant, setTenant] = useState<any>(null)
  const [preCheckinCompleted, setPreCheckinCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params
      setTenantSlug(resolvedParams.tenantSlug)

      const sessionStr = localStorage.getItem('guest_session')
      
      if (!sessionStr) {
        setError('No hay sesión activa. Por favor, iniciá sesión nuevamente.')
        setLoading(false)
        return
      }

      try {
        const session = JSON.parse(sessionStr)
        
        if (session.expiresAt && Date.now() > session.expiresAt) {
          localStorage.removeItem('guest_session')
          setError('La sesión expiró. Por favor, iniciá sesión nuevamente.')
          setLoading(false)
          return
        }
        
        await loadStay(session.reservationId, resolvedParams.tenantSlug)
      } catch (e) {
        setError('Sesión inválida. Por favor, iniciá sesión nuevamente.')
        setLoading(false)
      }
    }
    init()
  }, [params])

  async function loadStay(reservationId: string, slug: string) {
    const { data: res, error: resError } = await supabase
      .from('reservations')
      .select(`*, guests (first_name, last_name, email, phone), units (name, type, description)`)
      .eq('id', reservationId)
      .single()

    if (resError || !res) {
      setError('No se pudo cargar la reserva')
      setLoading(false)
      return
    }

    setReservation(res)

    const { data: tenantData } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .single()

    setTenant(tenantData)

    if (res.status === 'booked') {
      await supabase
        .from('reservations')
        .update({ status: 'pre_checkin' })
        .eq('id', reservationId)
    }

    // Verificar si ya completó el pre-checkin
    const { data: existingPreCheckin } = await supabase
      .from('pre_checkins')
      .select('id, status')
      .eq('reservation_id', reservationId)
      .eq('status', 'completed')
      .maybeSingle()

    if (existingPreCheckin) {
      setPreCheckinCompleted(true)
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (error || !reservation || !tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error || 'No se encontró la reserva'}</p>
            <Button onClick={() => {
              localStorage.removeItem('guest_session')
              window.location.href = `/${tenantSlug}`
            }}>
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const settings = tenant.settings || {}
  const checkInDate = new Date(reservation.check_in)
  const checkOutDate = new Date(reservation.check_out)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-700 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">¡Hola, {reservation.guests?.first_name}!</h1>
          <p className="text-green-100 mt-1">{tenant.name}</p>
          <Badge className="mt-2 bg-white/20 text-white border-0">
            {reservation.status === 'pre_checkin' ? 'Pre Check-in' : reservation.status === 'checked_in' ? 'Alojado' : reservation.status}
          </Badge>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Tu reserva</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Unidad</p>
                <p className="font-medium">{reservation.units?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Check-in</p>
                <p className="font-medium">{checkInDate.toLocaleDateString('es-AR')} - {settings.checkInTime || '15:00'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Check-out</p>
                <p className="font-medium">{checkOutDate.toLocaleDateString('es-AR')} - {settings.checkOutTime || '10:00'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Código</p>
                <p className="font-medium font-mono">{reservation.reservation_code}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pre Check-in */}
          <Card className={preCheckinCompleted ? 'border-2 border-green-200 bg-green-50' : 'border-2 border-blue-200 bg-blue-50'}>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <ClipboardList className={`h-6 w-6 flex-shrink-0 ${preCheckinCompleted ? 'text-green-600' : 'text-blue-600'}`} />
                <div>
                  <h3 className={`font-semibold ${preCheckinCompleted ? 'text-green-900' : 'text-blue-900'}`}>Pre Check-in</h3>
                  <p className={`text-sm mt-1 ${preCheckinCompleted ? 'text-green-700' : 'text-blue-700'}`}>
                    {preCheckinCompleted ? 'Completado ✓' : 'Completá tus datos antes de llegar'}
                  </p>
                  <a href={`/${tenantSlug}/pre-checkin?code=${reservation.reservation_code}&lastName=${encodeURIComponent(reservation.guests?.last_name || '')}`}>
                    <Button className={`mt-3 ${preCheckinCompleted ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                      {preCheckinCompleted ? 'Editar' : 'Completar'}
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wi-Fi */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Wifi className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Wi-Fi</h3>
                  {settings.wifiNetworks && settings.wifiNetworks.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {settings.wifiNetworks.map((wifi: any, i: number) => (
                        <div key={i} className="text-sm">
                          <p className="font-medium">Red: {wifi.ssid}</p>
                          <p className="text-gray-600">Clave: {wifi.password}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 mt-1">No configurada</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <MessageCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">¿Necesitás ayuda?</h3>
                  <p className="text-sm text-gray-600 mt-1">Contactanos por WhatsApp</p>
                  {settings.whatsappNumber && (
                    <a
                      href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3"
                    >
                      <Button className="bg-green-600 hover:bg-green-700">Enviar mensaje</Button>
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {settings.googleMapsUrl && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-6 w-6 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Ubicación</h3>
                  <a
                    href={settings.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                  >
                    Ver en Google Maps
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {reservation.status === 'checked_out' && settings.reviewUrl && (
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-yellow-900">¿Cómo fue tu estadía?</h3>
                  <p className="text-sm text-yellow-700 mt-1">Dejanos tu reseña en Google</p>
                  <a
                    href={settings.reviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3"
                  >
                    <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">Dejar reseña</Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <FileText className="h-6 w-6 text-gray-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Guía del alojamiento</h3>
                  <p className="text-sm text-gray-600 mt-1">Normas, servicios e información útil</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-6 w-6 text-purple-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Descubrí el destino</h3>
                  <p className="text-sm text-gray-600 mt-1">Recomendaciones y secretos del anfitrión</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}