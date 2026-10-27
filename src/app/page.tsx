"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import {
  Globe,
  CalendarCheck,
  Smartphone,
  LayoutDashboard,
  ArrowRight,
  MessageCircle,
  CheckCircle,
  MapPin,
  CloudSun,
  Star,
  Zap,
  Building2,
  Wifi,
  ShoppingBag,
  Compass,
  FileText,
  Mail,
  QrCode,
  ExternalLink,
  Plane,
  Hotel,
  Bed,
  Key,
  Clock,
  Users,
  TrendingUp,
  Shield,
  Sparkles,
} from "lucide-react";
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
        <a href="#pilares" className="hover:text-[#0F766E] transition">Beneficios</a>
        <a href="#experiencia" className="hover:text-[#0F766E] transition">Experiencia</a>
        <a href="#precios" className="hover:text-[#0F766E] transition">Precios</a>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/login" className="text-sm font-medium text-[#0F766E] hover:underline hidden sm:block">Ingresar</Link>
        <Link href="/login" className="text-sm font-semibold bg-[#EA580C] text-white px-5 py-2.5 rounded-full hover:bg-[#C2410C] transition shadow-md">Probar gratis</Link>
      </div>
    </div>
  </motion.nav>
);

// ============================================
// HERO SECTION (SIN ÍCONO, TÍTULO EN 2 LÍNEAS)
// ============================================
const slides = ["/images/slides/slide-1.jpg", "/images/slides/slide-2.jpg", "/images/slides/slide-3.jpg", "/images/slides/slide-4.jpg"];

const Hero = () => {
  const [current, setCurrent] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => setCurrent((prev) => (prev + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    slides.forEach((src, i) => {
      const img = new window.Image();
      img.onload = () => setLoadedImages((prev) => { const next = new Set(prev); next.add(i); return next; });
      img.src = src;
    });
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F766E] via-[#166534] to-[#0F766E]" />
      {loadedImages.size > 0 && (
        <div className="absolute inset-0">
          {slides.map((src, i) => (
            <motion.div key={i} className="absolute inset-0" initial={false} animate={{ opacity: i === current ? 1 : 0 }} transition={{ duration: 1.5, ease: "easeInOut" }}>
              <motion.div className="absolute inset-0" initial={{ scale: 1.1 }} animate={{ scale: i === current ? 1 : 1.1 }} transition={{ duration: 8, ease: "linear" }}>
                <img src={src} alt="" className="w-full h-full object-cover" style={{ display: loadedImages.has(i) ? "block" : "none" }} />
              </motion.div>
            </motion.div>
          ))}
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}
      
      <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, type: "spring", bounce: 0.3 }} className="relative z-10">
        <Logo size={180} />
      </motion.div>

      <motion.h1 
        initial={{ opacity: 0, y: 40 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3, duration: 1 }} 
        className="relative z-10 mt-8 text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight max-w-5xl"
      >
        Mi Estadía: La plataforma todo-en-uno
        <br />
        <span className="text-yellow-300">para multiplicar tus reservas directas.</span>
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.5, duration: 1 }} 
        className="relative z-10 mt-6 max-w-3xl text-xl text-white/90 font-medium leading-relaxed"
      >
        Tu propia página web profesional, un motor de reservas integrado y un panel de huésped de 5 estrellas, todo en un solo lugar.
      </motion.p>

      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.7, duration: 1 }} 
        className="relative z-10 mt-10 flex flex-col sm:flex-row gap-4"
      >
        <Link href="/login" className="group px-8 py-4 rounded-full bg-[#EA580C] text-white font-bold text-lg hover:bg-[#C2410C] transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
          Comenzar prueba gratis <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
        </Link>
        <a href="https://wa.me/5491131923742?text=Hola!%20Quiero%20mas%20info%20sobre%20Mi%20Estadia" target="_blank" rel="noopener noreferrer" className="px-8 py-4 rounded-full border-2 border-white text-white font-bold text-lg hover:bg-white hover:text-[#0F766E] transition flex items-center justify-center gap-2">
          <MessageCircle className="w-5 h-5" /> Hablar por WhatsApp
        </a>
      </motion.div>
    </section>
  );
};

