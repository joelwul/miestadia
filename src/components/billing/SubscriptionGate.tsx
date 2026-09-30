"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Lock, Crown, AlertCircle } from "lucide-react";

export default function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [tenantSlug, setTenantSlug] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function check() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: tenantUser } = await supabase
          .from("tenant_users")
          .select("tenants(id, slug, subscription_status, trial_ends_at)")
          .eq("user_id", user.id)
          .single();

        if (tenantUser?.tenants) {
          const t = tenantUser.tenants;
          setTenantSlug(t.slug);

          if (t.subscription_status !== "active" && t.trial_ends_at) {
            const end = new Date(t.trial_ends_at);
            const now = new Date();
            if (end < now) {
              setBlocked(true);
            }
          }
        }
      } catch (err) {
        console.error("Error checking subscription:", err);
      } finally {
        setLoading(false);
      }
    }
    check();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F766E]"></div>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Período de prueba expirado
          </h1>
          <p className="text-gray-600 mb-6">
            Tu período de prueba de 30 días ha finalizado. Suscribite para reactivar tu cuenta y continuar usando Mi Estadía.
          </p>
          <button
            onClick={() => router.push(`/${tenantSlug}/admin/billing`)}
            className="w-full bg-[#0F766E] text-white py-3 rounded-lg font-semibold hover:bg-[#0F766E]/90 transition-colors flex items-center justify-center gap-2"
          >
            <Crown className="w-5 h-5" />
            Ver planes y suscribirme
          </button>
          <p className="text-xs text-gray-500 mt-4">
            30 días de prueba gratis • Sin tarjeta de crédito
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}