"use client";
import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useInView,
  AnimatePresence,
} from "framer-motion";
import {
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
  Compass,
  Mail,
  QrCode,
  ExternalLink,
  Clock,
  TrendingUp,
  Shield,
  X,
  ChevronLeft,
  ChevronRight,
  Send,
  Bell,
  Users,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// ============================================
// HOOKS PREMIUM
// ============================================
const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);
  return mousePosition;
};

const MagneticButton = ({ children, className, ...props }: any) => {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.3);
    y.set((e.clientY - centerY) * 0.3);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
};

const TextReveal = ({ children, className = "", delay = 0 }: { children: string; className?: string; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        initial={{ y: "100%" }}
        animate={isInView ? { y: 0 } : { y: "100%" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
      >
        {children}
      </motion.div>
    </div>
  );
};

const StaggerContainer = ({ children, className = "" }: { children: ReactNode; className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className={className}>
      <motion.div
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1 } },
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

const StaggerItem = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 30 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// ============================================
// LOGO
// ============================================
const Logo = ({ size = 140 }: { size?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    className="relative inline-block"
  >
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
  </motion.div>
);

// ============================================
// NAVBAR
// ============================================
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-sm py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/mi-estadia-logo.png" alt="Mi Estadía" width={40} height={40} className="rounded-lg" style={{ width: "auto", height: "auto" }} />
          <span className={`text-xl font-bold transition-colors ${scrolled ? "text-[#0F766E]" : "text-white"}`}>Mi Estadía</span>
        </Link>
        <div className={`hidden md:flex items-center gap-8 text-sm font-medium transition-colors ${scrolled ? "text-gray-700" : "text-white/90"}`}>
          <a href="#pilares" className="hover:opacity-70 transition">Beneficios</a>
          <a href="#reservas" className="hover:opacity-70 transition">Reservador</a>
          <a href="#testimonios" className="hover:opacity-70 transition">Testimonios</a>
          <a href="#precios" className="hover:opacity-70 transition">Precios</a>
        </div>
        <MagneticButton className={`text-sm font-semibold px-5 py-2.5 rounded-full transition shadow-md ${
          scrolled ? "bg-[#EA580C] text-white hover:bg-[#C2410C]" : "bg-white text-[#0F766E] hover:bg-white/90"
        }`}>
          <a href="https://wa.me/554891089578?text=Hola!%20Quiero%20mas%20info%20sobre%20Mi%20Estadia" target="_blank" rel="noopener noreferrer">
            Probar gratis
          </a>
        </MagneticButton>
      </div>
    </motion.nav>
  );
};

// ============================================
// MARQUEE INFINITO
// ============================================
const Marquee = () => {
  const words = ["Gestión inteligente", "Panel 5 estrellas", "Motor de reservas", "Recordatorios automáticos", "Experiencia premium", "Check-in digital", "Guía del destino", "Upselling de servicios"];
  
  return (
    <div className="py-8 bg-[#0F766E] overflow-hidden">
      <motion.div
        className="flex gap-12 whitespace-nowrap"
        animate={{ x: [0, -1200] }}
        transition={{ duration: 30, ease: "linear", repeat: Infinity }}
      >
        {[...words, ...words, ...words].map((word, i) => (
          <div key={i} className="flex items-center gap-12">
            <span className="text-white/90 text-lg font-medium">{word}</span>
            <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// ============================================
// HERO CINEMATOGRÁFICO
// ============================================
const slides = ["/images/slides/slide-1.jpg", "/images/slides/slide-2.jpg", "/images/slides/slide-3.jpg", "/images/slides/slide-4.jpg"];

const Hero = () => {
  const [current, setCurrent] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((prev) => (prev + 1) % slides.length), 6000);
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
      {/* Fondo con parallax */}
      <motion.div style={{ y }} className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F766E] via-[#166534] to-[#0F766E]" />
        {loadedImages.size > 0 && (
          <div className="absolute inset-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <img
                  src={slides[current]}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ display: loadedImages.has(current) ? "block" : "none" }}
                />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-black/65" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
          </div>
        )}
      </motion.div>

      {/* Contenido */}
      <motion.div style={{ opacity }} className="relative z-10 max-w-6xl">
        <Logo size={140} />

        <div className="mt-8 space-y-6">
          <TextReveal className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight" delay={0.2}>
            La plataforma todo-en-uno
          </TextReveal>
          <TextReveal className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight" delay={0.3}>
            para <span className="text-yellow-300">gestionar tu alojamiento</span>
          </TextReveal>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 max-w-3xl mx-auto text-lg sm:text-xl text-white/90 font-medium leading-relaxed"
        >
          Gestión de reservas, motor online, recordatorios automáticos y un panel de huésped de 5 estrellas. Todo en un solo lugar.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <MagneticButton className="group px-8 py-4 rounded-full bg-[#EA580C] text-white font-bold text-lg hover:bg-[#C2410C] transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
            <Link href="/login" className="flex items-center gap-2">
              Comenzar prueba gratis <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </Link>
          </MagneticButton>
          <MagneticButton className="px-8 py-4 rounded-full border-2 border-white text-white font-bold text-lg hover:bg-white hover:text-[#0F766E] transition flex items-center justify-center gap-2">
            <a href="https://wa.me/554891089578?text=Hola!%20Quiero%20mas%20info%20sobre%20Mi%20Estadia" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" /> Hablar por WhatsApp
            </a>
          </MagneticButton>
        </motion.div>
      </motion.div>

      {/* Indicador de scroll */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-3 bg-white/70 rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

// ============================================
// 4 PILARES
// ============================================
const pillars = [
  {
    icon: LayoutDashboard,
    title: "Panel de Administración",
    subtitle: "Tu centro de comando",
    desc: "Gestiona todo tu negocio desde un dashboard intuitivo. Visualiza llegadas, salidas y ocupación en tiempo real. Gestión de reservas con un clic, mensajería WhatsApp con plantillas y control de inventario.",
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
    icon: Bell,
    title: "Recordatorios Automáticos",
    subtitle: "Comunicación sin esfuerzo",
    desc: "Emails y WhatsApp automáticos en cada etapa: confirmación, recordatorio pre-checkin, durante la estadía y post-checkout. Plantillas personalizables que mantienen a tus huéspedes informados sin que muevas un dedo.",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    iconBg: "bg-blue-100 text-blue-600",
    interactive: (
      <div className="mt-4 bg-white rounded-lg p-3 shadow-sm border border-gray-100 space-y-2">
        <div className="flex items-center gap-2 text-[10px]">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-gray-600">Email enviado hace 2h</span>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <p className="text-[9px] font-bold text-gray-800">Recordatorio de check-in</p>
          <p className="text-[8px] text-gray-500">Juan Pérez • 15/10</p>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <CheckCircle className="w-3 h-3 text-green-500" />
          <span className="text-gray-600">Entregado y leído</span>
        </div>
      </div>
    ),
  },
  {
    icon: Smartphone,
    title: "Panel del Huésped 5★",
    subtitle: "Experiencia premium digital",
    desc: "Digitaliza la estadía y elimina las preguntas repetitivas. Pre check-in con datos precargados, guía digital (Wi-Fi, mapas, reglas), upselling de servicios, guía del destino, clima en tiempo real y solicitud automática de reseñas.",
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
    icon: CalendarCheck,
    title: "Motor de Reservas Online",
    subtitle: "Reservas 24/7 sin intervención",
    desc: "Reservador embebido en tu web con calendario en tiempo real. Los huéspedes ven disponibilidad y reservan directamente. Confirmaciones automáticas con email profesional, código QR y link al panel privado.",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    iconBg: "bg-purple-100 text-purple-600",
    interactive: (
      <div className="mt-4 bg-white rounded-lg p-3 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-[#0F766E] rounded flex items-center justify-center text-white text-xs font-bold">ME</div>
          <div className="flex-1">
            <p className="text-xs font-bold text-gray-800">Cabañas del Bosque</p>
            <p className="text-[10px] text-gray-500 font-mono">miestadia.online/cabanas</p>
          </div>
        </div>
        <div className="bg-gray-200 rounded h-16 flex items-center justify-center text-gray-400 text-[10px]">Calendario de disponibilidad</div>
        <button className="w-full mt-2 bg-[#EA580C] text-white py-1.5 rounded text-[10px] font-bold">Reservar ahora</button>
      </div>
    ),
  },
];

const PillarsSection = () => (
  <section id="pilares" className="py-24 px-4 bg-white relative overflow-hidden">
    <div className="max-w-7xl mx-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <span className="text-sm font-semibold text-[#EA580C] uppercase tracking-wider">¿Por qué elegirnos?</span>
        <h2 className="mt-3 text-4xl md:text-5xl font-bold text-[#0F766E]">4 Pilares Fundamentales</h2>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Todo lo que necesitás para profesionalizar tu alojamiento y ofrecer una experiencia memorable.</p>
      </motion.div>

      <StaggerContainer className="grid md:grid-cols-2 gap-8">
        {pillars.map((pillar, i) => (
          <StaggerItem key={i}>
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={`rounded-2xl p-8 border-2 transition-all duration-300 hover:shadow-2xl ${pillar.color}`}
            >
              <div className="flex items-start gap-4 mb-4">
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${pillar.iconBg}`}
                >
                  <pillar.icon className="w-7 h-7" />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{pillar.title}</h3>
                  <p className="text-sm text-gray-600 font-medium">{pillar.subtitle}</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed text-base">{pillar.desc}</p>
              {pillar.interactive}
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  </section>
);

// ============================================
// WIDGET DE RESERVAS FUNCIONAL
// ============================================
const EmbedWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleReserve = () => {
    // Abrir el reservador en nueva ventana
    window.open(
      "https://miestadia.online/centro-el-progreso-chile",
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <section id="reservas" className="py-24 px-4 bg-gradient-to-b from-white to-[#FDFBF7]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <span className="text-sm font-semibold text-[#EA580C] uppercase tracking-wider">Motor de Reservas</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold text-[#0F766E]">Reservador en Acción</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Así funciona el motor de reservas. Los huéspedes pueden ver disponibilidad y reservar directamente.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border-2 border-[#0F766E]/10"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 bg-[#0F766E]/10 px-6 py-3 rounded-full mb-4">
              <Building2 className="w-6 h-6 text-[#0F766E]" />
              <span className="font-bold text-[#0F766E]">Centro El Progreso - Chile</span>
            </div>
            <p className="text-gray-600">Demo interactiva del reservador. Hacé clic para ver la experiencia completa.</p>
          </div>

          <div className="flex justify-center mb-8">
            <MagneticButton
              onClick={handleReserve}
              className="group bg-gradient-to-r from-[#0F766E] to-[#166534] text-white px-10 py-5 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center gap-3"
            >
              <CalendarCheck className="w-6 h-6" />
              📅 Reservar ahora
              <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition" />
            </MagneticButton>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-gray-50 rounded-xl p-4"
            >
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-800">Disponibilidad en tiempo real</p>
              <p className="text-xs text-gray-500 mt-1">Calendario actualizado al instante</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="bg-gray-50 rounded-xl p-4"
            >
              <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-800">Reserva segura</p>
              <p className="text-xs text-gray-500 mt-1">Confirmación automática por email</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="bg-gray-50 rounded-xl p-4"
            >
              <Mail className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-800">Panel de huésped</p>
              <p className="text-xs text-gray-500 mt-1">Acceso inmediato con código QR</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// ============================================
// TESTIMONIOS
// ============================================
const testimonials = [
  {
    name: "María González",
    stars: 5,
    text: "La gestión se volvió increíblemente eficiente. Los recordatorios automáticos y el panel digital eliminaron el 90% de las preguntas repetitivas. Mis huéspedes llegan con todo claro.",
    impact: "Consultas reducidas -90%",
  },
  {
    name: "Carlos Rodríguez",
    stars: 5,
    text: "El motor de reservas online funciona perfecto. Los huéspedes pueden ver disponibilidad y reservar a cualquier hora. La confirmación automática con QR es un detalle que marca la diferencia.",
    impact: "Reservas 24/7 automatizadas",
  },
  {
    name: "Ana Paula Silva",
    stars: 5,
    text: "El pre-checkin digital es brillante. Los huéspedes completan sus datos antes de llegar y yo tengo toda la información organizada. Profesionalizó el servicio al 100%.",
    impact: "Check-in 3x más rápido",
  },
  {
    name: "Roberto Fernández",
    stars: 5,
    text: "Los emails automáticos en cada etapa son geniales. Confirmación, recordatorio, durante la estadía y post-checkout. Todo sin que yo tenga que hacer nada. Los huéspedes aman la experiencia.",
    impact: "Satisfacción huéspedes +95%",
  },
  {
    name: "Luciana Martínez",
    stars: 5,
    text: "La guía del destino con recomendaciones personales es un toque premium. Los huéspedes exploran la zona con confianza y siempre agradecen los tips. Genera una experiencia única.",
    impact: "Reseñas 5 estrellas +200%",
  },
  {
    name: "Diego Hernández",
    stars: 5,
    text: "El upselling de servicios me genera ingresos extra increíbles. Los huéspedes reservan desayunos y tours directamente desde el panel. Una funcionalidad que se paga sola.",
    impact: "Ingresos extra +40%",
  },
];

const Testimonials = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      checkScroll();
      return () => el.removeEventListener("scroll", checkScroll);
    }
  }, []);

  return (
    <section id="testimonios" className="py-24 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-sm font-semibold text-[#EA580C] uppercase tracking-wider">Testimonios</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold text-[#0F766E]">Lo que dicen nuestros anfitriones</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Historias reales de anfitriones que transformaron la gestión de su alojamiento.
          </p>
        </motion.div>

        <div className="relative">
          <button
            onClick={() => scroll("left")}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center transition-all ${
              canScrollLeft ? "opacity-100 hover:bg-gray-50" : "opacity-0 pointer-events-none"
            }`}
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <button
            onClick={() => scroll("right")}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center transition-all ${
              canScrollRight ? "opacity-100 hover:bg-gray-50" : "opacity-0 pointer-events-none"
            }`}
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scroll-smooth pb-8 px-4 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="flex-shrink-0 w-80 bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border-2 border-gray-100 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.stars)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>

                <p className="text-gray-700 text-sm leading-relaxed mb-4 italic">
                  "{testimonial.text}"
                </p>

                <div className="bg-[#0F766E]/10 rounded-lg p-3 mb-4">
                  <p className="text-xs font-bold text-[#0F766E] text-center">
                    {testimonial.impact}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#0F766E] to-[#166534] rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-xs text-gray-500">Anfitrión verificado</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// PHONE MOCKUPS
// ============================================
const phoneScreens = [
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
              <p className="text-[10px] text-gray-600 mt-1 italic"> Pedir la mesa del fondo con vista al río.</p>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-[#EA580C] uppercase tracking-wider">Experiencia Visual</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold text-[#0F766E]">Así se ve por dentro</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Una interfaz limpia, moderna y diseñada para que tanto vos como tus huéspedes disfruten de la experiencia.</p>
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-16">
          <div className="relative w-72 h-[580px] flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] shadow-2xl p-3 ring-4 ring-gray-900/10">
              <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative flex flex-col">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-2xl z-20" />
                <div className="flex-1 overflow-y-auto bg-gray-50 pt-12 px-4 pb-4 no-scrollbar">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentScreen}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-gray-300 rounded-full z-20" />
              </div>
            </div>
          </div>

          <div className="max-w-md w-full space-y-6">
            <div className="flex justify-center gap-2 mb-4">
              {phoneScreens.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToScreen(index)}
                  className={`h-2 rounded-full transition-all ${index === currentScreen ? "w-8 bg-[#0F766E]" : "w-2 bg-gray-300 hover:bg-gray-400"}`}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3">
              {phoneScreens.map((screen, index) => (
                <motion.button
                  key={index}
                  onClick={() => goToScreen(index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ============================================
// PRICING
// ============================================
const Pricing = () => (
  <section id="precios" className="py-24 px-4 bg-white">
    <div className="max-w-5xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <span className="text-sm font-semibold text-[#EA580C] uppercase tracking-wider">Precios transparentes</span>
        <h2 className="mt-3 text-4xl md:text-5xl font-bold text-[#0F766E]">30 días de prueba gratis</h2>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Sin tarjeta de crédito. Unidades ilimitadas. Todas las features incluidas.</p>
      </motion.div>
      <div className="mt-16 grid md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -5 }}
          className="relative rounded-3xl border-2 border-gray-200 bg-white p-10 text-left shadow-lg transition-all duration-300"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan Mensual</h3>
          <p className="text-sm text-gray-500 mb-6">Pago mes a mes, cancelás cuando quieras</p>
          <div className="flex items-baseline gap-1 mb-2"><span className="text-5xl font-bold text-[#0F766E]">USD 40</span><span className="text-gray-500 text-lg">/ mes</span></div>
          <p className="text-sm text-gray-500 mb-6">≈ $64.000 ARS/mes (sujeto a cotización)</p>
          <Link href="/login" className="block w-full rounded-full py-4 text-center font-bold text-white bg-[#0F766E] hover:bg-[#115E59] transition shadow-lg hover:shadow-xl">Empezar prueba gratis</Link>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -5 }}
          className="relative rounded-3xl border-2 border-[#EA580C] bg-gradient-to-br from-[#FFF7ED] to-white p-10 text-left shadow-xl transition-all duration-300"
        >
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

// ============================================
// FINAL CTA
// ============================================
const FinalCTA = () => (
  <section className="py-24 px-4 bg-gradient-to-br from-[#0F766E] to-[#166534] text-white relative overflow-hidden">
    <div className="absolute top-0 right-0 w-96 h-96 bg-[#EA580C]/20 rounded-full blur-3xl" />
    <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#F59E0B]/10 rounded-full blur-3xl" />
    <div className="max-w-4xl mx-auto text-center relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <Star className="w-12 h-12 mx-auto mb-6 text-[#F59E0B]" />
        <h2 className="text-4xl md:text-6xl font-bold mb-6">¿Listo para profesionalizar tu alojamiento?</h2>
        <p className="text-xl text-teal-100 mb-10 max-w-2xl mx-auto">
          Gestión inteligente, comunicación automática y una experiencia de huésped que marca la diferencia.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <MagneticButton className="group px-8 py-4 rounded-full bg-[#EA580C] text-white font-bold text-lg hover:bg-[#C2410C] transition shadow-xl hover:shadow-2xl flex items-center justify-center gap-2">
            <Link href="/login" className="flex items-center gap-2">
              Probar gratis 30 días <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </Link>
          </MagneticButton>
          <MagneticButton className="px-8 py-4 rounded-full border-2 border-white text-white font-bold text-lg hover:bg-white hover:text-[#0F766E] transition flex items-center justify-center gap-2">
            <a href="https://wa.me/554891089578?text=Hola!%20Quiero%20mas%20info%20sobre%20Mi%20Estadia" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" /> Hablar por WhatsApp
            </a>
          </MagneticButton>
        </div>
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
          <p className="text-gray-400 max-w-md leading-relaxed">
            La plataforma que profesionaliza la gestión de reservas, automatiza la comunicación y ofrece una experiencia premium a tus huéspedes.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-4 text-[#F59E0B]">Contacto</h4>
          <ul className="space-y-3 text-gray-400 text-sm">
            <li><a href="https://wa.me/554891089578" target="_blank" rel="noopener noreferrer" className="hover:text-white transition flex items-center gap-2"><MessageCircle className="w-4 h-4" />WhatsApp</a></li>
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
    <main className="min-h-screen bg-white font-sans antialiased relative overflow-x-hidden">
      <Navbar />
      <Hero />
      <Marquee />
      <PillarsSection />
      <EmbedWidget />
      <PhoneMockups />
      <Testimonials />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}