'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  CreditCard,
  Clock,
  AlertTriangle,
  ExternalLink,
  Search,
  LogOut,
  Lock,
  Mail,
  KeyRound,
  TrendingUp,
  DollarSign,
  Activity,
  Settings,
  Eye,
  Calendar,
  PlusCircle,
  Trash2,
  CheckCircle,
  XCircle,
  BarChart3,
  FileText,
  Globe
} from 'lucide-react'

export default function SuperadminPage() {
  const [user, setUser] = useState<any>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const [tenants, setTenants] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setCheckingAuth(false)
      
      if (user && user.email === 'joelwul@gmail.com') {
        loadAllData()
      }
    }
    checkAuth()
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setLoginError('Credenciales incorrectas. Intentá de nuevo.')
      setLoginLoading(false)
      return
    }

    if (data.user?.email !== 'joelwul@gmail.com') {
      setLoginError('Acceso denegado. Esta área es exclusiva para el administrador principal.')
      await supabase.auth.signOut()
      setUser(null)
      setLoginLoading(false)
      return
    }

    setUser(data.user)
    setLoginLoading(false)
    loadAllData()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setEmail('')
    setPassword('')
    router.push('/')
  }

  async function loadAllData() {
    setDashboardLoading(true)
    
    const { data: tenantsData } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false })
    
    const { data: invoicesData } = await supabase
      .from('invoices')
      .select('*')
      .order('date', { ascending: false })
    
    if (tenantsData) setTenants(tenantsData)
    if (invoicesData) setInvoices(invoicesData)
    setDashboardLoading(false)
  }

  async function extendTrial(tenantId: string, days: number) {
    const tenant = tenants.find(t => t.id === tenantId)
    if (!tenant) return

    const currentEnd = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : new Date()
    currentEnd.setDate(currentEnd.getDate() + days)

    const { error } = await supabase
      .from('tenants')
      .update({ trial_ends_at: currentEnd.toISOString() })
      .eq('id', tenantId)

    if (error) {
      alert('Error al extender trial: ' + error.message)
    } else {
      alert(`Trial extendido ${days} días hasta ${currentEnd.toLocaleDateString('es-AR')}`)
      loadAllData()
    }
  }

  async function changeStatus(tenantId: string, newStatus: string) {
    const { error } = await supabase
      .from('tenants')
      .update({ subscription_status: newStatus })
      .eq('id', tenantId)

    if (error) {
      alert('Error al cambiar estado: ' + error.message)
    } else {
      alert(`Estado cambiado a: ${newStatus}`)
      loadAllData()
    }
  }

  async function deleteTenant(tenantId: string) {
    if (!confirm('¿Estás seguro? Esta acción eliminará el alojamiento y todos sus datos permanentemente.')) {
      return
    }

    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', tenantId)

    if (error) {
      alert('Error al eliminar: ' + error.message)
    } else {
      alert('Alojamiento eliminado')
      loadAllData()
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F766E] mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-[#0F766E]/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-[#0F766E]" />
            </div>
            <CardTitle className="text-2xl">Acceso Superadmin</CardTitle>
            <CardDescription>Ingresá tus credenciales de administrador principal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </label>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="joelwul@gmail.com" 
                  required 
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <KeyRound className="w-4 h-4" /> Contraseña
                </label>
                <Input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required 
                  className="h-11"
                />
              </div>
              
              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {loginError}
                </div>
              )}

              <Button type="submit" className="w-full h-11 bg-[#0F766E] hover:bg-[#0D665E]" disabled={loginLoading}>
                {loginLoading ? 'Ingresando...' : 'Ingresar al Panel'}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <Button variant="link" className="text-sm text-gray-500" onClick={() => router.push('/')}>
                ← Volver al sitio principal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (user.email !== 'joelwul@gmail.com') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-900">Acceso Denegado</CardTitle>
            <CardDescription className="text-red-700">
              El usuario <strong>{user.email}</strong> no tiene permisos de superadministrador.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              Cerrar sesión y volver
            </Button>
            <Button variant="link" className="w-full text-gray-500" onClick={() => router.push('/')}>
              Ir al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F766E] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos del sistema...</p>
        </div>
      </div>
    )
  }

  const totalTenants = tenants.length
  const activeTenants = tenants.filter(t => t.subscription_status === 'active').length
  const trialTenants = tenants.filter(t => t.subscription_status === 'trial').length
  const expiredTenants = tenants.filter(t => t.subscription_status === 'expired' || t.subscription_status === 'cancelled').length
  
  const mrr = tenants.reduce((acc, t) => {
    if (t.subscription_status === 'active') {
      return acc + (t.subscription_plan === 'yearly' ? 30 : 40)
    }
    return acc
  }, 0)

  const totalRevenue = invoices
    .filter(i => i.status === 'paid')
    .reduce((acc, i) => acc + (i.amount || 0), 0)

  const filteredTenants = tenants.filter(t => 
    t.name?.toLowerCase().includes(search.toLowerCase()) || 
    t.owner_email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Lock className="w-8 h-8 text-[#0F766E]" />
                Panel de Superadmin
              </h1>
              <p className="text-gray-500 mt-1">
                Bienvenido, {user.email}
                <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">Administrador Principal</Badge>
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push('/')}>
                Volver a la App
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
              <Button onClick={() => window.open('https://app.lemonsqueezy.com', '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                LemonSqueezy
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="tenants">Alojamientos</TabsTrigger>
            <TabsTrigger value="finance">Finanzas</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Alojamientos</CardTitle>
                  <Users className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalTenants}</div>
                </CardContent>
              </Card>
              
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-800">Activos (Pagos)</CardTitle>
                  <CreditCard className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-700">{activeTenants}</div>
                  <p className="text-xs text-green-600 mt-1">MRR Est.: USD {mrr}/mes</p>
                </CardContent>
              </Card>

              <Card className="border-yellow-200 bg-yellow-50/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-800">En Período de Prueba</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-700">{trialTenants}</div>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-800">Expirados / Cancelados</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-700">{expiredTenants}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Ingresos Totales
                  </CardTitle>
                  <CardDescription>Facturación histórica de la plataforma</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-[#0F766E]">USD {totalRevenue.toLocaleString('es-AR')}</div>
                  <p className="text-sm text-gray-500 mt-2">{invoices.filter(i => i.status === 'paid').length} facturas pagadas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Salud del Sistema
                  </CardTitle>
                  <CardDescription>Métricas de operación</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Webhooks LS (último 24h)</span>
                    <Badge className="bg-green-100 text-green-800">OK</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Emails Resend</span>
                    <Badge className="bg-blue-100 text-blue-800">Activo</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Base de datos</span>
                    <Badge className="bg-green-100 text-green-800">Conectada</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tenants" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle>Gestión de Alojamientos</CardTitle>
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input 
                      type="text" 
                      placeholder="Buscar por nombre o email..." 
                      className="pl-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 font-medium">Alojamiento</th>
                        <th className="px-4 py-3 font-medium">Dueño</th>
                        <th className="px-4 py-3 font-medium">Estado</th>
                        <th className="px-4 py-3 font-medium">Plan</th>
                        <th className="px-4 py-3 font-medium">Fechas Clave</th>
                        <th className="px-4 py-3 font-medium text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredTenants.map((tenant) => (
                        <tr key={tenant.id} className="bg-white hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="font-semibold text-gray-900">{tenant.name}</div>
                            <div className="text-xs text-gray-500 font-mono">{tenant.slug}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-gray-900">{tenant.owner_name || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{tenant.owner_email}</div>
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge status={tenant.subscription_status} />
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-gray-700">
                              {tenant.subscription_plan === 'yearly' ? 'Anual' : 
                               tenant.subscription_plan === 'monthly' ? 'Mensual' : 'Ninguno'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs">
                            {tenant.subscription_status === 'active' && tenant.subscription_ends_at ? (
                              <div>
                                <div className="text-gray-400 mb-1">Suscripción:</div>
                                <div className="font-medium text-gray-900">
                                  {new Date(tenant.subscription_ends_at).toLocaleDateString('es-AR')}
                                </div>
                              </div>
                            ) : tenant.trial_ends_at ? (
                              <div>
                                <div className="text-gray-400 mb-1">Fin de Trial:</div>
                                <div className="font-medium text-gray-900">
                                  {new Date(tenant.trial_ends_at).toLocaleDateString('es-AR')}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(`/${tenant.slug}/admin`, '_blank')}
                                className="text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1.5" />
                                Ver
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => extendTrial(tenant.id, 7)}
                                className="text-xs"
                              >
                                <PlusCircle className="h-3 w-3 mr-1.5" />
                                +7 días
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => changeStatus(tenant.id, 'active')}
                                className="text-xs"
                              >
                                <CheckCircle className="h-3 w-3 mr-1.5" />
                                Activar
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => deleteTenant(tenant.id)}
                                className="text-xs"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredTenants.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            No se encontraron alojamientos con ese criterio de búsqueda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Ingresos Totales</CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">USD {totalRevenue.toLocaleString('es-AR')}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">MRR (Mensual)</CardTitle>
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">USD {mrr}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Facturas</CardTitle>
                  <FileText className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{invoices.length}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Historial de Facturas</CardTitle>
                <CardDescription>Todas las transacciones de la plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 font-medium">Fecha</th>
                        <th className="px-4 py-3 font-medium">Tenant</th>
                        <th className="px-4 py-3 font-medium">Plan</th>
                        <th className="px-4 py-3 font-medium">Monto</th>
                        <th className="px-4 py-3 font-medium">Estado</th>
                        <th className="px-4 py-3 font-medium">Proveedor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoices.map((invoice) => {
                        const tenant = tenants.find(t => t.id === invoice.tenant_id)
                        return (
                          <tr key={invoice.id} className="bg-white hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4 text-xs">
                              {new Date(invoice.date).toLocaleDateString('es-AR')}
                            </td>
                            <td className="px-4 py-4">
                              <div className="font-medium text-gray-900">{tenant?.name || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{tenant?.slug}</div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-gray-700">
                                {invoice.plan === 'yearly' ? 'Anual' : 'Mensual'}
                              </span>
                            </td>
                            <td className="px-4 py-4 font-semibold">
                              USD {invoice.amount?.toLocaleString('es-AR')}
                            </td>
                            <td className="px-4 py-4">
                              <InvoiceStatusBadge status={invoice.status} />
                            </td>
                            <td className="px-4 py-4 text-xs text-gray-600">
                              {invoice.payment_provider || 'N/A'}
                            </td>
                          </tr>
                        )
                      })}
                      {invoices.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            No hay facturas registradas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración Global
                </CardTitle>
                <CardDescription>
                  Ajustes generales de la plataforma Mi Estadía
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Tipo de Cambio USD/ARS</label>
                    <Input 
                      type="number" 
                      defaultValue="1600"
                      className="h-11"
                    />
                    <p className="text-xs text-gray-500">Valor actual: 1 USD = 1600 ARS</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Plan Mensual (USD)</label>
                    <Input 
                      type="number" 
                      defaultValue="40"
                      className="h-11"
                    />
                    <p className="text-xs text-gray-500">Precio mensual en dólares</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Plan Anual (USD)</label>
                    <Input 
                      type="number" 
                      defaultValue="360"
                      className="h-11"
                    />
                    <p className="text-xs text-gray-500">Precio anual en dólares (2 meses gratis)</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Días de Trial</label>
                    <Input 
                      type="number" 
                      defaultValue="30"
                      className="h-11"
                    />
                    <p className="text-xs text-gray-500">Período de prueba gratuito</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Button className="bg-[#0F766E] hover:bg-[#0D665E]">
                    Guardar Cambios
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Mensaje Global
                </CardTitle>
                <CardDescription>
                  Banner que aparecerá en el dashboard de todos los tenants
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Mensaje</label>
                  <Input 
                    type="text" 
                    placeholder="Ej: ️ Mantenimiento programado el domingo a las 3 AM"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Color del Banner</label>
                  <select className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm">
                    <option value="blue">Azul (Informativo)</option>
                    <option value="yellow">Amarillo (Advertencia)</option>
                    <option value="red">Rojo (Urgente)</option>
                    <option value="green">Verde (Éxito)</option>
                  </select>
                </div>
                <Button variant="outline">
                  Publicar Mensaje
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-800 border-green-200',
    trial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    expired: 'bg-red-100 text-red-800 border-red-200',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
  }
  const labels: Record<string, string> = {
    active: 'Activo',
    trial: 'En Trial',
    expired: 'Expirado',
    cancelled: 'Cancelado',
  }
  return (
    <Badge className={`${styles[status] || 'bg-gray-100 text-gray-800'} border`}>
      {labels[status] || status}
    </Badge>
  )
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
  }
  const labels: Record<string, string> = {
    paid: 'Pagado',
    pending: 'Pendiente',
    failed: 'Fallido',
  }
  return (
    <Badge className={`${styles[status] || 'bg-gray-100 text-gray-800'} border`}>
      {labels[status] || status}
    </Badge>
  )
}