// ============================================
// ANIMACIÓN DE FONDO INTERACTIVA (PARTÍCULAS DE VIAJE)
// ============================================
const FloatingIcons = () => {
  const mouseRef = useRef({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; icon: any; size: number; opacity: number }>>([]);

  const travelIcons = [Plane, Hotel, Bed, Key, MapPin, Compass, Star, CloudSun, Clock, Users];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      
      // Crear partícula cada cierto movimiento
      if (Math.random() > 0.92) {
        const icon = travelIcons[Math.floor(Math.random() * travelIcons.length)];
        const newParticle = {
          id: Date.now() + Math.random(),
          x: e.clientX + (Math.random() - 0.5) * 100,
          y: e.clientY + (Math.random() - 0.5) * 100,
          icon,
          size: 16 + Math.random() * 24,
          opacity: 0.3 + Math.random() * 0.4,
        };
        setParticles(prev => [...prev.slice(-15), newParticle]);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        mouseRef.current = { x: touch.clientX, y: touch.clientY };
        
        if (Math.random() > 0.85) {
          const icon = travelIcons[Math.floor(Math.random() * travelIcons.length)];
          const newParticle = {
            id: Date.now() + Math.random(),
            x: touch.clientX + (Math.random() - 0.5) * 100,
            y: touch.clientY + (Math.random() - 0.5) * 100,
            icon,
            size: 16 + Math.random() * 24,
            opacity: 0.3 + Math.random() * 0.4,
          };
          setParticles(prev => [...prev.slice(-15), newParticle]);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  // Limpiar partículas antiguas
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => prev.slice(-10));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ opacity: 0, scale: 0, y: particle.y }}
            animate={{ opacity: particle.opacity, scale: 1, y: particle.y - 100 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute text-[#0F766E]/30"
            style={{ left: particle.x, top: particle.y }}
          >
            <particle.icon style={{ width: particle.size, height: particle.size }} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// 4 PILARES FUNDAMENTALES (REORDENADOS: 4, 3, 1, 2)
// ============================================
const pillars = [
  {
    icon: LayoutDashboard,
    title: "1. Panel de Administración",
    subtitle: "Tu centro de comando",
    desc: "Gestiona todo tu negocio desde un dashboard intuitivo y optimizado para móvil. Dashboard en tiempo real con llegadas, salidas y ocupación. Gestión de reservas con un clic, mensajería WhatsApp con plantillas, y control de inventario de unidades.",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconBg: "bg-emerald-100 text-emerald-600",
    interactive: (
      <div className="mt-4 bg-white rounded-lg p-3 shadow-sm border border-gray-100">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-blue-50 rounded p-2 text-center">
            <p className="text-[10px] text-blue-600 font-bold">Llegadas</p>
            <p className="text-lg font-bold text-blue-800">4</p>
          </div>
          <div className="bg-green-50 rounded p-2 text-center">
            <p className="text-[10px] text-green-600 font-bold">Ocupación</p>
            <p className="text-lg font-bold text-green-800">85%</p>
          </div>
          <div className="bg-amber-50 rounded p-2 text-center">
            <p className="text-[10px] text-amber-600 font-bold">Ingresos</p>
            <p className="text-lg font-bold text-amber-800">$2.4M</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-600">
          <TrendingUp className="w-3 h-3 text-green-500" />
          <span>+12% vs mes anterior</span>
        </div>
      </div>
    ),
  },
  {
    icon: Smartphone,
    title: "2. Panel del Huésped (5 Estrellas)",
    subtitle: "Experiencia premium digital",
    desc: "Digitaliza la estadía y reduce las preguntas repetitivas a cero. Pre check-in con datos precargados, guía digital (Wi-Fi, mapas, reglas), upselling de servicios con botón a WhatsApp, guía del destino, clima en tiempo real y solicitud automática de reseñas en Google Maps.",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    iconBg: "bg-amber-100 text-amber-600",
    interactive: (
      <div className="mt-4 bg-white rounded-lg p-3 shadow-sm border border-gray-100 space-y-2">
        <div className="flex items-center gap-2">
          <div className="bg-[#F0FDF4] p-1.5 rounded"><Wifi className="w-3 h-3 text-[#0F766E]" /></div>
          <div className="flex-1">
            <p className="text-[9px] text-gray-500">Red Wi-Fi</p>
            <p className="text-[10px] font-bold text-gray-800">MiEstadia_Guest</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-[#FFF7ED] p-1.5 rounded"><MapPin className="w-3 h-3 text-[#EA580C]" /></div>
          <div className="flex-1">
            <p className="text-[9px] text-gray-500">Ubicación</p>
            <p className="text-[10px] font-bold text-gray-800">Ver en Google Maps</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded p-2 text-white flex items-center justify-between">
          <div><p className="text-[9px] opacity-80">Hoy</p><p className="text-sm font-bold">24°</p></div>
          <CloudSun className="w-5 h-5 text-yellow-300" />
        </div>
      </div>
    ),
  },
  {
    icon: Globe,
    title: "3. Tu Propia Página Web Profesional",
    subtitle: "Adquirí tu web al instante",
    desc: "No necesitas saber programar. Te damos una web lista para usar bajo tu propia marca. Tu propia URL: miestadia.online/tu-alojamiento (o conecta tu propio dominio). Personalización total: logo, colores, galerías. 100% responsive con reservador embebido y confirmaciones automáticas con QR.",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    iconBg: "bg-blue-100 text-blue-600",
    interactive: (
      <div className="mt-4 space-y-3">
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-[#0F766E] rounded flex items-center justify-center text-white text-xs font-bold">ME</div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gray-800">Cabañas del Bosque</p>
              <p className="text-[10px] text-gray-500 font-mono">miestadia.online/cabanas</p>
            </div>
          </div>
          <div className="bg-gray-200 rounded h-16 flex items-center justify-center text-gray-400 text-[10px]">Galería de fotos</div>
          <button className="w-full mt-2 bg-[#EA580C] text-white py-1.5 rounded text-[10px] font-bold">Ver Disponibilidad</button>
        </div>
        <div className="bg-[#0F766E]/10 border border-[#0F766E]/20 rounded-lg p-2 text-center">
          <p className="text-[10px] text-[#0F766E] font-semibold">✨ Adquirí tu web:</p>
          <p className="text-xs font-bold text-[#0F766E] font-mono">miestadia.online/tualojamiento</p>
        </div>
      </div>
    ),
  },
  {
    icon: Zap,
    title: "4. Motor de Reservas Inteligente",
    subtitle: "De WhatsApp a reserva en 1 clic",
    desc: "¿Te escribieron por WhatsApp? Usá nuestro Parser inteligente: pegá el mensaje y el sistema extrae los datos automáticamente. También soporta importación masiva por CSV para que nunca pierdas una venta. Confirmaciones automáticas con email profesional, código QR y link al panel privado.",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    iconBg: "bg-purple-100 text-purple-600",
    interactive: (
      <div className="mt-4 space-y-2">
        <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-[9px] text-gray-700">
          <p className="font-bold text-green-800 mb-1">💬 Mensaje pegado:</p>
          <p>"Hola, quiero reservar para Juan Pérez, del 15 al 20 de octubre, cabaña 3, total $50000"</p>
        </div>
        <div className="flex justify-center"><ArrowRight className="w-3 h-3 text-gray-400 rotate-90" /></div>
        <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100 space-y-1">
          <div className="flex justify-between text-[9px]"><span className="text-gray-500">Huésped:</span><span className="font-semibold text-green-600">Juan Pérez ✅</span></div>
          <div className="flex justify-between text-[9px]"><span className="text-gray-500">Fechas:</span><span className="font-semibold text-green-600">15-20 Oct ✅</span></div>
          <div className="flex justify-between text-[9px]"><span className="text-gray-500">Monto:</span><span className="font-semibold text-green-600">$50.000 ✅</span></div>
        </div>
      </div>
    ),
  },
];

const PillarsSection = () => (
  <section id="pilares" className="py-24 px-4 bg-white relative overflow-hidden">
    {/* Textura de fondo */}
    <div className="absolute inset-0 opacity-5">
      <div className="absolute top-10 left-10"><Plane className="w-32 h-32 text-[#0F766E]" /></div>
      <div className="absolute top-40 right-20"><Hotel className="w-24 h-24 text-[#EA580C]" /></div>
      <div className="absolute bottom-20 left-1/4"><Bed className="w-28 h-28 text-[#F59E0B]" /></div>
      <div className="absolute bottom-40 right-1/3"><MapPin className="w-20 h-20 text-[#0F766E]" /></div>
    </div>
    
    <div className="max-w-7xl mx-auto relative z-10">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
        <span className="text-sm font-semibold text-[#EA580C] uppercase tracking-wider">¿Por qué elegirnos?</span>
        <h2 className="mt-3 text-4xl md:text-5xl font-bold text-[#0F766E]">4 Pilares Fundamentales</h2>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Todo lo que necesitás para profesionalizar tu alojamiento y deleitar a tus huéspedes.</p>
      </motion.div>
      <div className="grid md:grid-cols-2 gap-8">
        {pillars.map((pillar, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className={`rounded-2xl p-8 border-2 transition-all duration-300 hover:shadow-2xl ${pillar.color}`}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${pillar.iconBg}`}>
                <pillar.icon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{pillar.title}</h3>
                <p className="text-sm text-gray-600 font-medium">{pillar.subtitle}</p>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed text-base">{pillar.desc}</p>
            {pillar.interactive}
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// ============================================
// PHONE MOCKUPS ANIMADOS (CON EMAIL + QR)
// ============================================
const phoneScreens = [
  {
    title: "Web Profesional",
    desc: "Tu marca, tu URL, tu negocio",
    icon: "🌐",
    gradient: "from-blue-500 to-cyan-500",
    content: (
      <div className="space-y-3">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
          <div className="w-10 h-10 bg-[#0F766E] rounded-lg mx-auto mb-2 flex items-center justify-center text-white font-bold text-xs">ME</div>
          <p className="text-xs font-bold text-gray-800">Cabañas del Bosque</p>
          <p className="text-[10px] text-gray-500">miestadia.online/cabanas</p>
        </div>
        <div className="bg-gray-200 rounded-lg h-24 w-full flex items-center justify-center text-gray-400 text-xs">Galería de Fotos</div>
        <button className="w-full bg-[#EA580C] text-white py-2 rounded-lg text-sm font-bold shadow-md">Ver Disponibilidad</button>
      </div>
    ),
  },
  {
    title: "Email con QR",
    desc: "Confirmación automática al reservar",
    icon: "",
    gradient: "from-indigo-500 to-purple-600",
    content: (
      <div className="space-y-3">
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-indigo-600" />
            <p className="text-[10px] font-bold text-gray-800">¡Reserva confirmada!</p>
          </div>
          <p className="text-[9px] text-gray-600 mb-2">Hola Juan, tu check-in es el 15/10</p>
          <div className="bg-gray-100 rounded p-2 flex items-center gap-2">
            <QrCode className="w-10 h-10 text-gray-700" />
            <div className="flex-1">
              <p className="text-[9px] font-bold text-gray-800">Código: NUE-ABC123</p>
              <p className="text-[8px] text-gray-500">Escaneá al llegar</p>
            </div>
          </div>
        </div>
        <button className="w-full bg-[#0F766E] text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
          <ExternalLink className="w-3 h-3" /> Acceder a mi panel
        </button>
      </div>
    ),
  },
  {
    title: "Parser Inteligente",
    desc: "De WhatsApp a Reserva en 1 clic",
    icon: "⚡",
    gradient: "from-purple-500 to-pink-500",
    content: (
      <div className="space-y-3">
        <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-[10px] text-gray-700">
          <p className="font-bold text-green-800 mb-1">💬 Mensaje pegado:</p>
          <p>"Hola, quiero reservar para Juan Pérez, del 15 al 20 de octubre, cabaña 3, total $50000"</p>
        </div>
        <div className="flex justify-center"><ArrowRight className="w-4 h-4 text-gray-400 rotate-90" /></div>
        <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100 space-y-1">
          <div className="flex justify-between text-[10px]"><span className="text-gray-500">Huésped:</span><span className="font-semibold">Juan Pérez ✅</span></div>
          <div className="flex justify-between text-[10px]"><span className="text-gray-500">Fechas:</span><span className="font-semibold">15-20 Oct ✅</span></div>
          <div className="flex justify-between text-[10px]"><span className="text-gray-500">Monto:</span><span className="font-semibold">$50.000 ✅</span></div>
        </div>
      </div>
    ),
  },
  {
    title: "Pre Check-in Digital",
    desc: "Datos precargados, cero fricción",
    icon: "📝",
    gradient: "from-amber-500 to-orange-500",
    content: (
      <div className="space-y-3">
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <p className="text-[10px] text-gray-500 mb-1">Nombre</p>
          <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">Juan Pérez <CheckCircle className="w-3 h-3 text-green-500" /></p>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <p className="text-[10px] text-gray-500 mb-1">Documento (DNI)</p>
          <p className="text-sm font-semibold text-gray-800">35.123.456</p>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <p className="text-[10px] text-gray-500 mb-1">Patente</p>
          <p className="text-sm font-semibold text-gray-800">ABC 123</p>
        </div>
        <button className="w-full bg-[#0F766E] text-white py-2 rounded-lg text-sm font-bold shadow-md">Confirmar Pre Check-in</button>
      </div>
    ),
  },
  {
    title: "Panel del Huésped",
    desc: "Todo lo que necesita, a un clic",
    icon: "📱",
    gradient: "from-[#0F766E] to-[#166534]",
    content: (
      <div className="space-y-3">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-3 text-white flex items-center justify-between">
          <div><p className="text-[10px] opacity-80">Hoy en Villa Carlos Paz</p><p className="text-xl font-bold">24°</p></div>
          <CloudSun className="w-8 h-8 text-yellow-300" />
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="bg-[#F0FDF4] p-2 rounded-lg"><Wifi className="w-4 h-4 text-[#0F766E]" /></div>
          <div><p className="text-[10px] text-gray-500">Red Wi-Fi</p><p className="text-xs font-bold text-gray-800">MiEstadia_Guest</p></div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="bg-[#FFF7ED] p-2 rounded-lg"><MapPin className="w-4 h-4 text-[#EA580C]" /></div>
          <div><p className="text-[10px] text-gray-500">Ubicación</p><p className="text-xs font-bold text-gray-800">Ver en Google Maps</p></div>
        </div>
      </div>
    ),
  },
  {
    title: "Upselling de Servicios",
    desc: "Vendé más con un clic a WhatsApp",
    icon: "🛎️",
    gradient: "from-green-500 to-emerald-600",
    content: (
      <div className="space-y-3">
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <div><p className="text-xs font-bold text-gray-800">Desayuno en Cabaña</p><p className="text-[10px] text-gray-500">$5.000</p></div>
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          </div>
          <button className="w-full bg-[#25D366] text-white py-1.5 rounded-md text-[10px] font-bold flex items-center justify-center gap-1"><MessageCircle className="w-3 h-3" /> Solicitar por WhatsApp</button>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <div><p className="text-xs font-bold text-gray-800">Late Check-out</p><p className="text-[10px] text-gray-500">$3.000</p></div>
          </div>
          <button className="w-full bg-[#25D366] text-white py-1.5 rounded-md text-[10px] font-bold flex items-center justify-center gap-1"><MessageCircle className="w-3 h-3" /> Solicitar por WhatsApp</button>
        </div>
      </div>
    ),
  },
  {
    title: "Guía del Destino",
    desc: "Recomendaciones del anfitrión",
    icon: "🧭",
    gradient: "from-amber-500 to-yellow-600",
    content: (
      <div className="space-y-3">
        <div className="bg-yellow-50 rounded-lg p-3 shadow-sm border border-yellow-200">
          <div className="flex items-start gap-2">
            <div className="bg-white p-1.5 rounded-md"><Compass className="w-4 h-4 text-amber-600" /></div>
            <div>
              <p className="text-xs font-bold text-gray-800">Restaurante El Buen Sabor</p>
              <p className="text-[10px] text-gray-500">A 5 min caminando</p>
              <p className="text-[10px] text-gray-600 mt-1 italic">💡 Pedir la mesa del fondo con vista al río.</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <p className="text-xs text-gray-600">Ver todos los lugares recomendados en el mapa</p>
        </div>
      </div>
    ),
  },
  {
    title: "Dashboard Admin",
    desc: "Tu centro de comando en tiempo real",
    icon: "📊",
    gradient: "from-gray-700 to-gray-900",
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-blue-50 rounded-lg p-2 text-center border border-blue-100">
            <p className="text-[10px] text-blue-600 font-bold">Llegadas Hoy</p>
            <p className="text-lg font-bold text-blue-800">4</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center border border-green-100">
            <p className="text-[10px] text-green-600 font-bold">Ocupación</p>
            <p className="text-lg font-bold text-green-800">85%</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
          <p className="text-[10px] font-bold text-gray-500 mb-2">PRÓXIMAS LLEGADAS</p>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold">JP</div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-800">Juan Pérez</p>
              <p className="text-[10px] text-gray-500">Cabaña 3 • 15:00 hs</p>
            </div>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
        </div>
      </div>
    ),
  },
];

const PhoneMockups = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentScreen((prev) => (prev + 1) % phoneScreens.length);
    }, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const goToScreen = (index: number) => {
    setCurrentScreen(index);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentScreen((prev) => (prev + 1) % phoneScreens.length);
    }, 4000);
  };

  return (
    <section id="experiencia" className="py-24 px-4 bg-gradient-to-b from-[#FDFBF7] to-white">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-sm font-semibold text-[#EA580C] uppercase tracking-wider">Experiencia Visual</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold text-[#0F766E]">Así se ve Mi Estadía por dentro</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Una interfaz limpia, moderna y diseñada para que tanto vos como tus huéspedes disfruten de la experiencia.</p>
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-16">
          {/* Teléfono */}
          <div className="relative w-72 h-[580px] flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] shadow-2xl p-3 ring-4 ring-gray-900/10">
              <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative flex flex-col">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-2xl z-20" />
                
                {/* Contenido de la pantalla con animación */}
                <div className="flex-1 overflow-y-auto bg-gray-50 pt-12 px-4 pb-4 no-scrollbar">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentScreen}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="h-full"
                    >
                      <div className="text-center mb-4">
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${phoneScreens[currentScreen].gradient} mb-2 shadow-lg text-2xl`}>
                          {phoneScreens[currentScreen].icon}
                        </div>
                        <h3 className="font-bold text-sm text-gray-800">{phoneScreens[currentScreen].title}</h3>
                        <p className="text-[10px] text-gray-500">{phoneScreens[currentScreen].desc}</p>
                      </div>
                      {phoneScreens[currentScreen].content}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Home indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-gray-300 rounded-full z-20" />
              </div>
            </div>
          </div>

          {/* Controles */}
          <div className="max-w-md w-full space-y-6">
            <div className="flex justify-center gap-2 mb-4">
              {phoneScreens.map((_, index) => (
                <button key={index} onClick={() => goToScreen(index)} className={`h-2 rounded-full transition-all ${index === currentScreen ? "w-8 bg-[#0F766E]" : "w-2 bg-gray-300 hover:bg-gray-400"}`} />
              ))}
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {phoneScreens.map((screen, index) => (
                <button
                  key={index}
                  onClick={() => goToScreen(index)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                    index === currentScreen
                      ? "border-[#0F766E] bg-[#0F766E]/5 shadow-md"
                      : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-gradient-to-br ${screen.gradient} shadow-sm`}>
                    {screen.icon}
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${index === currentScreen ? "text-[#0F766E]" : "text-gray-800"}`}>{screen.title}</p>
                    <p className="text-xs text-gray-500">{screen.desc}</p>
                  </div>
                  {index === currentScreen && <CheckCircle className="w-5 h-5 text-[#0F766E] ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// PRICING & CTA
// ============================================
const Pricing = () => (
  <section id="precios" className="py-24 px-4 bg-white">
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
          <div className="flex items-baseline gap-1 mb-2"><span className="text-5xl font-bold text-[#0F766E]">USD 40</span><span className="text-gray-500 text-lg">/ mes</span></div>
          <p className="text-sm text-gray-500 mb-6">≈ $64.000 ARS/mes (sujeto a cotización)</p>
          <Link href="/login" className="block w-full rounded-full py-4 text-center font-bold text-white bg-[#0F766E] hover:bg-[#115E59] transition shadow-lg hover:shadow-xl">Empezar prueba gratis</Link>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} whileHover={{ y: -5 }} className="relative rounded-3xl border-2 border-[#EA580C] bg-gradient-to-br from-[#FFF7ED] to-white p-10 text-left shadow-xl transition-all duration-300">
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#EA580C] px-6 py-2 text-sm font-bold text-white shadow-lg">Ahorrás 25%</span>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan Anual</h3>
          <p className="text-sm text-gray-500 mb-6">Pago único anual, 2 meses gratis</p>
          <div className="flex items-baseline gap-1 mb-2"><span className="text-5xl font-bold text-[#0F766E]">USD 360</span><span className="text-gray-500 text-lg">/ año</span></div>
          <p className="text-sm text-gray-500 mb-6">≈ $576.000 ARS/año</p>
          <div className="bg-[#EA580C]/10 rounded-xl p-3 mb-6"><p className="text-sm font-semibold text-[#EA580C]">Equivale a USD 30/mes - Ahorrás USD 120 al año</p></div>
          <Link href="/login" className="block w-full rounded-full py-4 text-center font-bold text-white bg-[#EA580C] hover:bg-[#C2410C] transition shadow-lg hover:shadow-xl">Empezar prueba gratis</Link>
        </motion.div>
      </div>
    </div>
  </section>
);

const FinalCTA = () => (
  <section className="py-24 px-4 bg-gradient-to-br from-[#0F766E] to-[#166534] text-white relative overflow-hidden">
    <div className="absolute top-0 right-0 w-96 h-96 bg-[#EA580C]/20 rounded-full blur-3xl" />
    <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#F59E0B]/10 rounded-full blur-3xl" />
    <div className="max-w-4xl mx-auto text-center relative z-10">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <Star className="w-12 h-12 mx-auto mb-6 text-[#F59E0B]" />
        <h2 className="text-4xl md:text-6xl font-bold mb-6">¿Listo para multiplicar tus reservas directas?</h2>
        <p className="text-xl text-teal-100 mb-10 max-w-2xl mx-auto">Unite a los anfitriones que ya dejaron atrás el caos de WhatsApp y las planillas.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login" className="group px-8 py-4 rounded-full bg-[#EA580C] text-white font-bold text-lg hover:bg-[#C2410C] transition shadow-xl hover:shadow-2xl flex items-center justify-center gap-2">
            Probar gratis 30 días <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </Link>
          <a href="https://wa.me/5491131923742?text=Hola!%20Quiero%20mas%20info%20sobre%20Mi%20Estadia" target="_blank" rel="noopener noreferrer" className="px-8 py-4 rounded-full border-2 border-white text-white font-bold text-lg hover:bg-white hover:text-[#0F766E] transition flex items-center justify-center gap-2">
            <MessageCircle className="w-5 h-5" /> Hablar por WhatsApp
          </a>
        </div>
      </motion.div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-gray-900 text-white py-16 px-4">
    <div className="max-w-6xl mx-auto">
      <div className="grid md:grid-cols-3 gap-10 mb-12">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <Image src="/mi-estadia-logo.png" alt="Mi Estadía" width={48} height={48} className="rounded-lg" style={{ width: "auto", height: "auto" }} />
            <span className="text-2xl font-bold">Mi Estadía</span>
          </div>
          <p className="text-gray-400 max-w-md leading-relaxed">La plataforma SaaS que profesionaliza la gestión de reservas y ofrece una experiencia premium a tus huéspedes, multiplicando tus reservas directas.</p>
        </div>
        <div>
          <h4 className="font-bold mb-4 text-[#F59E0B]">Contacto</h4>
          <ul className="space-y-3 text-gray-400 text-sm">
            <li><a href="https://wa.me/5491131923742" target="_blank" rel="noopener noreferrer" className="hover:text-white transition flex items-center gap-2"><MessageCircle className="w-4 h-4" />WhatsApp</a></li>
            <li><Link href="/login" className="hover:text-white transition flex items-center gap-2">Ingresar al panel</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
        <p>© 2026 Mi Estadía. Todos los derechos reservados.</p>
      </div>
    </div>
  </footer>
);

// ============================================
// PAGINA PRINCIPAL
// ============================================
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white font-sans antialiased relative">
      <FloatingIcons />
      <Navbar />
      <Hero />
      <PillarsSection />
      <PhoneMockups />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}