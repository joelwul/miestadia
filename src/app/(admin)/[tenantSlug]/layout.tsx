import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminShell from '@/components/admin/AdminShell'

interface Props {
  children: React.ReactNode
  params: Promise<{ tenantSlug: string }>
}

export default async function AdminLayout({ children, params }: Props) {
  const { tenantSlug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('*, tenants(id, name, slug, subscription_status, trial_ends_at, subscription_ends_at)')
    .eq('user_id', user.id)
    .eq('tenants.slug', tenantSlug)
    .single()

  if (!tenantUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso no autorizado</h1>
          <p className="text-gray-600">No tenés permisos para acceder a este panel.</p>
          <Link href={`/${tenantSlug}`} className="text-green-600 hover:underline mt-4 inline-block">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  const tenant = tenantUser.tenants

  // ============================================
  // LÓGICA DE BLOQUEO POR SUSCRIPCIÓN
  // ============================================
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const trialEndsAt = tenant?.trial_ends_at ? new Date(tenant.trial_ends_at) : null
  const subscriptionEndsAt = tenant?.subscription_ends_at ? new Date(tenant.subscription_ends_at) : null
  const subscriptionStatus = tenant?.subscription_status || 'trial'

  let blocked = false
  let reason = ''

  if (subscriptionStatus === 'active') {
    if (subscriptionEndsAt && subscriptionEndsAt < now) {
      blocked = true
      reason = 'Tu suscripción ha finalizado.'
    }
  } else if (subscriptionStatus === 'cancelled') {
    if (subscriptionEndsAt && subscriptionEndsAt < now) {
      blocked = true
      reason = 'Tu período pagado ha finalizado.'
    }
  } else if (subscriptionStatus === 'trial') {
    if (trialEndsAt && trialEndsAt < now) {
      blocked = true
      reason = 'Tu período de prueba ha finalizado.'
    }
  } else if (subscriptionStatus === 'expired') {
    blocked = true
    reason = 'Tu cuenta está vencida.'
  }

  return (
    <AdminShell
      tenantName={tenant?.name || ''}
      tenantSlug={tenantSlug}
      subscription={{
        blocked,
        reason,
        trialEndsAt: tenant?.trial_ends_at || null,
        subscriptionEndsAt: tenant?.subscription_ends_at || null,
        subscriptionStatus,
      }}
    >
      {children}
    </AdminShell>
  )
}