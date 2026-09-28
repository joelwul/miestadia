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
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const Logo = ({ size = 200 }: { size?: number }) => (
  <Image
    src="/logotransparente1.png"
    alt="Mi Estadía"
    width={size}
    height={size}
    className="drop-shadow-2xl"
    priority
    loading="eager"
    style={{ width: "auto", height: "auto" }}
  />
);

const Navbar = () => (
  <motion.nav
    initial={{ y: -100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.6 }}
    className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm"
  >
    <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3">
        <Image 
          src="/logotransparente.png" 
          alt="Mi Estadía" 
          width={40} 
          height={40} 
          className="rounded-lg" 
          style={{ width: "auto", height: "auto" }} 
        />
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

const slides = [
  "/images/slides/slide-1.jpg",
  "/images/slides/slide-2.jpg",
  "/images/slides/slide-3.jpg",
  "/images/slides/slide-4.jpg",
  "/images/slides/slide-5.jpg",
  "/images/slides/slide-6.jpg",
];

const Hero = () => {
  const [current, setCurrent] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    slides.forEach((src, i) => {
      const img = new window.Image();
      img.onload = () => {
        setLoadedImages((prev) => {
          const next = new Set(prev);
          next.add(i);
          return next;
        });
      };
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
            <motion.div
              key={i}
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: i === current ? 1 : 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            >
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 1.1 }}
                animate={{ scale: i === current ? 1 : 1.1 }}
                transition={{ duration: 6, ease: "linear" }}
              >
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ display: loadedImages.has(i) ? "block" : "none" }}
                />
              </motion.div>
            </motion.div>
          ))}
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, type: "spring", bounce: 0.3 }}
        className="relative z-10"
      >
        <Logo size={220} />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="relative z-10 mt-8 text-5xl md:text-7xl font-bold text-white tracking-tight"
      >
        Mi Estadía
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 1 }}
        className="relative z-10 mt-4 text-xl md:text-2xl text-white font-medium"
      >
        Tu alojamiento, más cerca.
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 1 }}
        className="relative z-10 mt-6 max-w-2xl text-lg text-white font-medium"
      >
        Dejá el caos de WhatsApp y las planillas. Gestioná reservas, check-ins, pagos y ofrecé una experiencia premium a tus huéspedes.{" "}
        <strong>Sin instalaciones, sin complicaciones.</strong>
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 1 }}
        className="relative z-10 mt-10 flex flex-col sm:flex-row gap-4"
      >
        <Link
          href="/login"
          className="group px-8 py-4 rounded-full bg-[#EA580C] text-white font-bold text-lg hover:bg-[#C2410C] transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          Probar gratis 30 días
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
        </Link>
        <a
          href="https://wa.me/5491131923742?text=Hola!%20Quiero%20mas%20info%20sobre%20Mi%20Estadia"
          target="_blank"
          rel="noopener noreferrer"
          className="px-8 py-4 rounded-full border-2 border-white text-white font-bold text-lg hover:bg-white hover:text-[#0F766E] transition flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          Hablar por WhatsApp
        </a>
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="relative z-10 mt-5 text-sm text-white/90 font-medium"
      >
        Sin tarjeta de crédito - Sin instalaciones - Cancelás cuando quieras
      </motion.p>
    </section>
  );
};

