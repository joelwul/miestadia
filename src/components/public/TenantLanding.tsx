"use client";
import { useState } from "react";
import {
  Calendar,
  Users,
  MapPin,
  Phone,
  MessageCircle,
  Star,
  ChevronDown,
  ChevronUp,
  Bed,
  Wifi,
  Car,
  Coffee,
  Waves,
  TreePalm,
  Shield,
  Clock,
  ArrowRight,
  ExternalLink,
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
  description?: string;
  settings?: any;
  branding?: any;
}

interface Props {
  tenant: Tenant;
  units: (Unit & { photos: { image_url: string; is_primary: boolean }[] })[];
}

export default function TenantLanding({ tenant, units }: Props) {
  const [showAllUnits, setShowAllUnits] = useState(false);
  const settings = tenant.settings || {};
  const branding = tenant.branding || {};

  const displayedUnits = showAllUnits ? units : units.slice(0, 3);

  const amenities = [
    { icon: Wifi, label: "Wi-Fi", active: settings.wifiNetworks?.length > 0 },
    { icon: Car, label: "Estacionamiento", active: settings.arrivalInstructions?.parkingInfo },
    { icon: Coffee, label: "Cocina equipada", active: true },
    { icon: TreePalm, label: "Espacios verdes", active: true },
    { icon: Waves, label: "Piscina", active: false },
    { icon: Shield, label: "Seguridad 24hs", active: false },
  ].filter((a) => a.active);

  const formatPrice = (price: number) => {
    if (!price || price === 0) return "A consultar";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <header className="relative bg-gradient-to-br from-green-700 to-emerald-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="flex items-center gap-3 mb-6">
            {branding.logoUrl && (
              <img src={branding.logoUrl} alt={tenant.name} className="h-16 w-auto bg-white rounded-lg p-2" />
            )}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">{tenant.name}</h1>
          {tenant.description && (
            <p className="text-xl md:text-2xl text-green-100 max-w-3xl mb-8">{tenant.description}</p>
          )}
          <div className="flex flex-wrap gap-4">
            <a
              href={`/${tenant.slug}/reservas`}
              className="inline-flex items-center gap-2 bg-white text-green-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-50 transition-colors shadow-lg"
            >
              <Calendar className="w-5 h-5" />
              Reservar ahora
              <ArrowRight className="w-5 h-5" />
            </a>
            {settings.whatsappNumber && (
              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-500 transition-colors border border-green-500"
              >
                <MessageCircle className="w-5 h-5" />
                Contactar
              </a>
            )}
          </div>
          {settings.address && (
            <div className="mt-8 flex items-center gap-2 text-green-200">
              <MapPin className="w-4 h-4" />
              <span>{settings.address}</span>
            </div>
          )}
        </div>
      </header>

      {/* UNIDADES */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Nuestras unidades</h2>
          <p className="text-gray-600 text-lg">Elegí el espacio perfecto para tu estadía</p>
        </div>
        {units.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Bed className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Próximamente disponibles</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedUnits.map((unit) => {
                const primaryPhoto = unit.photos.find((p) => p.is_primary) || unit.photos[0];
                return (
                  <div key={unit.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow">
                    {primaryPhoto ? (
                      <div className="relative h-56 bg-gray-200">
                        <img src={primaryPhoto.image_url} alt={unit.name} className="w-full h-full object-cover" />
                        {unit.type && (
                          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-gray-700">
                            {unit.type}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-56 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <Bed className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{unit.name}</h3>
                      {unit.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{unit.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {unit.capacity} personas
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-2xl font-bold text-gray-900">{formatPrice(unit.price_per_night)}</span>
                          {unit.price_per_night > 0 && <span className="text-sm text-gray-500">/ noche</span>}
                        </div>
                        <a
                          href={`/${tenant.slug}/reservas`}
                          className="block w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center"
                        >
                          Reservar
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {units.length > 3 && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowAllUnits(!showAllUnits)}
                  className="inline-flex items-center gap-2 px-6 py-3 border-2 border-green-600 text-green-700 rounded-lg font-semibold hover:bg-green-50 transition-colors"
                >
                  {showAllUnits ? (
                    <>
                      Ver menos <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Ver todas las unidades ({units.length}) <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* SERVICIOS */}
      {amenities.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Servicios incluidos</h2>
              <p className="text-gray-600 text-lg">Todo lo que necesitás para una estadía perfecta</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {amenities.map((amenity, idx) => {
                const Icon = amenity.icon;
                return (
                  <div key={idx} className="bg-white rounded-xl p-6 text-center hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6 text-green-700" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">{amenity.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* UBICACIÓN */}
      {settings.googleMapsUrl && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Ubicación</h2>
            <p className="text-gray-600 text-lg">Cómo llegar al alojamiento</p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
            <iframe
              src={`https://maps.google.com/maps?q=${encodeURIComponent(settings.googleMapsUrl)}&output=embed`}
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              title="Ubicación del alojamiento"
              className="w-full"
            />
          </div>
          {settings.address && (
            <p className="mt-4 text-gray-600 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {settings.address}
            </p>
          )}
        </section>
      )}

      {/* CTA FINAL */}
      <section className="bg-gradient-to-br from-green-600 to-emerald-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Listo para tu estadía?</h2>
          <p className="text-xl text-green-100 mb-8">Reservá ahora y asegurá tu lugar</p>
          <a
            href={`/${tenant.slug}/reservas`}
            className="inline-flex items-center gap-2 bg-white text-green-700 px-10 py-4 rounded-lg font-bold text-lg hover:bg-green-50 transition-colors shadow-lg"
          >
            <Calendar className="w-5 h-5" />
            Ver disponibilidad y reservar
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {branding.logoUrl && <img src={branding.logoUrl} alt={tenant.name} className="h-8 w-auto" />}
              <span className="text-sm text-gray-600">© 2026 {tenant.name}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {settings.whatsappNumber && (
                <a
                  href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-gray-700"
                >
                  <Phone className="w-4 h-4" />
                  {settings.whatsappNumber}
                </a>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>Powered by</span>
              <a href="https://miestadia.online" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-medium">
                Mi Estadía
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}