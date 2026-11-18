"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Lock, Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  tenantId: string;
  tenantSlug: string;
}

export default function SubscriptionGuard({ children, tenantId, tenantSlug }: Props) {
  const pathname = usePathname();
  const [blocked, setBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("trial");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function checkSubscription() {
      try {
        const { data: tenant } = await supabase
          .from("tenants")
          .select("subscription_status, trial_ends_at, subscription_ends_at")
          .eq("id", tenantId)
          .single();

        if (!tenant) {
          setLoading(false);
          return;
        }

        const status = tenant.subscription_status || "trial";
        const trialEnd = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : null;
        const subEnd = tenant.subscription_ends_at ? new Date(tenant.subscription_ends_at) : null;
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let isBlocked = false;
        let reason = "";

        if (status === "active") {
          if (subEnd && subEnd < now) {
            isBlocked = true;
            reason = "Tu suscripción ha finalizado.";
          }
        } else if (status === "cancelled") {
          if (subEnd && subEnd < now) {
            isBlocked = true;
            reason = "Tu período pagado ha finalizado.";
          }
        } else if (status === "trial") {
          if (trialEnd && trialEnd < now) {
            isBlocked = true;
            reason = "Tu período de prueba ha finalizado.";
          }
        } else if (status === "expired") {
          isBlocked = true;
          reason = "Tu cuenta está vencida.";
        }

        setBlocked(isBlocked);
        setBlockReason(reason);
        setTrialEndsAt(tenant.trial_ends_at);
        setSubscriptionEndsAt(tenant.subscription_ends_at);
        setSubscriptionStatus(status);
      } catch (err) {
        console.error("Error checking subscription:", err);
      } finally {
        setLoading(false);
      }
    }
    checkSubscription();
  }, [tenantId]);

  // Si está en billing, siempre permitir acceso
  const isBillingPage = pathname.includes("/admin/billing");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F766E]" />
      </div>
    );
  }

  // Si está bloqueado y NO es billing, mostrar pantalla de bloqueo
  if (blocked && !isBillingPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cuenta bloqueada</h1>
          <p className="text-gray-600 mb-4">{blockReason}</p>
          <p className="text-gray-600 mb-6">
            Para seguir usando Mi Estadía, necesitás activar tu suscripción.
          </p>
          {trialEndsAt && subscriptionStatus === "trial" && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>Trial expiró el:</strong>{" "}
                {new Date(trialEndsAt).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
          )}
          {subscriptionEndsAt && (subscriptionStatus === "cancelled" || subscriptionStatus === "expired") && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>Suscripción finalizó el:</strong>{" "}
                {new Date(subscriptionEndsAt).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
          )}
          <Link
            href={`/${tenantSlug}/admin/billing`}
            className="block w-full bg-[#0F766E] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#0F766E]/90 transition-colors mb-3"
          >
            Activar suscripción
          </Link>
          <Link
            href="/login"
            className="block w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cerrar sesión
          </Link>
        </div>
      </div>
    );
  }

  // Si no está bloqueado, o está en billing, renderizar normal
  return <>{children}</>;
}