'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Wifi, MessageCircle, FileText, CheckCircle, ClipboardList, AlertCircle, Package, Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, Home, Car, Key, Navigation, ChevronDown, ChevronUp, LogOut, Utensils, TreePalm, Landmark, ShoppingBag, Coffee, Waves, ExternalLink, DollarSign, CreditCard, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

interface WeatherDay {
  date: string
  weatherCode: number
  tempMax: number
  tempMin: number
  precipitationProbability: number
}

interface LocationInfo {
  city: string
  region: string
  country: string
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  restaurant: { label: 'Restaurante', icon: Utensils, color: 'text-orange-700', bgColor: 'bg-orange-100' },
  activity: { label: 'Actividad', icon: TreePalm, color: 'text-green-700', bgColor: 'bg-green-100' },
  landmark: { label: 'Punto de interés', icon: Landmark, color: 'text-purple-700', bgColor: 'bg-purple-100' },
  shopping: { label: 'Compras', icon: ShoppingBag, color: 'text-pink-700', bgColor: 'bg-pink-100' },
  cafe: { label: 'Café / Bar', icon: Coffee, color: 'text-amber-700', bgColor: 'bg-amber-100' },
  beach: { label: 'Playa / Naturaleza', icon: Waves, color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
}

function getWeatherInfo(code: number): { emoji: string; icon: any; description: string; color: string } {
  const weatherMap: Record<number, { emoji: string; icon: any; description: string; color: string }> = {
    0: { emoji: '☀️', icon: Sun, description: 'Despejado', color: 'text-yellow-500' },
    1: { emoji: '🌤️', icon: Sun, description: 'Mayormente despejado', color: 'text-yellow-400' },
    2: { emoji: '⛅', icon: Cloud, description: 'Parcialmente nublado', color: 'text-gray-400' },
    3: { emoji: '☁️', icon: Cloud, description: 'Nublado', color: 'text-gray-500' },
    45: { emoji: '🌫️', icon: Cloud, description: 'Niebla', color: 'text-gray-400' },
    48: { emoji: '🌫️', icon: Cloud, description: 'Niebla con escarcha', color: 'text-gray-400' },
    51: { emoji: '🌦️', icon: CloudRain, description: 'Llovizna ligera', color: 'text-blue-400' },
    53: { emoji: '🌦️', icon: CloudRain, description: 'Llovizna moderada', color: 'text-blue-400' },
    55: { emoji: '️', icon: CloudRain, description: 'Llovizna densa', color: 'text-blue-500' },
    56: { emoji: '🌧️', icon: CloudRain, description: 'Llovizna helada', color: 'text-blue-600' },
    57: { emoji: '🌧️', icon: CloudRain, description: 'Llovizna helada densa', color: 'text-blue-600' },
    61: { emoji: '🌧️', icon: CloudRain, description: 'Lluvia ligera', color: 'text-blue-500' },
    63: { emoji: '🌧️', icon: CloudRain, description: 'Lluvia moderada', color: 'text-blue-600' },
    65: { emoji: '🌧️', icon: CloudRain, description: 'Lluvia intensa', color: 'text-blue-700' },
    66: { emoji: '🌧️', icon: CloudRain, description: 'Lluvia helada', color: 'text-blue-700' },
    67: { emoji: '🌧️', icon: CloudRain, description: 'Lluvia helada intensa', color: 'text-blue-700' },
    71: { emoji: '🌨️', icon: CloudSnow, description: 'Nevada ligera', color: 'text-blue-300' },
    73: { emoji: '🌨️', icon: CloudSnow, description: 'Nevada moderada', color: 'text-blue-400' },
    75: { emoji: '❄️', icon: CloudSnow, description: 'Nevada intensa', color: 'text-blue-500' },
    77: { emoji: '❄️', icon: CloudSnow, description: 'Granizo', color: 'text-blue-400' },
    80: { emoji: '🌦️', icon: CloudRain, description: 'Chubascos ligeros', color: 'text-blue-400' },
    81: { emoji: '🌧️', icon: CloudRain, description: 'Chubascos moderados', color: 'text-blue-500' },
    82: { emoji: '🌧️', icon: CloudRain, description: 'Chubascos violentos', color: 'text-blue-600' },
    85: { emoji: '🌨️', icon: CloudSnow, description: 'Chubascos de nieve', color: 'text-blue-300' },
    86: { emoji: '❄️', icon: CloudSnow, description: 'Chubascos de nieve intensos', color: 'text-blue-400' },
    95: { emoji: '️', icon: CloudLightning, description: 'Tormenta', color: 'text-purple-600' },
    96: { emoji: '⛈️', icon: CloudLightning, description: 'Tormenta con granizo', color: 'text-purple-700' },
    99: { emoji: '⛈️', icon: CloudLightning, description: 'Tormenta con granizo intenso', color: 'text-purple-800' },
  }
  return weatherMap[code] || { emoji: '🌡️', icon: Wind, description: 'Desconocido', color: 'text-gray-500' }
}

function getGoogleMapsEmbedUrl(mapsUrl: string): string | null {
  if (!mapsUrl) return null
  if (mapsUrl.includes('/embed')) return mapsUrl
  const patterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
  ]
  for (const pattern of patterns) {
    const match = mapsUrl.match(pattern)
    if (match) {
      const lat = match[1]
      const lng = match[2]
      return `https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&center=${lat},${lng}&zoom=15`
    }
  }
  if (mapsUrl.includes('/maps/place/')) {
    const encodedUrl = encodeURIComponent(mapsUrl)
    return `https://maps.google.com/maps?q=${encodedUrl}&output=embed`
  }
  return null
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount || 0)
}

