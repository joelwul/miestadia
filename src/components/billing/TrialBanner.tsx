"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Clock, Crown, AlertTriangle, CheckCircle, X } from "lucide-react";

export default function TrialBanner() {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");
  const [plan, setPlan] = useState<string>("");
  const [tenantSlug, setTenantSlug] = useState<string>("");
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
          .select("tenants(id, name, slug, subscription_status, subscription_plan, trial_ends_at, subscription_ends_at)")
          .eq("user_id", user.id)
          .single();

        if (tenantUser?.tenants) {
          const t = tenantUser.tenants;
          setTenantSlug(t.slug);
          setStatus(t.subscription_status || "trial");
          setPlan(t.subscription_plan || "");

          if (t.subscription_status === "active" && t.subscription_ends_at) {
            const end = new Date(t.subscription_ends_at);
            end.setHours(0, 0, 0, 0);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            setDaysLeft(diff);
            setExpired(diff <= 0);
          } else if (t.trial_ends_at) {
            const end = new Date(t.trial_ends_at);
            end.setHours(0, 0, 0, 0);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
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

  if (dismissed) return null;

  const getColorClasses = () => {
    if (status === "active" && !expired) return "bg-green-600 text-white";
    if (expired) return "bg-red-600 text-white";
    if (daysLeft === null) return "bg-gray-600 text-white";
    if (daysLeft <= 3) return "bg-orange-500 text-white";
    if (daysLeft <= 7) return "bg-yellow-500 text-white";
    return "bg-[#0F766E] text-white";
  };

  const getIcon = () => {
    if (status === "active" && !expired) return <CheckCircle className="w-5 h-5 flex-shrink-0" />;
    if (expired) return <AlertTriangle className="w-5 h-5 flex-shrink-0" />;
    return <Clock className="w-5 h-5 flex-shrink-0" />;
  };

  const getMessage = () => {
    if (status === "active" && !expired) {
      const planLabel = plan === "yearly" ? "Plan Anual" : "Plan Mensual";
      return `${planLabel} activo • ${daysLeft} días restantes`;
    }
    if (expired) return "Período expirado";
    if (daysLeft === null) return "Cargando...";
    return `${daysLeft} ${daysLeft === 1 ? "día" : "días"} de prueba`;
  };

  const getSubMessage = () => {
    if (status === "active" && !expired) return "Suscripción activa";
    if (expired) return "Suscribite para reactivar";
    if (daysLeft <= 3) return "¡Últimos días!";
    return "Disfrutá Mi Estadía";
  };

  const handleVerClick = () => {
    if (tenantSlug) {
      router.push(`/${tenantSlug}/admin/billing`);
    } else {
      router.push("/login");
    }
  };

  return (
    <div className={`fixed bottom-4 left-4 z-50 rounded-lg shadow-2xl border border-white/20 p-3 max-w-xs ${getColorClasses()}`}>
      <div className="flex items-center gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate">{getMessage()}</p>
          <p className="text-xs opacity-90 truncate">{getSubMessage()}</p>
        </div>
        <button
          onClick={handleVerClick}
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