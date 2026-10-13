"use client";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import {
  Calendar,
  Users,
  Search,
  CheckCircle,
  Loader2,
  AlertCircle,
  ChevronLeft,
  Shield,
  Clock,
} from "lucide-react";

interface Unit {
  id: string;
  name: string;
  type: string;
  capacity: number;
  price_per_night: number;
  description: string;
  photos: { image_url: string; is_primary: boolean }[];
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings?: any;
  branding?: any;
}

type Step = "dates" | "units" | "form" | "success";

export default function PublicReservationsPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>("dates");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestsCount, setGuestsCount] = useState(1);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    guestDocument: "",
    specialRequests: "",
  });

  // Calcular minDate una sola vez
  const minDate = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  // Estilo base para forzar inputs visibles
  const inputStyle = { colorScheme: "light" as const };
  const inputClass =
    "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white";

  useEffect(() => {
    async function loadData() {
      try {
        const { data: tenantData, error: tenantError } = await supabase
          .from("tenants")
          .select("*")
          .eq("slug", tenantSlug)
          .single();

        if (tenantError || !tenantData) {
          setError("Alojamiento no encontrado");
          setLoading(false);
          return;
        }
        setTenant(tenantData);

        const { data: unitsData } = await supabase
          .from("units")
          .select("*")
          .eq("tenant_id", tenantData.id)
          .eq("status", "active");

        if (unitsData) {
          const unitsWithPhotos = await Promise.all(
            unitsData.map(async (unit) => {
              const { data: photos } = await supabase
                .from("unit_photos")
                .select("image_url, is_primary")
                .eq("unit_id", unit.id)
                .order("order_index");
              return { ...unit, photos: photos || [] };
            })
          );
          setUnits(unitsWithPhotos);
        }
      } catch (err: any) {
        setError("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tenantSlug]);

  async function handleCheckAvailability() {
    if (!checkIn || !checkOut) {
      alert("Seleccioná las fechas de check-in y check-out");
      return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      alert("La fecha de check-out debe ser posterior al check-in");
      return;
    }

    setCheckingAvailability(true);
    setError("");

    try {
      const available: Unit[] = [];

      for (const unit of units) {
        if (unit.capacity < guestsCount) continue;

        const response = await fetch("/api/check-availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantSlug,
            unitId: unit.id,
            checkIn,
            checkOut,
          }),
        });

        const data = await response.json();

        if (data.available) {
          available.push(unit);
        }
      }

      setAvailableUnits(available);
      setStep("units");
    } catch (err) {
      setError("Error al verificar disponibilidad");
    } finally {
      setCheckingAvailability(false);
    }
  }

  function selectUnit(unit: Unit) {
    setSelectedUnit(unit);
    setStep("form");
  }

  async function handleSubmitReservation(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.guestName || !formData.guestEmail || !selectedUnit) {
      alert("Completá todos los campos obligatorios");
      return;
    }

    setSubmitting(true);

    try {
      const nights = Math.ceil(
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const totalAmount = nights * selectedUnit.price_per_night;

      const response = await fetch("/api/create-reservation-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          unitId: selectedUnit.id,
          guestName: formData.guestName,
          guestEmail: formData.guestEmail,
          guestPhone: formData.guestPhone,
          guestDocument: formData.guestDocument,
          checkIn,
          checkOut,
          guestsCount,
          totalAmount,
          specialRequests: formData.specialRequests,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear la solicitud");
      }

      setStep("success");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function calculateNights() {
    if (!checkIn || !checkOut) return 0;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    return Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">
            {error || "Alojamiento no encontrado"}
          </p>
          <button
            onClick={() => (window.location.href = `/${tenantSlug}`)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const branding = tenant.branding || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {branding.logoUrl && (
                <img
                  src={branding.logoUrl}
                  alt={tenant.name}
                  className="h-10 w-auto"
                />
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {tenant.name}
                </h1>
                <p className="text-sm text-gray-500">Reservas online</p>
              </div>
            </div>
            <button
              onClick={() => (window.location.href = `/${tenantSlug}`)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Volver al inicio
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {step === "dates" && (
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold mb-4">Reservá tu estadía</h2>
            <p className="text-xl text-green-100 mb-8">
              Elegí las fechas y descubrí nuestras unidades disponibles
            </p>
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Check-in
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min={minDate}
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Check-out
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn || minDate}
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Huéspedes
                  </label>
                  <input
                    type="number"
                    value={guestsCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1) {
                        setGuestsCount(val);
                      } else if (e.target.value === "") {
                        setGuestsCount(1);
                      }
                    }}
                    min="1"
                    max="20"
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
              </div>
              <button
                onClick={handleCheckAvailability}
                disabled={checkingAvailability}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {checkingAvailability ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verificando disponibilidad...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Ver unidades disponibles
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Units Grid */}
      {step === "units" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <button
              onClick={() => setStep("dates")}
              className="text-green-600 hover:text-green-700 font-medium mb-4 flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Cambiar fechas
            </button>
            <h2 className="text-3xl font-bold text-gray-900">
              Unidades disponibles
            </h2>
            <p className="text-gray-600 mt-2">
              {checkIn && checkOut && (
                <>
                  {new Date(checkIn).toLocaleDateString("es-AR")} →{" "}
                  {new Date(checkOut).toLocaleDateString("es-AR")} •{" "}
                  {calculateNights()}{" "}
                  {calculateNights() === 1 ? "noche" : "noches"} •{" "}
                  {guestsCount}{" "}
                  {guestsCount === 1 ? "huésped" : "huéspedes"}
                </>
              )}
            </p>
          </div>

          {availableUnits.length === 0 ? (
            <div className="text-center py-16">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No hay unidades disponibles
              </h3>
              <p className="text-gray-600 mb-6">
                Probá con otras fechas o contactanos directamente
              </p>
              <button
                onClick={() => setStep("dates")}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Cambiar fechas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableUnits.map((unit) => {
                const nights = calculateNights();
                const total = nights * unit.price_per_night;
                const primaryPhoto =
                  unit.photos.find((p) => p.is_primary) || unit.photos[0];

                return (
                  <div
                    key={unit.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    {primaryPhoto && (
                      <div className="relative h-48 bg-gray-200">
                        <img
                          src={primaryPhoto.image_url}
                          alt={unit.name}
                          className="w-full h-full object-cover"
                        />
                        {unit.type && (
                          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium text-gray-700">
                            {unit.type}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {unit.name}
                      </h3>
                      {unit.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {unit.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {unit.capacity} personas
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-2xl font-bold text-gray-900">
                            ${unit.price_per_night.toLocaleString("es-AR")}
                          </span>
                          <span className="text-sm text-gray-500">/ noche</span>
                        </div>
                        {nights > 0 && (
                          <div className="bg-green-50 rounded-lg p-3 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">
                                {nights} {nights === 1 ? "noche" : "noches"} × $
                                {unit.price_per_night.toLocaleString("es-AR")}
                              </span>
                              <span className="font-bold text-green-700">
                                Total: ${total.toLocaleString("es-AR")}
                              </span>
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => selectUnit(unit)}
                          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                          Reservar esta unidad
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Guest Form */}
      {step === "form" && selectedUnit && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => setStep("units")}
            className="text-green-600 hover:text-green-700 font-medium mb-6 flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver a unidades
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Completá tus datos
            </h2>
            <p className="text-gray-600 mb-8">
              Enviaremos una confirmación a tu email
            </p>

            {/* Resumen de reserva */}
            <div className="bg-green-50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">
                Resumen de tu reserva
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Unidad:</span>
                  <span className="font-medium text-gray-900">
                    {selectedUnit.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(checkIn).toLocaleDateString("es-AR")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-out:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(checkOut).toLocaleDateString("es-AR")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Noches:</span>
                  <span className="font-medium text-gray-900">
                    {calculateNights()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Huéspedes:</span>
                  <span className="font-medium text-gray-900">
                    {guestsCount}
                  </span>
                </div>
                <div className="border-t border-green-200 pt-2 mt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">Total:</span>
                  <span className="font-bold text-green-700 text-lg">
                    $
                    {(
                      calculateNights() * selectedUnit.price_per_night
                    ).toLocaleString("es-AR")}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitReservation} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={formData.guestName}
                  onChange={(e) =>
                    setFormData({ ...formData, guestName: e.target.value })
                  }
                  required
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.guestEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, guestEmail: e.target.value })
                  }
                  required
                  className={inputClass}
                  style={inputStyle}
                  placeholder="juan@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.guestPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, guestPhone: e.target.value })
                  }
                  className={inputClass}
                  style={inputStyle}
                  placeholder="011 1234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Documento (DNI/Pasaporte)
                </label>
                <input
                  type="text"
                  value={formData.guestDocument}
                  onChange={(e) =>
                    setFormData({ ...formData, guestDocument: e.target.value })
                  }
                  className={inputClass}
                  style={inputStyle}
                  placeholder="12345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Solicitudes especiales (opcional)
                </label>
                <textarea
                  value={formData.specialRequests}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      specialRequests: e.target.value,
                    })
                  }
                  rows={3}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Viajamos con mascota, necesitamos cuna, etc."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">
                      ¿Cómo funciona la reserva?
                    </p>
                    <p>
                      Tu solicitud será enviada al anfitrión, quien la confirmará
                      en las próximas 24 horas. Recibirás un email con la
                      confirmación.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando solicitud...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Enviar solicitud de reserva
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Success */}
      {step === "success" && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¡Solicitud enviada!
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Tu solicitud de reserva fue recibida. El anfitrión la revisará y te
              enviará una confirmación por email en las próximas 24 horas.
            </p>
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-gray-900 mb-4">
                Detalles de tu solicitud
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Unidad:</span>
                  <span className="font-medium text-gray-900">
                    {selectedUnit?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fechas:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(checkIn).toLocaleDateString("es-AR")} →{" "}
                    {new Date(checkOut).toLocaleDateString("es-AR")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">
                    {formData.guestEmail}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setStep("dates");
                  setCheckIn("");
                  setCheckOut("");
                  setSelectedUnit(null);
                  setFormData({
                    guestName: "",
                    guestEmail: "",
                    guestPhone: "",
                    guestDocument: "",
                    specialRequests: "",
                  });
                }}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Hacer otra reserva
              </button>
              <button
                onClick={() => (window.location.href = `/${tenantSlug}`)}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/mi-estadia-logo.png"
                alt="Mi Estadía"
                className="h-8 w-auto"
              />
              <span className="text-sm text-gray-600">© 2026 Mi Estadía</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                Reservas seguras
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Confirmación en 24hs
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}