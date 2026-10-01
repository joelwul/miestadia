"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const { data: tenantUser } = await supabase
      .from("tenant_users")
      .select("tenant_id")
      .eq("user_id", authData.user.id)
      .single();

    if (!tenantUser) {
      setError("No tenés un alojamiento asignado.");
      setLoading(false);
      return;
    }

    const { data: tenant } = await supabase
      .from("tenants")
      .select("slug")
      .eq("id", tenantUser.tenant_id)
      .single();

    if (tenant) {
      router.push(`/${tenant.slug}/admin`);
      router.refresh();
    } else {
      setError("Error al cargar tu alojamiento.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-green-50 to-emerald-100 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <img src="/mi-estadia-logo.png" alt="Mi Estadía" className="h-28 w-auto mx-auto object-contain mb-3" />
            <h1 className="text-2xl font-bold text-teal-900">Mi Estadía</h1>
            <p className="text-teal-600 text-sm mt-1">Panel de Administración</p>
          </div>

          <Card className="border-2 border-teal-200 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-2 mb-6">
                <LogIn className="h-5 w-5 text-teal-700" />
                <h2 className="text-xl font-semibold text-gray-800">Iniciar Sesión</h2>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@miestadia.com" required className="h-11" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Contraseña</label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="h-11" />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
                )}
                <Button type="submit" className="w-full h-11 bg-teal-700 hover:bg-teal-800 text-white font-medium" disabled={loading}>
                  {loading ? "Ingresando..." : "Ingresar al Panel"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="border-t border-gray-200 bg-white py-5">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/mi-estadia-logo.png" alt="Mi Estadía" className="h-8 w-auto" />
            <span className="text-sm text-gray-600">© 2026 Mi Estadía</span>
          </div>
          <a href="https://buenpuerto.online" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
            <span>App desarrollada por</span>
            <img src="/buenpuerto-logo.png" alt="Buen Puerto" className="h-7 w-auto" />
            <span className="font-semibold text-teal-700">buenpuerto.online</span>
          </a>
        </div>
      </footer>
    </div>
  );
}