const HowItWorks = () => {
  const steps = [
    { icon: <CalendarCheck className="w-8 h-8" />, title: "Cargá tu reserva", desc: "Manual, por CSV o pegando el mensaje de WhatsApp.", color: "bg-[#0F766E]" },
    { icon: <Bell className="w-8 h-8" />, title: "Automatizá mensajes", desc: "Recordatorios de check-in y post-estadía.", color: "bg-[#166534]" },
    { icon: <BarChart3 className="w-8 h-8" />, title: "Controlá todo", desc: "Reservas, pagos e inventario en un panel.", color: "bg-[#EA580C]" },
  ];
  
  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-sm font-semibold text-[#EA580C] uppercase tracking-wider">Simple y potente</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold text-[#0F766E]">Así de fácil es gestionar tu alojamiento</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="relative">
              <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-lg">
                <div className={`${step.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6`}>{step.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Benefits = () => {
  const benefits = [
    { icon: <CalendarCheck className="w-7 h-7" />, title: "Gestión de reservas", desc: "Estados automáticos y parser de WhatsApp." },
    { icon: <MessageCircle className="w-7 h-7" />, title: "WhatsApp automático", desc: "Mensajes pre y post estadía." },
    { icon: <CreditCard className="w-7 h-7" />, title: "Control de pagos", desc: "Saldos y pagos parciales." },
    { icon: <Users className="w-7 h-7" />, title: "Gestión de huéspedes", desc: "Datos y pre-checkin digital." },
  ];
  
  return (
    <section id="beneficios" className="py-24 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#0F766E]">Todo lo que necesitás</h2>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0F766E] to-[#166534] flex items-center justify-center text-white mb-4">{b.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{b.title}</h3>
              <p className="text-sm text-gray-600">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Pricing = () => (
  <section id="precios" className="py-24 px-4 bg-gradient-to-b from-[#FDFBF7] to-white">
    <div className="max-w-5xl mx-auto text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <h2 className="mt-3 text-4xl md:text-5xl font-bold text-[#0F766E]">30 días de prueba gratis</h2>
      </motion.div>
      <div className="mt-16 grid md:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-3xl border-2 border-gray-200 bg-white p-10 text-left shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan Mensual</h3>
          <div className="flex items-baseline gap-1 mb-2"><span className="text-7xl font-bold text-[#0F766E]">USD 40</span><span className="text-gray-500 text-lg">/ mes</span></div>
          <a href="https://wa.me/5491131923742" target="_blank" rel="noopener noreferrer" className="mt-8 block w-full rounded-full py-4 text-center font-bold text-white bg-[#0F766E]">Empezar prueba gratis</a>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-3xl border-2 border-[#EA580C] bg-white p-10 text-left shadow-lg">
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#EA580C] px-6 py-2 text-sm font-bold text-white">Ahorrás 25%</span>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan Anual</h3>
          <div className="flex items-baseline gap-1 mb-2"><span className="text-7xl font-bold text-[#0F766E]">USD 360</span><span className="text-gray-500 text-lg">/ año</span></div>
          <a href="https://wa.me/5491131923742" target="_blank" rel="noopener noreferrer" className="mt-8 block w-full rounded-full py-4 text-center font-bold text-white bg-[#EA580C]">Empezar prueba gratis</a>
        </motion.div>
      </div>
    </div>
  </section>
);

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = [
    { q: "¿Necesito instalar algo?", a: "No. Todo funciona desde el navegador." },
    { q: "¿Necesito tarjeta de crédito?", a: "No. La prueba es gratuita y sin compromiso." },
    { q: "¿Puedo cancelar?", a: "Sí, cancelás cuando quieras sin penalizaciones." },
  ];
  
  return (
    <section id="faq" className="py-24 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-[#0F766E] text-center mb-12">Preguntas frecuentes</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-[#FDFBF7] rounded-2xl border border-gray-100 p-6">
              <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="w-full flex justify-between items-center text-left font-semibold text-gray-900">
                <span className="text-lg">{faq.q}</span>
                <span className="text-[#0F766E] text-2xl">{openIndex === i ? "−" : "+"}</span>
              </button>
              {openIndex === i && <p className="mt-3 text-gray-600">{faq.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="bg-gray-900 text-white py-16 px-4">
    <div className="max-w-6xl mx-auto">
      <div className="grid md:grid-cols-3 gap-10 mb-12">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <Image src="/logotransparente1.png" alt="Mi Estadía" width={48} height={48} style={{ width: "auto", height: "auto" }} />
            <span className="text-2xl font-bold">Mi Estadía</span>
          </div>
          <p className="text-gray-400">Tu alojamiento, más cerca.</p>
        </div>
        <div>
          <h4 className="font-bold mb-4 text-[#F59E0B]">Contacto</h4>
          <ul className="space-y-3 text-gray-400 text-sm">
            <li><a href="https://wa.me/5491131923742" target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a></li>
            <li><Link href="/login" className="hover:text-white">Ingresar al panel</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 pt-8 text-center">
        <p className="text-gray-500 text-sm">© 2026 Mi Estadía. Todos los derechos reservados.</p>
      </div>
    </div>
  </footer>
);

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white font-sans antialiased">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Benefits />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  );
}