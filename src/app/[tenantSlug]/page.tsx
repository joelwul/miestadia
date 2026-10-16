"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import GuestStayPage from "@/components/guest/GuestStayPage";
import TenantLanding from "@/components/public/TenantLanding";

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
  const [reservationData, setReservationData] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Verificar si hay parámetros de acceso en la URL
        const code = searchParams.get("code");
        const lastName = searchParams.get("lastName");

        if (code && lastName) {
          // 2. Validar automáticamente contra la base de datos
          const { data: reservation } = await supabase
            .from("reservations")
            .select(`
              id,
              reservation_code,
              guests (last_name)
            `)
            .eq("reservation_code", code)
            .ilike("guests.last_name", `%${lastName}%`)
            .single();

          if (reservation) {
            // 3. Si es válido, guardar en sessionStorage (solo para esta sesión)
            sessionStorage.setItem("guest_session", JSON.stringify({
              reservationId: reservation.id,
              code: code,
              lastName: lastName,
              expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 horas
            }));
            setIsValidGuest(true);
            setReservationData(reservation);
          }
        }

        // 4. Cargar datos del tenant (necesario para ambos casos)
        const { data: tenantData } = await supabase
          .from("tenants")
          .select("*")
          .eq("slug", tenantSlug)
          .single();

        if (tenantData) {
          setTenant(tenantData);

          // 5. Cargar unidades con fotos
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

  // Si hay parámetros válidos → Panel del huésped
  if (isValidGuest && tenant) {
    return <GuestStayPage params={Promise.resolve({ tenantSlug })} />;
  }

  // Si no hay parámetros → Landing pública
  if (tenant) {
    return <TenantLanding tenant={tenant} units={units} />;
  }

  // Si no existe el tenant
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Alojamiento no encontrado</h1>
        <p className="text-gray-600">El alojamiento que buscás no existe o no está disponible.</p>
      </div>
    </div>
  );
} 