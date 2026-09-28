'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MapPin, Plus, Edit, Trash2, Save, X, Utensils, TreePalm, Landmark, ShoppingBag, Coffee, Waves } from 'lucide-react'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

const CATEGORIES = [
  { value: 'restaurant', label: 'Restaurante', icon: Utensils, color: 'bg-orange-100 text-orange-800' },
  { value: 'activity', label: 'Actividad', icon: TreePalm, color: 'bg-green-100 text-green-800' },
  { value: 'landmark', label: 'Punto de interés', icon: Landmark, color: 'bg-purple-100 text-purple-800' },
  { value: 'shopping', label: 'Compras', icon: ShoppingBag, color: 'bg-pink-100 text-pink-800' },
  { value: 'cafe', label: 'Café / Bar', icon: Coffee, color: 'bg-amber-100 text-amber-800' },
  { value: 'beach', label: 'Playa / Naturaleza', icon: Waves, color: 'bg-cyan-100 text-cyan-800' },
]

export default function DestinationPage({ params }: Props) {
  const [tenantSlug, setTenantSlug] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [places, setPlaces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    address: '',
    hours: '',
    phone: '',
    website: '',
    googleMapsUrl: '',
    imageUrl: '',
    tips: '',
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
        await loadPlaces(tenant.id)
      }
    }
    init()
  }, [params])

  async function loadPlaces(tid: string) {
    const { data } = await supabase
      .from('destination_places')
      .select('*')
      .eq('tenant_id', tid)
      .order('order', { ascending: true })

    if (data) setPlaces(data)
    setLoading(false)
  }

  function resetForm() {
    setFormData({
      name: '',
      category: '',
      description: '',
      address: '',
      hours: '',
      phone: '',
      website: '',
      googleMapsUrl: '',
      imageUrl: '',
      tips: '',
      order: places.length + 1,
    })
    setEditingId(null)
    setShowForm(false)
  }

  function handleEdit(place: any) {
    setFormData({
      name: place.name || '',
      category: place.category || '',
      description: place.description || '',
      address: place.address || '',
      hours: place.hours || '',
      phone: place.phone || '',
      website: place.website || '',
      googleMapsUrl: place.google_maps_url || '',
      imageUrl: place.image_url || '',
      tips: place.tips || '',
      order: place.order || 0,
    })
    setEditingId(place.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!formData.name || !formData.category) {
      alert('Nombre y categoría son obligatorios')
      return
    }

    setSaving(true)

    const placeData = {
      tenant_id: tenantId,
      name: formData.name,
      category: formData.category,
      description: formData.description || null,
      address: formData.address || null,
      hours: formData.hours || null,
      phone: formData.phone || null,
      website: formData.website || null,
      google_maps_url: formData.googleMapsUrl || null,
      image_url: formData.imageUrl || null,
      tips: formData.tips || null,
      order: formData.order,
    }

    let result
    if (editingId) {
      result = await supabase
        .from('destination_places')
        .update(placeData)
        .eq('id', editingId)
    } else {
      result = await supabase
        .from('destination_places')
        .insert(placeData)
    }

    if (result.error) {
      alert('Error: ' + result.error.message)
    } else {
      await loadPlaces(tenantId)
      resetForm()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este lugar?')) return
    
    await supabase
      .from('destination_places')
      .delete()
      .eq('id', id)
    
    await loadPlaces(tenantId)
  }

  function getCategoryConfig(value: string) {
    return CATEGORIES.find(c => c.value === value) || CATEGORIES[0]
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Guía del Destino</h1>
          <p className="text-gray-500 mt-1">
            {places.length} lugares recomendados para tus huéspedes
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar lugar
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editingId ? 'Editar lugar' : 'Nuevo lugar'}</CardTitle>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nombre *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Restaurante El Mirador"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Categoría *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="">Seleccionar categoría</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Descripción del lugar..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Dirección</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Calle y número"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Horarios</label>
                <Input
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  placeholder="Ej: Lun-Dom 12:00 - 23:00"
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
                <label className="text-sm font-medium text-gray-700">Sitio web</label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">URL de Google Maps</label>
                <Input
                  value={formData.googleMapsUrl}
                  onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">URL de imagen</label>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Tips / Recomendaciones</label>
                <textarea
                  value={formData.tips}
                  onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
                  className="w-full min-h-[60px] px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Consejos para los huéspedes..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Orden</label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lugares recomendados</CardTitle>
        </CardHeader>
        <CardContent>
          {places.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No hay lugares agregados</p>
              <p className="text-sm text-gray-400 mt-1">Hacé clic en "Agregar lugar" para empezar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {places.map((place) => {
                const catConfig = getCategoryConfig(place.category)
                const Icon = catConfig.icon
                return (
                  <div key={place.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${catConfig.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900">{place.name}</p>
                            <Badge className={catConfig.color}>{catConfig.label}</Badge>
                          </div>
                          {place.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{place.description}</p>
                          )}
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                            {place.address && <span>📍 {place.address}</span>}
                            {place.hours && <span>🕐 {place.hours}</span>}
                            {place.phone && <span>📱 {place.phone}</span>}
                          </div>
                          {place.tips && (
                            <p className="text-xs text-blue-600 mt-2 italic">💡 {place.tips}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(place)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(place.id)} className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}