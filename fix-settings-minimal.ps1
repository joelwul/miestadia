Write-Host " Creando Settings versión minimalista..." -ForegroundColor Cyan

$settingsContent = @'
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Save, Upload, Trash2, Wifi } from 'lucide-react'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default function SettingsPage({ params }: Props) {
  const [tenantSlug, setTenantSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [name, setName] = useState('')
  const [checkIn, setCheckIn] = useState('15:00')
  const [checkOut, setCheckOut] = useState('11:00')
  const [notes, setNotes] = useState('')
  const supabase = createClient()

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
        setName(tenant.name || '')
        setCheckIn(tenant.settings?.checkInTime || '15:00')
        setCheckOut(tenant.settings?.checkOutTime || '11:00')
        setNotes(tenant.settings?.notes || '')
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
        name: name,
        settings: {
          checkInTime: checkIn,
          checkOutTime: checkOut,
          notes: notes,
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
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nombre</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Check-in</label>
                <Input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Check-out</label>
                <Input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required />
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas internas..."
              className="w-full min-h-[150px] px-3 py-2 border border-gray-300 rounded-lg"
            />
          </CardContent>
        </Card>

        <Button type="submit" size="lg" disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>

        {saved && <span className="text-green-600">✓ Guardado</span>}
      </form>
    </div>
  )
}
'@

$settingsContent | Out-File -FilePath "src\app\(admin)\[tenantSlug]\admin\settings\page.tsx" -Encoding UTF8 -Force
Write-Host "✅ Settings minimalista creado" -ForegroundColor Green
Write-Host ""
Write-Host "Recargá: http://localhost:3000/centroelprogreso/admin/settings" -ForegroundColor Cyan
Write-Host ""
Write-Host "Esta versión es SUPER simple - solo nombre, horarios y notas." -ForegroundColor Yellow
Write-Host "Si funciona, después agregamos el resto." -ForegroundColor Yellow