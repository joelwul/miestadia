'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Save, Plus, Trash2, Wifi, Upload, MapPin, Star, Key, AlertTriangle, Navigation, Eye, EyeOff, Mail, Send, FileText, Scale, Home, XCircle } from 'lucide-react'

interface WifiNetwork {
  id: string
  ssid: string
  password: string
}

interface ArrivalStep {
  order: number
  text: string
}

interface CheckoutStep {
  order: number
  text: string
}

interface EmergencyContact {
  id: string
  name: string
  phone: string
  role: string
}

interface Props {
  params: Promise<{ tenantSlug: string }>
}

// Plantillas predefinidas
const TEMPLATES = {
  terms: {
    standard: `TÉRMINOS Y CONDICIONES

1. CHECK-IN Y CHECK-OUT
• Horario de check-in: a partir de las 15:00 hs
• Horario de check-out: hasta las 10:00 hs
• Check-in tardío: coordinar previamente con el anfitrión
• Check-out tardío: sujeto a disponibilidad, con cargo adicional

2. CAPACIDAD MÁXIMA
• La capacidad máxima de la unidad es de [X] personas
• No se permiten visitas sin autorización previa
• El incumplimiento puede resultar en la cancelación de la reserva

3. USO DE LAS INSTALACIONES
• Las instalaciones son para uso exclusivo de los huéspedes registrados
• Se debe mantener el orden y la limpieza
• Cualquier daño será cobrado al huésped responsable

4. RUIDO Y CONVIVENCIA
• Horario de silencio: de 22:00 a 08:00 hs
• No se permiten fiestas o eventos sin autorización previa
• El incumplimiento puede resultar en el desalojo inmediato

5. MASCOTAS
• [Permitidas/No permitidas] - Especificar según el caso
• Si se permiten: cargo adicional de limpieza y depósito de garantía

6. FUMAR
• [Permitido/No permitido] en las instalaciones
• Si no se permite: multa por incumplimiento

7. RESPONSABILIDAD
• El huésped es responsable de sus pertenencias
• El anfitrión no se hace responsable por pérdidas o daños
• Se recomienda contratar seguro de viaje

8. CANCELACIONES
• Ver política de cancelación detallada`,

    strict: `TÉRMINOS Y CONDICIONES (ESTRICTO)

1. RESERVA Y PAGO
• La reserva se confirma con el pago del 50% del total
• El saldo restante se abona 7 días antes del check-in
• No se aceptan devoluciones por cancelación tardía

2. CHECK-IN Y CHECK-OUT
• Check-in: 15:00 hs (puntual)
• Check-out: 10:00 hs (puntual)
• Retrasos: cargo de $[X] por hora
• No se permiten early check-in ni late check-out sin autorización

3. CAPACIDAD Y VISITAS
• Capacidad máxima estricta: [X] personas
• NO se permiten visitas ni personas adicionales
• Violación: cancelación inmediata sin reembolso

4. RUIDO Y FIESTAS
• PROHIBIDO realizar fiestas o eventos
• Horario de silencio: 22:00 a 08:00 hs
• Violación: desalojo inmediato sin reembolso + multa de $[X]

5. DAÑOS
• Depósito de garantía: $[X] (reembolsable)
• Cualquier daño será descontado del depósito
• Daños superiores al depósito: cobro adicional

6. MASCOTAS
• NO se permiten mascotas
• Violación: multa de $[X] + limpieza profunda

7. FUMAR
• PROHIBIDO fumar en las instalaciones
• Violación: multa de $[X] + limpieza

8. CANCELACIONES
• Ver política de cancelación estricta`,

    flexible: `TÉRMINOS Y CONDICIONES (FLEXIBLE)

1. CHECK-IN Y CHECK-OUT
• Check-in: a partir de las 15:00 hs (flexible según disponibilidad)
• Check-out: hasta las 10:00 hs (posible extensión según disponibilidad)
• Coordinar horarios con anticipación para mejor atención

2. CAPACIDAD
• Capacidad recomendada: [X] personas
• Visitas: permitidas con aviso previo al anfitrión
• Flexibilidad para adaptarnos a tus necesidades

3. USO DE INSTALACIONES
• Sentite como en casa
• Mantené el orden y la limpieza básica
• Cualquier inconveniente, avisanos y lo resolvemos juntos

4. CONVIVENCIA
• Respetar horarios de descanso: 22:00 a 08:00 hs
• Eventos pequeños: consultar con el anfitrión
• Buscamos que todos disfruten una estadía agradable

5. MASCOTAS
• [Permitidas con aviso previo / Consultar]
• Cargo de limpieza: $[X]
• Depósito de garantía: $[X]

6. FUMAR
• [Permitido en áreas exteriores / Consultar]
• Por favor, mantener ventilación adecuada

7. DAÑOS
• Depósito de garantía: $[X] (reembolsable)
• Reportar cualquier incidente de inmediato
• Solución amistosa y razonable

8. CANCELACIONES
• Ver política de cancelación flexible`
  },
  cancellation: {
    standard: `POLÍTICA DE CANCELACIÓN (ESTÁNDAR)

• Cancelación con más de 14 días antes del check-in: reembolso del 100%
• Cancelación entre 7 y 14 días antes: reembolso del 50%
• Cancelación entre 3 y 7 días antes: reembolso del 25%
• Cancelación con menos de 3 días: sin reembolso
• No-show (no presentación): sin reembolso

Excepciones:
• Fuerza mayor (desastres naturales, pandemias): reembolso completo con documentación
• Enfermedad grave: reembolso del 75% con certificado médico
• Cambios de vuelo: reembolso del 50% con comprobante

Proceso de cancelación:
1. Enviar solicitud por email a [email del anfitrión]
2. Confirmación de recepción en 24 hs
3. Reembolso en 5-10 días hábiles
4. Método de reembolso: mismo método de pago original`,

    strict: `POLÍTICA DE CANCELACIÓN (ESTRICTA)

• Cancelación con más de 30 días antes del check-in: reembolso del 100%
• Cancelación entre 15 y 30 días antes: reembolso del 50%
• Cancelación con menos de 15 días: SIN reembolso
• No-show: SIN reembolso
• Modificaciones de fechas: sujetas a disponibilidad, sin devolución

Excepciones (muy limitadas):
• Fuerza mayor documentada: reembolso del 75%
• Enfermedad grave con certificado médico: reembolso del 50%
• No se aceptan cambios de opinión o planes

Proceso de cancelación:
1. Solicitud por email con motivo detallado
2. Respuesta en 48 hs
3. Reembolso en 10-15 días hábiles
4. Se descuenta 5% por gastos administrativos

Importante:
• Se recomienda contratar seguro de cancelación
• Las reservas en temporada alta son no reembolsables
• Grupos de más de [X] personas: política especial`,

    flexible: `POLÍTICA DE CANCELACIÓN (FLEXIBLE)

• Cancelación con más de 7 días antes del check-in: reembolso del 100%
• Cancelación entre 3 y 7 días antes: reembolso del 75%
• Cancelación entre 1 y 3 días antes: reembolso del 50%
• No-show: reembolso del 25% (como crédito para futura reserva)

Excepciones favorables:
• Fuerza mayor: reembolso completo
• Enfermedad: reembolso del 90%
• Cambios de planes: siempre buscamos una solución
• Reprogramación: gratuita según disponibilidad

Proceso de cancelación:
1. Contactanos por WhatsApp o email
2. Respuesta en menos de 24 hs
3. Reembolso en 3-5 días hábiles
4. Opción de crédito para futura reserva

Beneficios adicionales:
• Primera cancelación gratuita (sin cargo)
• Huéspedes frecuentes: política especial
• Temporada baja: más flexibilidad`
  },
  houseRules: {
    standard: `REGLAS DE LA CASA

✓ Llegada y Salida
• Check-in: 15:00 hs
• Check-out: 10:00 hs
• Coordinar horarios con anticipación

✓ Convivencia
• Horario de silencio: 22:00 a 08:00 hs
• No fiestas sin autorización
• Respetar a vecinos y otros huéspedes

✓ Limpieza
• Mantener orden básico
• Sacar basura antes del check-out
• No dejar platos sucios por días

✓ Seguridad
• Cerrar puertas y ventanas al salir
• No dejar objetos de valor a la vista
• Reportar cualquier anomalía

✓ Uso de servicios
• Wi-Fi: uso responsable
• Cocina: limpiar después de usar
• Lavandería: consultar horarios

✗ Prohibido
• Fumar en espacios cerrados
• Mascotas sin autorización
• Dañar instalaciones
• Ruido excesivo`,

    strict: `REGLAS DE LA CASA (ESTRICTO)

✓ HORARIOS (ESTRICTOS)
• Check-in: 15:00 hs (puntual)
• Check-out: 10:00 hs (puntual)
• Silencio: 22:00 a 08:00 hs (obligatorio)

✓ CAPACIDAD
• Máximo [X] personas
• NO visitas sin autorización
• NO personas adicionales

✓ LIMPIEZA
• Mantener impecable
• Sacar basura diariamente
• Lavar platos inmediatamente
• Multa por limpieza: $[X]

✓ SEGURIDAD
• Cerrar todo al salir
• No ingresar personas no autorizadas
• Cámaras de seguridad en áreas comunes

✗ TERMINANTEMENTE PROHIBIDO
• Fiestas o eventos
• Fumar en cualquier espacio
• Mascotas
• Ruido después de 22:00 hs
• Dañar instalaciones
• Violación: desalojo inmediato + multa

⚠️ INCUMPLIMIENTO
• Primera vez: advertencia formal
• Segunda vez: multa de $[X]
• Tercera vez: desalojo sin reembolso`,

    flexible: `REGLAS DE LA CASA (AMIGABLE)

✓ BIENVENIDA
• Check-in: desde 15:00 hs (flexible)
• Check-out: hasta 10:00 hs (consultar)
• Sentite como en casa

✓ CONVIVENCIA
• Respetar horarios de descanso: 22:00 a 08:00 hs
• Eventos pequeños: consultar primero
• Buena onda con vecinos

✓ LIMPIEZA
• Mantener orden básico
• Sacar basura antes de irte
• Ayudanos a cuidar el espacio

✓ SEGURIDAD
• Cerrar al salir
• Cuidar tus pertenencias
• Avisar si ves algo raro

✓ SERVICIOS
• Wi-Fi libre
• Cocina a disposición
• Consultar por lavandería

 POR FAVOR EVITAR
• Fumar adentro (afuera OK)
• Ruido excesivo de noche
• Dañar cosas a propósito
• Mascotas: consultar primero

💡 TIPS
• Cualquier duda, preguntanos
• Queremos que disfrutes
• Reportá si algo no funciona`
  }
}

