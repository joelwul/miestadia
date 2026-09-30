"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  MessageCircle,
  Calendar,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  Phone,
  Clock,
  CloudSun,
  Wifi,
  MapPin,
  Compass,
  Star,
  Package,
  ExternalLink,
  Navigation,
  Info,
  LogOut,
  ChevronDown,
  ChevronUp,
  History,
  DollarSign,
  Send,
  UserCheck,
  Edit3,
  X,
  Menu,
} from "lucide-react";

// ... (interfaces igual que antes)

export default function GuestPage() {
  // ... (todo el código de estado y useEffect igual que antes)

  // Agregar estado para menú móvil
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // ... (resto del código igual)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header responsive */}
      <header className="bg-gradient-to-r from-[#0F766E] to-[#166534] text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-lg font-bold">¡Hola, {reservation.guest?.first_name || "huésped"}!</h1>
              <p className="text-white/90 text-xs">{tenant.name}</p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-xs">Código</p>
              <p className="text-sm font-mono font-bold">{reservation.reservation_code}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navegación rápida móvil (scroll horizontal) */}
      <div className="lg:hidden sticky top-[72px] z-30 bg-white border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-1 p-2 min-w-max">
          {[
            { id: "payment", label: "Pago", icon: CreditCard, color: "bg-[#0F766E]" },
            { id: "weather", label: "Clima", icon: CloudSun, color: "bg-[#00B4D8]" },
            { id: "stay", label: "Estadía", icon: Home, color: "bg-[#166534]" },
            { id: "wifi", label: "WiFi", icon: Wifi, color: "bg-[#6366F1]" },
            { id: "location", label: "Ubicación", icon: MapPin, color: "bg-[#EF4444]" },
            { id: "guide", label: "Destino", icon: Compass, color: "bg-[#F59E0B]" },
            { id: "services", label: "Servicios", icon: Package, color: "bg-[#10B981]" },
            { id: "contact", label: "Contacto", icon: MessageCircle, color: "bg-[#25D366]" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                const element = document.getElementById(item.id);
                if (element) {
                  element.scrollIntoView({ behavior: "smooth", block: "start" });
                  setActiveSection(item.id);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeSection === item.id
                  ? `${item.color} text-white`
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 lg:py-6 space-y-4">
        {/* Todas las secciones igual que antes, pero con IDs para navegación */}
        
        {/* PAGO */}
        <motion.div id="payment" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* ... contenido igual ... */}
        </motion.div>

        {/* CLIMA */}
        <motion.div id="weather" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* ... contenido igual ... */}
        </motion.div>

        {/* ... resto de secciones ... */}
      </div>
    </div>
  );
}

/* Ocultar scrollbar en navegación móvil */
.overflow-x-auto::-webkit-scrollbar {
  display: none;
}
.overflow-x-auto {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Modales responsive */
@media (max-width: 640px) {
  .fixed.inset-0 {
    padding: 0;
  }
  
  .fixed.inset-0 .bg-white {
    max-height: 100vh;
    border-radius: 0;
  }
}

/* Tablas scrollables en móvil */
@media (max-width: 768px) {
  .overflow-x-auto {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}

/* Inputs más grandes en móvil para mejor touch */
@media (max-width: 640px) {
  input, select, textarea, button {
    font-size: 16px; /* Previene zoom en iOS */
  }
}