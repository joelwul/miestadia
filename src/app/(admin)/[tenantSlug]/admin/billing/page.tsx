"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import {
  Crown,
  CreditCard,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  plan: string;
  period: string;
}

export default function BillingPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const [tenantId, setTenantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [daysLeft, setDaysLeft] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("*")
        .eq("slug", tenantSlug)
        .single();

      if (tenant) {
        setTenantId(tenant.id);
        setSubscription(tenant);

        const now = new Date();
        const trialEnd = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : null;
        const subEnd = tenant.subscription_ends_at ? new Date(tenant.subscription_ends_at) : null;

        if (tenant.subscription_status === "active" && subEnd) {
          setDaysLeft(Math.ceil((subEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        } else if (trialEnd) {
          setDaysLeft(Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        }

        const { data: invoicesData } = await supabase
          .from("invoices")
          .select("*")
          .eq("tenant_id", tenant.id)
          .order("date", { ascending: false });

        if (invoicesData) {
          setInvoices(invoicesData);
        }
      }
      setLoading(false);
    }
    load();
  }, [tenantSlug]);

  async function handleCheckout(plan: "monthly" | "yearly", provider: "lemonsqueezy" | "mercadopago") {
    setCheckoutLoading(`${plan}-${provider}`);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          tenant_id: tenantId,
          plan,
          provider,
          return_url: `${window.location.origin}/${tenantSlug}/admin/billing`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      alert("Error al crear el checkout: " + err.message);
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handleCancelSubscription() {
    if (!confirm("¿Estás seguro que querés cancelar tu suscripción? Tu acceso continuará hasta el final del período pagado.")) {
      return;
    }

    const { error } = await supabase.functions.invoke("cancel-subscription", {
      body: { tenant_id: tenantId },
    });

    if (error) {
      alert("Error al cancelar: " + error.message);
    } else {
      alert("Suscripción cancelada. Tu acceso continuará hasta el final del período pagado.");
      window.location.reload();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const isTrial = subscription?.subscription_status === "trial";
  const isActive = subscription?.subscription_status === "active";
  const isBlocked = daysLeft <= 0 && !isActive;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Plan y Suscripción</h1>
        <p className="text-gray-500 mt-1">Gestioná tu plan de pago y facturación</p>
      </div>

      {isTrial && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-900">
                Período de prueba: {daysLeft > 0 ? `${daysLeft} días restantes` : "Finalizado"}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {daysLeft > 0
                  ? "Disfrutá de todas las funcionalidades durante tu prueba gratuita de 30 días."
                  : "Tu período de prueba ha finalizado. Suscribite para continuar usando Mi Estadía."}
              </p>
            </div>
          </div>
        </div>
      )}

      {isActive && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Plan activo</p>
              <p className="text-sm text-green-700 mt-1">
                Tu suscripción está activa. Próximo cobro en {daysLeft} días.
              </p>
            </div>
          </div>
        </div>
      )}

      {isBlocked && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">Cuenta bloqueada</p>
              <p className="text-sm text-red-700 mt-1">
                Tu período de prueba ha finalizado. Suscribite para reactivar tu cuenta.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Tu plan actual</p>
              <h2 className="text-2xl font-bold text-gray-900">
                {isActive ? (subscription?.subscription_plan === "yearly" ? "Anual" : "Mensual") : "Prueba Gratuita"}
              </h2>
            </div>
            <div className="bg-[#0F766E]/10 p-3 rounded-lg">
              <Crown className="w-6 h-6 text-[#0F766E]" />
            </div>
          </div>

          {isActive && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  Próximo cobro: {new Date(subscription?.subscription_ends_at).toLocaleDateString("es-AR")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CreditCard className="w-4 h-4" />
                <span>
                  Método: {subscription?.payment_method || "Tarjeta"}
                </span>
              </div>
            </div>
          )}

          {!isActive && (
            <p className="text-sm text-gray-600">
              {daysLeft > 0
                ? `Te quedan ${daysLeft} días de prueba gratuita`
                : "Tu prueba ha finalizado"}
            </p>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Gestión de tu suscripción</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Cancelar:</strong> corta los próximos cobros al instante; tu plan sigue activo hasta el fin del período pagado.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Reembolsos:</strong> garantía de 7 días desde el primer pago; se procesa por el mismo medio de pago.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Suscripciones por Mercado Pago:</strong> también podés verlas en tu cuenta de MP → "Suscripciones".
              </span>
            </li>
          </ul>

          {isActive && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelSubscription}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar suscripción
              </button>
            </div>
          )}
        </div>
      </div>

      {!isActive && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Elegí tu plan</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-[#0F766E] transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Plan Mensual</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Flexible</span>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[#0F766E]">USD 40</span>
                  <span className="text-gray-500">/ mes</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Pago mes a mes, cancelás cuando quieras</p>
              </div>

              <ul className="space-y-3 mb-6">
                {[
                  "Todas las funcionalidades",
                  "Unidades ilimitadas",
                  "Reservas ilimitadas",
                  "Panel de huésped premium",
                  "Mensajería WhatsApp",
                  "Emails automáticos",
                  "Soporte prioritario",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-[#0F766E] flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="space-y-3">
                <button
                  onClick={() => handleCheckout("monthly", "mercadopago")}
                  disabled={checkoutLoading !== null}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#00B1EA] text-white rounded-lg font-semibold hover:bg-[#009EE3] transition-colors disabled:opacity-50"
                >
                  {checkoutLoading === "monthly-mercadopago" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Mercado Pago (ARS)
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleCheckout("monthly", "lemonsqueezy")}
                  disabled={checkoutLoading !== null}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {checkoutLoading === "monthly-lemonsqueezy" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      Pagar con LemonSqueezy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white border-2 border-[#EA580C] rounded-xl p-6 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#EA580C] text-white text-xs font-bold px-3 py-1 rounded-full">
                Ahorrás 25%
              </span>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Plan Anual</h3>
                <span className="text-xs bg-[#EA580C]/10 text-[#EA580C] px-2 py-1 rounded">Mejor valor</span>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[#0F766E]">USD 360</span>
                  <span className="text-gray-500">/ año</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">Pago único anual, 2 meses gratis</p>
                <div className="bg-[#EA580C]/10 rounded-lg p-2 mt-3">
                  <p className="text-xs font-semibold text-[#EA580C]">
                    Equivale a USD 30/mes - Ahorrás USD 120 al año
                  </p>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {[
                  "Todas las funcionalidades",
                  "Unidades ilimitadas",
                  "Reservas ilimitadas",
                  "Panel de huésped premium",
                  "Mensajería WhatsApp",
                  "Emails automáticos",
                  "Soporte prioritario",
                  "2 meses gratis",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-[#0F766E] flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="space-y-3">
                <button
                  onClick={() => handleCheckout("yearly", "mercadopago")}
                  disabled={checkoutLoading !== null}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#00B1EA] text-white rounded-lg font-semibold hover:bg-[#009EE3] transition-colors disabled:opacity-50"
                >
                  {checkoutLoading === "yearly-mercadopago" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Mercado Pago (ARS)
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleCheckout("yearly", "lemonsqueezy")}
                  disabled={checkoutLoading !== null}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {checkoutLoading === "yearly-lemonsqueezy" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      Pagar con LemonSqueezy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Historial de pagos</h3>
          <span className="text-sm text-gray-500">{invoices.length} facturas</span>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aún no tenés facturas</p>
            <p className="text-sm text-gray-400 mt-1">
              {isTrial ? "Tus facturas aparecerán aquí cuando te suscribas." : "No hay pagos registrados."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      invoice.status === "paid"
                        ? "bg-green-100"
                        : invoice.status === "pending"
                        ? "bg-yellow-100"
                        : "bg-red-100"
                    }`}
                  >
                    {invoice.status === "paid" ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : invoice.status === "pending" ? (
                      <Clock className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {invoice.plan === "yearly" ? "Plan Anual" : "Plan Mensual"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(invoice.date).toLocaleDateString("es-AR")} • {invoice.period}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${invoice.amount.toLocaleString("es-AR")}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        invoice.status === "paid"
                          ? "text-green-600"
                          : invoice.status === "pending"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {invoice.status === "paid"
                        ? "Pagado"
                        : invoice.status === "pending"
                        ? "Pendiente"
                        : "Fallido"}
                    </p>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}