function extractCoordinates(mapsUrl: string): { lat: number; lng: number } | null {
  if (!mapsUrl) return null
  const atRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/
  const atMatch = mapsUrl.match(atRegex)
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) }
  const qRegex = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/
  const qMatch = mapsUrl.match(qRegex)
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) }
  const placeRegex = /\/maps\/place\/[^/]+\/@(-?\d+\.\d+),(-?\d+\.\d+)/
  const placeMatch = mapsUrl.match(placeRegex)
  if (placeMatch) return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) }
  return null
}

export default function SettingsPage({ params }: Props) {
  const [tenantSlug, setTenantSlug] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    notes: '',
    primaryColor: '#166534',
    secondaryColor: '#F59E0B',
    logoUrl: '',
    googleMapsUrl: '',
    mapImageUrl: '',
    reviewUrl: '',
    latitude: '',
    longitude: '',
    termsAndConditions: '',
    cancellationPolicy: '',
    houseRules: '',
  })

  const [wifiNetworks, setWifiNetworks] = useState<WifiNetwork[]>([
    { id: '1', ssid: '', password: '' }
  ])

  const [arrivalInstructions, setArrivalInstructions] = useState({
    enabled: false,
    steps: [] as ArrivalStep[],
    parkingInfo: '',
    accessCode: '',
  })

  const [checkoutInstructions, setCheckoutInstructions] = useState({
    enabled: false,
    steps: [] as CheckoutStep[],
    keyReturnLocation: '',
  })

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
  const [showCoordinates, setShowCoordinates] = useState(false)
  const [coordMsg, setCoordMsg] = useState('')

  const [autoEmailEnabled, setAutoEmailEnabled] = useState(true)
  const [preCheckinDays, setPreCheckinDays] = useState(4)
  const [postCheckoutDays, setPostCheckoutDays] = useState(1)
  const [emailTemplates, setEmailTemplates] = useState({
    preCheckin: '¡Hola {{guestName}}! \n\nTu reserva en {{propertyName}} está confirmada:\n📅 Check-in: {{checkIn}}\n📅 Check-out: {{checkOut}}\n🏠 Unidad: {{unitName}}\n\nCódigo de reserva: {{reservationCode}}\n\n👉 Accedé a tu panel de huésped:\n{{loginUrl}}\n\n¡Esperamos que disfrutes tu estadía!',
    postCheckout: '¡Hola {{guestName}}! 👋\n\nGracias por elegir {{propertyName}}.\n\nEsperamos que hayas disfrutado tu estadía.\n\n{{reviewSection}}\n\n¡Te esperamos la próxima!',
  })

  // Estados para modales de plantillas
  const [showTermsTemplate, setShowTermsTemplate] = useState(false)
  const [showCancellationTemplate, setShowCancellationTemplate] = useState(false)
  const [showHouseRulesTemplate, setShowHouseRulesTemplate] = useState(false)

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params
      setTenantSlug(resolvedParams.tenantSlug)

      const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', resolvedParams.tenantSlug)
        .single()

      if (tenant) {
        setTenantId(tenant.id)
        const settings = tenant.settings || {}
        const branding = tenant.branding || {}
        setFormData({
          name: tenant.name || '',
          address: settings.address || '',
          phone: settings.phone || '',
          whatsappNumber: settings.whatsappNumber || '',
          email: settings.email || '',
          checkInTime: settings.checkInTime || '15:00',
          checkOutTime: settings.checkOutTime || '11:00',
          notes: settings.notes || '',
          primaryColor: branding.primaryColor || '#166534',
          secondaryColor: branding.secondaryColor || '#F59E0B',
          logoUrl: branding.logoUrl || '',
          googleMapsUrl: settings.googleMapsUrl || '',
          mapImageUrl: settings.mapImageUrl || '',
          reviewUrl: settings.reviewUrl || '',
          latitude: settings.latitude?.toString() || '',
          longitude: settings.longitude?.toString() || '',
          termsAndConditions: tenant.terms_and_conditions || '',
          cancellationPolicy: tenant.cancellation_policy || '',
          houseRules: tenant.house_rules || '',
        })

        if (settings.wifiNetworks && settings.wifiNetworks.length > 0) {
          setWifiNetworks(settings.wifiNetworks)
        }
        if (settings.arrivalInstructions) {
          setArrivalInstructions({
            enabled: settings.arrivalInstructions.enabled || false,
            steps: settings.arrivalInstructions.steps || [],
            parkingInfo: settings.arrivalInstructions.parkingInfo || '',
            accessCode: settings.arrivalInstructions.accessCode || '',
          })
        }
        if (settings.checkoutInstructions) {
          setCheckoutInstructions({
            enabled: settings.checkoutInstructions.enabled || false,
            steps: settings.checkoutInstructions.steps || [],
            keyReturnLocation: settings.checkoutInstructions.keyReturnLocation || '',
          })
        }
        if (settings.emergencyContacts && settings.emergencyContacts.length > 0) {
          setEmergencyContacts(settings.emergencyContacts)
        }

        setAutoEmailEnabled(tenant.auto_email_enabled !== false)
        setPreCheckinDays(tenant.pre_checkin_days || 4)
        setPostCheckoutDays(tenant.post_checkout_days || 1)
        if (tenant.email_templates) {
          setEmailTemplates({
            preCheckin: tenant.email_templates.preCheckin || emailTemplates.preCheckin,
            postCheckout: tenant.email_templates.postCheckout || emailTemplates.postCheckout,
          })
        }
      }
    }
    init()
  }, [params])

  useEffect(() => {
    if (formData.googleMapsUrl) {
      const coords = extractCoordinates(formData.googleMapsUrl)
      if (coords) {
        setFormData(prev => ({
          ...prev,
          latitude: coords.lat.toString(),
          longitude: coords.lng.toString(),
        }))
        setCoordMsg('✅ Coordenadas extraídas automáticamente')
        setTimeout(() => setCoordMsg(''), 3000)
      } else {
        setCoordMsg('️ No se pudieron extraer. Ingresalas manualmente.')
      }
    }
  }, [formData.googleMapsUrl])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    const { error } = await supabase
      .from('tenants')
      .update({
        name: formData.name,
        auto_email_enabled: autoEmailEnabled,
        pre_checkin_days: preCheckinDays,
        post_checkout_days: postCheckoutDays,
        email_templates: emailTemplates,
        terms_and_conditions: formData.termsAndConditions,
        cancellation_policy: formData.cancellationPolicy,
        house_rules: formData.houseRules,
        settings: {
          address: formData.address,
          phone: formData.phone,
          whatsappNumber: formData.whatsappNumber,
          email: formData.email,
          checkInTime: formData.checkInTime,
          checkOutTime: formData.checkOutTime,
          wifiNetworks: wifiNetworks.filter(n => n.ssid.trim() !== ''),
          notes: formData.notes,
          googleMapsUrl: formData.googleMapsUrl,
          mapImageUrl: formData.mapImageUrl,
          reviewUrl: formData.reviewUrl,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          arrivalInstructions: arrivalInstructions.enabled ? arrivalInstructions : null,
          checkoutInstructions: checkoutInstructions.enabled ? checkoutInstructions : null,
          emergencyContacts: emergencyContacts.length > 0 ? emergencyContacts : null,
        },
        branding: {
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          logoUrl: formData.logoUrl,
        },
      })
      .eq('slug', tenantSlug)

    if (error) {
      console.error('Error:', error)
      alert('Error al guardar: ' + error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setLoading(false)
  }

  async function handleSendTestEmail() {
    if (!formData.email) {
      alert('Primero guardá un email de contacto en la sección "Contacto"')
      return
    }
    setSendingTest(true)
    try {
      const res = await fetch('/api/cron/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          email: formData.email,
          template: 'preCheckin',
        }),
      })
      const data = await res.json()
      if (data.success) {
        alert('✅ Email de prueba enviado a ' + formData.email)
      } else {
        alert('❌ Error: ' + data.error)
      }
    } catch (err) {
      alert('Error: ' + err)
    } finally {
      setSendingTest(false)
    }
  }

  function addWifiNetwork() {
    setWifiNetworks([...wifiNetworks, { id: Date.now().toString(), ssid: '', password: '' }])
  }

  function removeWifiNetwork(id: string) {
    if (wifiNetworks.length > 1) {
      setWifiNetworks(wifiNetworks.filter(n => n.id !== id))
    }
  }

  function updateWifiNetwork(id: string, field: keyof WifiNetwork, value: string) {
    setWifiNetworks(wifiNetworks.map(n =>
      n.id === id ? { ...n, [field]: value } : n
    ))
  }

  function addArrivalStep() {
    setArrivalInstructions({
      ...arrivalInstructions,
      steps: [...arrivalInstructions.steps, { order: arrivalInstructions.steps.length + 1, text: '' }]
    })
  }

  function updateArrivalStep(index: number, text: string) {
    const newSteps = [...arrivalInstructions.steps]
    newSteps[index] = { ...newSteps[index], text }
    setArrivalInstructions({ ...arrivalInstructions, steps: newSteps })
  }

  function removeArrivalStep(index: number) {
    const newSteps = arrivalInstructions.steps.filter((_, i) => i !== index).map((step, i) => ({ ...step, order: i + 1 }))
    setArrivalInstructions({ ...arrivalInstructions, steps: newSteps })
  }

  function addCheckoutStep() {
    setCheckoutInstructions({
      ...checkoutInstructions,
      steps: [...checkoutInstructions.steps, { order: checkoutInstructions.steps.length + 1, text: '' }]
    })
  }

  function updateCheckoutStep(index: number, text: string) {
    const newSteps = [...checkoutInstructions.steps]
    newSteps[index] = { ...newSteps[index], text }
    setCheckoutInstructions({ ...checkoutInstructions, steps: newSteps })
  }

  function removeCheckoutStep(index: number) {
    const newSteps = checkoutInstructions.steps.filter((_, i) => i !== index).map((step, i) => ({ ...step, order: i + 1 }))
    setCheckoutInstructions({ ...checkoutInstructions, steps: newSteps })
  }

  function addEmergencyContact() {
    setEmergencyContacts([...emergencyContacts, { id: Date.now().toString(), name: '', phone: '', role: '' }])
  }

  function updateEmergencyContact(id: string, field: keyof EmergencyContact, value: string) {
    setEmergencyContacts(emergencyContacts.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ))
  }

  function removeEmergencyContact(id: string) {
    setEmergencyContacts(emergencyContacts.filter(c => c.id !== id))
  }

  async function handleFileUpload(field: 'logoUrl' | 'mapImageUrl', e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fileExt = file.name.split('.').pop()
    const fileName = `${tenantSlug}-${field}-${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage
      .from('tenant-assets')
      .upload(fileName, file)
    if (uploadError) {
      alert('Error subiendo archivo: ' + uploadError.message)
      return
    }
    const { data } = supabase.storage
      .from('tenant-assets')
      .getPublicUrl(fileName)
    setFormData({ ...formData, [field]: data.publicUrl })
  }

  function applyTemplate(type: 'terms' | 'cancellation' | 'houseRules', template: string) {
    const templateText = TEMPLATES[type][template as keyof typeof TEMPLATES[typeof type]]
    if (type === 'terms') {
      setFormData({ ...formData, termsAndConditions: templateText })
      setShowTermsTemplate(false)
    } else if (type === 'cancellation') {
      setFormData({ ...formData, cancellationPolicy: templateText })
      setShowCancellationTemplate(false)
    } else {
      setFormData({ ...formData, houseRules: templateText })
      setShowHouseRulesTemplate(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 mt-1">Gestioná la información de tu alojamiento</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Logo y Marca</CardTitle>
            <CardDescription>Personalización visual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Logo del Alojamiento</label>
              {formData.logoUrl && (
                <div className="mb-3">
                  <img src={formData.logoUrl} alt="Logo" className="h-20 w-auto rounded-lg border" />
                </div>
              )}
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={() => document.getElementById('logo-upload')?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Subir Logo
                </Button>
                <input id="logo-upload" type="file" accept="image/*" onChange={(e) => handleFileUpload('logoUrl', e)} className="hidden" />
                {formData.logoUrl && (
                  <Button type="button" variant="destructive" onClick={() => setFormData({ ...formData, logoUrl: '' })}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Color Principal</label>
                <div className="flex gap-2 mt-1">
                  <Input type="color" value={formData.primaryColor} onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })} className="w-16 h-10" />
                  <Input value={formData.primaryColor} onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Color Secundario</label>
                <div className="flex gap-2 mt-1">
                  <Input type="color" value={formData.secondaryColor} onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })} className="w-16 h-10" />
                  <Input value={formData.secondaryColor} onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nombre</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Dirección</label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Teléfono</label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">WhatsApp</label>
              <Input value={formData.whatsappNumber} onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })} placeholder="5491112345678" />
            </div>
          </CardContent>
        </Card>

        {/* TÉRMINOS Y CONDICIONES */}
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-blue-700" />
              Términos y Condiciones
            </CardTitle>
            <CardDescription>
              Información legal visible para los huéspedes. Usá las plantillas como base y personalizalas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowTermsTemplate(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Usar Plantilla
              </Button>
              {formData.termsAndConditions && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, termsAndConditions: '' })}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Limpiar
                </Button>
              )}
            </div>
            <textarea
              value={formData.termsAndConditions}
              onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
              className="w-full min-h-[300px] px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              placeholder="Escribí tus términos y condiciones, o usá una plantilla..."
            />
            <p className="text-xs text-gray-500">
              💡 Tip: Los huéspedes podrán ver estos términos en su panel. Sé claro y específico.
            </p>
          </CardContent>
        </Card>

        {/* POLÍTICA DE CANCELACIÓN */}
        <Card className="border-2 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-orange-700" />
              Política de Cancelación
            </CardTitle>
            <CardDescription>
              Reglas claras sobre cancelaciones y reembolsos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowCancellationTemplate(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Usar Plantilla
              </Button>
              {formData.cancellationPolicy && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, cancellationPolicy: '' })}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Limpiar
                </Button>
              )}
            </div>
            <textarea
              value={formData.cancellationPolicy}
              onChange={(e) => setFormData({ ...formData, cancellationPolicy: e.target.value })}
              className="w-full min-h-[300px] px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              placeholder="Escribí tu política de cancelación, o usá una plantilla..."
            />
            <p className="text-xs text-gray-500">
              💡 Tip: Una política clara evita conflictos. Especificá plazos y porcentajes de reembolso.
            </p>
          </CardContent>
        </Card>

        {/* REGLAS DE LA CASA */}
        <Card className="border-2 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-green-700" />
              Reglas de la Casa
            </CardTitle>
            <CardDescription>
              Normas de convivencia y uso de las instalaciones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowHouseRulesTemplate(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Usar Plantilla
              </Button>
              {formData.houseRules && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, houseRules: '' })}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Limpiar
                </Button>
              )}
            </div>
            <textarea
              value={formData.houseRules}
              onChange={(e) => setFormData({ ...formData, houseRules: e.target.value })}
              className="w-full min-h-[300px] px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              placeholder="Escribí las reglas de tu casa, o usá una plantilla..."
            />
            <p className="text-xs text-gray-500">
               Tip: Reglas claras = huéspedes felices. Incluí horarios, capacidad, y qué está permitido.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Google Maps</CardTitle>
            <CardDescription>Ubicación y reseñas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Link de Google Maps (ubicación)</label>
              <Input value={formData.googleMapsUrl} onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })} placeholder="https://maps.google.com/..." />
              {coordMsg && <p className="text-xs text-gray-600 mt-1">{coordMsg}</p>}
            </div>
            <div className="border border-gray-200 rounded-lg p-3">
              <button
                type="button"
                onClick={() => setShowCoordinates(!showCoordinates)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                {showCoordinates ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showCoordinates ? 'Ocultar coordenadas' : 'Mostrar coordenadas (opcional)'}
              </button>
              {showCoordinates && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-xs text-gray-500">Latitud</label>
                    <Input value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} placeholder="-34.6037" step="any" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Longitud</label>
                    <Input value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} placeholder="-58.3816" step="any" />
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Mapa del Hotel (imagen)</label>
              {formData.mapImageUrl && (
                <div className="mb-3">
                  <img src={formData.mapImageUrl} alt="Mapa" className="h-40 w-auto rounded-lg border" />
                </div>
              )}
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={() => document.getElementById('map-upload')?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Subir Mapa
                </Button>
                <input id="map-upload" type="file" accept="image/*" onChange={(e) => handleFileUpload('mapImageUrl', e)} className="hidden" />
                {formData.mapImageUrl && (
                  <Button type="button" variant="destructive" onClick={() => setFormData({ ...formData, mapImageUrl: '' })}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Link para dejar reseña en Google
              </label>
              <Input value={formData.reviewUrl} onChange={(e) => setFormData({ ...formData, reviewUrl: e.target.value })} placeholder="https://g.page/..." />
              <p className="text-xs text-gray-500 mt-1">Se mostrará al huésped después del check-out</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Wifi className="h-5 w-5" />Redes Wi-Fi</CardTitle>
                <CardDescription>Configurá todas las redes disponibles</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addWifiNetwork}>
                <Plus className="mr-2 h-4 w-4" />Agregar Red
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {wifiNetworks.map((network, index) => (
              <div key={network.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Red {index + 1}</p>
                  {wifiNetworks.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeWifiNetwork(network.id)} className="h-8 w-8 text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Nombre de la Red (SSID)</label>
                    <Input value={network.ssid} onChange={(e) => updateWifiNetwork(network.id, 'ssid', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Contraseña</label>
                    <Input value={network.password} onChange={(e) => updateWifiNetwork(network.id, 'password', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Check-in</label>
                <Input type="time" value={formData.checkInTime} onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Check-out</label>
                <Input type="time" value={formData.checkOutTime} onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })} required />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* EMAIL AUTOMÁTICO */}
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-700" />
              Email Automático
            </CardTitle>
            <CardDescription>
              El sistema envía emails automáticamente a los huéspedes. 100 emails/día gratis con Resend.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <p className="font-medium text-gray-900">Envío automático activado</p>
                <p className="text-sm text-gray-600">
                  {autoEmailEnabled 
                    ? 'El sistema enviará emails según la configuración' 
                    : 'Los emails automáticos están desactivados'}
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoEmailEnabled}
                  onChange={(e) => setAutoEmailEnabled(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-700">
                  {autoEmailEnabled ? 'Activado' : 'Desactivado'}
                </span>
              </label>
            </div>
            {autoEmailEnabled && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Días antes del check-in</label>
                    <Input
                      type="number"
                      value={preCheckinDays}
                      onChange={(e) => setPreCheckinDays(parseInt(e.target.value) || 4)}
                      min="1"
                      max="14"
                    />
                    <p className="text-xs text-gray-500 mt-1">Se envía recordatorio N días antes</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Días después del check-out</label>
                    <Input
                      type="number"
                      value={postCheckoutDays}
                      onChange={(e) => setPostCheckoutDays(parseInt(e.target.value) || 1)}
                      min="0"
                      max="7"
                    />
                    <p className="text-xs text-gray-500 mt-1">Se envía agradecimiento N días después</p>
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Plantilla: Recordatorio pre-checkin
                    </label>
                    <textarea
                      value={emailTemplates.preCheckin}
                      onChange={(e) => setEmailTemplates({ ...emailTemplates, preCheckin: e.target.value })}
                      className="w-full min-h-[150px] px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                      placeholder="Mensaje..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Placeholders disponibles: <code className="bg-gray-100 px-1 rounded">{'{{guestName}}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{{propertyName}}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{{checkIn}}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{{checkOut}}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{{unitName}}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{{reservationCode}}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{{loginUrl}}'}</code>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Plantilla: Agradecimiento post-checkout
                    </label>
                    <textarea
                      value={emailTemplates.postCheckout}
                      onChange={(e) => setEmailTemplates({ ...emailTemplates, postCheckout: e.target.value })}
                      className="w-full min-h-[150px] px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                      placeholder="Mensaje..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Placeholders disponibles: <code className="bg-gray-100 px-1 rounded">{'{{guestName}}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{{propertyName}}'}</code>, <code className="bg-gray-100 px-1 rounded">{'{{reviewSection}}'}</code> (se reemplaza automáticamente con link de reseña o Google Maps)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendTestEmail}
                    disabled={sendingTest || !formData.email}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {sendingTest ? 'Enviando...' : 'Enviar email de prueba'}
                  </Button>
                  {formData.email && (
                    <p className="text-xs text-gray-500">
                      Se enviará a: {formData.email}
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Instrucciones de Llegada
                </CardTitle>
                <CardDescription>Cómo llegar al alojamiento</CardDescription>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={arrivalInstructions.enabled}
                  onChange={(e) => setArrivalInstructions({ ...arrivalInstructions, enabled: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-700">Activar</span>
              </label>
            </div>
          </CardHeader>
          {arrivalInstructions.enabled && (
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Pasos para llegar</label>
                <div className="space-y-2 mt-2">
                  {arrivalInstructions.steps.map((step, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-sm text-gray-500 w-6 pt-2">{step.order}.</span>
                      <Input value={step.text} onChange={(e) => updateArrivalStep(index, e.target.value)} placeholder={`Paso ${step.order}...`} className="flex-1" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeArrivalStep(index)} className="h-8 w-8 text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addArrivalStep}>
                    <Plus className="mr-2 h-4 w-4" />Agregar paso
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Información de estacionamiento</label>
                <Input value={arrivalInstructions.parkingInfo} onChange={(e) => setArrivalInstructions({ ...arrivalInstructions, parkingInfo: e.target.value })} placeholder="Ej: Estacionamiento dentro del predio" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Código de acceso
                </label>
                <Input value={arrivalInstructions.accessCode} onChange={(e) => setArrivalInstructions({ ...arrivalInstructions, accessCode: e.target.value })} placeholder="Ej: 1234" />
              </div>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Instrucciones de Check-out
                </CardTitle>
                <CardDescription>Qué hacer al momento de salir</CardDescription>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkoutInstructions.enabled}
                  onChange={(e) => setCheckoutInstructions({ ...checkoutInstructions, enabled: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-700">Activar</span>
              </label>
            </div>
          </CardHeader>
          {checkoutInstructions.enabled && (
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Pasos para el check-out</label>
                <div className="space-y-2 mt-2">
                  {checkoutInstructions.steps.map((step, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="text-sm text-gray-500 w-6 pt-2">{step.order}.</span>
                      <Input value={step.text} onChange={(e) => updateCheckoutStep(index, e.target.value)} placeholder={`Paso ${step.order}...`} className="flex-1" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeCheckoutStep(index)} className="h-8 w-8 text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addCheckoutStep}>
                    <Plus className="mr-2 h-4 w-4" />Agregar paso
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Dónde dejar las llaves</label>
                <Input value={checkoutInstructions.keyReturnLocation} onChange={(e) => setCheckoutInstructions({ ...checkoutInstructions, keyReturnLocation: e.target.value })} placeholder="Ej: Mesa de la cocina" />
              </div>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Contactos de Emergencia
                </CardTitle>
                <CardDescription>Números importantes para los huéspedes</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addEmergencyContact}>
                <Plus className="mr-2 h-4 w-4" />Agregar Contacto
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {emergencyContacts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No hay contactos de emergencia</p>
            ) : (
              emergencyContacts.map((contact, index) => (
                <div key={contact.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">Contacto {index + 1}</p>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeEmergencyContact(contact.id)} className="h-8 w-8 text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">Nombre</label>
                      <Input value={contact.name} onChange={(e) => updateEmergencyContact(contact.id, 'name', e.target.value)} placeholder="Juan Pérez" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Teléfono</label>
                      <Input value={contact.phone} onChange={(e) => updateEmergencyContact(contact.id, 'phone', e.target.value)} placeholder="+5491112345678" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Rol</label>
                      <Input value={contact.role} onChange={(e) => updateEmergencyContact(contact.id, 'role', e.target.value)} placeholder="Admin, Emergencia" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notas Internas</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas internas..."
              className="w-full min-h-[150px] px-3 py-2 border border-gray-300 rounded-lg"
            />
          </CardContent>
        </Card>

        <div className="flex items-center gap-4">
          <Button type="submit" size="lg" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
          {saved && <Badge variant="default" className="bg-green-600">✓ Guardado</Badge>}
        </div>
      </form>

      {/* MODAL: Plantilla de Términos */}
      {showTermsTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Elegí una plantilla de Términos</h2>
              <button onClick={() => setShowTermsTemplate(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {Object.entries(TEMPLATES.terms).map(([key, template]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-2 capitalize">{key === 'standard' ? 'Estándar' : key === 'strict' ? 'Estricto' : 'Flexible'}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">{template.substring(0, 200)}...</p>
                  <Button onClick={() => applyTemplate('terms', key)} size="sm">
                    Usar esta plantilla
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Plantilla de Cancelación */}
      {showCancellationTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Elegí una plantilla de Cancelación</h2>
              <button onClick={() => setShowCancellationTemplate(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {Object.entries(TEMPLATES.cancellation).map(([key, template]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-2 capitalize">{key === 'standard' ? 'Estándar' : key === 'strict' ? 'Estricta' : 'Flexible'}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">{template.substring(0, 200)}...</p>
                  <Button onClick={() => applyTemplate('cancellation', key)} size="sm">
                    Usar esta plantilla
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Plantilla de Reglas */}
      {showHouseRulesTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Elegí una plantilla de Reglas</h2>
              <button onClick={() => setShowHouseRulesTemplate(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {Object.entries(TEMPLATES.houseRules).map(([key, template]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <h3 className="font-semibold text-gray-900 mb-2 capitalize">{key === 'standard' ? 'Estándar' : key === 'strict' ? 'Estrictas' : 'Flexibles'}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">{template.substring(0, 200)}...</p>
                  <Button onClick={() => applyTemplate('houseRules', key)} size="sm">
                    Usar esta plantilla
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}