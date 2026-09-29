"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  Package,
  DollarSign,
  CheckCircle,
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  description?: string;
  price?: number;
  is_requestable: boolean;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export default function ServicesPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    is_requestable: true,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const { data: tenantData, error: tenantError } = await supabase
          .from("tenants")
          .select("id, name, slug")
          .eq("slug", tenantSlug)
          .single();

        if (tenantError || !tenantData) {
          setError("Alojamiento no encontrado.");
          setLoading(false);
          return;
        }

        setTenant(tenantData);

        const { data: servicesData, error: servicesError } = await supabase
          .from("services")
          .select("*")
          .eq("tenant_id", tenantData.id)
          .order("created_at", { ascending: false });

        if (servicesError) {
          setError("Error al cargar servicios.");
        } else {
          setServices(servicesData || []);
        }
      } catch (err: any) {
        setError("Error: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [tenantSlug]);

  const handleCreateOrUpdate = async () => {
    if (!formData.name.trim()) {
      alert("El nombre es obligatorio.");
      return;
    }

    setActionLoading(true);
    try {
      if (editingService) {
        const { error } = await supabase
          .from("services")
          .update({
            name: formData.name,
            description: formData.description || null,
            price: formData.price ? parseFloat(formData.price) : null,
            is_requestable: formData.is_requestable,
          })
          .eq("id", editingService.id);

        if (error) throw error;

        setServices(services.map(s => s.id === editingService.id ? {
          ...s,
          name: formData.name,
          description: formData.description,
          price: formData.price ? parseFloat(formData.price) : null,
          is_requestable: formData.is_requestable,
        } : s));
      } else {
        const { data: newService, error } = await supabase
          .from("services")
          .insert({
            tenant_id: tenant!.id,
            name: formData.name,
            description: formData.description || null,
            price: formData.price ? parseFloat(formData.price) : null,
            is_requestable: formData.is_requestable,
          })
          .select()
          .single();

        if (error) throw error;

        setServices([newService, ...services]);
      }

      setShowModal(false);
      setEditingService(null);
      setFormData({ name: "", description: "", price: "", is_requestable: true });
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (service: Service) => {
    if (!confirm(`¿Eliminar el servicio "${service.name}"?`)) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", service.id);

      if (error) throw error;

      setServices(services.filter(s => s.id !== service.id));
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      price: service.price?.toString() || "",
      is_requestable: service.is_requestable,
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingService(null);
    setFormData({ name: "", description: "", price: "", is_requestable: true });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F766E]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Servicios</h1>
          <p className="text-gray-500 mt-1">
            {services.length} {services.length === 1 ? "servicio" : "servicios"}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-medium hover:bg-[#0F766E]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo servicio
        </button>
      </div>

      {services.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No hay servicios</h3>
          <p className="text-gray-600 mb-6">Agregá servicios adicionales para ofrecer a tus huéspedes.</p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F766E] text-white rounded-lg font-semibold hover:bg-[#0F766E]/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Agregar servicio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div key={service.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">{service.name}</h3>
                  {service.description && (
                    <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => openEditModal(service)}
                    className="p-2 text-gray-400 hover:text-[#0F766E] hover:bg-gray-100 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(service)}
                    disabled={actionLoading}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                {service.price ? (
                  <p className="text-lg font-bold text-[#0F766E]">${service.price.toLocaleString("es-AR")}</p>
                ) : (
                  <p className="text-sm text-gray-500">Precio a consultar</p>
                )}
                {service.is_requestable && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Solicitable
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Agregar/Editar Servicio */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingService ? "Editar servicio" : "Nuevo servicio"}
              </h2>
              <button onClick={() => { setShowModal(false); setEditingService(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  placeholder="Ej: Desayuno en Cabaña"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  placeholder="Descripción del servicio..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Precio (opcional)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  placeholder="0"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_requestable"
                  checked={formData.is_requestable}
                  onChange={(e) => setFormData({ ...formData, is_requestable: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="is_requestable" className="text-sm text-gray-700">
                  Los huéspedes pueden solicitar este servicio
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => { setShowModal(false); setEditingService(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateOrUpdate}
                disabled={actionLoading}
                className="px-4 py-2 bg-[#0F766E] text-white rounded-lg text-sm font-medium hover:bg-[#0F766E]/90 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {editingService ? "Guardar cambios" : "Crear servicio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 