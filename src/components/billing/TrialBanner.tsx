"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Clock, Crown, X } from "lucide-react";

interface TrialBannerProps {
  tenantId: string;
  compact?: boolean;
}

export default function TrialBanner({ tenantId, compact = false }: TrialBannerProps) {
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

  if (compact) {
    return (
      <div className={`rounded-lg shadow-lg border p-3 max-w-xs ${
        isExpired
          ? "bg-red-50 border-red-200"
          : daysLeft <= 3
          ? "bg-orange-50 border-orange-200"
          : daysLeft <= 7
          ? "bg-yellow-50 border-yellow-200"
          : "bg-blue-50 border-blue-200"
      }`}>
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 flex-shrink-0 ${
            isExpired ? "text-red-600" : daysLeft <= 3 ? "text-orange-600" : daysLeft <= 7 ? "text-yellow-600" : "text-blue-600"
          }`} />
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold truncate ${
              isExpired ? "text-red-900" : daysLeft <= 3 ? "text-orange-900" : daysLeft <= 7 ? "text-yellow-900" : "text-blue-900"
            }`}>
              {isExpired ? "Trial expirado" : `${daysLeft} días de prueba`}
            </p>
          </div>
          <button
            onClick={() => router.push(`/admin/billing`)}
            className="flex items-center gap-1 px-2 py-1 bg-[#0F766E] text-white rounded text-xs font-medium hover:bg-[#0F766E]/90 transition-colors flex-shrink-0"
          >
            <Crown className="w-3 h-3" />
            Ver
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}