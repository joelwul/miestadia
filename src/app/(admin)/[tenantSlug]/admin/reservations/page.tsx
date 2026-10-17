"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import {
  Calendar,
  Plus,
  Search,
  QrCode,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  CheckSquare,
  X,
  Mail,
  Phone,
  Copy,
  ExternalLink,
  MessageSquare,
  Upload,
  UserCheck,
  LogOut,
  Star,
  Home,
  Bell,
  DollarSign,
  History,
  Filter,
  Info,
  RefreshCw,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";

// ... (interfaces igual que antes, no las repito para ahorrar espacio)

export default function ReservationsPage() {
  // ... (todo el estado y lógica igual que antes)
  
  // Agregar estado para menú de acciones móvil
  const [mobileActionMenu, setMobileActionMenu] = useState<string | null>(null);

  // ... (loadData, filtros, handlers igual que antes)

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Reservas</h1>
          <p className="text-sm lg:text-base text-gray-500 mt-1">
            {filteredReservations.length} {filteredReservations.length === 1 ? "reserva" : "reservas"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
          <button
            onClick={() => { setAddMethod("manual"); setActiveModal("add"); }}
            className="flex items-center gap-2 px-3 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-medium hover:bg-[#0F766E]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva reserva</span>
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 lg:p-4 space-y-3">
        {/* Búsqueda */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <span className="text-gray-500">-</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>

        {/* Filtros de fecha - scroll horizontal en móvil */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { key: "all", label: "Todas" },
            { key: "today", label: "Hoy" },
            { key: "tomorrow", label: "Mañana" },
            { key: "nextweek", label: "Semana" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as FilterType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f.key ? "bg-[#0F766E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Filtros de estado */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-gray-600 flex-shrink-0" />
          {[
            { key: "all", label: "Todas", count: statusCounts.all, color: "gray" },
            { key: "booked", label: "Reservada", count: statusCounts.booked, color: "blue" },
            { key: "pre_checkin_completed", label: "Pre-checkin", count: statusCounts.pre_checkin_completed, color: "green" },
            { key: "checked_in", label: "Check-in", count: statusCounts.checked_in, color: "purple" },
            { key: "checked_out", label: "Check-out", count: statusCounts.checked_out, color: "gray" },
            { key: "cancelled", label: "Cancelada", count: statusCounts.cancelled, color: "red" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key as StatusFilterType)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                statusFilter === item.key ? "bg-[#0F766E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                item.color === "blue" ? "bg-blue-500" :
                item.color === "green" ? "bg-green-500" :
                item.color === "purple" ? "bg-purple-500" :
                item.color === "red" ? "bg-red-500" :
                "bg-gray-400"
              }`} />
              {item.label}
              {item.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  statusFilter === item.key ? "bg-white/20" : "bg-gray-200"
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA DE RESERVAS */}
      {filteredReservations.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 lg:p-12 text-center">
          <Calendar className="w-12 h-12 lg:w-16 lg:h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2">No hay reservas</h3>
          <p className="text-sm text-gray-600">
            {searchTerm || filter !== "all" || statusFilter !== "all" || dateFrom || dateTo
              ? "No se encontraron reservas con los filtros aplicados."
              : "Comenzá agregando tu primera reserva."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReservations.map((reservation) => {
            const realStatus = getRealStatus(reservation);
            return (
              <div key={reservation.id} className="bg-white border border-gray-200 rounded-xl p-4 lg:p-6 hover:shadow-md transition-shadow">
                {/* Header de la reserva */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base lg:text-lg font-bold text-gray-900 truncate">
                        {reservation.guest?.first_name || "—"} {reservation.guest?.last_name || ""}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(realStatus)}`}>
                        {getStatusIcon(realStatus)}
                        <span className="hidden sm:inline">{getStatusLabel(realStatus)}</span>
                        <span className="sm:hidden">{getStatusLabel(realStatus).split(' ')[0]}</span>
                      </span>
                    </div>
                  </div>
                  {/* Menú de acciones móvil */}
                  <div className="relative lg:hidden">
                    <button
                      onClick={() => setMobileActionMenu(mobileActionMenu === reservation.id ? null : reservation.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {mobileActionMenu === reservation.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setMobileActionMenu(null)} />
                        <div className="absolute right-0 top-10 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-48">
                          {(reservation.status === "booked" || realStatus === "pre_checkin_completed") && (
                            <button onClick={() => { openCheckInModal(reservation); setMobileActionMenu(null); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                              <CheckSquare className="w-4 h-4" /> Check-in
                            </button>
                          )}
                          {reservation.status === "checked_in" && (
                            <button onClick={() => { openCheckOutModal(reservation); setMobileActionMenu(null); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                              <LogOut className="w-4 h-4" /> Check-out
                            </button>
                          )}
                          <button onClick={() => { openPaymentModal(reservation); setMobileActionMenu(null); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> Pago
                          </button>
                          <button onClick={() => { openWhatsAppModal(reservation); setMobileActionMenu(null); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                            <Send className="w-4 h-4" /> WhatsApp
                          </button>
                          <button onClick={() => { setSelectedReservation(reservation); setActiveModal("qr"); setMobileActionMenu(null); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                            <QrCode className="w-4 h-4" /> QR
                          </button>
                          <button onClick={() => { openEditModal(reservation); setMobileActionMenu(null); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                            <Edit className="w-4 h-4" /> Editar
                          </button>
                          <button onClick={() => { setSelectedReservation(reservation); setActiveModal("delete"); setMobileActionMenu(null); }} className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2">
                            <Trash2 className="w-4 h-4" /> Eliminar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  {/* Acciones desktop */}
                  <div className="hidden lg:flex items-center gap-1">
                    {reservation.status === "booked" || realStatus === "pre_checkin_completed" ? (
                      <button onClick={() => openCheckInModal(reservation)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Check-in">
                        <CheckSquare className="w-5 h-5" />
                      </button>
                    ) : reservation.status === "checked_in" ? (
                      <button onClick={() => openCheckOutModal(reservation)} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg" title="Check-out">
                        <LogOut className="w-5 h-5" />
                      </button>
                    ) : null}
                    <button onClick={() => openPaymentModal(reservation)} className="p-2 text-gray-400 hover:text-[#0F766E] hover:bg-gray-100 rounded-lg" title="Pago">
                      <DollarSign className="w-5 h-5" />
                    </button>
                    <button onClick={() => openWhatsAppModal(reservation)} className="p-2 text-gray-400 hover:text-[#25D366] hover:bg-green-50 rounded-lg" title="WhatsApp">
                      <Send className="w-5 h-5" />
                    </button>
                    <button onClick={() => { setSelectedReservation(reservation); setActiveModal("qr"); }} className="p-2 text-gray-400 hover:text-[#0F766E] hover:bg-gray-100 rounded-lg" title="QR">
                      <QrCode className="w-5 h-5" />
                    </button>
                    <button onClick={() => openEditModal(reservation)} className="p-2 text-gray-400 hover:text-[#0F766E] hover:bg-gray-100 rounded-lg" title="Editar">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={() => { setSelectedReservation(reservation); setActiveModal("delete"); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Info grid - 2 cols en móvil, 5 en desktop */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Código</p>
                    <p className="font-mono font-semibold text-gray-900 text-sm">{reservation.reservation_code || "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Check-in</p>
                    <p className="font-semibold text-gray-900 text-sm">{new Date(reservation.check_in).toLocaleDateString("es-AR")}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Check-out</p>
                    <p className="font-semibold text-gray-900 text-sm">{new Date(reservation.check_out).toLocaleDateString("es-AR")}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Unidad</p>
                    <p className="font-semibold text-gray-900 text-sm truncate">{reservation.unit?.name || "—"}</p>
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <p className="text-gray-500 text-xs">Pago</p>
                    <p className="font-semibold text-gray-900 text-sm">${reservation.paid_amount || 0} / ${reservation.total_amount || 0}</p>
                  </div>
                </div>

                {/* Contacto */}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  {reservation.guest?.email && (
                    <span className="text-gray-600 flex items-center gap-1 text-xs">
                      <Mail className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">{reservation.guest.email}</span>
                    </span>
                  )}
                  {reservation.guest?.phone && (
                    <span className="text-gray-600 flex items-center gap-1 text-xs">
                      <Phone className="w-3 h-3" />
                      {reservation.guest.phone}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ... (todos los modales igual que antes, solo ajustar max-w y padding para móvil) ... */}
    </div>
  );
}