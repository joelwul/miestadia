"use client";
import { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  MapPin,
  Phone,
  MessageCircle,
  Star,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Bed,
  Shield,
  Clock,
  ArrowRight,
  ExternalLink,
  CheckCircle,
  X,
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

function getGoogleMapsEmbedUrl(mapsUrl: string): string | null {
  if (!mapsUrl) return null;
  
  // Si ya es una URL embed, usarla directamente
  if (mapsUrl.includes("/embed")) return mapsUrl;
  
  // Si es una URL de Google Maps normal, extraer coordenadas
  const patterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
  ];
  
  for (const pattern of patterns) {
    const match = mapsUrl.match(pattern);
    if (match) {
      const lat = match[1];
      const lng = match[2];
      return `https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&center=${lat},${lng}&zoom=15`;
    }
  }
  
  // Si es una URL de lugar, usar el formato de embed
  if (mapsUrl.includes("/maps/place/")) {
    const encodedUrl = encodeURIComponent(mapsUrl);
    return `https://maps.google.com/maps?q=${encodedUrl}&output=embed`;
  }
  
  // Si es una búsqueda, usar el formato de embed
  if (mapsUrl.includes("/maps/search/")) {
    const encodedUrl = encodeURIComponent(mapsUrl);
    return `https://maps.google.com/maps?q=${encodedUrl}&output=embed`;
  }
  
  // Fallback: intentar con la URL directa
  return mapsUrl;
}

