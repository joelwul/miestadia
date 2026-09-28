'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X, Upload, AlertCircle } from 'lucide-react'

interface Props {
  tenantSlug: string
  onClose: () => void
  onSaved: () => void
}

export default function CSVImport({ tenantSlug, onClose, onSaved }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [units, setUnits] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadUnits()
  }, [tenantSlug])

  async function loadUnits() {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single()

    if (tenant) {
      const { data } = await supabase
        .from('units')
        .select('id, name')
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
      
      if (data) setUnits(data)
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFile(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.trim())
      
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim())
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index]
        })
        return row
      })

      setPreview(data)
    }
    reader.readAsText(file)
  }

  function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = 'CEP-'
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  async function handleImport() {
    if (!file || preview.length === 0) return

    setLoading(true)

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single()

    if (!tenant) {
      setLoading(false)
      return
    }

    let successCount = 0

    for (const row of preview) {
      const { data: guest } = await supabase
        .from('guests')
        .insert({
          tenant_id: tenant.id,
          first_name: row.nombre || row.firstName || 'Huésped',
          last_name: row.apellido || row.lastName || 'Sin apellido',
          email: row.email || '',
          phone: row.telefono || row.phone || '',
          country: 'Argentina',
        })
        .select()
        .single()

      if (guest) {
        await supabase
          .from('reservations')
          .insert({
            tenant_id: tenant.id,
            reservation_code: generateCode(),
            guest_id: guest.id,
            unit_id: units[0]?.id,
            check_in: row.checkIn || new Date().toISOString().split('T')[0],
            check_out: row.checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0],
            status: 'booked',
            source: 'csv_import',
          })
        
        successCount++
      }
    }

    if (successCount > 0) {
      onSaved()
      onClose()
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Importar CSV</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium text-gray-700 mb-2">
              Arrastrá un archivo CSV o hacé clic para seleccionar
            </p>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <Button type="button" variant="outline" onClick={() => document.getElementById('csv-upload')?.click()}>
              Seleccionar Archivo
            </Button>
          </div>

          {preview.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Previsualización ({preview.length} reservas)
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Nombre</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Check-in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((row, index) => (
                      <tr key={index} className="border-t border-gray-200">
                        <td className="px-4 py-2">{row.nombre || row.firstName || '—'}</td>
                        <td className="px-4 py-2">{row.email || '—'}</td>
                        <td className="px-4 py-2">{row.checkIn || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 5 && (
                  <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500">
                    ... y {preview.length - 5} más
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleImport} disabled={loading} className="flex-1">
                  {loading ? 'Importando...' : `Importar ${preview.length} Reservas`}
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
