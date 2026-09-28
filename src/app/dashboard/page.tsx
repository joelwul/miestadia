import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  
  // Intentamos leer el tenant de Centro El Progreso
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('name, slug, status')
    .eq('slug', 'centroelprogreso')
    .single()

  if (error) {
    return (
      <main className="p-10 text-red-500">
        <h1 className="text-2xl font-bold">❌ Error conectando a Supabase</h1>
        <p className="mt-2">Detalles: {error.message}</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-green-50">
      <h1 className="text-4xl font-bold text-green-800 mb-4">¡Conexión Exitosa! 🎉</h1>
      <div className="bg-white p-6 rounded-lg shadow-md border border-green-200">
        <p className="text-xl text-gray-700">Tenant encontrado en la base de datos:</p>
        <p className="text-3xl font-bold text-green-700 mt-2">{tenant.name}</p>
        <p className="text-gray-500 mt-2">🔗 Slug: {tenant.slug}</p>
        <p className="text-gray-500">🟢 Estado: {tenant.status}</p>
      </div>
    </main>
  )
}