Write-Host "🏠 Creando Gestión de Unidades..." -ForegroundColor Cyan

$unitsContent = @'
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Bed, Users, DollarSign } from 'lucide-react'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default function UnitsPage({ params }: Props) {
  const [tenantSlug, setTenantSlug] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [units, setUnits] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingUnit, setEditingUnit] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: '',
    type: 'cabin',
    capacity: 2,
    price: 0,
    description: '',
    status: 'active',
  })

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
        loadUnits(tenant.id)
      }
    }
    init()
  }, [params])

  async function loadUnits(tid: string) {
    const { data } = await supabase
      .from('units')
      .select('*')
      .eq('tenant_id', tid)
      .order('name')

    if (data) setUnits(data)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    if (editingUnit) {
      await supabase
        .from('units')
        .update(formData)
        .eq('id', editingUnit.id)
    } else {
      await supabase
        .from('units')
        .insert({ ...formData, tenant_id: tenantId })
    }

    loadUnits(tenantId)
    setShowForm(false)
    setEditingUnit(null)
    setFormData({ name: '', type: 'cabin', capacity: 2, price: 0, description: '', status: 'active' })
    setLoading(false)
  }

  async function deleteUnit(id: string) {
    if (confirm('¿Eliminar esta unidad?')) {
      await supabase.from('units').delete().eq('id', id)
      loadUnits(tenantId)
    }
  }

  function editUnit(unit: any) {
    setEditingUnit(unit)
    setFormData({
      name: unit.name,
      type: unit.type,
      capacity: unit.capacity,
      price: unit.price,
      description: unit.description || '',
      status: unit.status,
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Unidades</h1>
          <p className="text-gray-500 mt-1">Gestioná cabañas, habitaciones, camping</p>
        </div>
        <Button size="lg" onClick={() => { setShowForm(true); setEditingUnit(null); }}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Unidad
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingUnit ? 'Editar' : 'Nueva'} Unidad</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nombre *</label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg"
                  >
                    <option value="cabin">Cabaña</option>
                    <option value="room">Habitación</option>
                    <option value="camping">Camping</option>
                    <option value="apartment">Departamento</option>
                    <option value="house">Casa</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Capacidad (personas)</label>
                  <Input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })} min="1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Precio por noche</label>
                  <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })} min="0" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingUnit(null); }}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {units.map((unit) => (
          <Card key={unit.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{unit.name}</h3>
                  <Badge variant={unit.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                    {unit.status === 'active' ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => editUnit(unit)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteUnit(unit.id)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Bed className="h-4 w-4" />
                  <span>{unit.type === 'cabin' ? 'Cabaña' : unit.type === 'room' ? 'Habitación' : unit.type === 'camping' ? 'Camping' : unit.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{unit.capacity} personas</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>${unit.price}/noche</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {units.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Bed className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">No hay unidades creadas</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear primera unidad
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
'@

New-Item -ItemType Directory -Path "src\app\(admin)\[tenantSlug]\admin\units" -Force | Out-Null
$unitsContent | Out-File -FilePath "src\app\(admin)\[tenantSlug]\admin\units\page.tsx" -Encoding UTF8 -Force
Write-Host "✅ Gestión de Unidades creada" -ForegroundColor Green