export default function GuestStayPage({ params }: Props) {
  const [tenantSlug, setTenantSlug] = useState('')
  const [reservation, setReservation] = useState<any>(null)
  const [tenant, setTenant] = useState<any>(null)
  const [preCheckinCompleted, setPreCheckinCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unitInventory, setUnitInventory] = useState<any[]>([])
  const [groupedInventory, setGroupedInventory] = useState<Record<string, any[]>>({})
  const [weatherData, setWeatherData] = useState<WeatherDay[]>([])
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherMessage, setWeatherMessage] = useState('')
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null)
  const [showInventory, setShowInventory] = useState(false)
  const [showArrival, setShowArrival] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [destinationPlaces, setDestinationPlaces] = useState<any[]>([])
  const [selectedPlace, setSelectedPlace] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params
      setTenantSlug(resolvedParams.tenantSlug)
      const sessionStr = localStorage.getItem('guest_session')
      if (!sessionStr) {
        setError('No hay sesión activa.')
        setLoading(false)
        return
      }
      try {
        const session = JSON.parse(sessionStr)
        if (session.expiresAt && Date.now() > session.expiresAt) {
          localStorage.removeItem('guest_session')
          setError('La sesión expiró.')
          setLoading(false)
          return
        }
        await loadStay(session.reservationId, resolvedParams.tenantSlug)
      } catch (e) {
        console.error('Error en init:', e)
        setError('Sesión inválida.')
        setLoading(false)
      }
    }
    init()
  }, [params])

  async function getLocationName(lat: number, lng: number): Promise<LocationInfo | null> {
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`)
      if (!res.ok) return null
      const data = await res.json()
      return {
        city: data.city || data.locality || data.localityInfo?.administrative?.[2]?.name || '',
        region: data.principalSubdivision || data.localityInfo?.administrative?.[1]?.name || '',
        country: data.countryName || '',
      }
    } catch {
      return null
    }
  }

  async function loadWeather(lat: number, lng: number, startDate: string, endDate: string) {
    setWeatherLoading(true)
    setWeatherMessage('')
    setWeatherData([])
    setLocationInfo(null)
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]
      const maxDate = new Date(today)
      maxDate.setDate(today.getDate() + 16)
      const maxDateStr = maxDate.toISOString().split('T')[0]
      const startDateObj = new Date(startDate + 'T00:00:00')
      const endDateObj = new Date(endDate + 'T00:00:00')
      if (startDateObj < today) startDate = todayStr
      if (startDate > maxDateStr) {
        setWeatherMessage(`El pronóstico estará disponible cuando se acerque la fecha de tu estadía (a partir del ${new Date(startDate).toLocaleDateString('es-AR')}).`)
        setWeatherLoading(false)
        return
      }
      if (endDateObj > maxDate) endDate = maxDateStr
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America/Argentina/Buenos_Aires&start_date=${startDate}&end_date=${endDate}`
      const response = await fetch(url)
      if (!response.ok) {
        setWeatherMessage('No se pudo cargar el pronóstico en este momento.')
        setWeatherLoading(false)
        return
      }
      const data = await response.json()
      if (data.daily && data.daily.time && data.daily.time.length > 0) {
        const days: WeatherDay[] = data.daily.time.map((date: string, index: number) => ({
          date,
          weatherCode: data.daily.weathercode[index],
          tempMax: Math.round(data.daily.temperature_2m_max[index]),
          tempMin: Math.round(data.daily.temperature_2m_min[index]),
          precipitationProbability: data.daily.precipitation_probability_max[index] || 0,
        }))
        setWeatherData(days)
        if (endDate !== endDateObj.toISOString().split('T')[0]) {
          setWeatherMessage(`Pronóstico disponible hasta el ${new Date(endDate).toLocaleDateString('es-AR')}. El resto se actualizará más cerca de la fecha.`)
        }
      } else {
        setWeatherMessage('No hay datos de pronóstico disponibles para estas fechas.')
      }
      const loc = await getLocationName(lat, lng)
      if (loc) setLocationInfo(loc)
    } catch (err) {
      console.error('Error cargando clima:', err)
      setWeatherMessage('Error al cargar el pronóstico.')
    } finally {
      setWeatherLoading(false)
    }
  }

  async function loadStay(reservationId: string, slug: string) {
    const { data: res, error: resError } = await supabase
      .from('reservations')
      .select(`*, guests (first_name, last_name, email, phone), units (name, type, description, capacity)`)
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
    if (tenantData) {
      setTenant(tenantData)
      const settings = tenantData.settings || {}
      if (settings.latitude && settings.longitude) {
        const startDate = new Date(res.check_in).toISOString().split('T')[0]
        const endDate = new Date(res.check_out).toISOString().split('T')[0]
        await loadWeather(Number(settings.latitude), Number(settings.longitude), startDate, endDate)
      }
      const { data: placesData } = await supabase
        .from('destination_places')
        .select('*')
        .eq('tenant_id', tenantData.id)
        .order('order')
      if (placesData) setDestinationPlaces(placesData)
    }
    if (res.status === 'booked') {
      await supabase.from('reservations').update({ status: 'pre_checkin' }).eq('id', reservationId)
    }
    const { data: existingPreCheckin } = await supabase
      .from('pre_checkins')
      .select('id, status')
      .eq('reservation_id', reservationId)
      .eq('status', 'completed')
      .maybeSingle()
    if (existingPreCheckin) setPreCheckinCompleted(true)
    if (res.unit_id) {
      const { data: inventoryData } = await supabase
        .from('unit_inventory_items')
        .select('*')
        .eq('unit_id', res.unit_id)
        .order('category')
        .order('order')
      if (inventoryData && inventoryData.length > 0) {
        setUnitInventory(inventoryData)
        const grouped: Record<string, any[]> = {}
        inventoryData.forEach(item => {
          const categoryName = item.custom_category || (item.category === 'bedding' ? 'Ropa de cama' : item.category === 'kitchen' ? 'Cocina' : item.category === 'bathroom' ? 'Baño' : item.category)
          if (!grouped[categoryName]) grouped[categoryName] = []
          grouped[categoryName].push(item)
        })
        setGroupedInventory(grouped)
      }
    }
    setLoading(false)
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
  }
  function isToday(dateStr: string) {
    return dateStr === new Date().toISOString().split('T')[0]
  }
  function handlePreCheckinClick() {
    const code = reservation?.reservation_code
    const lastName = reservation?.guests?.last_name || ''
    window.location.href = `/${tenantSlug}/pre-checkin?code=${code}&lastName=${encodeURIComponent(lastName)}`
  }
  function handleLogout() {
    localStorage.removeItem('guest_session')
    window.location.href = `/${tenantSlug}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando...</p>
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
            <button onClick={() => { localStorage.removeItem('guest_session'); window.location.href = `/${tenantSlug}` }} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">Volver al inicio</button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const settings = tenant.settings || {}
  const branding = tenant.branding || {}
  const checkInDate = new Date(reservation.check_in)
  const checkOutDate = new Date(reservation.check_out)
  const mapsEmbedUrl = getGoogleMapsEmbedUrl(settings.googleMapsUrl)
  const arrivalInstructions = settings.arrivalInstructions || null
  const checkoutInstructions = settings.checkoutInstructions || null
  const emergencyContacts = settings.emergencyContacts || []
  const locationLabel = locationInfo
    ? [locationInfo.city, locationInfo.region, locationInfo.country].filter(Boolean).join(', ')
    : null

  // Datos de pago
  const totalAmount = reservation.total_amount || 0
  const paidAmount = reservation.paid_amount || 0
  const pendingAmount = Math.max(0, totalAmount - paidAmount)
  const paymentPercentage = totalAmount > 0 ? Math.min(100, (paidAmount / totalAmount) * 100) : 0
  const paymentStatus = reservation.payment_status || 'pending'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-green-700 text-white p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {branding.logoUrl && (
                <img src={branding.logoUrl} alt="Logo" className="h-20 w-auto bg-white rounded-lg p-2 object-contain" />
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">¡Hola, {reservation.guests?.first_name}!</h1>
                <p className="text-green-100 text-sm md:text-base">{tenant.name}</p>
                <Badge className="mt-2 bg-white/20 text-white border-0 text-xs px-3 py-1">
                  {reservation.status === 'pre_checkin' ? 'Pre Check-in' : reservation.status === 'checked_in' ? 'Alojado' : reservation.status}
                </Badge>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium border border-white/20 flex-shrink-0"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>

          <div className="mt-6">
            <Card className="bg-white/95 backdrop-blur shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm">Así estará el clima durante tu estadía:</h3>
                  {locationLabel && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      <MapPin className="h-3 w-3" />
                      {locationLabel}
                    </span>
                  )}
                </div>
                {weatherLoading ? (
                  <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div></div>
                ) : weatherData.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {weatherData.map((day, index) => {
                        const weatherInfo = getWeatherInfo(day.weatherCode)
                        const WeatherIcon = weatherInfo.icon
                        return (
                          <div key={index} className={`border rounded-lg p-2 text-center ${isToday(day.date) ? 'border-green-400 bg-green-50 shadow-sm' : 'border-gray-200 bg-white'}`}>
                            <p className="text-[10px] font-medium text-gray-500 capitalize mb-1">{isToday(day.date) ? 'Hoy' : formatDate(day.date)}</p>
                            <div className="flex justify-center mb-1"><WeatherIcon className={`h-6 w-6 ${weatherInfo.color}`} /></div>
                            <p className="text-[10px] text-gray-600 mb-1 line-clamp-1">{weatherInfo.description}</p>
                            <div className="flex justify-center gap-1 text-xs font-semibold">
                              <span className="text-red-500">{day.tempMax}°</span>
                              <span className="text-blue-500">{day.tempMin}°</span>
                            </div>
                            {day.precipitationProbability > 0 && (
                              <p className="text-[10px] text-blue-500 mt-1 flex items-center justify-center gap-0.5">
                                💧 {day.precipitationProbability}%
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {weatherMessage && <p className="text-[10px] text-amber-600 mt-2 bg-amber-50 border border-amber-200 rounded px-2 py-1">{weatherMessage}</p>}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Cloud className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs text-gray-500">{weatherMessage || 'El pronóstico estará disponible cuando se acerque la fecha de tu estadía.'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6 flex-1">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Tu reserva</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-sm text-gray-500">Unidad</p><p className="font-medium">{reservation.units?.name}</p></div>
              <div><p className="text-sm text-gray-500">Check-in</p><p className="font-medium">{checkInDate.toLocaleDateString('es-AR')} - {settings.checkInTime || '15:00'}</p></div>
              <div><p className="text-sm text-gray-500">Check-out</p><p className="font-medium">{checkOutDate.toLocaleDateString('es-AR')} - {settings.checkOutTime || '10:00'}</p></div>
              <div><p className="text-sm text-gray-500">Código</p><p className="font-medium font-mono">{reservation.reservation_code}</p></div>
            </div>
          </CardContent>
        </Card>

        {/* NUEVA: SECCIÓN DE PAGOS */}
        {totalAmount > 0 && (
          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Estado de tu pago</h3>
                  <p className="text-sm text-gray-600">Seguimiento de tu reserva</p>
                </div>
                <div className="ml-auto">
                  {paymentStatus === 'paid' ? (
                    <Badge className="bg-green-600 text-white">✅ Pagado</Badge>
                  ) : paymentStatus === 'partial' ? (
                    <Badge className="bg-yellow-600 text-white">⏳ Parcial</Badge>
                  ) : (
                    <Badge variant="destructive">⏳ Pendiente</Badge>
                  )}
                </div>
              </div>

              {/* Barra de progreso tipo batería */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progreso de pago</span>
                  <span className="text-sm font-bold text-gray-900">{Math.round(paymentPercentage)}%</span>
                </div>
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      paymentPercentage === 100 
                        ? 'bg-gradient-to-r from-green-400 to-green-600' 
                        : paymentPercentage > 0 
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' 
                          : 'bg-gray-300'
                    }`}
                    style={{ width: `${paymentPercentage}%` }}
                  />
                </div>
              </div>

              {/* Datos numéricos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <p className="text-xs text-gray-500 font-medium">Total de la reserva</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-xs text-green-600 font-medium">Ya pagado</p>
                  </div>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(paidAmount)}</p>
                  {paidAmount > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {reservation.payment_method === 'cash' && '💵 Efectivo'}
                      {reservation.payment_method === 'transfer' && '🏦 Transferencia'}
                      {reservation.payment_method === 'card' && '💳 Tarjeta'}
                      {reservation.payment_method === 'mercadopago' && '📱 Mercado Pago'}
                    </p>
                  )}
                </div>
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-xs text-red-600 font-medium">Saldo pendiente</p>
                  </div>
                  <p className={`text-2xl font-bold ${pendingAmount > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {formatCurrency(pendingAmount)}
                  </p>
                  {pendingAmount > 0 && (
                    <p className="text-xs text-gray-500 mt-1">A pagar al llegar</p>
                  )}
                </div>
              </div>

              {pendingAmount > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    💡 <strong>Recordá:</strong> El saldo pendiente de {formatCurrency(pendingAmount)} se abona al momento del check-in.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3 flex-1">
                <Home className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Tu unidad: {reservation.units?.name}</h3>
                </div>
              </div>
              {unitInventory.length > 0 ? (
                <button onClick={() => setShowInventory(!showInventory)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  <Package className="h-4 w-4" /> Inventario {showInventory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              ) : (
                <p className="text-sm text-gray-500 italic">Sin inventario cargado</p>
              )}
            </div>
            {reservation.units?.description && <p className="text-gray-700 mt-4 mb-4">{reservation.units.description}</p>}
            {reservation.units?.capacity && <p className="text-sm text-gray-600"> Capacidad: {reservation.units.capacity} personas</p>}
            {showInventory && unitInventory.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Package className="h-5 w-5 text-blue-600" /> Inventario de la unidad</h4>
                <div className="space-y-3">
                  {Object.entries(groupedInventory).map(([category, items]) => (
                    <div key={category} className="border border-gray-200 rounded-lg p-3">
                      <h5 className="font-medium text-gray-900 mb-2 text-sm">{category}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {items.map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2">
                            <span className="text-gray-700">{item.name}</span>
                            <Badge variant="secondary" className="text-xs">x{item.quantity}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {arrivalInstructions?.enabled && (
          <Card className="border-2 border-green-200 bg-green-50">
            <button onClick={() => setShowArrival(!showArrival)} className="w-full p-6 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <Navigation className="h-6 w-6 text-green-700 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900 text-lg">Instrucciones de llegada</h3>
                  <p className="text-sm text-green-700 mt-1">Cómo llegar al alojamiento</p>
                </div>
              </div>
              {showArrival ? <ChevronUp className="h-5 w-5 text-green-700" /> : <ChevronDown className="h-5 w-5 text-green-700" />}
            </button>
            {showArrival && (
              <div className="px-6 pb-6">
                {arrivalInstructions.steps && arrivalInstructions.steps.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-green-900 mb-2">Pasos para llegar:</h4>
                    <ol className="space-y-2">
                      {arrivalInstructions.steps.map((step: any, index: number) => (
                        <li key={index} className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-700 text-white flex items-center justify-center text-xs font-bold">{step.order || index + 1}</span>
                          <span className="text-green-800">{step.text}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {arrivalInstructions.parkingInfo && (
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200 mb-3">
                    <Car className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
                    <div><p className="font-medium text-green-900 text-sm">Estacionamiento</p><p className="text-green-800 text-sm">{arrivalInstructions.parkingInfo}</p></div>
                  </div>
                )}
                {arrivalInstructions.accessCode && (
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200">
                    <Key className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
                    <div><p className="font-medium text-green-900 text-sm">Código de acceso</p><p className="text-green-800 text-sm font-mono text-lg">{arrivalInstructions.accessCode}</p></div>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {checkoutInstructions?.enabled && (
          <Card className="border-2 border-orange-200 bg-orange-50">
            <button onClick={() => setShowCheckout(!showCheckout)} className="w-full p-6 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <Key className="h-6 w-6 text-orange-700 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-orange-900 text-lg">Instrucciones de check-out</h3>
                  <p className="text-sm text-orange-700 mt-1">Qué hacer al momento de salir</p>
                </div>
              </div>
              {showCheckout ? <ChevronUp className="h-5 w-5 text-orange-700" /> : <ChevronDown className="h-5 w-5 text-orange-700" />}
            </button>
            {showCheckout && (
              <div className="px-6 pb-6">
                {checkoutInstructions.steps && checkoutInstructions.steps.length > 0 && (
                  <ol className="space-y-2 mb-4">
                    {checkoutInstructions.steps.map((step: any, index: number) => (
                      <li key={index} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-700 text-white flex items-center justify-center text-xs font-bold">{step.order || index + 1}</span>
                        <span className="text-orange-800">{step.text}</span>
                      </li>
                    ))}
                  </ol>
                )}
                {checkoutInstructions.keyReturnLocation && (
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200">
                    <Key className="h-5 w-5 text-orange-700 flex-shrink-0 mt-0.5" />
                    <div><p className="font-medium text-orange-900 text-sm">Dónde dejar las llaves</p><p className="text-orange-800 text-sm">{checkoutInstructions.keyReturnLocation}</p></div>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {destinationPlaces.length > 0 && (
          <Card className="border-2 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="h-6 w-6 text-purple-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Descubrí el destino</h3>
                  <p className="text-sm text-gray-600 mt-1">Lugares recomendados por el anfitrión</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Elegí un lugar para ver más información:</label>
                  <select
                    value={selectedPlace?.id || ''}
                    onChange={(e) => {
                      const place = destinationPlaces.find(p => p.id === e.target.value)
                      setSelectedPlace(place || null)
                    }}
                    className="w-full h-11 px-3 border border-gray-300 rounded-lg bg-white text-sm"
                  >
                    <option value="">-- Seleccioná un lugar --</option>
                    {destinationPlaces.map((place) => {
                      const catConfig = CATEGORY_CONFIG[place.category] || CATEGORY_CONFIG.landmark
                      return <option key={place.id} value={place.id}>{place.name} ({catConfig.label})</option>
                    })}
                  </select>
                </div>
                {selectedPlace && (
                  <div className="border border-purple-200 rounded-lg overflow-hidden bg-purple-50/30">
                    {selectedPlace.image_url && (
                      <div className="w-full h-48 bg-gray-200 overflow-hidden">
                        <img src={selectedPlace.image_url} alt={selectedPlace.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-xl font-bold text-gray-900">{selectedPlace.name}</h4>
                          {(() => {
                            const catConfig = CATEGORY_CONFIG[selectedPlace.category] || CATEGORY_CONFIG.landmark
                            const Icon = catConfig.icon
                            return (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-2 ${catConfig.bgColor} ${catConfig.color}`}>
                                <Icon className="h-3 w-3" /> {catConfig.label}
                              </span>
                            )
                          })()}
                        </div>
                        {selectedPlace.google_maps_url && (
                          <a href={selectedPlace.google_maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                            <ExternalLink className="h-4 w-4" /> Ver en Maps
                          </a>
                        )}
                      </div>
                      {selectedPlace.description && <p className="text-gray-700 text-sm leading-relaxed">{selectedPlace.description}</p>}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {selectedPlace.address && (
                          <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
                            <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                            <div><p className="text-xs text-gray-500">Dirección</p><p className="text-gray-800">{selectedPlace.address}</p></div>
                          </div>
                        )}
                        {selectedPlace.hours && (
                          <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
                            <span className="text-gray-500 flex-shrink-0">🕐</span>
                            <div><p className="text-xs text-gray-500">Horarios</p><p className="text-gray-800">{selectedPlace.hours}</p></div>
                          </div>
                        )}
                        {selectedPlace.phone && (
                          <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
                            <span className="text-gray-500 flex-shrink-0">📞</span>
                            <div><p className="text-xs text-gray-500">Teléfono</p><a href={`tel:${selectedPlace.phone}`} className="text-blue-600 hover:underline">{selectedPlace.phone}</a></div>
                          </div>
                        )}
                        {selectedPlace.website && (
                          <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
                            <span className="text-gray-500 flex-shrink-0">🌐</span>
                            <div><p className="text-xs text-gray-500">Sitio web</p><a href={selectedPlace.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedPlace.website}</a></div>
                          </div>
                        )}
                      </div>
                      {selectedPlace.tips && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-xs text-amber-800 font-medium mb-1"> Recomendación del anfitrión</p>
                          <p className="text-sm text-amber-900">{selectedPlace.tips}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {!selectedPlace && (
                  <div className="text-center py-6">
                    <MapPin className="h-10 w-10 mx-auto mb-2 text-purple-300" />
                    <p className="text-sm text-gray-500">Seleccioná un lugar del menú desplegable para ver los detalles</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {mapsEmbedUrl && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="h-6 w-6 text-red-600 flex-shrink-0" />
                <div><h3 className="font-semibold text-gray-900">Ubicación</h3><p className="text-sm text-gray-600 mt-1">Cómo llegar al alojamiento</p></div>
              </div>
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <iframe src={mapsEmbedUrl} width="100%" height="400" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Ubicación del alojamiento" className="w-full" />
              </div>
              {settings.address && <p className="text-sm text-gray-600 mt-3">📍 {settings.address}</p>}
              <a href={settings.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-sm text-blue-600 hover:underline font-medium">Abrir en Google Maps →</a>
            </CardContent>
          </Card>
        )}

        {emergencyContacts.length > 0 && (
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="h-6 w-6 text-red-700 flex-shrink-0" />
                <div><h3 className="font-semibold text-red-900 text-lg">Contactos importantes</h3><p className="text-sm text-red-700 mt-1">Números útiles durante tu estadía</p></div>
              </div>
              <div className="space-y-2">
                {emergencyContacts.map((contact: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                    <div><p className="font-medium text-gray-900">{contact.name}</p><p className="text-xs text-gray-500">{contact.role}</p></div>
                    <a href={`tel:${contact.phone}`} className="text-sm bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors">📞 {contact.phone}</a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={preCheckinCompleted ? 'border-2 border-green-200 bg-green-50' : 'border-2 border-blue-200 bg-blue-50'}>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <ClipboardList className={`h-6 w-6 flex-shrink-0 ${preCheckinCompleted ? 'text-green-600' : 'text-blue-600'}`} />
                <div className="flex-1">
                  <h3 className={`font-semibold ${preCheckinCompleted ? 'text-green-900' : 'text-blue-900'}`}>Pre Check-in</h3>
                  <p className={`text-sm mt-1 mb-4 ${preCheckinCompleted ? 'text-green-700' : 'text-blue-700'}`}>{preCheckinCompleted ? 'Completado ✓' : 'Completá tus datos antes de llegar'}</p>
                  <button type="button" onClick={handlePreCheckinClick} className={`w-full px-4 py-2 rounded-lg text-white font-medium transition-colors ${preCheckinCompleted ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{preCheckinCompleted ? 'Editar' : 'Completar'}</button>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Wifi className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Wi-Fi</h3>
                  {settings.wifiNetworks && settings.wifiNetworks.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {settings.wifiNetworks.map((wifi: any, i: number) => (
                        <div key={i} className="text-sm"><p className="font-medium">Red: {wifi.ssid}</p><p className="text-gray-600">Clave: {wifi.password}</p></div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-gray-600 mt-1">No configurada</p>}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <MessageCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">¿Necesitás ayuda?</h3>
                  <p className="text-sm text-gray-600 mt-1">Contactanos por WhatsApp</p>
                  {settings.whatsappNumber && (
                    <a href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-block mt-3">
                      <span className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">Enviar mensaje</span>
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {reservation.status === 'checked_out' && settings.reviewUrl && (
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-yellow-900">¿Cómo fue tu estadía?</h3>
                  <p className="text-sm text-yellow-700 mt-1">Dejanos tu reseña en Google</p>
                  <a href={settings.reviewUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-3">
                    <span className="inline-block bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">Dejar reseña</span>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Link href={`/${tenantSlug}/guides`} className="block">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <FileText className="h-6 w-6 text-gray-600 flex-shrink-0" />
                <div><h3 className="font-semibold text-gray-900">Guía del alojamiento</h3><p className="text-sm text-gray-600 mt-1">Normas, servicios e información útil</p></div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <footer className="border-t border-gray-200 bg-white py-5 mt-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/mi-estadia-logo.png" alt="Mi Estadía" className="h-8 w-auto" />
            <span className="text-sm text-gray-600">© 2026 Mi Estadía</span>
          </div>
          <a 
            href="https://buenpuerto.online" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span>App desarrollada por</span>
            <img src="/buenpuerto-logo.png" alt="Buen Puerto" className="h-7 w-auto" />
            <span className="font-semibold text-teal-700">buenpuerto.online</span>
          </a>
        </div>
      </footer>
    </div>
  )
}