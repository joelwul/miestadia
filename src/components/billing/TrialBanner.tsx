"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Clock, Crown, AlertTriangle, X } from "lucide-react";

export default function TrialBanner() {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");
  const [dismissed, setDismissed] = useState(false);
  const [expired, setExpired] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadTrial() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: tenantUser } = await supabase
          .from("tenant_users")
          .select("tenants(id, name, slug, subscription_status, trial_ends_at)")
          .eq("user_id", user.id)
          .single();

        if (tenantUser?.tenants) {
          const t = tenantUser.tenants;
          setStatus(t.subscription_status || "trial");

          if (t.trial_ends_at) {
            const end = new Date(t.trial_ends_at);
            const now = new Date();
            const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            setDaysLeft(diff);
            setExpired(diff <= 0 && t.subscription_status !== "active");
          }
        }
      } catch (err) {
        console.error("Error loading trial:", err);
      }
    }
    loadTrial();
  }, []);

  if (dismissed || status === "active") return null;

  const getColorClasses = () => {
    if (expired) return "bg-red-600 text-white";
    if (daysLeft === null) return "bg-gray-600 text-white";
    if (daysLeft <= 3) return "bg-orange-500 text-white";
    if (daysLeft <= 7) return "bg-yellow-500 text-white";
    return "bg-[#0F766E] text-white";
  };

  return (
    <div className={`fixed bottom-4 left-4 z-50 rounded-lg shadow-2xl border border-white/20 p-3 max-w-xs ${getColorClasses()}`}>
      <div className="flex items-center gap-3">
        {expired ? (
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        ) : (
          <Clock className="w-5 h-5 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate">
            {expired
              ? "️ Período de prueba expirado"
              : daysLeft === null
              ? "Cargando..."
              : `${daysLeft} ${daysLeft === 1 ? "día" : "días"} de prueba`}
          </p>
          <p className="text-xs opacity-90 truncate">
            {expired
              ? "Suscribite para reactivar"
              : daysLeft <= 3
              ? "¡Últimos días!"
              : "Disfrutá Mi Estadía"}
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/billing")}
          className="flex items-center gap-1 px-3 py-1.5 bg-white text-gray-900 rounded text-xs font-bold hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <Crown className="w-3 h-3" />
          Ver
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-white/70 hover:text-white flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}