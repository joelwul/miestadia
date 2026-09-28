"use client";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, CalendarCheck, Bell, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0F766E] via-[#166534] to-[#0F766E]">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-[#0F766E]">Mi Estadía</Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
            <a href="#beneficios">Beneficios</a>
            <a href="#precios">Precios</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-[#0F766E]">Ingresar</Link>
            <Link href="/login" className="text-sm font-semibold bg-[#EA580C] text-white px-5 py-2.5 rounded-full">Probar gratis</Link>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-24">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-5xl md:text-7xl font-bold text-white tracking-tight">
          Mi Estadía
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 1 }}
          className="mt-4 text-xl md:text-2xl text-white font-medium">
          Tu alojamiento, más cerca.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 1 }}
          className="mt-6 max-w-2xl text-lg text-white font-medium">
          Dejá el caos de WhatsApp y las planillas. Gestioná reservas, check-ins, pagos y ofrecé una experiencia premium a tus huéspedes.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 1 }}
          className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="group px-8 py-4 rounded-full bg-[#EA580C] text-white font-bold text-lg hover:bg-[#C2410C] transition shadow-lg flex items-center justify-center gap-2">
            Probar gratis 30 días
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </Link>
          <a
            href="https://wa.me/5491131923742"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 rounded-full border-2 border-white text-white font-bold text-lg hover:bg-white hover:text-[#0F766E] transition flex items-center justify-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Hablar por WhatsApp
          </a>
        </motion.div>
      </section>

      <section id="beneficios" className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-[#0F766E] text-center mb-16">Así de fácil es gestionar tu alojamiento</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <CalendarCheck className="w-8 h-8" />, title: "Cargá tu reserva", desc: "Manual, por CSV o pegando el mensaje de WhatsApp.", color: "bg-[#0F766E]" },
              { icon: <Bell className="w-8 h-8" />, title: "Automatizá mensajes", desc: "Recordatorios de check-in y post-estadía.", color: "bg-[#166534]" },
              { icon: <BarChart3 className="w-8 h-8" />, title: "Controlá todo", desc: "Reservas, pagos e inventario en un panel.", color: "bg-[#EA580C]" },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-white border border-gray-100 rounded-3xl p-8 shadow-lg">
                <div className={`${step.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6`}>{step.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="precios" className="py-24 px-4 bg-gradient-to-b from-[#FDFBF7] to-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-[#0F766E] mb-16">30 días de prueba gratis</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-3xl border-2 border-gray-200 bg-white p-10 text-left shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan Mensual</h3>
              <div className="flex items-baseline gap-1 mb-2"><span className="text-7xl font-bold text-[#0F766E]">USD 40</span><span className="text-gray-500 text-lg">/ mes</span></div>
              <a href="https://wa.me/5491131923742" target="_blank" rel="noopener noreferrer" className="mt-8 block w-full rounded-full py-4 text-center font-bold text-white bg-[#0F766E]">Empezar prueba gratis</a>
            </div>
            <div className="rounded-3xl border-2 border-[#EA580C] bg-white p-10 text-left shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan Anual</h3>
              <div className="flex items-baseline gap-1 mb-2"><span className="text-7xl font-bold text-[#0F766E]">USD 360</span><span className="text-gray-500 text-lg">/ año</span></div>
              <a href="https://wa.me/5491131923742" target="_blank" rel="noopener noreferrer" className="mt-8 block w-full rounded-full py-4 text-center font-bold text-white bg-[#EA580C]">Empezar prueba gratis</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-500 text-sm">© 2026 Mi Estadía. Todos los derechos reservados.</p>
        </div>
      </footer>
    </main>
  );
}