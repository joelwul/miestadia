"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Users,
  DollarSign,
  MessageSquare,
  Mail,
  Phone,
  User,
  Home,
  Send,
  X,
} from "lucide-react";

interface Request {
  id: string;
  tenant_id: string;
  unit_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_document: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_amount: number;
  special_requests: string;
  status: string;
  admin_notes: string;
  expires_at: string;
  created_at: string;
  confirmed_at: string;
  rejected_at: string;
  units?: { name: string; type: string; capacity: number };
}

type FilterStatus = "all" | "pending" | "confirmed" | "rejected" | "expired";

export default function RequestsPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const [tenantId, setTenantId] = useState("");
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [actionModal, setActionModal] = useState<{ type: "confirm" | "reject"; request: Request } | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", tenantSlug)
        .single();
      if (tenant) {
        setTenantId(tenant.id);
        await loadRequests(tenant.id);
      }
    }
    init();
  }, [tenantSlug]);

  async function loadRequests(tid: string) {
    setLoading(true);
    const { data } = await supabase
      .from("reservation_requests")
      .select("*, units(name, type, capacity)")
      .eq("tenant_id", tid)
      .order("created_at", { ascending: false });
    if (data) setRequests(data as Request[]);
    setLoading(false);
  }

  async function handleAction() {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      const response = await fetch("/api/confirm-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: actionModal.request.id,
          action: actionModal.type === "confirm" ? "confirmed" : "rejected",
          adminNotes: adminNotes || null,
          rejectionReason: actionModal.type === "reject" ? adminNotes : null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al procesar la solicitud");
      await loadRequests(tenantId);
      setActionModal(null);
      setAdminNotes("");
      alert(actionModal.type === "confirm" ? "✅ Solicitud confirmada" : "❌ Solicitud rechazada");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    const config: Record<string, { label: string; color: string; icon: any }> = {
      pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
      confirmed: { label: "Confirmada", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
      rejected: { label: "Rechazada", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
      expired: { label: "Expirada", color: "bg-gray-100 text-gray-800 border-gray-200", icon: AlertCircle },
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${c.color}`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </span>
    );
  }

  function getTimeAgo(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`;
    if (diffHours > 0) return `hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `hace ${diffMins} ${diffMins === 1 ? "minuto" : "minutos"}`;
  }

  function isExpired(request: Request) {
    if (request.status !== "pending") return false;
    return new Date(request.expires_at) < new Date();
  }

  const filteredRequests = requests.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  const pendingCount = requests.filter((r) => r.status === "pending" && !isExpired(r)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F766E]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Solicitudes de reserva</h1>
          <p className="text-gray-500 mt-1">
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium mr-2">
                <Clock className="w-4 h-4" />
                {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
              </span>
            )}
            {requests.length} en total
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { value: "pending", label: "Pendientes", count: requests.filter((r) => r.status === "pending").length },
            { value: "confirmed", label: "Confirmadas", count: requests.filter((r) => r.status === "confirmed").length },
            { value: "rejected", label: "Rechazadas", count: requests.filter((r) => r.status === "rejected").length },
            { value: "expired", label: "Expiradas", count: requests.filter((r) => r.status === "expired").length },
            { value: "all", label: "Todas", count: requests.length },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as FilterStatus)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                filter === f.value ? "bg-[#0F766E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {f.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${filter === f.value ? "bg-white/20" : "bg-gray-200"}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Lista de solicitudes */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No hay solicitudes</h3>
          <p className="text-gray-600">
            {filter !== "all" ? "No hay solicitudes con este filtro." : "Aún no recibiste solicitudes de reserva."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const expired = isExpired(request);
            const nights = Math.ceil(
              (new Date(request.check_out).getTime() - new Date(request.check_in).getTime()) / (1000 * 60 * 60 * 24)
            );
            const totalFormatted = new Intl.NumberFormat("es-AR", {
              style: "currency",
              currency: "ARS",
              minimumFractionDigits: 0,
            }).format(request.total_amount || 0);

            return (
              <div
                key={request.id}
                className={`bg-white border rounded-xl p-6 hover:shadow-md transition-shadow ${
                  expired ? "border-gray-300 opacity-75" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-900">{request.guest_name}</h3>
                      {getStatusBadge(expired ? "expired" : request.status)}
                      <span className="text-xs text-gray-500">{getTimeAgo(request.created_at)}</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-500 text-xs flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Check-in
                        </p>
                        <p className="font-semibold text-gray-900">
                          {new Date(request.check_in).toLocaleDateString("es-AR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Check-out
                        </p>
                        <p className="font-semibold text-gray-900">
                          {new Date(request.check_out).toLocaleDateString("es-AR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs flex items-center gap-1">
                          <Home className="w-3 h-3" /> Unidad
                        </p>
                        <p className="font-semibold text-gray-900">{request.units?.name || "—"}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> Total
                        </p>
                        <p className="font-semibold text-gray-900">{totalFormatted}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {request.guest_email}
                      </span>
                      {request.guest_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {request.guest_phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {request.guests_count} {request.guests_count === 1 ? "huésped" : "huéspedes"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {nights} {nights === 1 ? "noche" : "noches"}
                      </span>
                    </div>

                    {request.special_requests && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs font-medium text-amber-800 mb-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> Solicitudes especiales
                        </p>
                        <p className="text-sm text-amber-900 italic">{request.special_requests}</p>
                      </div>
                    )}

                    {request.admin_notes && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs font-medium text-blue-800 mb-1">Notas del admin</p>
                        <p className="text-sm text-blue-900">{request.admin_notes}</p>
                      </div>
                    )}

                    {expired && (
                      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-xs text-gray-600">
                          ⏰ Expiró el {new Date(request.expires_at).toLocaleDateString("es-AR")} a las{" "}
                          {new Date(request.expires_at).toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  {request.status === "pending" && !expired && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          setActionModal({ type: "confirm", request });
                          setAdminNotes("");
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirmar
                      </button>
                      <button
                        onClick={() => {
                          setActionModal({ type: "reject", request });
                          setAdminNotes("");
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de acción */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {actionModal.type === "confirm" ? "Confirmar solicitud" : "Rechazar solicitud"}
              </h2>
              <button onClick={() => { setActionModal(null); setAdminNotes(""); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700">
                <strong>Huésped:</strong> {actionModal.request.guest_name}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Unidad:</strong> {actionModal.request.units?.name}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Fechas:</strong> {new Date(actionModal.request.check_in).toLocaleDateString("es-AR")} →{" "}
                {new Date(actionModal.request.check_out).toLocaleDateString("es-AR")}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {actionModal.type === "confirm" ? "Mensaje para el huésped (opcional)" : "Motivo del rechazo (opcional)"}
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  placeholder={
                    actionModal.type === "confirm"
                      ? "Ej: ¡Te esperamos! El check-in es a partir de las 15hs."
                      : "Ej: La unidad no está disponible en esas fechas."
                  }
                />
              </div>

              <div className={`p-3 rounded-lg ${actionModal.type === "confirm" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                <p className={`text-sm ${actionModal.type === "confirm" ? "text-green-800" : "text-red-800"}`}>
                  {actionModal.type === "confirm" ? (
                    <>
                      ✅ Al confirmar se creará la reserva real y se enviará un email al huésped con los detalles.
                    </>
                  ) : (
                    <>
                      ❌ Al rechazar se liberarán las fechas y se enviará un email al huésped informando.
                    </>
                  )}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setActionModal(null); setAdminNotes(""); }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAction}
                  disabled={actionLoading}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50 ${
                    actionModal.type === "confirm" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : actionModal.type === "confirm" ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Confirmar y enviar email
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Rechazar y enviar email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}