export default function TenantLanding({ tenant, units }: Props) {
  const [showAllUnits, setShowAllUnits] = useState(false);
  const [heroPhotoIndex, setHeroPhotoIndex] = useState(0);
  const [galleryPhotoIndex, setGalleryPhotoIndex] = useState<number | null>(null);
  const settings = tenant.settings || {};
  const branding = tenant.branding || {};
  const landing = settings.landing || {};

  const heroPhotos = landing.heroPhotos?.length > 0 ? landing.heroPhotos : [];
  const services = landing.services || [];
  const amenities = landing.amenities || [];
  const gallery = landing.gallery || [];
  const policies = landing.policies || {};
  const nearbyPlaces = landing.nearbyPlaces || [];

  useEffect(() => {
    if (heroPhotos.length <= 1) return;
    const interval = setInterval(() => {
      setHeroPhotoIndex((prev) => (prev + 1) % heroPhotos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroPhotos.length]);

  const formatPrice = (price: number) => {
    if (!price || price === 0) return "A consultar";
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const displayedUnits = showAllUnits ? units : units.slice(0, 3);

  const heroTitle = landing.heroTitle || tenant.name || "Bienvenidos";
  const heroSubtitle = landing.heroSubtitle || tenant.description || "";
  const aboutText = landing.aboutText || "";
  const ctaText = landing.ctaText || "Reservar ahora";
  const ctaSubtext = landing.ctaSubtext || "";

  const mapsEmbedUrl = getGoogleMapsEmbedUrl(settings.googleMapsUrl);

  return (
    <div className="min-h-screen bg-white">
      {/* HERO con carrusel de fotos */}
      <header className="relative bg-gray-900 text-white overflow-hidden">
        {heroPhotos.length > 0 ? (
          <div className="absolute inset-0">
            {heroPhotos.map((photo, idx) => (
              <div
                key={idx}
                className="absolute inset-0 transition-opacity duration-1000"
                style={{ opacity: idx === heroPhotoIndex ? 1 : 0 }}
              >
                <img src={photo.url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-green-700 to-emerald-900" />
        )}

        {heroPhotos.length > 1 && (
          <>
            <button
              onClick={() => setHeroPhotoIndex((prev) => (prev - 1 + heroPhotos.length) % heroPhotos.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setHeroPhotoIndex((prev) => (prev + 1) % heroPhotos.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-full transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10 flex gap-2">
              {heroPhotos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroPhotoIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === heroPhotoIndex ? "bg-white w-8" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
          {/* LOGO MUCHO MÁS GRANDE */}
          <div className="flex items-center gap-6 mb-10">
            {branding.logoUrl && (
              <img
                src={branding.logoUrl}
                alt={tenant.name}
                className="h-40 md:h-48 w-auto bg-white rounded-2xl p-4 shadow-2xl"
              />
            )}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight drop-shadow-lg">
            {heroTitle}
          </h1>
          {heroSubtitle && (
            <p className="text-2xl md:text-3xl text-white/90 max-w-3xl mb-10 drop-shadow-md">
              {heroSubtitle}
            </p>
          )}
          <div className="flex flex-wrap gap-4">
            <a
              href={`/${tenant.slug}/reservas`}
              className="inline-flex items-center gap-2 bg-white text-green-700 px-10 py-5 rounded-xl font-bold text-xl hover:bg-green-50 transition-all shadow-2xl hover:scale-105"
            >
              <Calendar className="w-6 h-6" />
              {ctaText}
              <ArrowRight className="w-6 h-6" />
            </a>
            {settings.whatsappNumber && (
              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 text-white px-10 py-5 rounded-xl font-bold text-xl hover:bg-green-500 transition-all border-2 border-white/30 backdrop-blur"
              >
                <MessageCircle className="w-6 h-6" />
                Contactar
              </a>
            )}
          </div>
          {ctaSubtext && (
            <p className="mt-6 text-white/80 text-lg">{ctaSubtext}</p>
          )}
          {settings.address && (
            <div className="mt-8 flex items-center gap-2 text-white/90 text-lg">
              <MapPin className="w-5 h-5" />
              <span>{settings.address}</span>
            </div>
          )}
        </div>
      </header>

      {/* SOBRE NOSOTROS */}
      {aboutText && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Sobre nosotros</h2>
            <p className="text-xl text-gray-700 leading-relaxed whitespace-pre-line">{aboutText}</p>
          </div>
        </section>
      )}

      {/* SERVICIOS DESTACADOS */}
      {services.length > 0 && (
        <section className="bg-gradient-to-br from-green-50 to-emerald-50 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-3">Nuestros servicios</h2>
              <p className="text-lg text-gray-600">Todo lo que necesitás para una estadía perfecta</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow border border-gray-100"
                >
                  <div className="text-5xl mb-4">{service.icon || "⭐"}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                  {service.description && (
                    <p className="text-gray-600">{service.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* UNIDADES */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">Nuestras unidades</h2>
          <p className="text-lg text-gray-600">Elegí el espacio perfecto para tu estadía</p>
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
                  <div
                    key={unit.id}
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow"
                  >
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

      {/* COMODIDADES */}
      {amenities.length > 0 && (
        <section className="bg-gray-50 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-3">Comodidades incluidas</h2>
              <p className="text-lg text-gray-600">Todo lo que tenés a disposición</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {amenities.map((amenity: any, idx: number) => (
                <div key={idx} className="bg-white rounded-xl p-6 text-center hover:shadow-md transition-shadow border border-gray-100">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900">{amenity.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GALERÍA */}
      {gallery.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Galería</h2>
            <p className="text-lg text-gray-600">Conocé nuestros espacios</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.map((photo: any, idx: number) => (
              <div
                key={idx}
                onClick={() => setGalleryPhotoIndex(idx)}
                className="relative aspect-square bg-gray-200 rounded-xl overflow-hidden cursor-pointer group"
              >
                <img src={photo.url} alt={photo.caption || ""} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-white text-sm">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal galería */}
      {galleryPhotoIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setGalleryPhotoIndex(null)}
        >
          <button
            onClick={() => setGalleryPhotoIndex(null)}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setGalleryPhotoIndex((prev) => (prev! - 1 + gallery.length) % gallery.length);
            }}
            className="absolute left-4 p-2 bg-white/20 hover:bg-white/30 rounded-full"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <img
            src={gallery[galleryPhotoIndex].url}
            alt=""
            className="max-w-5xl max-h-[80vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setGalleryPhotoIndex((prev) => (prev! + 1) % gallery.length);
            }}
            className="absolute right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
          {gallery[galleryPhotoIndex].caption && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg">
              {gallery[galleryPhotoIndex].caption}
            </div>
          )}
        </div>
      )}

      {/* POLÍTICAS */}
      {(policies.checkIn || policies.checkOut || policies.cancellation || policies.children || policies.pets || policies.smoking) && (
        <section className="bg-amber-50 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-3">Políticas del alojamiento</h2>
              <p className="text-lg text-gray-600">Información importante antes de reservar</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {policies.checkIn && (
                <div className="bg-white rounded-xl p-6 border border-amber-200">
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" /> Check-in
                  </h3>
                  <p className="text-gray-700">{policies.checkIn}</p>
                </div>
              )}
              {policies.checkOut && (
                <div className="bg-white rounded-xl p-6 border border-amber-200">
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" /> Check-out
                  </h3>
                  <p className="text-gray-700">{policies.checkOut}</p>
                </div>
              )}
              {policies.cancellation && (
                <div className="bg-white rounded-xl p-6 border border-amber-200">
                  <h3 className="font-bold text-gray-900 mb-2">Cancelación</h3>
                  <p className="text-gray-700">{policies.cancellation}</p>
                </div>
              )}
              {policies.children && (
                <div className="bg-white rounded-xl p-6 border border-amber-200">
                  <h3 className="font-bold text-gray-900 mb-2">Niños</h3>
                  <p className="text-gray-700">{policies.children}</p>
                </div>
              )}
              {policies.pets && (
                <div className="bg-white rounded-xl p-6 border border-amber-200">
                  <h3 className="font-bold text-gray-900 mb-2">Mascotas</h3>
                  <p className="text-gray-700">{policies.pets}</p>
                </div>
              )}
              {policies.smoking && (
                <div className="bg-white rounded-xl p-6 border border-amber-200">
                  <h3 className="font-bold text-gray-900 mb-2">Fumar</h3>
                  <p className="text-gray-700">{policies.smoking}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* LUGARES CERCANOS */}
      {nearbyPlaces.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Lugares cercanos</h2>
            <p className="text-lg text-gray-600">Descubrí qué hay alrededor</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearbyPlaces.map((place: any, idx: number) => (
              <div key={idx} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">{place.name}</h3>
                    {place.description && <p className="text-sm text-gray-600 mb-2">{place.description}</p>}
                    {place.distance && (
                      <span className="inline-block text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                        {place.distance}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* UBICACIÓN CON MAPA */}
      {mapsEmbedUrl && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Ubicación</h2>
            <p className="text-lg text-gray-600">Cómo llegar al alojamiento</p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg bg-gray-100">
            <iframe
              src={mapsEmbedUrl}
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación del alojamiento"
              className="w-full"
            />
          </div>
          {settings.address && (
            <p className="mt-4 text-gray-600 flex items-center gap-2 justify-center text-lg">
              <MapPin className="w-5 h-5" />
              {settings.address}
            </p>
          )}
        </section>
      )}

      {/* CTA FINAL */}
      <section className="bg-gradient-to-br from-green-600 to-emerald-700 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">¿Listo para tu estadía?</h2>
          <p className="text-xl text-green-100 mb-10">Reservá ahora y asegurá tu lugar</p>
          <a
            href={`/${tenant.slug}/reservas`}
            className="inline-flex items-center gap-2 bg-white text-green-700 px-12 py-5 rounded-xl font-bold text-xl hover:bg-green-50 transition-all shadow-2xl hover:scale-105"
          >
            <Calendar className="w-6 h-6" />
            {ctaText}
            <ArrowRight className="w-6 h-6" />
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {branding.logoUrl && <img src={branding.logoUrl} alt={tenant.name} className="h-10 w-auto" />}
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