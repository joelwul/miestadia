'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  params: Promise<{ tenantSlug: string }>
  searchParams: Promise<{ code?: string; lastName?: string }>
}

export default function GuestLoginPage({ params, searchParams }: Props) {
  const [tenantSlug, setTenantSlug] = useState('')
  const [tenant, setTenant] = useState<any>(null)
  const [code, setCode] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params
      const resolvedSearchParams = await searchParams
      setTenantSlug(resolvedParams.tenantSlug)
      if (resolvedSearchParams.code) setCode(resolvedSearchParams.code)
      if (resolvedSearchParams.lastName) setLastName(resolvedSearchParams.lastName)

      const { data: tenantData } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', resolvedParams.tenantSlug)
        .single()
      if (tenantData) setTenant(tenantData)
    }
    init()
  }, [params, searchParams])

  async function handleAccess(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: tenantData } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single()

    if (!tenantData) {
      setError('Alojamiento no encontrado')
      setLoading(false)
      return
    }

    const { data: res } = await supabase
      .from('reservations')
      .select('*, guests (first_name, last_name)')
      .eq('tenant_id', tenantData.id)
      .eq('reservation_code', code.toUpperCase().trim())
      .single()

    if (!res) {
      setError('Código de reserva no encontrado.')
      setLoading(false)
      return
    }

    if (res.guests?.last_name?.toLowerCase().trim() !== lastName.toLowerCase().trim()) {
      setError(`El apellido no coincide. Registrado: "${res.guests?.last_name}"`)
      setLoading(false)
      return
    }

    if (res.status === 'cancelled') {
      setError('Esta reserva está cancelada')
      setLoading(false)
      return
    }

    localStorage.setItem('guest_session', JSON.stringify({
      reservationId: res.id,
      tenantId: tenantData.id,
      guestName: res.guests?.first_name,
      reservationCode: res.reservation_code,
      lastName: res.guests?.last_name,
      expiresAt: Date.now() + 86400000
    }))

    window.location.href = `/${tenantSlug}/stay`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          {tenant?.branding?.logoUrl && (
            <img src={tenant.branding.logoUrl} alt="Logo" className="h-16 mx-auto mb-4" />
          )}
          <h1 className="text-3xl font-bold text-green-800 mb-2">{tenant?.name || 'Mi Estadía'}</h1>
          <p className="text-green-600">Tu estadía empieza antes de llegar</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Acceder a mi estadía</h2>
            <form onSubmit={handleAccess} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Código de reserva</label>
                <Input value={code} onChange={(e) => { setCode(e.target.value); setError('') }} placeholder="Ej: CEP-7F92K" required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Apellido del titular</label>
                <Input value={lastName} onChange={(e) => { setLastName(e.target.value); setError('') }} placeholder="Ej: Pérez" required />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <p className="font-medium">Error al ingresar</p>
                  <p className="mt-1">{error}</p>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>
            <p className="text-xs text-gray-500 text-center mt-4">¿No tenés tu código? Contactá a tu alojamiento</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}