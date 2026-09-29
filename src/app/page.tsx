"use client";
import { motion } from "framer-motion";
import {
  Check,
  Wifi,
  MapPin,
  CloudSun,
  MessageCircle,
  CalendarCheck,
  CreditCard,
  Key,
  Star,
  ShoppingBag,
  UtensilsCrossed,
  Compass,
  Package,
  Clock,
  ShieldCheck,
  Zap,
  Heart,
  ArrowRight,
  Sparkles,
  Users,
  BarChart3,
  Bell,
  Camera,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Building2,
  CheckCircle,
  Calendar,
  Send,
  LogOut,
  Info,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

// ============================================
// LOGO HERO
// ============================================
const Logo = ({ size = 200 }: { size?: number }) => (
  <div className="relative inline-block">
    <Image
      src="/logotransparente1.png"
      alt="Mi Estadía"
      width={size}
      height={size}
      className="drop-shadow-2xl"
      priority
      loading="eager"
      style={{ width: "auto", height: "auto", mixBlendMode: "multiply" }}
    />
  </div>
);

// ============================================
// NAVBAR
// ============================================
const Navbar = () => (
  <motion.nav
    initial={{ y: -100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.6 }}
    className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm"
  >
    <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3">
        <Image src="/mi-estadia-logo.png" alt="Mi Estadía" width={40} height={40} className="rounded-lg" style={{ width: "auto", height: "auto" }} />
        <span className="text-xl font-bold text-[#0F766E] hidden sm:block">Mi Estadía</span>
      </Link>
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
        <a href="#beneficios" className="hover:text-[#0F766E] transition">Beneficios</a>
        <a href="#huesped" className="hover:text-[#0F766E] transition">Huéspedes</a>
        <a href="#precios" className="hover:text-[#0F766E] transition">Precios</a>
        <a href="#faq" className="hover:text-[#0F766E] transition">FAQ</a>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/login" className="text-sm font-medium text-[#0F766E] hover:underline hidden sm:block">Ingresar</Link>
        <Link href="/login" className="text-sm font-semibold bg-[#EA580C] text-white px-5 py-2.5 rounded-full hover:bg-[#C2410C] transition shadow-md">Probar gratis</Link>
      </div>
    </div>
  </motion.nav>
);

// ============================================
// HERO
// ============================================
const slides = ["/images/slides/slide-1.jpg", "/images/slides/slide-2.jpg", "/images/slides/slide-3.jpg", "/images/slides/slide-4.jpg", "/images/slides/slide-5.jpg", "/images/slides/slide-6.jpg"];

const Hero = () => {
  const [current, setCurrent] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => setCurrent((prev) => (prev + 1) % slides.length), 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    slides.forEach((src, i) => {
      const img = new window.Image();
      img.onload = () => setLoadedImages((prev) => { const next = new Set(prev); next.add(i); return next; });
      img.src = src;
    });
  }, []);

  const hasAnyImage = loadedImages.size > 0;

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F766E] via-[#166534] to-[#0F766E]" />
      {hasAnyImage && (
        <div className="absolute inset-0">
          {slides.map((src, i) => (
            <motion.div key={i} className="absolute inset-0" initial={false} animate={{ opacity: i === current ? 1 : 0 }} transition={{ duration: 1.2, ease: "easeInOut" }}>
              <motion.div className="absolute inset-0" initial={{ scale: 1.1 }} animate={{ scale: i === current ? 1 : 1.1 }} transition={{ duration: 6, ease: "linear" }}>
                <img src={src} alt="" className="w-full h-full object-cover" style={{ display: loadedImages.has(i) ? "block" : "none" }} />
              </motion.div>
            </motion.div>
          ))}
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />
        </div>
      )}
      <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, type: "spring", bounce: 0.3 }} className="relative z-10">
        <Logo size={220} />
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 1 }} className="relative z-10 mt-8 text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight">
        Más simple para vos.
        <br />
        <span className="text-yellow-300">Más experiencia</span> para tus huéspedes.
      </motion.h1>
      <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1 }} className="relative z-10 mt-6 max-w-3xl text-xl md:text-2xl text-white font-medium leading-relaxed">
        Mi Estadía transforma cada reserva en una experiencia digital personalizada, desde antes de llegar hasta después de irse.
      </motion.p>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 1 }} className="relative z-10 mt-10 flex flex-col sm:flex-row gap-4">
        <Link href="/login" className="group px-8 py-4 rounded-full bg-[#EA580C] text-white font-bold text-lg hover:bg-[#C2410C] transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
          Probar gratis 30 días
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
        </Link>
        <a href="https://wa.me/5491131923742?text=Hola!%20Quiero%20mas%20info%20sobre%20Mi%20Estadia" target="_blank" rel="noopener noreferrer" className="px-8 py-4 rounded-full border-2 border-white text-white font-bold text-lg hover:bg-white hover:text-[#0F766E] transition flex items-center justify-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Hablar por WhatsApp
        </a>
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="relative z-10 mt-5 text-sm text-white/90 font-medium">
        Sin tarjeta de crédito - Sin instalaciones - Cancelás cuando quieras
      </motion.p>
    </section>
  );
};

