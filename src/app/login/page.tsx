"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Building2,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

type View = "login" | "register" | "forgot" | "success";

export default function LoginPage() {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Buscar tenant por owner_email
        const { data: tenant } = await supabase
          .from("tenants")
          .select("slug")
          .eq("owner_email", email)
          .single();

        if (tenant?.slug) {
          router.push(`/${tenant.slug}/admin/dashboard`);
        } else {
          // Buscar por tenant_users
          const { data: tenantUser } = await supabase
            .from("tenant_users")
            .select("tenants(slug)")
            .eq("user_id", authData.user.id)
            .single();

          if (tenantUser?.tenants?.slug) {
            router.push(`/${tenantUser.tenants.slug}/admin/dashboard`);
          } else {
            setError("No se encontró un panel asociado a esta cuenta. Contactá soporte.");
            setLoading(false);
          }
        }
      }
    } catch (err: any) {
      setError("Error inesperado: " + err.message);
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            property_name: propertyName,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError("No se pudo crear el usuario. Verificá tu email.");
        setLoading(false);
        return;
      }

      // 2. Generar slug único
      const baseSlug = propertyName
        ?.toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "") || "mi-propiedad";
      
      let slug = baseSlug;
      let counter = 1;

      while (true) {
        const { data: existingSlug } = await supabase
          .from("tenants")
          .select("id")
          .eq("slug", slug)
          .single();

        if (!existingSlug) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // 3. Calcular fecha de fin de trial (30 días)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 30);

      // 4. Crear tenant (SIN owner_id - usamos owner_email y owner_name)
      const { data: newTenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name: propertyName || "Mi Propiedad",
          slug: slug,
          owner_email: email,
          owner_name: fullName,
          subscription_status: "trial",
          trial_ends_at: trialEndsAt.toISOString(),
          settings: {
            currency: "USD",
            timezone: "America/Argentina/Buenos_Aires",
            language: "es",
            checkInTime: "15:00",
            checkOutTime: "10:00",
          },
          branding: {
            primaryColor: "#0F766E",
            secondaryColor: "#EA580C",
          },
          auto_email_enabled: true,
          pre_checkin_days: 2,
          post_checkout_days: 1,
        })
        .select()
        .single();

      if (tenantError) {
        console.error("Error creando tenant:", tenantError);
        setError("Error al crear tu propiedad: " + tenantError.message);
        setLoading(false);
        return;
      }

      // 5. Crear relación en tenant_users
      if (newTenant?.id) {
        await supabase
          .from("tenant_users")
          .insert({
            user_id: authData.user.id,
            tenant_id: newTenant.id,
            role: "owner",
          });
      }

      // 6. Éxito
      setSuccessMessage(
        "¡Cuenta creada exitosamente! Revisá tu email para verificar tu cuenta. Luego podrás ingresar."
      );
      setView("success");
      setLoading(false);
    } catch (err: any) {
      console.error("Error en registro:", err);
      setError("Error inesperado: " + err.message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setSuccessMessage("Email de recuperación enviado. Revisá tu bandeja de entrada.");
        setView("success");
        setLoading(false);
      }
    } catch (err: any) {
      setError("Error inesperado: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F766E] via-[#166534] to-[#0F766E] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-5xl grid md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-[#0F766E] to-[#166534] text-white">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold">Mi Estadía</span>
            </div>
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Tu alojamiento,
              <br />
              más cerca.
            </h1>
            <p className="text-lg text-white/90 mb-8 leading-relaxed">
              La plataforma todo-en-uno para gestionar reservas, check-ins,
              pagos y ofrecer una experiencia premium a tus huéspedes.
            </p>
            <div className="space-y-4">
              {[
                "Gestión completa de reservas",
                "Check-in digital automático",
                "Panel premium para huéspedes",
                "Mensajería WhatsApp integrada",
                "Reportes y análisis en tiempo real",
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />
                  <span className="text-white/90">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/20">
            <p className="text-sm text-white/70">© 2026 Mi Estadía. Todos los derechos reservados.</p>
          </div>
        </div>

        <div className="p-8 md:p-12 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {view === "login" && (
              <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="md:hidden text-center mb-8">
                  <div className="inline-flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-[#0F766E] rounded-xl flex items-center justify-center">
                      <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">Mi Estadía</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Bienvenido!</h2>
                  <p className="text-gray-600">Ingresá a tu panel de administración</p>
                </div>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </motion.div>
                )}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="tu@email.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="••••••••" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                      <span className="text-sm text-gray-600">Recordarme</span>
                    </label>
                    <button type="button" onClick={() => setView("forgot")} className="text-sm text-[#0F766E] hover:text-[#0F766E]/80 font-medium">¿Olvidaste tu contraseña?</button>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-[#0F766E] text-white py-3 rounded-lg font-semibold hover:bg-[#0F766E]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Ingresar</span><ArrowRight className="w-5 h-5" /></>}
                  </button>
                </form>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                  <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-500">¿Nuevo en Mi Estadía?</span></div>
                </div>
                <button onClick={() => setView("register")} className="w-full border-2 border-[#0F766E] text-[#0F766E] py-3 rounded-lg font-semibold hover:bg-[#0F766E]/5 transition-colors">Crear cuenta gratis</button>
                <p className="text-xs text-center text-gray-500">30 días de prueba gratis • Sin tarjeta de crédito</p>
              </motion.div>
            )}

            {view === "register" && (
              <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Crear cuenta</h2>
                  <p className="text-gray-600">Comenzá tu prueba gratis de 30 días</p>
                </div>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </motion.div>
                )}
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="Juan Pérez" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de tu propiedad</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="text" value={propertyName} onChange={(e) => setPropertyName(e.target.value)} required className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="Cabañas del Bosque" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="tu@email.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="Mínimo 6 caracteres" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-[#0F766E] text-white py-3 rounded-lg font-semibold hover:bg-[#0F766E]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Crear cuenta</span><ArrowRight className="w-5 h-5" /></>}
                  </button>
                </form>
                <button onClick={() => setView("login")} className="w-full text-center text-sm text-gray-600 hover:text-[#0F766E]">¿Ya tenés cuenta? Ingresá aquí</button>
              </motion.div>
            )}

            {view === "forgot" && (
              <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Recuperar contraseña</h2>
                  <p className="text-gray-600">Te enviaremos un link para restablecer tu contraseña</p>
                </div>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </motion.div>
                )}
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F766E]" placeholder="tu@email.com" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-[#0F766E] text-white py-3 rounded-lg font-semibold hover:bg-[#0F766E]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Enviar link de recuperación</span><ArrowRight className="w-5 h-5" /></>}
                  </button>
                </form>
                <button onClick={() => setView("login")} className="w-full text-center text-sm text-gray-600 hover:text-[#0F766E]">Volver al login</button>
              </motion.div>
            )}

            {view === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Listo!</h2>
                  <p className="text-gray-600">{successMessage}</p>
                </div>
                <button onClick={() => setView("login")} className="bg-[#0F766E] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#0F766E]/90 transition-colors">Volver al login</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}