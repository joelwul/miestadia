"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Lock, Crown } from "lucide-react";
import TrialBanner from "@/components/billing/TrialBanner";

export default function AdminSubLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function check() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: tenantUser } = await supabase
          .from("tenant_users")
          .select("tenants(id, slug, subscription_status, trial_ends_at, subscription_ends_at)")
          .eq("user_id", user.id)
          .single();

        if (tenantUser?.tenants) {
          const t = tenantUser.tenants;
          
          // Si está activo, verificar si expiró
          if (t.subscription_status === "active" && t.subscription_ends_at) {
            const end = new Date(t.subscription_ends_at);
            if (end < new Date()) {
              setBlocked(true);
            }
          }
          // Si está en trial y expiró
          else if (t.subscription_status === "trial" && t.trial_ends_at) {
            const end = new Date(t.trial_ends_at);
            if (end < new Date()) {
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
        <Loader2 className="w-12 h-12 animate-spin text-[#0F766E]" />
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
            Período expirado
          </h1>
          <p className="text-gray-600 mb-6">
            Tu período de prueba o suscripción ha finalizado. Suscribite para reactivar tu cuenta y continuar usando Mi Estadía.
          </p>
          <button
            onClick={() => router.push(`/${tenantSlug}/admin/billing`)}
            className="w-full bg-[#0F766E] text-white py-3 rounded-lg font-semibold hover:bg-[#0F766E]/90 transition-colors flex items-center justify-center gap-2"
          >
            <Crown className="w-5 h-5" />
            Ver planes y suscribirme
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <TrialBanner />
    </>
  );
}