"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Type,
  MapPin,
  Star,
  Settings,
  X,
  GripVertical,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LandingConfigPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const [tenantId, setTenantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");
  const supabase = createClient();

  const [config, setConfig] = useState({
    heroTitle: "",
    heroSubtitle: "",
    heroPhotos: [] as { url: string; order: number }[],
    aboutText: "",
    services: [] as { name: string; description: string; icon: string }[],
    amenities: [] as { name: string }[],
    gallery: [] as { url: string; caption: string }[],
    policies: {
      checkIn: "",
      checkOut: "",
      cancellation: "",
      children: "",
      pets: "",
      smoking: "",
    },
    nearbyPlaces: [] as { name: string; description: string; distance: string }[],
    ctaText: "Reservar ahora",
    ctaSubtext: "",
  });

  useEffect(() => {
    async function init() {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id, settings, name")
        .eq("slug", tenantSlug)
        .single();

      if (tenant) {
        setTenantId(tenant.id);
        const settings = tenant.settings || {};
        const landing = settings.landing || {};
        setConfig({
          heroTitle: landing.heroTitle || tenant.name || "",
          heroSubtitle: landing.heroSubtitle || tenant.description || "",
          heroPhotos: landing.heroPhotos || [],
          aboutText: landing.aboutText || "",
          services: landing.services || [],
          amenities: landing.amenities || [],
          gallery: landing.gallery || [],
          policies: landing.policies || {
            checkIn: "",
            checkOut: "",
            cancellation: "",
            children: "",
            pets: "",
            smoking: "",
          },
          nearbyPlaces: landing.nearbyPlaces || [],
          ctaText: landing.ctaText || "Reservar ahora",
          ctaSubtext: landing.ctaSubtext || "",
        });
      }
      setLoading(false);
    }
    init();
  }, [tenantSlug]);

  async function handleSave() {
    setSaving(true);
    try {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("settings")
        .eq("id", tenantId)
        .single();

      const currentSettings = tenant?.settings || {};
      const newSettings = {
        ...currentSettings,
        landing: config,
      };

      const { error } = await supabase
        .from("tenants")
        .update({ settings: newSettings })
        .eq("id", tenantId);

      if (error) throw error;
      alert("✅ Configuración guardada correctamente");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>, field: "heroPhotos" | "gallery") {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${tenantId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("unit-photos")
        .upload(fileName, file);

      if (uploadError) {
        alert("Error subiendo: " + uploadError.message);
        continue;
      }

      const { data } = supabase.storage.from("unit-photos").getPublicUrl(fileName);

      if (field === "heroPhotos") {
        setConfig({
          ...config,
          heroPhotos: [
            ...config.heroPhotos,
            { url: data.publicUrl, order: config.heroPhotos.length },
          ],
        });
      } else {
        setConfig({
          ...config,
          gallery: [
            ...config.gallery,
            { url: data.publicUrl, caption: "" },
          ],
        });
      }
    }

    if (e.target) e.target.value = "";
  }

  const tabs = [
    { id: "hero", label: "Hero", icon: ImageIcon },
    { id: "about", label: "Sobre nosotros", icon: Type },
    { id: "services", label: "Servicios", icon: Star },
    { id: "amenities", label: "Comodidades", icon: Settings },
    { id: "gallery", label: "Galería", icon: ImageIcon },
    { id: "policies", label: "Políticas", icon: Type },
    { id: "nearby", label: "Alrededores", icon: MapPin },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F766E]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración de la Landing</h1>
          <p className="text-gray-500 mt-1">Personalizá cómo se ve tu página pública</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`https://miestadia.online/${tenantSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Ver mi sitio web
          </a>
          <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar cambios
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#0F766E] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* HERO TAB */}
      {activeTab === "hero" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Sección Hero (parte superior)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título principal</label>
              <Input
                value={config.heroTitle}
                onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })}
                placeholder="Ej: Centro El Progreso"
              />
              <p className="text-xs text-gray-500 mt-1">Aparece grande en la parte superior de la landing</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subtítulo</label>
              <Input
                value={config.heroSubtitle}
                onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
                placeholder="Ej: Tu refugio en la montaña"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Texto del botón CTA</label>
              <Input
                value={config.ctaText}
                onChange={(e) => setConfig({ ...config, ctaText: e.target.value })}
                placeholder="Reservar ahora"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Texto debajo del botón (opcional)</label>
              <Input
                value={config.ctaSubtext}
                onChange={(e) => setConfig({ ...config, ctaSubtext: e.target.value })}
                placeholder="Ej: Confirmación en 24hs"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fotos del hero (carrusel)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                {config.heroPhotos.map((photo, idx) => (
                  <div key={idx} className="relative group">
                    <img src={photo.url} alt="" className="w-full h-32 object-cover rounded-lg border" />
                    <button
                      onClick={() =>
                        setConfig({
                          ...config,
                          heroPhotos: config.heroPhotos.filter((_, i) => i !== idx),
                        })
                      }
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F766E] text-white rounded-lg cursor-pointer hover:bg-[#0F766E]/90">
                <Upload className="w-4 h-4" />
                Subir fotos del hero
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handlePhotoUpload(e, "heroPhotos")}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">Subí varias fotos. Se mostrarán en carrusel automático.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ABOUT TAB */}
      {activeTab === "about" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="w-5 h-5" />
              Sobre el alojamiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descripción / Historia</label>
            <textarea
              value={config.aboutText}
              onChange={(e) => setConfig({ ...config, aboutText: e.target.value })}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              placeholder="Contá la historia de tu alojamiento, qué lo hace especial, etc."
            />
            <p className="text-xs text-gray-500 mt-1">Aparece en una sección dedicada de la landing</p>
          </CardContent>
        </Card>
      )}

      {/* SERVICES TAB */}
      {activeTab === "services" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Servicios destacados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {config.services.map((service, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <GripVertical className="w-5 h-5 text-gray-400 mt-2" />
                    <div className="flex-1 space-y-2">
                      <Input
                        value={service.name}
                        onChange={(e) => {
                          const newServices = [...config.services];
                          newServices[idx].name = e.target.value;
                          setConfig({ ...config, services: newServices });
                        }}
                        placeholder="Nombre del servicio"
                      />
                      <Input
                        value={service.description}
                        onChange={(e) => {
                          const newServices = [...config.services];
                          newServices[idx].description = e.target.value;
                          setConfig({ ...config, services: newServices });
                        }}
                        placeholder="Descripción breve"
                      />
                      <Input
                        value={service.icon}
                        onChange={(e) => {
                          const newServices = [...config.services];
                          newServices[idx].icon = e.target.value;
                          setConfig({ ...config, services: newServices });
                        }}
                        placeholder="Ícono (emoji o nombre)"
                      />
                    </div>
                    <button
                      onClick={() =>
                        setConfig({
                          ...config,
                          services: config.services.filter((_, i) => i !== idx),
                        })
                      }
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() =>
                setConfig({
                  ...config,
                  services: [...config.services, { name: "", description: "", icon: "⭐" }],
                })
              }
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar servicio
            </Button>
          </CardContent>
        </Card>
      )}

      {/* AMENITIES TAB */}
      {activeTab === "amenities" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Comodidades incluidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {config.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={amenity.name}
                    onChange={(e) => {
                      const newAmenities = [...config.amenities];
                      newAmenities[idx].name = e.target.value;
                      setConfig({ ...config, amenities: newAmenities });
                    }}
                    placeholder="Ej: Wi-Fi"
                  />
                  <button
                    onClick={() =>
                      setConfig({
                        ...config,
                        amenities: config.amenities.filter((_, i) => i !== idx),
                      })
                    }
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => setConfig({ ...config, amenities: [...config.amenities, { name: "" }] })}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar comodidad
            </Button>
          </CardContent>
        </Card>
      )}

      {/* GALLERY TAB */}
      {activeTab === "gallery" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Galería de fotos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {config.gallery.map((photo, idx) => (
                <div key={idx} className="relative group">
                  <img src={photo.url} alt="" className="w-full h-40 object-cover rounded-lg border" />
                  <Input
                    value={photo.caption}
                    onChange={(e) => {
                      const newGallery = [...config.gallery];
                      newGallery[idx].caption = e.target.value;
                      setConfig({ ...config, gallery: newGallery });
                    }}
                    placeholder="Descripción"
                    className="mt-2 text-sm"
                  />
                  <button
                    onClick={() =>
                      setConfig({
                        ...config,
                        gallery: config.gallery.filter((_, i) => i !== idx),
                      })
                    }
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F766E] text-white rounded-lg cursor-pointer hover:bg-[#0F766E]/90">
              <Upload className="w-4 h-4" />
              Subir fotos a la galería
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handlePhotoUpload(e, "gallery")}
                className="hidden"
              />
            </label>
          </CardContent>
        </Card>
      )}

      {/* POLICIES TAB */}
      {activeTab === "policies" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="w-5 h-5" />
              Políticas del alojamiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "checkIn", label: "Check-in" },
              { key: "checkOut", label: "Check-out" },
              { key: "cancellation", label: "Política de cancelación" },
              { key: "children", label: "Niños" },
              { key: "pets", label: "Mascotas" },
              { key: "smoking", label: "Fumar" },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                <textarea
                  value={(config.policies as any)[field.key]}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      policies: { ...config.policies, [field.key]: e.target.value },
                    })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                  placeholder={`Información sobre ${field.label.toLowerCase()}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* NEARBY TAB */}
      {activeTab === "nearby" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Lugares cercanos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {config.nearbyPlaces.map((place, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={place.name}
                        onChange={(e) => {
                          const newPlaces = [...config.nearbyPlaces];
                          newPlaces[idx].name = e.target.value;
                          setConfig({ ...config, nearbyPlaces: newPlaces });
                        }}
                        placeholder="Nombre del lugar"
                      />
                      <Input
                        value={place.description}
                        onChange={(e) => {
                          const newPlaces = [...config.nearbyPlaces];
                          newPlaces[idx].description = e.target.value;
                          setConfig({ ...config, nearbyPlaces: newPlaces });
                        }}
                        placeholder="Descripción"
                      />
                      <Input
                        value={place.distance}
                        onChange={(e) => {
                          const newPlaces = [...config.nearbyPlaces];
                          newPlaces[idx].distance = e.target.value;
                          setConfig({ ...config, nearbyPlaces: newPlaces });
                        }}
                        placeholder="Distancia (Ej: 500m, 2km)"
                      />
                    </div>
                    <button
                      onClick={() =>
                        setConfig({
                          ...config,
                          nearbyPlaces: config.nearbyPlaces.filter((_, i) => i !== idx),
                        })
                      }
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() =>
                setConfig({
                  ...config,
                  nearbyPlaces: [...config.nearbyPlaces, { name: "", description: "", distance: "" }],
                })
              }
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar lugar cercano
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Botón guardar flotante */}
      <div className="fixed bottom-6 right-6">
        <Button onClick={handleSave} disabled={saving} className="shadow-lg flex items-center gap-2 px-6 py-3">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}