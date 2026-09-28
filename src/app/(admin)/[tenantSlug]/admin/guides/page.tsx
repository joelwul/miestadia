'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, MapPin, Save } from 'lucide-react'

interface Props {
  params: Promise<{ tenantSlug: string }>
}

export default function GuidesPage({ params }: Props) {
  const [tenantSlug, setTenantSlug] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [activeTab, setActiveTab] = useState<'accommodation' | 'destination'>('accommodation')
  const [guide, setGuide] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

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
        await loadGuide(tenant.id, 'accommodation')
      }
    }
    init()
  }, [params])

  async function loadGuide(tid: string, type: string) {
    const { data } = await supabase
      .from('guide_contents')
      .select('*')
      .eq('tenant_id', tid)
      .eq('type', type)
      .single()

    if (data) {
      setGuide(data)
    } else {
      setGuide({
        tenant_id: tid,
        type,
        title: type === 'accommodation' ? 'Guía del Alojamiento' : 'Guía del Destino',
        content: '',
        sections: [],
      })
    }
    setLoading(false)
  }

  async function saveGuide() {
    if (!guide) return
    setSaving(true)

    let result
    if (guide.id) {
      result = await supabase
        .from('guide_contents')
        .update({ ...guide, updated_at: new Date().toISOString() })
        .eq('id', guide.id)
    } else {
      result = await supabase
        .from('guide_contents')
        .insert(guide)
        .select()
        .single()
    }

    if (result.data) {
      setGuide(result.data)
      alert('✅ Guía guardada correctamente')
    } else {
      alert('❌ Error: ' + result.error?.message)
    }
    setSaving(false)
  }

  function addSection() {
    const sections = guide.sections || []
    sections.push({ title: 'Nueva sección', content: '' })
    setGuide({ ...guide, sections })
  }

  function updateSection(index: number, field: string, value: string) {
    const sections = [...(guide.sections || [])]
    sections[index] = { ...sections[index], [field]: value }
    setGuide({ ...guide, sections })
  }

  function removeSection(index: number) {
    const sections = (guide.sections || []).filter((_: any, i: number) => i !== index)
    setGuide({ ...guide, sections })
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Guías</h1>
          <p className="text-gray-500 mt-1">Editá la información que ven los huéspedes</p>
        </div>
        <Button onClick={saveGuide} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={activeTab === 'accommodation' ? 'default' : 'outline'}
          onClick={() => { setActiveTab('accommodation'); setLoading(true); loadGuide(tenantId, 'accommodation') }}
        >
          <FileText className="mr-2 h-4 w-4" />
          Guía del Alojamiento
        </Button>
        <Button
          variant={activeTab === 'destination' ? 'default' : 'outline'}
          onClick={() => { setActiveTab('destination'); setLoading(true); loadGuide(tenantId, 'destination') }}
        >
          <MapPin className="mr-2 h-4 w-4" />
          Guía del Destino
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Título</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={guide?.title || ''}
            onChange={(e) => setGuide({ ...guide, title: e.target.value })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Descripción general</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={guide?.content || ''}
            onChange={(e) => setGuide({ ...guide, content: e.target.value })}
            className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Descripción general de la guía..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Secciones</CardTitle>
            <Button variant="outline" size="sm" onClick={addSection}>
              + Agregar sección
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(guide?.sections || []).map((section: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={section.title}
                  onChange={(e) => updateSection(index, 'title', e.target.value)}
                  placeholder="Título de la sección"
                  className="flex-1"
                />
                <Button variant="ghost" size="sm" onClick={() => removeSection(index)} className="text-red-600">
                  ✕
                </Button>
              </div>
              <textarea
                value={section.content}
                onChange={(e) => updateSection(index, 'content', e.target.value)}
                className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Contenido de la sección..."
              />
            </div>
          ))}
          {(guide?.sections || []).length === 0 && (
            <p className="text-center text-gray-500 py-8">No hay secciones. Agregá la primera.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}