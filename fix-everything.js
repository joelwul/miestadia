const fs = require('fs');
const path = require('path');

console.log('🔧 Iniciando reparación automática...\n');

// Función para eliminar BOM
function removeBOM(filePath) {
  const content = fs.readFileSync(filePath);
  if (content[0] === 0xEF && content[1] === 0xBB && content[2] === 0xBF) {
    const newContent = content.slice(3);
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ BOM eliminado: ${path.basename(filePath)}`);
    return true;
  }
  return false;
}

// 1. Eliminar BOM de TODOS los archivos .ts y .tsx
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      removeBOM(filePath);
    }
  });
}

console.log('📁 Eliminando BOM de todos los archivos...');
processDirectory(path.join(__dirname, 'src'));

// 2. Reemplazar completamente el page.tsx de la landing con código limpio
console.log('\n🎨 Regenerando landing page...');
const landingCode = `"use client";
import { motion } from "framer-motion";
import { Check, Wifi, MapPin, CloudSun, MessageCircle, CalendarCheck, CreditCard, Key, Star, ShoppingBag, UtensilsCrossed, Compass, Package, Clock, ShieldCheck, Zap, Heart, ArrowRight, Sparkles, Users, BarChart3, Bell, Camera, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const Logo = ({ size = 200 }) => (
  <div className="relative inline-block">
    <Image src="/logotransparente1.png" alt="Mi Estadía" width={size} height={size} className="drop-shadow-2xl" priority loading="eager" style={{ width: "auto", height: "auto", mixBlendMode: "multiply" }} />
  </div>
);

const Navbar = () => (
  <motion.nav initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
    <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3">
        <Image src="/logotransparente.png" alt="Mi Estadía" width={40} height={40} className="rounded-lg" style={{ width: "auto", height: "auto", mixBlendMode: "multiply" }} />
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

const slides = ["/images/slides/slide-1.jpg", "/images/slides/slide-2.jpg", "/images/slides/slide-3.jpg", "/images/slides/slide-4.jpg", "/images/slides/slide-5.jpg", "/images/slides/slide-6.jpg"];

const Hero = () => {
  const [current, setCurrent] = useState(0);
  const [loadedImages, setLoadedImages] = useState(new Set());

  useEffect(() => {
    const timer = setInterval(() => { setCurrent((prev) => (prev + 1) % slides.length); }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    slides.forEach((src, i) => {
      const img = new window.Image();
      img.onload = () => { setLoadedImages((prev) => { const next = new Set(prev); next.add(i); return next; }); };
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
      <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1 }} className="relative z-10 mt-8 text-5xl md:text-7xl font-bold text-white tracking-tight">Mi Estadía</motion.h1>
      <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 1 }} className="relative z-10 mt-4 text-xl md:text-2xl text-white font-medium">Tu alojamiento, más cerca.</motion.p>
      <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 1 }} className="relative z-10 mt-6 max-w-2xl text-lg text-white font-medium">Dejá el caos de WhatsApp y las planillas. Gestioná reservas, check-ins, pagos y ofrecé una experiencia premium a tus huéspedes. <strong>Sin instalaciones, sin complicaciones.</strong></motion.p>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 1 }} className="relative z-10 mt-10 flex flex-col sm:flex-row gap-4">
        <Link href="/login" className="group px-8 py-4 rounded-full bg-[#EA580C] text-white font-bold text-lg hover:bg-[#C2410C] transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2">Probar gratis 30 días<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" /></Link>
        <a href="https://wa.me/5491131923742?text=Hola!%20Quiero%20mas%20info%20sobre%20Mi%20Estadia" target="_blank" rel="noopener noreferrer" className="px-8 py-4 rounded-full border-2 border-white text-white font-bold text-lg hover:bg-white hover:text-[#0F766E] transition flex items-center justify-center gap-2"><MessageCircle className="w-5 h-5" />Hablar por WhatsApp</a>
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="relative z-10 mt-5 text-sm text-white/90 font-medium">Sin tarjeta de crédito - Sin instalaciones - Cancelás cuando quieras</motion.p>
    </section>
  );
};

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
                <div className={\`\${step.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300\`}>{step.icon}</div>
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

const GuestJourney = () => {
  const phases = [
    { phase: "Antes de llegar", icon: <Clock className="w-7 h-7" />, color: "from-[#0F766E] to-[#166534]", items: ["Mensaje automático de confirmación con link personalizado", "Pre-checkin digital: datos del huésped antes de llegar", "Recordatorio automático 48hs antes con instrucciones", "Acceso con código de reserva + apellido (sin instalar nada)"] },
    { phase: "Durante la estadía", icon: <Heart className="w-7 h-7" />, color: "from-[#EA580C] to-[#F59E0B]", items: ["Panel premium con clima, Wi-Fi, mapa y guía de la zona", "Inventario de la unidad visible (ropa de cama, cocina, etc.)", "Catálogo de productos, gastronomía y experiencias del anfitrión", "Contacto directo con el anfitrión por WhatsApp"] },
    { phase: "Después del check-out", icon: <Star className="w-7 h-7" />, color: "from-[#166534] to-[#0F766E]", items: ["Mensaje automático de agradecimiento", "Solicitud de reseña en Google Maps con link directo", "Oferta de retorno para huéspedes recurrentes", "Historial completo para futuras estadías"] },
  ];
  return (
    <section id="huesped" className="py-24 px-4 bg-gradient-to-b from-[#FDFBF7] to-white">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-sm font-semibold text-[#EA580C] uppercase tracking-wider">Experiencia 360°</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold text-[#0F766E]">Un viaje completo para tus huéspedes</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Desde que reservan hasta que dejan la reseña. Cada momento pensado para que vuelvan.</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6">
          {phases.map((phase, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300">
              <div className={\`bg-gradient-to-br \${phase.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-5 shadow-lg\`}>{phase.icon}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-5">{phase.phase}</h3>
              <ul className="space-y-3">
                {phase.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-3 text-gray-700">
                    <Check className="w-5 h-5 flex-shrink-0 text-[#0F766E] mt-0.5" />
                    <span className="text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-12 bg-[#0F766E] rounded-3xl p-8 md:p-12 text-white text-center shadow-xl">
          <Sparkles className="w-10 h-10 mx-auto mb-4 text-[#F59E0B]" />
          <h3 className="text-2xl md:text-3xl font-bold mb-3">Sin instalaciones. Sin fricción.</h3>
          <p className="text-lg text-teal-100 max-w-2xl mx-auto">Ni vos ni tus huéspedes necesitan bajar ninguna app. El huésped entra con su <strong>código de reserva y apellido</strong>. Listo.</p>
        </motion.div>
      </div>
    </section>
  );
};

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
  return (
    <section id="beneficios" className="py-24 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="text-sm font-semibold text-[#EA580C] uppercase tracking-wider">Todo incluido</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold text-[#0F766E]">Todo lo que necesitás, nada que sobre</h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Una plataforma completa para profesionalizar tu alojamiento y deleitar a tus huéspedes.</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} whileHover={{ y: -5 }} className="group bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-[#0F766E]/20 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0F766E] to-[#166534] flex items-center justify-center text-white mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-md">{b.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{b.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const GuestPanelPreview = () => (
  <section className="py-24 px-4 bg-gradient-to-b from-white to-[#FDFBF7] overflow-hidden">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
      <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="md:w-1/2">
        <span className="text-sm font-semibold text-[#EA580C] uppercase tracking-wider">Panel del huésped</span>
        <h2 className="mt-3 text-4xl md:text-5xl font-bold text-[#0F766E] mb-6">Una experiencia que tus huéspedes van a amar</h2>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">Olvidate de enviar 20 mensajes de WhatsApp. Tu huésped recibe un link y tiene <strong>todo lo que necesita</strong> en una sola pantalla premium con tu marca.</p>
        <ul className="space-y-4">
          {["Pre-checkin digital antes de llegar", "Clima en tiempo real de la zona", "Guía del destino con recomendaciones", "Inventario y servicios de la unidad", "Productos y experiencias adicionales", "Contacto directo con el anfitrión"].map((item, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex items-center gap-3 text-gray-700">
              <div className="w-6 h-6 rounded-full bg-[#0F766E]/10 flex items-center justify-center flex-shrink-0"><Check className="w-4 h-4 text-[#0F766E]" /></div>
              {item}
            </motion.li>
          ))}
        </ul>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 60, rotateX: 15 }} whileInView={{ opacity: 1, y: 0, rotateX: 0 }} viewport={{ once: true }} transition={{ duration: 1, type: "spring" }} className="md:w-1/2 flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F766E]/20 to-[#EA580C]/20 rounded-[4rem] blur-3xl" />
          <div className="relative w-[280px] h-[580px] bg-white rounded-[3rem] border-[10px] border-gray-900 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-2xl z-20" />
            <div className="h-full overflow-y-auto bg-gray-50 pt-12 px-4 pb-4">
              <div className="text-center mb-5">
                <h3 className="font-bold text-lg text-gray-800">¡Hola, Juan!</h3>
                <p className="text-xs text-gray-500">Cabañas del Bosque - 15-20 Mar</p>
              </div>
              <div className="bg-gradient-to-r from-[#0F766E] to-[#166534] rounded-2xl p-4 text-white mb-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs opacity-80">Hoy en Villa Carlos Paz</p><p className="text-3xl font-bold mt-1">24°</p></div>
                  <CloudSun className="w-12 h-12 text-amber-300" />
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 mb-3 shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="bg-[#F0FDF4] p-2 rounded-lg"><Wifi className="w-5 h-5 text-[#0F766E]" /></div>
                <div><p className="text-xs text-gray-500">Red Wi-Fi</p><p className="font-semibold text-sm text-gray-800">MiEstadia_Guest</p></div>
              </div>
              <div className="bg-white rounded-xl p-3 mb-3 shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="bg-[#FFF7ED] p-2 rounded-lg"><MapPin className="w-5 h-5 text-[#EA580C]" /></div>
                <div><p className="text-xs text-gray-500">Ubicación</p><p className="font-semibold text-sm text-gray-800">Ver en Google Maps</p></div>
              </div>
              <div className="bg-white rounded-xl p-3 mb-3 shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="bg-[#FEF3C7] p-2 rounded-lg"><ShoppingBag className="w-5 h-5 text-[#F59E0B]" /></div>
                <div><p className="text-xs text-gray-500">Productos disponibles</p><p className="font-semibold text-sm text-gray-800">Desayuno, kits, tours</p></div>
              </div>
              <button className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-2 shadow-md"><MessageCircle className="w-5 h-5" />Contactar Anfitrión</button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

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

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);
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
                <motion.span animate={{ rotate: openIndex === i ? 180 : 0 }} className="text-[#0F766E] text-2xl flex-shrink-0 ml-4">&#9662;</motion.span>
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
          <Link href="/login" className="group px-8 py-4 rounded-full bg-[#EA580C] text-white font-bold text-lg hover:bg-[#C2410C] transition shadow-xl hover:shadow-2xl flex items-center justify-center gap-2">Probar gratis 30 días<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" /></Link>
          <a href="https://wa.me/5491131923742?text=Hola!%20Quiero%20mas%20info%20sobre%20Mi%20Estadia" target="_blank" rel="noopener noreferrer" className="px-8 py-4 rounded-full border-2 border-white text-white font-bold text-lg hover:bg-white hover:text-[#0F766E] transition flex items-center justify-center gap-2"><MessageCircle className="w-5 h-5" />Hablar por WhatsApp</a>
        </div>
        <p className="mt-6 text-sm text-teal-200">Sin tarjeta - Sin instalaciones - 30 días gratis</p>
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
            <Image src="/logotransparente1.png" alt="Mi Estadía" width={48} height={48} className="rounded-lg" style={{ width: "auto", height: "auto", mixBlendMode: "multiply" }} />
            <span className="text-2xl font-bold">Mi Estadía</span>
          </div>
          <p className="text-gray-400 max-w-md leading-relaxed">Tu alojamiento, más cerca. La plataforma SaaS que profesionaliza la gestión de reservas y ofrece una experiencia premium a tus huéspedes.</p>
        </div>
        <div>
          <h4 className="font-bold mb-4 text-[#F59E0B]">Contacto</h4>
          <ul className="space-y-3 text-gray-400 text-sm">
            <li><a href="https://wa.me/5491131923742" target="_blank" rel="noopener noreferrer" className="hover:text-white transition flex items-center gap-2"><MessageCircle className="w-4 h-4" />WhatsApp</a></li>
            <li><Link href="/login" className="hover:text-white transition flex items-center gap-2">Ingresar al panel <ExternalLink className="w-3 h-3" /></Link></li>
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

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white font-sans antialiased">
      <Navbar />
      <Hero />
      <HowItWorks />
      <GuestJourney />
      <Benefits />
      <GuestPanelPreview />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
`;

fs.writeFileSync(path.join(__dirname, 'src', 'app', 'page.tsx'), landingCode, 'utf8');
console.log('✅ Landing page regenerada correctamente');

// 3. Corregir variables de entorno en route.ts
console.log('\n🔧 Corrigiendo variables de entorno...');
const routePath = path.join(__dirname, 'src', 'app', 'api', 'cron', 'send-emails', 'route.ts');
let routeContent = fs.readFileSync(routePath, 'utf8');
routeContent = routeContent.replace(/NEXT_PUBLIC_SUPABASE_URL/g, 'SUPABASE_URL');
routeContent = routeContent.replace(/SUPABASE_SERVICE_ROLE_KEY/g, 'SUPABASE_ANON_KEY');
fs.writeFileSync(routePath, routeContent, 'utf8');
console.log('✅ Variables de entorno corregidas');

console.log('\n🎉 ¡Reparación completada!');
console.log('\n Próximos pasos:');
console.log('1. Ejecutá: git add .');
console.log('2. Ejecutá: git commit -m "Fix: BOM eliminado y landing regenerada"');
console.log('3. Ejecutá: git push origin main');
console.log('4. Esperá 2 minutos y probá en Vercel');