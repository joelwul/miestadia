"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  UserCheck,
  CreditCard,
  MessageCircle,
  Users,
  Shield,
  CloudSun,
  MapPin,
  Compass,
  Bed,
  ShoppingBag,
  UtensilsCrossed,
  Star,
  Globe,
  Palette,
  BarChart3,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Gestión de reservas",
    description: "Estados automáticos, importación CSV y parser de WhatsApp.",
    color: "bg-teal-100 text-teal-700",
  },
  {
    icon: UserCheck,
    title: "Check-in operativo",
    description: "Registro de llaves, observaciones e historial completo.",
    color: "bg-teal-100 text-teal-700",
  },
  {
    icon: CreditCard,
    title: "Control de pagos",
    description: "Saldos, señas, pagos parciales y barra visual tipo batería.",
    color: "bg-teal-100 text-teal-700",
  },
  {
    icon: MessageCircle,
    title: "Mensajería WhatsApp",
    description: "Plantillas automáticas y links directos al panel del huésped.",
    color: "bg-teal-100 text-teal-700",
  },
  {
    icon: Users,
    title: "Gestión de huéspedes",
    description: "Datos, historial y pre-checkin digital con formulario personalizado.",
    color: "bg-teal-100 text-teal-700",
  },
  {
    icon: Shield,
    title: "Seguridad total",
    description: "Aislamiento por tenant, sesiones con expiración y RLS en datos.",
    color: "bg-teal-100 text-teal-700",
  },
  {
    icon: CloudSun,
    title: "Clima en tiempo real",
    description: "Pronóstico automático para el rango de estadía del huésped.",
    color: "bg-teal-100 text-teal-700",
  },
  {
    icon: MapPin,
    title: "Mapa y ubicación",
    description: "Google Maps embebido con coordenadas auto-extraídas.",
    color: "bg-teal-100 text-teal-700",
  },
  {
    icon: Compass,
    title: "Guía del destino",
    description: "Lugares recomendados por categoría con tips del anfitrión.",
    color: "bg-teal-100 text-teal-700",
  },
  {
    icon: Bed,
    title: "Inventario de unidades",
    description: "Categorías personalizables: ropa de cama, cocina, baño y más.",
    color: "bg-teal-100 text-teal-700",
  },
  {
    icon: ShoppingBag,
    title: "Venta de productos",
    description: "Ofrecé productos adicionales dentro del sistema (toallas, kits, etc.).",
    color: "bg-teal-100 text-teal-700",
  },
  {
    icon: UtensilsCrossed,
    title: "Gastronomía y experiencias",
    description: "Incluí desayunos, cenas o experiencias locales como upsell.",
    color: "bg-teal-100 text-teal-700",
  },
  {
    icon: Star,
    title: "Reseñas en Google Maps",
    description: "Solicitud automática post-estadía con link directo (alto valor).",
    color: "bg-teal-100 text-teal-700",
  },
  {
    icon: Globe,
    title: "100% web, sin instalar",
    description: "Funciona en cualquier navegador. Anfitrión y huésped desde el celular.",
    color: "bg-teal-100 text-teal-700",
  },
  {
    icon: Palette,
    title: "Branding personalizado",
    description: "Logo, colores de marca y dominio propio en tu panel.",
    color: "bg-teal-100 text-teal-700",
  },
  {
    icon: BarChart3,
    title: "Reportes claros",
    description: "Ocupación, ingresos y huéspedes recurrentes de un vistazo.",
    color: "bg-teal-100 text-teal-700",
  },
];

