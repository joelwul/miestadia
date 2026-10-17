"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import GuestStayPage from "@/components/guest/GuestStayPage";
import TenantLanding from "@/components/public/TenantLanding";
import LanguageSelector from "@/components/LanguageSelector";

interface Unit {
  id: string;
  name: string;
  type: string;
  capacity: number;
  price_per_night: number;
  description: string;
  photos: { image_url: string; is_primary: boolean }[];
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  settings?: any;
  branding?: any;
}

export default function TenantPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tenantSlug = params.tenantSlug as string;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isValidGuest, setIsValidGuest] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        const code = searchParams.get("code");
        const lastName = searchParams.get("lastName");

        if (code && lastName) {
          const { data: reservation, error: resError } = await supabase
            .from("reservations")
            .select(`id, reservation_code, guests(last_name)`)
            .eq("reservation_code", code)
            .ilike("guests.last_name", `%${lastName}%`)
            .single();

          if (reservation && !resError) {
            sessionStorage.setItem(
              "guest_session",
              JSON.stringify({
                reservationId: reservation.id,
                code,
                lastName,
                expiresAt: Date.now() + 24 * 60 * 60 * 1000,
              })
            );
            setIsValidGuest(true);
          } else {
            alert("Código de reserva o apellido incorrecto. Verificá el email de confirmación.");
            return;
          }
        }

        const { data: tenantData } = await supabase
          .from("tenants")
          .select("*")
          .eq("slug", tenantSlug)
          .single();

        if (tenantData) {
          setTenant(tenantData);

          const { data: unitsData } = await supabase
            .from("units")
            .select("*")
            .eq("tenant_id", tenantData.id)
            .eq("status", "active");

          if (unitsData) {
            const unitsWithPhotos = await Promise.all(
              unitsData.map(async (unit) => {
                const { data: photos } = await supabase
                  .from("unit_photos")
                  .select("image_url, is_primary")
                  .eq("unit_id", unit.id)
                  .order("order_index");
                return { ...unit, photos: photos || [] };
              })
            );
            setUnits(unitsWithPhotos);
          }
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tenantSlug, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (isValidGuest && tenant) {
    return <GuestStayPage params={Promise.resolve({ tenantSlug })} />;
  }

  if (tenant) {
    return (
      <div className="relative">
        {/* SELECTOR DE IDIOMA FLOTANTE - SIEMPRE VISIBLE */}
        <div className="fixed top-4 right-4 z-50">
          <LanguageSelector variant="dropdown" />
        </div>
        <TenantLanding tenant={tenant} units={units} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Alojamiento no encontrado</h1>
        <p className="text-gray-600">El alojamiento que buscás no existe o no está disponible.</p>
      </div>
    </div>
  );
}