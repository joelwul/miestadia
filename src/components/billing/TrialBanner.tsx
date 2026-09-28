"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { AlertCircle, Clock, Crown, X } from "lucide-react";

interface TrialBannerProps {
  tenantId: string;
}

export default function TrialBanner({ tenantId }: TrialBannerProps) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadTrial() {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("trial_ends_at, subscription_status")
        .eq("id", tenantId)
        .single();

      if (tenant) {
        setStatus(tenant.subscription_status || "trial");
        if (tenant.trial_ends_at) {
          const end = new Date(tenant.trial_ends_at);
          const now = new Date();
          const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          setDaysLeft(diff);
        }
      }
    }
    loadTrial();
  }, [tenantId]);

  if (dismissed || status === "active" || daysLeft === null) return null;

  const isExpired = daysLeft <= 0;
  const isUrgent = daysLeft <= 3 && daysLeft > 0;
  const isWarning = daysLeft <= 7 && daysLeft > 3;

  const bgColor = isExpired
    ? "bg-red-50 border-red-200"
    : isUrgent
    ? "bg-orange-50 border-orange-200"
    : isWarning
    ? "bg-yellow-50 border-yellow-200"
    : "bg-blue-50 border-blue-200";

  const textColor = isExpired
    ? "text-red-900"
    : isUrgent
    ? "text-orange-900"
    : isWarning
    ? "text-yellow-900"
    : "text-blue-900";

  const iconColor = isExpired
    ? "text-red-600"
    : isUrgent
    ? "text-orange-600"
    : isWarning
    ? "text-yellow-600"
    : "text-blue-600";

  return (
    <div className={`${bgColor} border rounded-lg p-4 mb-6`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {isExpired ? (
            <AlertCircle className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
          ) : (
            <Clock className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
          )}
          <div className={`${textColor}`}>
            {isExpired ? (
              <>
                <p className="font-semibold">Tu período de prueba ha finalizado</p>
                <p className="text-sm mt-1">
                  Tu cuenta está bloqueada. Suscribite para volver a acceder a todas las funcionalidades.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold">
                  {daysLeft} {daysLeft === 1 ? "día" : "días"} de prueba restantes
                </p>
                <p className="text-sm mt-1">
                  {isUrgent
                    ? "¡Últimos días! Suscribite ahora para no perder acceso."
                    : isWarning
                    ? "Tu prueba está por terminar. Considerá suscribirte."
                    : "Disfrutá de todas las funcionalidades durante tu prueba gratuita."}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/admin/billing`)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0F766E] text-white rounded-lg font-medium hover:bg-[#0F766E]/90 transition-colors"
          >
            <Crown className="w-4 h-4" />
            {isExpired ? "Suscribirme" : "Ver planes"}
          </button>
          {!isExpired && (
            <button
              onClick={() => setDismissed(true)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}