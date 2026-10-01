"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Key } from "lucide-react";

interface Props {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ code?: string; lastName?: string }>;
}

export default function GuestLoginPage({ params, searchParams }: Props) {
  const [tenantSlug, setTenantSlug] = useState("");
  const [tenant, setTenant] = useState<any>(null);
  const [code, setCode] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params;
      const resolvedSearchParams = await searchParams;
      setTenantSlug(resolvedParams.tenantSlug);
      if (resolvedSearchParams.code) setCode(resolvedSearchParams.code);
      if (resolvedSearchParams.lastName) setLastName(resolvedSearchParams.lastName);

      const { data: tenantData } = await supabase
        .from("tenants")
        .select("*")
        .eq("slug", resolvedParams.tenantSlug)
        .single();
      if (tenantData) setTenant(tenantData);
    };
    init();
  }, [params, searchParams]);

  async function handleAccess(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data: tenantData } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", tenantSlug)
      .single();

    if (!tenantData) {
      setError("Alojamiento no encontrado");
      setLoading(false);
      return;
    }

    const { data: res } = await supabase
      .from("reservations")
      .select("*, guests (first_name, last_name)")
      .eq("tenant_id", tenantData.id)
      .eq("reservation_code", code.toUpperCase().trim())
      .single();

    if (!res) {
      setError("Código de reserva no encontrado.");
      setLoading(false);
      return;
    }

    if (res.guests?.last_name?.toLowerCase().trim() !== lastName.toLowerCase().trim()) {
      setError(`El apellido no coincide. Registrado: "${res.guests?.last_name}"`);
      setLoading(false);
      return;
    }

    if (res.status === "cancelled") {
      setError("Esta reserva está cancelada");
      setLoading(false);
      return;
    }

    localStorage.setItem(
      "guest_session",
      JSON.stringify({
        reservationId: res.id,
        tenantId: tenantData.id,
        guestName: res.guests?.first_name,
        reservationCode: res.reservation_code,
        lastName: res.guests?.last_name,
        expiresAt: Date.now() + 86400000,
      })
    );
    window.location.href = `/${tenantSlug}/stay`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-green-50 to-emerald-100 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            {tenant?.branding?.logoUrl ? (
              <img src={tenant.branding.logoUrl} alt="Logo" className="h-20 w-auto mx-auto mb-3 object-contain" />
            ) : (
              <img src="/mi-estadia-logo.png" alt="Mi Estadía" className="h-24 w-auto mx-auto mb-3 object-contain" />
            )}
            <h1 className="text-2xl font-bold text-teal-900">{tenant?.name || "Mi Estadía"}</h1>
            <p className="text-teal-600 text-sm mt-1">Tu estadía empieza antes de llegar</p>
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-teal-200">
              <img src="/mi-estadia-logo.png" alt="Mi Estadía" className="h-6 w-auto object-contain" />
              <span className="text-xs text-teal-700 font-medium">Powered by Mi Estadía</span>
            </div>
          </div>

          <Card className="border-2 border-teal-200 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Key className="h-5 w-5 text-teal-700" />
                <h2 className="text-xl font-semibold text-gray-800">Acceder a mi Estadía</h2>
              </div>

              <form onSubmit={handleAccess} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Código de Reserva</label>
                  <Input value={code} onChange={(e) => { setCode(e.target.value); setError(""); }} placeholder="Ej: CEP-7F92K" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Apellido del Titular</label>
                  <Input value={lastName} onChange={(e) => { setLastName(e.target.value); setError(""); }} placeholder="Ej: Pérez" required />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
                )}
                <Button type="submit" className="w-full h-11 bg-teal-700 hover:bg-teal-800 text-white font-medium" disabled={loading}>
                  {loading ? "Ingresando..." : "Ingresar"}
                </Button>
              </form>
              <p className="text-xs text-gray-500 text-center mt-4">¿No tenés tu código? Contactá a tu alojamiento</p>
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