Write-Host " Agregando WiFi múltiple a Settings..." -ForegroundColor Cyan

$settingsContent = @'
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Save, Plus, Trash2, Wifi } from 'lucide-react'

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
    description: '',
    address: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    notes: '',
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
        setFormData({
          name: tenant.name || '',
          description: tenant.description || '',
          address: tenant.settings?.address || '',
          phone: tenant.settings?.phone || '',
          whatsappNumber: tenant.settings?.whatsappNumber || '',
          email: tenant.settings?.email || '',
          checkInTime: tenant.settings?.checkInTime || '15:00',
          checkOutTime: tenant.settings?.checkOutTime || '11:00',
          notes: tenant.settings?.notes || '',
        })

        if (tenant.settings?.wifiNetworks && tenant.settings.wifiNetworks.length > 0) {
          setWifiNetworks(tenant.settings.wifiNetworks)
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 mt-1">Gestioná la información de tu alojamiento</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
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
              <label className="text-sm font-medium text-gray-700">Descripción</label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
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

        {saved && <Badge variant="default" className="bg-green-600">✓ Guardado</Badge>}
      </form>
    </div>
  )
}
'@

$settingsContent | Out-File -FilePath "src\app\(admin)\[tenantSlug]\admin\settings\page.tsx" -Encoding UTF8 -Force
Write-Host "✅ WiFi múltiple agregado" -ForegroundColor Green
Write-Host ""
Write-Host "Recargá: http://localhost:3000/centroelprogreso/admin/settings" -ForegroundColor Cyan