const phoneScreens = [
  {
    title: "Pre Check-in Digital",
    description: "Tus huéspedes completan sus datos antes de llegar",
    image: "/mockups/pre-checkin.png",
    gradient: "from-orange-500 to-orange-600",
  },
  {
    title: "Detalles de Reserva",
    description: "Check-in, check-out y unidad asignada",
    image: "/mockups/reservation.png",
    gradient: "from-teal-600 to-teal-700",
  },
  {
    title: "Servicios Adicionales",
    description: "Solicitá servicios extra por WhatsApp",
    image: "/mockups/services.png",
    gradient: "from-green-600 to-green-700",
  },
  {
    title: "Guía del Destino",
    description: "Lugares recomendados por el anfitrión",
    image: "/mockups/destination.png",
    gradient: "from-amber-500 to-amber-600",
  },
  {
    title: "Estado de Pago",
    description: "Control total de pagos y saldos",
    image: "/mockups/payment.png",
    gradient: "from-teal-600 to-teal-700",
  },
  {
    title: "Clima en Tiempo Real",
    description: "Pronóstico durante toda la estadía",
    image: "/mockups/weather.png",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    title: "Check-out Simple",
    description: "Instrucciones claras para la salida",
    image: "/mockups/checkout.png",
    gradient: "from-gray-600 to-gray-700",
  },
];

export default function LandingPage() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScreen((prev) => (prev + 1) % phoneScreens.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const scrollFeatures = (direction: "left" | "right") => {
    if (featuresRef.current) {
      const scrollAmount = 320;
      featuresRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-600 to-green-700 text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <span className="text-3xl font-bold">Mi Estadía</span>
            </div>

            {/* Frase protagonista */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Menos trabajo para vos.
              <br />
              <span className="text-yellow-300">Más experiencia</span> para tus huéspedes.
            </h1>

            <p className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed max-w-3xl mx-auto">
              Mi Estadía transforma cada reserva en una experiencia digital personalizada,
              desde antes de llegar hasta después de irse.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-teal-700 px-8 py-4 rounded-lg font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-2 text-lg">
                Comenzar prueba gratis
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors text-lg">
                Ver demo
              </button>
            </div>

            <p className="text-sm text-white/70 mt-6">
              30 días de prueba gratis • Sin tarjeta de crédito
            </p>
          </motion.div>
        </div>
      </section>

      {/* PHONE MOCKUPS CAROUSEL */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Una experiencia completa para tus huéspedes
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Desde el pre check-in hasta el check-out, todo en una app web elegante y funcional
            </p>
          </motion.div>

          <div className="relative">
            {/* Phone display */}
            <div className="flex justify-center mb-8">
              <div className="relative w-72 h-[580px]">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] shadow-2xl p-3">
                  <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10" />
                    
                    {/* Screen content */}
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <div className="text-center p-6">
                        <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${phoneScreens[currentScreen].gradient} flex items-center justify-center`}>
                          <Building2 className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {phoneScreens[currentScreen].title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {phoneScreens[currentScreen].description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation dots */}
            <div className="flex justify-center gap-2 mb-6">
              {phoneScreens.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentScreen(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentScreen ? "w-8 bg-teal-600" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

            {/* Screen titles */}
            <div className="flex justify-center gap-2 flex-wrap">
              {phoneScreens.map((screen, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentScreen(index)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    index === currentScreen
                      ? "bg-teal-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {screen.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SLIDER */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-sm font-semibold text-teal-600 uppercase tracking-wide mb-2">
              TODO INCLUIDO
            </p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitás, nada que sobre
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Una plataforma completa para profesionalizar tu alojamiento y deleitar a tus huéspedes
            </p>
          </motion.div>

          <div className="relative">
            {/* Navigation buttons */}
            <button
              onClick={() => scrollFeatures("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <button
              onClick={() => scrollFeatures("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>

            {/* Features slider */}
            <div
              ref={featuresRef}
              className="flex gap-6 overflow-x-auto scroll-smooth pb-4 px-4 scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="flex-shrink-0 w-72 bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 bg-gradient-to-br from-teal-700 to-green-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              ¿Listo para transformar tu alojamiento?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Unite a los anfitriones que ya ofrecen una experiencia premium a sus huéspedes
            </p>
            <button className="bg-white text-teal-700 px-8 py-4 rounded-lg font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-2 text-lg mx-auto">
              Comenzar prueba gratis
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-sm text-white/70 mt-4">
              30 días de prueba gratis • Sin tarjeta de crédito
            </p>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">Mi Estadía</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Términos</a>
              <a href="#" className="hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="hover:text-white transition-colors">Contacto</a>
            </div>
            <p className="text-sm text-gray-400">
              © 2026 Mi Estadía. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}