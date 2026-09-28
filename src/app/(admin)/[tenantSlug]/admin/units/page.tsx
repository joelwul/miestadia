'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Save, X, Bed, Package } from 'lucide-react'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

interface InventoryItem {
  id: string
  unit_id: string
  category: string
  custom_category: string | null
  name: string
  quantity: number
  description: string | null
  order: number
}

const DEFAULT_CATEGORIES = [
  { value: 'bedding', label: 'Ropa de cama' },
  { value: 'kitchen', label: 'Cocina' },
  { value: 'bathroom', label: 'Baño' },
]

export default function UnitsPage({ params }: Props) {
  const [tenantSlug, setTenantSlug] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [units, setUnits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showInventory, setShowInventory] = useState<string | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [showInventoryForm, setShowInventoryForm] = useState(false)
  const [editingInventoryId, setEditingInventoryId] = useState<string | null>(null)
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [newCustomCategory, setNewCustomCategory] = useState('')
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    capacity: 1,
    price_per_night: 0,
    status: 'active',
  })

  const [inventoryFormData, setInventoryFormData] = useState({
    unit_id: '',
    category: '',
    custom_category: '',
    name: '',
    quantity: 1,
    description: '',
    order: 0,
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
        await loadUnits(tenant.id)
        await loadCustomCategories(tenant.id)
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
    setLoading(false)
  }

  async function loadCustomCategories(tid: string) {
    const { data } = await supabase
      .from('unit_inventory_items')
      .select('custom_category')
      .eq('tenant_id', tid)
      .not('custom_category', 'is', null)

    if (data) {
      const categories = [...new Set(data.map(item => item.custom_category))]
      setCustomCategories(categories.filter((c): c is string => c !== null))
    }
  }

  async function loadInventory(unitId: string) {
    const { data } = await supabase
      .from('unit_inventory_items')
      .select('*')
      .eq('unit_id', unitId)
      .order('category')
      .order('order')

    if (data) setInventory(data)
  }

  function resetForm() {
    setFormData({
      name: '',
      type: '',
      description: '',
      capacity: 1,
      price_per_night: 0,
      status: 'active',
    })
    setEditingId(null)
    setShowForm(false)
  }

  function handleEdit(unit: any) {
    setFormData({
      name: unit.name || '',
      type: unit.type || '',
      description: unit.description || '',
      capacity: unit.capacity || 1,
      price_per_night: unit.price_per_night || 0,
      status: unit.status || 'active',
    })
    setEditingId(unit.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!formData.name) {
      alert('El nombre es obligatorio')
      return
    }

    const unitData = {
      tenant_id: tenantId,
      name: formData.name,
      type: formData.type || null,
      description: formData.description || null,
      capacity: formData.capacity,
      price_per_night: formData.price_per_night,
      status: formData.status,
    }

    let result
    if (editingId) {
      result = await supabase
        .from('units')
        .update(unitData)
        .eq('id', editingId)
    } else {
      result = await supabase
        .from('units')
        .insert(unitData)
    }

    if (result.error) {
      alert('Error: ' + result.error.message)
    } else {
      await loadUnits(tenantId)
      resetForm()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta unidad?')) return
    
    await supabase
      .from('units')
      .delete()
      .eq('id', id)
    
    await loadUnits(tenantId)
  }

  function toggleInventory(unitId: string) {
    if (showInventory === unitId) {
      setShowInventory(null)
    } else {
      setShowInventory(unitId)
      loadInventory(unitId)
      setInventoryFormData({ ...inventoryFormData, unit_id: unitId })
    }
  }

  function resetInventoryForm() {
    setInventoryFormData({
      unit_id: showInventory || '',
      category: '',
      custom_category: '',
      name: '',
      quantity: 1,
      description: '',
      order: 0,
    })
    setEditingInventoryId(null)
    setShowInventoryForm(false)
  }

  function handleEditInventory(item: InventoryItem) {
    setInventoryFormData({
      unit_id: item.unit_id,
      category: item.category,
      custom_category: item.custom_category || '',
      name: item.name,
      quantity: item.quantity,
      description: item.description || '',
      order: item.order,
    })
    setEditingInventoryId(item.id)
    setShowInventoryForm(true)
  }

  async function handleSaveInventory() {
    if (!inventoryFormData.name || !inventoryFormData.category) {
      alert('Nombre y categoría son obligatorios')
      return
    }

    const itemData = {
      tenant_id: tenantId,
      unit_id: inventoryFormData.unit_id,
      category: inventoryFormData.category,
      custom_category: inventoryFormData.category === 'custom' ? inventoryFormData.custom_category : null,
      name: inventoryFormData.name,
      quantity: inventoryFormData.quantity,
      description: inventoryFormData.description || null,
      order: inventoryFormData.order,
    }

    let result
    if (editingInventoryId) {
      result = await supabase
        .from('unit_inventory_items')
        .update(itemData)
        .eq('id', editingInventoryId)
    } else {
      result = await supabase
        .from('unit_inventory_items')
        .insert(itemData)
    }

    if (result.error) {
      alert('Error: ' + result.error.message)
    } else {
      await loadInventory(showInventory!)
      await loadCustomCategories(tenantId)
      resetInventoryForm()
    }
  }

  async function handleDeleteInventory(id: string) {
    if (!confirm('¿Eliminar este item?')) return
    
    await supabase
      .from('unit_inventory_items')
      .delete()
      .eq('id', id)
    
    await loadInventory(showInventory!)
  }

  function addCustomCategory() {
    if (newCustomCategory.trim()) {
      setCustomCategories([...customCategories, newCustomCategory.trim()])
      setNewCustomCategory('')
    }
  }

  function getAllCategories() {
    return [
      ...DEFAULT_CATEGORIES,
      { value: 'custom', label: 'Personalizada' },
      ...customCategories.map(cat => ({ value: cat, label: cat })),
    ]
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Unidades</h1>
          <p className="text-gray-500 mt-1">{units.length} unidades registradas</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Unidad
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editingId ? 'Editar Unidad' : 'Nueva Unidad'}</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nombre *</label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: Cabaña 1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tipo</label>
                <Input value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} placeholder="Ej: Familiar, Doble" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Capacidad</label>
                <Input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })} min="1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Precio por noche</label>
                <Input type="number" value={formData.price_per_night} onChange={(e) => setFormData({ ...formData, price_per_night: parseFloat(e.target.value) || 0 })} min="0" step="0.01" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Estado</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white">
                  <option value="active">Activa</option>
                  <option value="inactive">Inactiva</option>
                  <option value="maintenance">En mantenimiento</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Guardar
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {units.map((unit) => (
          <Card key={unit.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Bed className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-900">{unit.name}</h3>
                      {unit.type && <Badge variant="secondary">{unit.type}</Badge>}
                      <Badge className={
                        unit.status === 'active' ? 'bg-green-100 text-green-800' :
                        unit.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {unit.status === 'active' ? 'Activa' : unit.status === 'inactive' ? 'Inactiva' : 'Mantenimiento'}
                      </Badge>
                    </div>
                    {unit.description && (
                      <p className="text-sm text-gray-600 mt-1">{unit.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>👥 Capacidad: {unit.capacity}</span>
                      {unit.price_per_night > 0 && <span>💰 ${unit.price_per_night}/noche</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" onClick={() => toggleInventory(unit.id)}>
                    <Package className="mr-2 h-4 w-4" />
                    {showInventory === unit.id ? 'Cerrar' : 'Inventario'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(unit)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(unit.id)} className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Sección de Inventario */}
              {showInventory === unit.id && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Inventario de {unit.name}</h4>
                    <Button size="sm" onClick={() => { resetInventoryForm(); setShowInventoryForm(true) }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Item
                    </Button>
                  </div>

                  {showInventoryForm && (
                    <Card className="mb-4 bg-gray-50">
                      <CardContent className="p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-gray-500">Categoría *</label>
                            <select
                              value={inventoryFormData.category}
                              onChange={(e) => setInventoryFormData({ ...inventoryFormData, category: e.target.value })}
                              className="w-full h-9 px-2 border border-gray-300 rounded bg-white text-sm"
                            >
                              <option value="">Seleccionar</option>
                              {getAllCategories().map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                              ))}
                            </select>
                          </div>
                          {inventoryFormData.category === 'custom' && (
                            <div>
                              <label className="text-xs text-gray-500">Nombre de categoría personalizada</label>
                              <div className="flex gap-2">
                                <Input
                                  value={inventoryFormData.custom_category}
                                  onChange={(e) => setInventoryFormData({ ...inventoryFormData, custom_category: e.target.value })}
                                  placeholder="Nueva categoría"
                                  className="h-9"
                                />
                                <Button type="button" size="sm" onClick={addCustomCategory}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                          <div>
                            <label className="text-xs text-gray-500">Nombre del item *</label>
                            <Input
                              value={inventoryFormData.name}
                              onChange={(e) => setInventoryFormData({ ...inventoryFormData, name: e.target.value })}
                              placeholder="Ej: Sábanas queen"
                              className="h-9"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Cantidad</label>
                            <Input
                              type="number"
                              value={inventoryFormData.quantity}
                              onChange={(e) => setInventoryFormData({ ...inventoryFormData, quantity: parseInt(e.target.value) || 1 })}
                              min="1"
                              className="h-9"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Descripción (opcional)</label>
                          <Input
                            value={inventoryFormData.description}
                            onChange={(e) => setInventoryFormData({ ...inventoryFormData, description: e.target.value })}
                            placeholder="Detalles adicionales"
                            className="h-9"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveInventory}>
                            <Save className="mr-2 h-4 w-4" />
                            Guardar
                          </Button>
                          <Button size="sm" variant="outline" onClick={resetInventoryForm}>
                            Cancelar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {inventory.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No hay items en el inventario</p>
                  ) : (
                    <div className="space-y-2">
                      {getAllCategories().map(cat => {
                        const items = inventory.filter(item => item.category === cat.value)
                        if (items.length === 0) return null
                        return (
                          <div key={cat.value} className="border border-gray-200 rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-2">{cat.label}</h5>
                            <div className="space-y-2">
                              {items.map(item => (
                                <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded p-2">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                    {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary">x{item.quantity}</Badge>
                                    <Button size="sm" variant="ghost" onClick={() => handleEditInventory(item)}>
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleDeleteInventory(item.id)} className="text-red-600">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}