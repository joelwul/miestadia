Write-Host "🔧 Corrigiendo Settings con React.use()..." -ForegroundColor Cyan

$filePath = "src\app\(admin)\[tenantSlug]\admin\settings\page.tsx"

# Verificar que existe la carpeta
$folder = Split-Path $filePath
if (-not (Test-Path $folder)) {
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    Write-Host "✓ Carpeta creada" -ForegroundColor Green
}

# Contenido corregido
$content = @'
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Save, Upload, Plus, Trash2, Wifi, FileText } from 'lucide-react'

interface WifiNetwork {
  id: string
  ssid: string
  password: string
}

export default function SettingsPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const resolvedParams = React.use(params)
  const tenantSlug = resolvedParams.tenantSlug
  
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    primaryColor: '#166534',
    secondaryColor: '#F59E0B',
    logoUrl: '',
    notes: '',
  })

  const [wifiNetworks, setWifiNetworks] = useState<WifiNetwork[]>([
    { id: '1', ssid: '', password: '' }
  ])

  useEffect(() => {
    loadSettings()
  }, [tenantSlug])

  async function loadSettings() {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', tenantSlug)
      .single()

    if (tenant) {
      const settings = tenant.settings || {}
      const branding = tenant.branding || {}
      
      setFormData({
        name: tenant.name || '',
        description: tenant.description || '',
        address: settings.address || '',
        phone: settings.phone || '',
        whatsappNumber: settings.whatsappNumber || '',
        email: settings.email || '',
        checkInTime: settings.checkInTime || '15:00',
        checkOutTime: settings.checkOutTime || '11:00',
        primaryColor: branding.primaryColor || '#166534',
        secondaryColor: branding.secondaryColor || '#F59E0B',
        logoUrl: branding.logoUrl || '',
        notes: settings.notes || '',
      })

      if (settings.wifiNetworks && settings.wifiNetworks.length > 0) {
        setWifiNetworks(settings.wifiNetworks)
      }
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    const { error } = await supabase
      .from('tenants')
      .update({
        name: formData.name,
        description: formData.description,
        settings: {
          address: formData.address,
          phone: formData.phone,
          whatsappNumber: formData.whatsappNumber,
          email: formData.email,
          checkInTime: formData.checkInTime,
          checkOutTime: formData.checkOutTime,
          wifiNetworks: wifiNetworks.filter(n => n.ssid.trim() !== ''),
          notes: formData.notes,
        },
        branding: {
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          logoUrl: formData.logoUrl,
        },
      })
      .eq('slug', tenantSlug)

    if (!error) {
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

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('tenant-logos')
      .upload(fileName, file)

    if (!uploadError) {
      const { data } = supabase.storage
        .from('tenant-logos')
        .getPublicUrl(fileName)
      
      setFormData({ ...formData, logoUrl: data.publicUrl })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 mt-1">Gestioná la información de tu alojamiento</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Logo y Branding */}
        <Card>
          <CardHeader>
            <CardTitle>Logo y Marca</CardTitle>
            <CardDescription>Personalización visual de tu alojamiento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Logo del Alojamiento
              </label>
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
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                {formData.logoUrl && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={() => setFormData({ ...formData, logoUrl: '' })}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Formatos: PNG, JPG, SVG. Tamaño recomendado: 200x60px
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Color Principal</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Color Secundario</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>Datos principales del alojamiento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Nombre del Alojamiento *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Centro El Progreso"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Descripción</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descripción del alojamiento"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Dirección</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Dirección completa"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contacto */}
        <Card>
          <CardHeader>
            <CardTitle>Contacto</CardTitle>
            <CardDescription>Información de contacto y WhatsApp</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contacto@ejemplo.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Teléfono</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+54 9 11 1234-5678"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                WhatsApp 
                <Badge variant="info" className="ml-2">Importante</Badge>
              </label>
              <Input
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                placeholder="5491112345678 (sin espacios ni signos)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Número para que los huéspedes envíen mensajes desde la app
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Wi-Fi Múltiple */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  Redes Wi-Fi
                </CardTitle>
                <CardDescription>Configurá todas las redes disponibles</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addWifiNetwork}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Red
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {wifiNetworks.map((network, index) => (
              <div key={network.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Red {index + 1}</p>
                  {wifiNetworks.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeWifiNetwork(network.id)}
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Nombre de la Red (SSID)</label>
                    <Input
                      value={network.ssid}
                      onChange={(e) => updateWifiNetwork(network.id, 'ssid', e.target.value)}
                      placeholder="Ej: ElProgreso_Guest"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Contraseña</label>
                    <Input
                      value={network.password}
                      onChange={(e) => updateWifiNetwork(network.id, 'password', e.target.value)}
                      placeholder="Contraseña"
                    />
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
            <CardDescription>Check-in y Check-out</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Hora de Check-in</label>
                <Input
                  type="time"
                  value={formData.checkInTime}
                  onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Hora de Check-out</label>
                <Input
                  type="time"
                  value={formData.checkOutTime}
                  onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notas Internas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notas Internas
            </CardTitle>
            <CardDescription>Información solo visible para el administrador</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Notas sobre el alojamiento
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Información importante, instrucciones especiales, datos de proveedores, etc."
                className="w-full min-h-[150px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Estas notas solo las ves vos y tu equipo. No son visibles para los huéspedes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Botón Guardar */}
        <div className="flex items-center gap-4 pb-8">
          <Button type="submit" size="lg" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>

          {saved && (
            <Badge variant="default" className="bg-green-600">
              ✓ Guardado correctamente
            </Badge>
          )}
        </div>
      </form>
    </div>
  )
}
'@

# Escribir archivo
$content | Out-File -FilePath $filePath -Encoding UTF8 -Force

# Verificar que se escribió
if (Test-Path $filePath) {
    $fileSize = (Get-Item $filePath).Length
    Write-Host "✓ Archivo creado: $filePath ($fileSize bytes)" -ForegroundColor Green
    
    # Verificar que contiene React.use
    $fileContent = Get-Content $filePath -Raw
    if ($fileContent -match 'React\.use\(params\)') {
        Write-Host "✓ Contiene React.use(params) - CORRECTO" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No contiene React.use(params)" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ Error: No se pudo crear el archivo" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Settings corregido" -ForegroundColor Green
Write-Host "Recargá: http://localhost:3000/centroelprogreso/admin/settings" -ForegroundColor Cyan