// ============================================
// MOCKUPS DE CELULAR - CARRUSEL AUTOMÁTICO
// ============================================
const phoneScreens = [
  {
    title: "Pre Check-in Digital",
    description: "Tus huéspedes completan sus datos antes de llegar",
    icon: "",
    gradient: "from-orange-500 to-orange-600",
    content: (
      <>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Número de documento</p>
          <p className="text-sm font-medium text-gray-800">35.123.456</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Placa del vehículo</p>
          <p className="text-sm font-medium text-gray-800">ABC 123</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Contacto de emergencia</p>
          <p className="text-sm font-medium text-gray-800">María - 11 2345-6789</p>
        </div>
        <button className="w-full bg-[#EA580C] text-white py-3 rounded-xl font-semibold mt-4">Completar pre check-in</button>
      </>
    ),
  },
  {
    title: "Detalles de Reserva",
    description: "Check-in, check-out y unidad asignada",
    icon: "📅",
    gradient: "from-teal-600 to-teal-700",
    content: (
      <>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <CalendarCheck className="w-6 h-6 text-[#0F766E]" />
          <div><p className="text-xs text-gray-500">Check-in</p><p className="text-sm font-semibold text-gray-800">15 Mar</p></div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <CalendarCheck className="w-6 h-6 text-[#EA580C]" />
          <div><p className="text-xs text-gray-500">Check-out</p><p className="text-sm font-semibold text-gray-800">20 Mar</p></div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <Building2 className="w-6 h-6 text-[#0F766E]" />
          <div><p className="text-xs text-gray-500">Unidad</p><p className="text-sm font-semibold text-gray-800">Cabaña del Bosque</p></div>
        </div>
      </>
    ),
  },
  {
    title: "Servicios Adicionales",
    description: "Solicitá servicios extra por WhatsApp",
    icon: "🛎️",
    gradient: "from-green-600 to-green-700",
    content: (
      <>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div><p className="text-sm font-semibold text-gray-800">Desayuno en Cabaña</p><p className="text-xs text-gray-500">$5000</p></div>
            <button className="bg-[#25D366] text-white px-3 py-1 rounded-lg text-xs font-medium">Solicitar</button>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div><p className="text-sm font-semibold text-gray-800">Late Check-out</p><p className="text-xs text-gray-500">$3000</p></div>
            <button className="bg-[#25D366] text-white px-3 py-1 rounded-lg text-xs font-medium">Solicitar</button>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <div><p className="text-sm font-semibold text-gray-800">Tour Guiado</p><p className="text-xs text-gray-500">$8000</p></div>
            <button className="bg-[#25D366] text-white px-3 py-1 rounded-lg text-xs font-medium">Solicitar</button>
          </div>
        </div>
      </>
    ),
  },
  {
    title: "Guía del Destino",
    description: "Lugares recomendados por el anfitrión",
    icon: "🧭",
    gradient: "from-amber-500 to-amber-600",
    content: (
      <>
        <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-200">
          <div className="flex items-start gap-3">
            <Star className="w-6 h-6 text-yellow-600 fill-yellow-600 flex-shrink-0" />
            <div><p className="text-sm font-semibold text-gray-800">Restaurante El Buen Sabor</p><p className="text-xs text-gray-500">Restaurant</p><p className="text-xs text-gray-600 mt-1">Cocina tradicional con ingredientes locales</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-start gap-3">
            <Compass className="w-6 h-6 text-[#F59E0B] flex-shrink-0" />
            <div><p className="text-sm font-semibold text-gray-800">Sendero del Arroyo</p><p className="text-xs text-gray-500">Hiking Trail</p><p className="text-xs text-gray-600 mt-1">Ruta de 4 km con vistas panorámicas</p></div>
          </div>
        </div>
      </>
    ),
  },
  {
    title: "Estado de Pago",
    description: "Control total de pagos y saldos",
    icon: "💳",
    gradient: "from-teal-600 to-teal-700",
    content: (
      <>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p className="text-xs text-gray-500 uppercase mb-2">Total</p><p className="text-2xl font-bold text-gray-900">$50.000</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p className="text-xs text-gray-500 uppercase mb-2">Pagado</p><p className="text-2xl font-bold text-green-600">$35.000</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><p className="text-xs text-gray-500 uppercase mb-2">Pendiente</p><p className="text-2xl font-bold text-orange-600">$15.000</p></div>
        <div className="w-full bg-gray-200 rounded-full h-3 mt-4"><div className="bg-green-500 h-3 rounded-full" style={{ width: "70%" }} /></div>
        <p className="text-center text-sm font-semibold text-green-600 mt-2">70% pagado</p>
      </>
    ),
  },
  {
    title: "Clima en Tiempo Real",
    description: "Pronóstico durante toda la estadía",
    icon: "☀️",
    gradient: "from-blue-500 to-cyan-500",
    content: (
      <>
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-4 text-white mb-4"><p className="text-sm font-medium">Clima en Villa Carlos Paz</p></div>
        <div className="grid grid-cols-5 gap-2">
          {["Hoy", "Mié 15", "Jue 16", "Vie 17", "Sáb 18"].map((day, i) => (
            <div key={i} className="bg-white rounded-lg p-2 text-center shadow-sm">
              <p className="text-xs text-gray-500">{day}</p>
              <p className="text-lg">☀️</p>
              <p className="text-xs font-semibold">24°/16°</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    title: "Check-out Simple",
    description: "Instrucciones claras para la salida",
    icon: "🚪",
    gradient: "from-gray-600 to-gray-700",
    content: (
      <>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm text-gray-800">Dejar llaves en recepción</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm text-gray-800">Apagar luces y aire acondicionado</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm text-gray-800">Cerrar ventanas</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm text-gray-800">Sacar basura</p>
        </div>
      </>
    ),
  },
];

// ============================================
// SECCIÓN UNIFICADA: MOCKUPS + PANEL DEL HUÉSPED
// ============================================
const GuestExperienceSection = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentScreen((prev) => (prev + 1) % phoneScreens.length);
    }, 3500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const goToScreen = (index: number) => {
    setCurrentScreen(index);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentScreen((prev) => (prev + 1) % phoneScreens.length);
    }, 3500);
  };

  return (
    <section id="huesped" className="py-24 px-4 bg-gradient-to-b from-[#FDFBF7] to-white">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-sm font-semibold text-[#EA580C] uppercase tracking-wider">Experiencia del huésped</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold text-[#0F766E]">Una experiencia que tus huéspedes van a amar</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Olvidate de enviar 20 mensajes de WhatsApp. Tu huésped recibe un link y tiene <strong>todo lo que necesita</strong> en una sola pantalla premium con tu marca.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Lista de features a la izquierda */}
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:w-1/2">
            <ul className="space-y-4">
              {[
                "Pre-checkin digital antes de llegar",
                "Clima en tiempo real de la zona",
                "Guía del destino con recomendaciones",
                "Inventario y servicios de la unidad",
                "Productos y experiencias adicionales",
                "Control de pagos con historial",
                "Check-out con instrucciones claras",
                "Contacto directo con el anfitrión",
              ].map((item, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex items-center gap-3 text-gray-700">
                  <div className="w-6 h-6 rounded-full bg-[#0F766E]/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-[#0F766E]" />
                  </div>
                  <span className="text-lg">{item}</span>
                </motion.li>
              ))}
            </ul>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-10 bg-[#0F766E] rounded-2xl p-6 text-white">
              <Sparkles className="w-8 h-8 mb-3 text-[#F59E0B]" />
              <h3 className="text-xl font-bold mb-2">Sin instalaciones. Sin fricción.</h3>
              <p className="text-teal-100">Ni vos ni tus huéspedes necesitan bajar ninguna app. El huésped entra con su <strong>código de reserva y apellido</strong>. Listo.</p>
            </motion.div>
          </motion.div>

          {/* Teléfono con carrusel a la derecha */}
          <motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, type: "spring" }} className="lg:w-1/2 flex flex-col items-center">
            <div className="relative w-72 h-[580px]">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] shadow-2xl p-3">
                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-2xl z-20" />
                  <div className="h-full overflow-y-auto bg-gray-50 pt-12 px-4 pb-4">
                    <div className="text-center mb-5">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${phoneScreens[currentScreen].gradient} mb-3 shadow-lg`}>
                        <span className="text-3xl">{phoneScreens[currentScreen].icon}</span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-800">{phoneScreens[currentScreen].title}</h3>
                      <p className="text-xs text-gray-500 mt-1">{phoneScreens[currentScreen].description}</p>
                    </div>
                    <div className="space-y-3">
                      <motion.div key={currentScreen} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                        {phoneScreens[currentScreen].content}
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dots de navegación */}
            <div className="flex justify-center gap-2 mt-8">
              {phoneScreens.map((_, index) => (
                <button key={index} onClick={() => goToScreen(index)} className={`h-2 rounded-full transition-all ${index === currentScreen ? "w-8 bg-[#0F766E]" : "w-2 bg-gray-300 hover:bg-gray-400"}`} />
              ))}
            </div>

            {/* Botones de navegación */}
            <div className="flex justify-center gap-4 mt-4">
              <button onClick={() => goToScreen((currentScreen - 1 + phoneScreens.length) % phoneScreens.length)} className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button onClick={() => goToScreen((currentScreen + 1) % phoneScreens.length)} className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Labels clickeables */}
            <div className="flex justify-center gap-2 flex-wrap mt-4">
              {phoneScreens.map((screen, index) => (
                <button key={index} onClick={() => goToScreen(index)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${index === currentScreen ? "bg-[#0F766E] text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
                  {screen.title}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// COMO FUNCIONA
// ============================================
const HowItWorks = () => {
  const steps = [
    { icon: <CalendarCheck className="w-8 h-8" />, title: "Cargá tu reserva", desc: "Manual, por CSV o pegando el mensaje de WhatsApp. El sistema interpreta todo automáticamente.", color: "bg-[#0F766E]" },
    { icon: <Bell className="w-8 h-8" />, title: "Automatizá mensajes", desc: "Recordatorios de check-in, info del alojamiento y post-estadía con link de reseña en Google Maps.", color: "bg-[#166534]" },
    { icon: <BarChart3 className="w-8 h-8" />, title: "Controlá todo", desc: "Reservas, pagos, inventario y huéspedes en un solo panel. Reportes claros, decisiones fáciles.", color: "bg-[#EA580C]" },
  ];
  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-sm font-semibold text-[#EA580C] uppercase tracking-wider">Simple y potente</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold text-[#0F766E]">Así de fácil es gestionar tu alojamiento</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Tres pasos para dejar atrás el caos y profesionalizar tu operación.</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.6 }} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-br from-[#0F766E]/10 to-[#EA580C]/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500" />
              <div className="relative bg-white border border-gray-100 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 h-full">
                <div className={`${step.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>{step.icon}</div>
                <div className="absolute top-8 right-8 text-6xl font-bold text-gray-100">{i + 1}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// BENEFICIOS - SLIDER HORIZONTAL
// ============================================
const Benefits = () => {
  const benefits = [
    { icon: <CalendarCheck className="w-7 h-7" />, title: "Gestión de reservas", desc: "Estados automáticos, importación CSV y parser de WhatsApp." },
    { icon: <Key className="w-7 h-7" />, title: "Check-in operativo", desc: "Registro de llaves, observaciones e historial completo." },
    { icon: <CreditCard className="w-7 h-7" />, title: "Control de pagos", desc: "Saldos, señas, pagos parciales y barra visual tipo batería." },
    { icon: <MessageCircle className="w-7 h-7" />, title: "Mensajería WhatsApp", desc: "Plantillas automáticas y links directos al panel del huésped." },
    { icon: <Users className="w-7 h-7" />, title: "Gestión de huéspedes", desc: "Datos, historial y pre-checkin digital con formulario personalizado." },
    { icon: <ShieldCheck className="w-7 h-7" />, title: "Seguridad total", desc: "Aislamiento por tenant, sesiones con expiración y RLS en datos." },
    { icon: <CloudSun className="w-7 h-7" />, title: "Clima en tiempo real", desc: "Pronóstico automático para el rango de estadía del huésped." },
    { icon: <MapPin className="w-7 h-7" />, title: "Mapa y ubicación", desc: "Google Maps embebido con coordenadas auto-extraídas." },
    { icon: <Compass className="w-7 h-7" />, title: "Guía del destino", desc: "Lugares recomendados por categoría con tips del anfitrión." },
    { icon: <Package className="w-7 h-7" />, title: "Inventario de unidades", desc: "Categorías personalizables: ropa de cama, cocina, baño y más." },
    { icon: <ShoppingBag className="w-7 h-7" />, title: "Venta de productos", desc: "Ofrecé productos adicionales dentro del sistema (toallas, kits, etc.)." },
    { icon: <UtensilsCrossed className="w-7 h-7" />, title: "Gastronomía y experiencias", desc: "Incluí desayunos, cenas o experiencias locales como upsell." },
    { icon: <Star className="w-7 h-7" />, title: "Reseñas en Google Maps", desc: "Solicitud automática post-estadía con link directo (alto valor)." },
    { icon: <Zap className="w-7 h-7" />, title: "100% web, sin instalar", desc: "Funciona en cualquier navegador. Anfitrión y huésped desde el celular." },
    { icon: <Camera className="w-7 h-7" />, title: "Branding personalizado", desc: "Logo, colores de marca y dominio propio en tu panel." },
    { icon: <BarChart3 className="w-7 h-7" />, title: "Reportes claros", desc: "Ocupación, ingresos y huéspedes recurrentes de un vistazo." },
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section id="beneficios" className="py-24 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <span className="text-sm font-semibold text-[#EA580C] uppercase tracking-wider">TODO INCLUIDO</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold text-[#0F766E]">Todo lo que necesitás, nada que sobre</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Una plataforma completa para profesionalizar tu alojamiento y deleitar a tus huéspedes.</p>
        </motion.div>
        <div className="flex justify-center gap-3 mb-8">
          <button onClick={() => scroll("left")} className="w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <button onClick={() => scroll("right")} className="w-12 h-12 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        </div>
        <div ref={scrollRef} className="flex gap-6 overflow-x-auto scroll-smooth pb-4 px-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {benefits.map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }} whileHover={{ y: -5 }} className="flex-shrink-0 w-72 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-[#0F766E]/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0F766E] to-[#166534] flex items-center justify-center text-white mb-4 shadow-md">{b.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{b.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// PRICING
// ============================================
const Pricing = () => (
  <section id="precios" className="py-24 px-4 bg-gradient-to-b from-[#FDFBF7] to-white">
    <div className="max-w-5xl mx-auto text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <span className="text-sm font-semibold text-[#EA580C] uppercase tracking-wider">Precios transparentes</span>
        <h2 className="mt-3 text-4xl md:text-5xl font-bold text-[#0F766E]">30 días de prueba gratis</h2>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Sin tarjeta de crédito. Unidades ilimitadas. Todas las features incluidas.</p>
      </motion.div>
      <div className="mt-16 grid md:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} whileHover={{ y: -5 }} className="relative rounded-3xl border-2 border-gray-200 bg-white p-10 text-left shadow-lg transition-all duration-300">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan Mensual</h3>
          <p className="text-sm text-gray-500 mb-6">Pago mes a mes, cancelás cuando quieras</p>
          <div className="flex items-baseline gap-1 mb-2"><span className="text-7xl font-bold text-[#0F766E]">USD 40</span><span className="text-gray-500 text-lg">/ mes</span></div>
          <p className="text-sm text-gray-500">Unidades ilimitadas - Todas las features</p>
          <a href="https://wa.me/5491131923742?text=Hola!%20Quiero%20contratar%20el%20plan%20Mensual" target="_blank" rel="noopener noreferrer" className="mt-8 block w-full rounded-full py-4 text-center font-bold text-white bg-[#0F766E] hover:bg-[#115E59] transition shadow-lg hover:shadow-xl">Empezar prueba gratis</a>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} whileHover={{ y: -5 }} className="relative rounded-3xl border-2 border-[#EA580C] bg-gradient-to-br from-[#FFF7ED] to-white p-10 text-left shadow-xl transition-all duration-300">
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#EA580C] px-6 py-2 text-sm font-bold text-white shadow-lg">Ahorrás 25%</span>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan Anual</h3>
          <p className="text-sm text-gray-500 mb-6">Pago único anual, 2 meses gratis</p>
          <div className="flex items-baseline gap-1 mb-2"><span className="text-7xl font-bold text-[#0F766E]">USD 360</span><span className="text-gray-500 text-lg">/ año</span></div>
          <p className="text-sm text-gray-500 mb-4">Unidades ilimitadas - Todas las features</p>
          <div className="bg-[#EA580C]/10 rounded-xl p-3 mb-6"><p className="text-sm font-semibold text-[#EA580C]">Equivale a USD 30/mes - Ahorrás USD 120 al año</p></div>
          <a href="https://wa.me/5491131923742?text=Hola!%20Quiero%20contratar%20el%20plan%20Anual" target="_blank" rel="noopener noreferrer" className="block w-full rounded-full py-4 text-center font-bold text-white bg-[#EA580C] hover:bg-[#C2410C] transition shadow-lg hover:shadow-xl">Empezar prueba gratis</a>
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-12 bg-gradient-to-r from-[#00B1EA]/10 to-[#009EE3]/10 border border-[#00B1EA]/30 rounded-2xl p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-[#00B1EA] rounded-xl flex items-center justify-center shadow-md"><CreditCard className="w-6 h-6 text-white" /></div>
          <div className="text-left"><p className="font-bold text-gray-900">¿Sos de Argentina?</p><p className="text-sm text-gray-600">Podés pagar en pesos con MercadoPago. Consultanos por el tipo de cambio.</p></div>
        </div>
      </motion.div>
      <p className="mt-8 text-sm text-gray-500">Sin tarjeta de crédito para probar - Cancelás cuando quieras</p>
    </div>
  </section>
);

// ============================================
// FAQ
// ============================================
const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = [
    { q: "¿Necesito instalar algo en el celular?", a: "No. Ni vos ni tus huéspedes necesitan instalar ninguna app. Todo funciona desde el navegador. El huésped entra con su código de reserva y apellido. Listo." },
    { q: "¿Necesito tarjeta de crédito para probar?", a: "No. La prueba de 30 días es totalmente gratuita y sin compromiso. No te pedimos datos de pago hasta que decidas suscribirte." },
    { q: "¿Cómo funciona el panel del huésped?", a: "Cada reserva genera un link único. Se lo enviás por WhatsApp y el huésped ve el clima, Wi-Fi, mapa, normas, inventario, productos disponibles y puede hacer el pre-checkin. Todo en una sola pantalla con tu marca." },
    { q: "¿Puedo vender productos o experiencias?", a: "Sí. Podés incluir en el panel del huésped un catálogo de productos (toallas, kits, desayunos) y experiencias (tours, cenas, actividades) que el huésped puede contratar directamente." },
    { q: "¿Cómo consigo más reseñas en Google Maps?", a: "El sistema envía automáticamente un mensaje post-estadía con un link directo a tu ficha de Google Maps para dejar reseña. Esto aumenta drásticamente la tasa de reseñas de tus huéspedes." },
    { q: "¿Tengo límite de unidades o reservas?", a: "No. Ambos planes tienen unidades ilimitadas. Pagás un precio fijo sin importar cuántas propiedades o reservas gestiones." },
    { q: "¿Puedo gestionar varios alojamientos?", a: "Por ahora el sistema está pensado para un alojamiento por cuenta. Si tenés varios, contactanos por WhatsApp y te armamos una solución a medida." },
    { q: "¿Qué pasa si quiero cancelar?", a: "Podés cancelar tu suscripción en cualquier momento desde tu panel. No hay contratos de permanencia ni penalizaciones." },
  ];
  return (
    <section id="faq" className="py-24 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <span className="text-sm font-semibold text-[#EA580C] uppercase tracking-wider">Resolvé tus dudas</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold text-[#0F766E]">Preguntas frecuentes</h2>
        </motion.div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="bg-[#FDFBF7] rounded-2xl border border-gray-100 overflow-hidden hover:border-[#0F766E]/20 transition">
              <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="w-full flex justify-between items-center p-6 text-left font-semibold text-gray-900 hover:bg-white/50 transition">
                <span className="text-lg">{faq.q}</span>
                <motion.span animate={{ rotate: openIndex === i ? 180 : 0 }} className="text-[#0F766E] text-2xl flex-shrink-0 ml-4">▾</motion.span>
              </button>
              <motion.div initial={false} animate={{ height: openIndex === i ? "auto" : 0, opacity: openIndex === i ? 1 : 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                <p className="px-6 pb-6 text-gray-600 leading-relaxed">{faq.a}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================
// CTA FINAL
// ============================================
const FinalCTA = () => (
  <section className="py-24 px-4 bg-gradient-to-br from-[#0F766E] to-[#166534] text-white relative overflow-hidden">
    <div className="absolute top-0 right-0 w-96 h-96 bg-[#EA580C]/20 rounded-full blur-3xl" />
    <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#F59E0B]/10 rounded-full blur-3xl" />
    <div className="max-w-4xl mx-auto text-center relative z-10">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <Sparkles className="w-12 h-12 mx-auto mb-6 text-[#F59E0B]" />
        <h2 className="text-4xl md:text-6xl font-bold mb-6">¿Listo para profesionalizar tu alojamiento?</h2>
        <p className="text-xl text-teal-100 mb-10 max-w-2xl mx-auto">Unite a los anfitriones que ya dejaron atrás el caos de WhatsApp y las planillas.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login" className="group px-8 py-4 rounded-full bg-[#EA580C] text-white font-bold text-lg hover:bg-[#C2410C] transition shadow-xl hover:shadow-2xl flex items-center justify-center gap-2">
            Probar gratis 30 días
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </Link>
          <a href="https://wa.me/5491131923742?text=Hola!%20Quiero%20mas%20info%20sobre%20Mi%20Estadia" target="_blank" rel="noopener noreferrer" className="px-8 py-4 rounded-full border-2 border-white text-white font-bold text-lg hover:bg-white hover:text-[#0F766E] transition flex items-center justify-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Hablar por WhatsApp
          </a>
        </div>
        <p className="mt-6 text-sm text-teal-200">Sin tarjeta - Sin instalaciones - 30 días gratis</p>
      </motion.div>
    </div>
  </section>
);

// ============================================
// FOOTER
// ============================================
const Footer = () => (
  <footer className="bg-gray-900 text-white py-16 px-4">
    <div className="max-w-6xl mx-auto">
      <div className="grid md:grid-cols-3 gap-10 mb-12">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <Image src="/mi-estadia-logo.png" alt="Mi Estadía" width={48} height={48} className="rounded-lg" style={{ width: "auto", height: "auto" }} />
            <span className="text-2xl font-bold">Mi Estadía</span>
          </div>
          <p className="text-gray-400 max-w-md leading-relaxed">Tu alojamiento, más cerca. La plataforma SaaS que profesionaliza la gestión de reservas y ofrece una experiencia premium a tus huéspedes.</p>
        </div>
        <div>
          <h4 className="font-bold mb-4 text-[#F59E0B]">Contacto</h4>
          <ul className="space-y-3 text-gray-400 text-sm">
            <li><a href="https://wa.me/5491131923742" target="_blank" rel="noopener noreferrer" className="hover:text-white transition flex items-center gap-2"><MessageCircle className="w-4 h-4" />WhatsApp</a></li>
            <li><Link href="/login" className="hover:text-white transition flex items-center gap-2">Ingresar al panel<ExternalLink className="w-3 h-3" /></Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 pt-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">© 2026 Mi Estadía. Todos los derechos reservados.</p>
          <a href="https://buenpuerto.online" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <span>App desarrollada por</span>
            <img src="/buenpuerto-logo.png" alt="Buen Puerto" className="h-6 w-auto" />
            <span className="font-semibold text-[#F59E0B]">buenpuerto.online</span>
          </a>
        </div>
      </div>
    </div>
  </footer>
);

// ============================================
// PAGINA PRINCIPAL
// ============================================
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white font-sans antialiased">
      <Navbar />
      <Hero />
      <HowItWorks />
      <GuestExperienceSection />
      <Benefits />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}