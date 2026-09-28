Write-Host " Actualizando Settings completo..." -ForegroundColor Cyan

$settingsContent = @'
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Save, Plus, Trash2, Wifi, Upload, MapPin, Star } from 'lucide-react'

interface WifiNetwork {
  id: string
  ssid: string
  password: string
}

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default function SettingsPage({ params }: Props) {
  const [tenantSlug, setTenantSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
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
  })

  const [wifiNetworks, setWifiNetworks] = useState<WifiNetwork[]>([
    { id: '1', ssid: '', password: '' }
  ])

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
        })

        if (settings.wifiNetworks && settings.wifiNetworks.length > 0) {
          setWifiNetworks(settings.wifiNetworks)
        }
      }
    }
    init()
  }, [params])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    const { error } = await supabase
      .from('tenants')
      .update({
        name: formData.name,
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
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }

    setLoading(false)
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

  async function handleFileUpload(field: 'logoUrl' | 'mapImageUrl', e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const fileExt = file.name.split('.').pop()
    const fileName = `${tenantSlug}-${field}-${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('tenant-assets')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Error subiendo:', uploadError)
      alert('Error subiendo archivo: ' + uploadError.message)
      return
    }

    const { data } = supabase.storage
      .from('tenant-assets')
      .getPublicUrl(fileName)
    
    setFormData({ ...formData, [field]: data.publicUrl })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 mt-1">Gestioná la información de tu alojamiento</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Logo y Marca */}
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

        {/* Información Básica */}
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

        {/* Contacto */}
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

        {/* Google Maps y Reseñas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Google Maps</CardTitle>
            <CardDescription>Ubicación y reseñas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Link de Google Maps (ubicación)</label>
              <Input value={formData.googleMapsUrl} onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })} placeholder="https://maps.google.com/..." />
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

        {/* Wi-Fi */}
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

        {/* Horarios */}
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

        {/* Notas */}
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

        <Button type="submit" size="lg" disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>

        {saved && <Badge variant="default" className="bg-green-600 ml-4">✓ Guardado</Badge>}
      </form>
    </div>
  )
}
'@

$settingsContent | Out-File -FilePath "src\app\(admin)\[tenantSlug]\admin\settings\page.tsx" -Encoding UTF8 -Force
Write-Host "✅ Settings completo actualizado" -ForegroundColor Green