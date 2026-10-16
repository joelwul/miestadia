"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  User,
  Mail,
  Phone,
  FileText,
  Calendar,
  Home,
  ArrowLeft,
  ClipboardList,
} from "lucide-react";

export default function PreCheckinPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tenantSlug = params.tenantSlug as string;
  const [reservation, setReservation] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    documentNumber: "",
    documentType: "DNI",
    nationality: "Argentina",
    birthDate: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    specialRequests: "",
    arrivalTime: "",
    vehiclePlate: "",
    agreeToRules: false,
  });

  useEffect(() => {
    const init = async () => {
      const code = searchParams.get("code");
      const lastNameParam = searchParams.get("lastName");

      let reservationId: string | null = null;

      if (code && lastNameParam) {
        const { data: res } = await supabase
          .from("reservations")
          .select(`id, reservation_code, guests(last_name)`)
          .eq("reservation_code", code)
          .ilike("guests.last_name", `%${lastNameParam}%`)
          .single();

        if (res) {
          reservationId = res.id;
          sessionStorage.setItem(
            "guest_session",
            JSON.stringify({
              reservationId: res.id,
              code,
              lastName: lastNameParam,
              expiresAt: Date.now() + 24 * 60 * 60 * 1000,
            })
          );
        }
      }

      if (!reservationId) {
        const sessionStr = sessionStorage.getItem("guest_session");
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            if (session.expiresAt && Date.now() < session.expiresAt) {
              reservationId = session.reservationId;
            }
          } catch {
            sessionStorage.removeItem("guest_session");
          }
        }
      }

      if (!reservationId) {
        const sessionStr = localStorage.getItem("guest_session");
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            if (session.expiresAt && Date.now() < session.expiresAt) {
              reservationId = session.reservationId;
            }
          } catch {
            localStorage.removeItem("guest_session");
          }
        }
      }

      if (!reservationId) {
        setError("No hay sesión activa. Por favor, iniciá sesión nuevamente.");
        setLoading(false);
        return;
      }

      const { data: res, error: resError } = await supabase
        .from("reservations")
        .select(
          `*, guests (first_name, last_name, email, phone, document_number), units (name, type, description)`
        )
        .eq("id", reservationId)
        .single();

      if (resError || !res) {
        setError("No se pudo cargar la reserva");
        setLoading(false);
        return;
      }

      setReservation(res);

      const { data: tenantData } = await supabase
        .from("tenants")
        .select("*")
        .eq("slug", tenantSlug)
        .single();
      setTenant(tenantData);

      const { data: existingPreCheckin } = await supabase
        .from("pre_checkins")
        .select("*")
        .eq("reservation_id", reservationId)
        .maybeSingle();

      const guest = res.guests;
      setFormData({
        firstName: existingPreCheckin?.first_name || guest?.first_name || "",
        lastName: existingPreCheckin?.last_name || guest?.last_name || "",
        email: existingPreCheckin?.email || guest?.email || "",
        phone: existingPreCheckin?.phone || guest?.phone || "",
        documentNumber: existingPreCheckin?.document_number || guest?.document_number || "",
        documentType: existingPreCheckin?.document_type || "DNI",
        nationality: existingPreCheckin?.nationality || "Argentina",
        birthDate: existingPreCheckin?.birth_date || "",
        emergencyContactName: existingPreCheckin?.emergency_contact_name || "",
        emergencyContactPhone: existingPreCheckin?.emergency_contact_phone || "",
        specialRequests: existingPreCheckin?.special_requests || "",
        arrivalTime: existingPreCheckin?.arrival_time || "",
        vehiclePlate: existingPreCheckin?.vehicle_plate || "",
        agreeToRules: existingPreCheckin?.agree_to_rules || false,
      });

      setLoading(false);
    };
    init();
  }, [tenantSlug, searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.agreeToRules) {
      alert("Debés aceptar las reglas del alojamiento para continuar.");
      return;
    }
    setSaving(true);
    try {
      const { data: preCheckin, error: preCheckinError } = await supabase
        .from("pre_checkins")
        .upsert(
          {
            reservation_id: reservation.id,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            document_number: formData.documentNumber,
            document_type: formData.documentType,
            nationality: formData.nationality,
            birth_date: formData.birthDate,
            emergency_contact_name: formData.emergencyContactName,
            emergency_contact_phone: formData.emergencyContactPhone,
            special_requests: formData.specialRequests,
            arrival_time: formData.arrivalTime,
            vehicle_plate: formData.vehiclePlate,
            agree_to_rules: formData.agreeToRules,
            status: "completed",
            completed_at: new Date().toISOString(),
          },
          { onConflict: "reservation_id" }
        )
        .select()
        .single();

      if (preCheckinError) throw preCheckinError;

      await supabase
        .from("reservations")
        .update({ status: "pre_checkin" })
        .eq("id", reservation.id);

      setSuccess(true);
    } catch (err: any) {
      alert("Error al guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !reservation || !tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error || "No se encontró la reserva"}</p>
            <Button
              onClick={() => {
                sessionStorage.removeItem("guest_session");
                localStorage.removeItem("guest_session");
                window.location.href = `/${tenantSlug}`;
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pre Check-in completado!</h2>
            <p className="text-gray-600 mb-6">
              Tus datos fueron guardados correctamente. Te esperamos el {new Date(reservation.check_in).toLocaleDateString("es-AR")}.
            </p>
            <Button
              onClick={() => {
                window.location.href = `/${tenantSlug}?code=${reservation.reservation_code}&lastName=${encodeURIComponent(formData.lastName)}`;
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Volver al panel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const checkInDate = new Date(reservation.check_in);
  const checkOutDate = new Date(reservation.check_out);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              window.location.href = `/${tenantSlug}?code=${reservation.reservation_code}&lastName=${encodeURIComponent(formData.lastName)}`;
            }}
            className="mb-4 text-green-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al panel
          </Button>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-200">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-green-600 flex items-center justify-center">
                <ClipboardList className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pre Check-in</h1>
                <p className="text-gray-600">
                  {tenant.name} • {reservation.units?.name}
                </p>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {checkInDate.toLocaleDateString("es-AR")} → {checkOutDate.toLocaleDateString("es-AR")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" />
                Datos personales
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre *</label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Apellido *</label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    placeholder="Pérez"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="juan@email.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Teléfono *</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    placeholder="+54 9 11 1234-5678"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Tipo de documento</label>
                  <select
                    value={formData.documentType}
                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="DNI">DNI</option>
                    <option value="Pasaporte">Pasaporte</option>
                    <option value="Cédula">Cédula</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Número de documento *</label>
                  <Input
                    value={formData.documentNumber}
                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                    required
                    placeholder="12345678"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Nacionalidad</label>
                  <Input
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    placeholder="Argentina"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Fecha de nacimiento</label>
                  <Input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Contacto de emergencia
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre completo</label>
                  <Input
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    placeholder="María Pérez"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Teléfono</label>
                  <Input
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    placeholder="+54 9 11 1234-5678"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Detalles de llegada
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Hora estimada de llegada</label>
                  <Input
                    type="time"
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Patente del vehículo (opcional)</label>
                  <Input
                    value={formData.vehiclePlate}
                    onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                    placeholder="AB 123 CD"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Solicitudes especiales</label>
                <textarea
                  value={formData.specialRequests}
                  onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Alergias, necesidades especiales, etc."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreeToRules}
                  onChange={(e) => setFormData({ ...formData, agreeToRules: e.target.checked })}
                  className="h-5 w-5 mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  required
                />
                <div>
                  <p className="font-medium text-gray-900">Acepto las reglas del alojamiento</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Confirmo que he leído y acepto las normas de convivencia, horarios de check-in/check-out, y políticas de cancelación del alojamiento.
                  </p>
                </div>
              </label>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                window.location.href = `/${tenantSlug}?code=${reservation.reservation_code}&lastName=${encodeURIComponent(formData.lastName)}`;
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || !formData.agreeToRules}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completar Pre Check-in
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}