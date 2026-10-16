"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import {
  Calendar,
  Copy,
  CheckCircle,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  ExternalLink,
  AlertCircle,
  Clock,
  Globe,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CalendarSync {
  id: string;
  tenant_id: string;
  unit_id: string;
  sync_type: string;
  external_url: string;
  external_source: string;
  external_name: string;
  sync_frequency: number;
  last_sync_at: string;
  last_sync_status: string;
  last_sync_error: string;
  events_imported: number;
  export_token: string;
  is_active: boolean;
  units?: { name: string };
}

interface Unit {
  id: string;
  name: string;
}

export default function CalendarSyncPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const [tenantId, setTenantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncs, setSyncs] = useState<CalendarSync[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    external_url: "",
    external_source: "airbnb",
    external_name: "",
    unit_id: "",
    sync_frequency: 6,
  });

  useEffect(() => {
    async function init() {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", tenantSlug)
        .single();

      if (tenant) {
        setTenantId(tenant.id);
        await loadData(tenant.id);
      }
      setLoading(false);
    }
    init();
  }, [tenantSlug]);

  async function loadData(tid: string) {
    const { data: syncsData } = await supabase
      .from("calendar_sync")
      .select("*, units(name)")
      .eq("tenant_id", tid)
      .eq("sync_type", "import")
      .order("created_at", { ascending: false });

    if (syncsData) setSyncs(syncsData as CalendarSync[]);

    const { data: unitsData } = await supabase
      .from("units")
      .select("id, name")
      .eq("tenant_id", tid)
      .eq("status", "active")
      .order("name");

    if (unitsData) setUnits(unitsData);
  }

  const exportUrl = `https://miestadia.online/api/ical/${tenantSlug}.ics`;

  function copyExportUrl() {
    navigator.clipboard.writeText(exportUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleAddSync() {
    if (!formData.external_url || !formData.unit_id) {
      alert("Completá la URL y seleccioná una unidad");
      return;
    }

    const { error } = await supabase.from("calendar_sync").insert({
      tenant_id: tenantId,
      unit_id: formData.unit_id,
      sync_type: "import",
      external_url: formData.external_url,
      external_source: formData.external_source,
      external_name: formData.external_name || `${formData.external_source} - ${units.find((u) => u.id === formData.unit_id)?.name}`,
      sync_frequency: formData.sync_frequency,
      is_active: true,
    });

    if (error) {
      alert("Error: " + error.message);
      return;
    }

    setFormData({
      external_url: "",
      external_source: "airbnb",
      external_name: "",
      unit_id: "",
      sync_frequency: 6,
    });
    setShowAddForm(false);
    await loadData(tenantId);
  }

  async function handleDeleteSync(id: string) {
    if (!confirm("¿Eliminar esta sincronización?")) return;

    const { error } = await supabase.from("calendar_sync").delete().eq("id", id);
    if (error) {
      alert("Error: " + error.message);
      return;
    }

    await loadData(tenantId);
  }

  async function handleSyncNow(syncId: string) {
    setSyncingId(syncId);
    try {
      const response = await fetch("/api/ical/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error en la sincronización");
      }

      alert(`✅ ${data.message}`);
      await loadData(tenantId);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSyncingId(null);
    }
  }

  function getStatusBadge(status: string) {
    if (status === "success") {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Exitosa
        </Badge>
      );
    }
    if (status === "error") {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Error
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-800 border-gray-200">
        <Clock className="w-3 h-3 mr-1" />
        Pendiente
      </Badge>
    );
  }

  function getSourceIcon(source: string) {
    if (source === "airbnb") return "";
    if (source === "booking") return "🏨";
    if (source === "vrbo") return "🏡";
    return "📅";
  }

  function timeAgo(dateStr: string) {
    if (!dateStr) return "Nunca";
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F766E]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sincro con Booking y Airbnb</h1>
        <p className="text-gray-500 mt-1">
          Sincronizá tus reservas con Airbnb, Booking y otras plataformas
        </p>
      </div>

      {/* EXPORTACIÓN */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Globe className="w-5 h-5" />
            Exportar tu calendario (Mi Estadía → Airbnb/Booking)
          </CardTitle>
          <CardDescription className="text-green-700">
            Copiá esta URL y pegala en Airbnb/Booking para que vean tus reservas de Mi Estadía
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white border border-green-200 rounded-lg p-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">Tu URL de exportación:</label>
            <div className="flex items-center gap-2">
              <Input
                value={exportUrl}
                readOnly
                className="font-mono text-sm bg-gray-50"
              />
              <Button
                onClick={copyExportUrl}
                variant="outline"
                className="flex-shrink-0"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Pegá esta URL en Airbnb: Calendario → Disponibilidad y precios → Sincronización de calendarios → Importar calendario
            </p>
          </div>
        </CardContent>
      </Card>

      {/* IMPORTACIÓN */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Importar calendarios externos (Airbnb/Booking → Mi Estadía)
              </CardTitle>
              <CardDescription>
                Agregá las URLs de tus calendarios de Airbnb/Booking para bloquear fechas automáticamente
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar calendario
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddForm && (
            <Card className="bg-gray-50 border-2 border-gray-200">
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL del calendario externo *
                    </label>
                    <Input
                      value={formData.external_url}
                      onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                      placeholder="https://www.airbnb.com/calendar/ical/..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Obtenela en Airbnb/Booking → Calendario → Exportar calendario
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plataforma *
                    </label>
                    <select
                      value={formData.external_source}
                      onChange={(e) => setFormData({ ...formData, external_source: e.target.value })}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="airbnb">Airbnb</option>
                      <option value="booking">Booking.com</option>
                      <option value="vrbo">Vrbo</option>
                      <option value="ical">Otro (iCal genérico)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre (para identificar) *
                    </label>
                    <Input
                      value={formData.external_name}
                      onChange={(e) => setFormData({ ...formData, external_name: e.target.value })}
                      placeholder="Ej: Airbnb Cabaña 1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unidad de Mi Estadía *
                    </label>
                    <select
                      value={formData.unit_id}
                      onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="">Seleccionar unidad...</option>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frecuencia de sincronización
                    </label>
                    <select
                      value={formData.sync_frequency}
                      onChange={(e) => setFormData({ ...formData, sync_frequency: parseInt(e.target.value) })}
                      className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value={1}>Cada 1 hora</option>
                      <option value={3}>Cada 3 horas</option>
                      <option value={6}>Cada 6 horas</option>
                      <option value={12}>Cada 12 horas</option>
                      <option value={24}>Cada 24 horas</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddSync} className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Guardar calendario
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {syncs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">No tenés calendarios externos configurados</p>
              <p className="text-sm text-gray-500">
                Agregá la URL de tu calendario de Airbnb o Booking para sincronizar automáticamente
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {syncs.map((sync) => (
                <div
                  key={sync.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getSourceIcon(sync.external_source)}</span>
                        <h3 className="font-semibold text-gray-900">{sync.external_name}</h3>
                        {getStatusBadge(sync.last_sync_status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs">Unidad</p>
                          <p className="font-medium text-gray-900">{sync.units?.name || "—"}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Última sync</p>
                          <p className="font-medium text-gray-900">{timeAgo(sync.last_sync_at)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Eventos importados</p>
                          <p className="font-medium text-gray-900">{sync.events_imported}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Frecuencia</p>
                          <p className="font-medium text-gray-900">Cada {sync.sync_frequency}hs</p>
                        </div>
                      </div>
                      {sync.last_sync_error && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          {sync.last_sync_error}
                        </div>
                      )}
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 truncate">
                          <ExternalLink className="w-3 h-3 inline mr-1" />
                          {sync.external_url}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleSyncNow(sync.id)}
                        disabled={syncingId === sync.id}
                        className="flex items-center gap-2"
                      >
                        {syncingId === sync.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Sync ahora
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteSync(sync.id)}
                        className="text-red-600 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            ¿Cómo funciona la sincronización?
          </h3>
          <div className="space-y-3 text-sm text-blue-800">
            <div>
              <strong>1. Exportar (Mi Estadía → Airbnb/Booking):</strong>
              <p className="mt-1">
                Copiá tu URL de exportación y pegala en Airbnb/Booking. Así ellos verán tus reservas de Mi Estadía y bloquearán esas fechas automáticamente.
              </p>
            </div>
            <div>
              <strong>2. Importar (Airbnb/Booking → Mi Estadía):</strong>
              <p className="mt-1">
                Agregá la URL de tu calendario de Airbnb/Booking. Mi Estadía descargará ese calendario periódicamente y bloqueará las fechas ocupadas en esas plataformas.
              </p>
            </div>
            <div>
              <strong>3. Sincronización automática:</strong>
              <p className="mt-1">
                Las sincronizaciones ocurren automáticamente según la frecuencia que configures. También podés forzar una sincronización manual con el botón "Sync ahora".
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}