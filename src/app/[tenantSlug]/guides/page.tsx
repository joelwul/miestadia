'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, MapPin, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{ type?: string }>
}

export default function GuidesPage({ params, searchParams }: Props) {
  const [tenantSlug, setTenantSlug] = useState('')
  const [tenant, setTenant] = useState<any>(null)
  const [guide, setGuide] = useState<any>(null)
  const [activeType, setActiveType] = useState<'accommodation' | 'destination'>('accommodation')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params
      const resolvedSearchParams = await searchParams
      
      setTenantSlug(resolvedParams.tenantSlug)
      
      if (resolvedSearchParams.type === 'destination') {
        setActiveType('destination')
      }

      const { data: tenantData } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', resolvedParams.tenantSlug)
        .single()

      if (tenantData) {
        setTenant(tenantData)
        await loadGuide(tenantData.id, resolvedSearchParams.type === 'destination' ? 'destination' : 'accommodation')
      }
    }
    init()
  }, [params, searchParams])

  async function loadGuide(tid: string, type: string) {
    const { data } = await supabase
      .from('guide_contents')
      .select('*')
      .eq('tenant_id', tid)
      .eq('type', type)
      .single()

    if (data) setGuide(data)
    setLoading(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-600">Cargando...</p></div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-700 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <Link href={`/${tenantSlug}/stay`} className="inline-flex items-center gap-2 text-green-100 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4" /> Volver a mi estadía
          </Link>
          {tenant?.branding?.logoUrl && (
            <img src={tenant.branding.logoUrl} alt="Logo" className="h-16 w-auto mb-4 bg-white rounded-lg p-2" />
          )}
          <h1 className="text-3xl font-bold">{tenant?.name}</h1>
          <p className="text-green-100 mt-1">Información para tu estadía</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveType('accommodation'); setLoading(true); loadGuide(tenant.id, 'accommodation') }}
            className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
              activeType === 'accommodation' ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <FileText className={`h-6 w-6 mb-2 ${activeType === 'accommodation' ? 'text-green-600' : 'text-gray-400'}`} />
            <p className="font-semibold">Guía del Alojamiento</p>
            <p className="text-sm text-gray-500">Normas, servicios e información útil</p>
          </button>
          <button
            onClick={() => { setActiveType('destination'); setLoading(true); loadGuide(tenant.id, 'destination') }}
            className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
              activeType === 'destination' ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <MapPin className={`h-6 w-6 mb-2 ${activeType === 'destination' ? 'text-green-600' : 'text-gray-400'}`} />
            <p className="font-semibold">Guía del Destino</p>
            <p className="text-sm text-gray-500">Recomendaciones y secretos del anfitrión</p>
          </button>
        </div>

        {guide && (
          <>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{guide.title}</h2>
                {guide.content && (
                  <p className="text-gray-700 whitespace-pre-wrap">{guide.content}</p>
                )}
              </CardContent>
            </Card>

            {(guide.sections || []).map((section: any, index: number) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{section.title}</h3>
                  {section.content ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{section.content}</p>
                  ) : (
                    <p className="text-gray-400 italic">Contenido próximamente...</p>
                  )}
                </CardContent>
              </Card>
            ))}

            {activeType === 'accommodation' && tenant?.settings?.googleMapsUrl && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">📍 Ubicación</h3>
                  <a
                    href={tenant.settings.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Ver en Google Maps →
                  </a>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!guide && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">Esta guía aún no tiene contenido.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}