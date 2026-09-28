# 🏠 Mi Estadía - Masterplan del Proyecto

**Slogan:** *Tu alojamiento, más cerca*  
**Desarrollado por:** [buenpuerto.online](https://buenpuerto.online)  
**Versión:** 1.0  
**Última actualización:** Septiembre 2026

---

## 📖 Resumen Ejecutivo

**Mi Estadía** es una plataforma SaaS multi-tenant diseñada para propietarios de alojamientos turísticos (cabañas, departamentos, hostales, posadas) que buscan profesionalizar la gestión de sus reservas y ofrecer una experiencia premium a sus huéspedes.

El sistema reemplaza el caos de WhatsApp + planillas + mensajes manuales por una plataforma centralizada que automatiza el flujo completo: desde la reserva hasta el post check-out.

---

## 🎯 Propuesta de Valor

### Para el dueño del alojamiento:
- ✅ **Centralización total**: Reservas, huéspedes, pagos, mensajes y operaciones en un solo lugar
- ✅ **Ahorro de tiempo**: Automatización de mensajes, check-ins y recordatorios
- ✅ **Imagen profesional**: Panel del huésped personalizado con tu marca
- ✅ **Control operativo**: Check-in/check-out con registro de historial
- ✅ **Gestión de pagos**: Seguimiento de saldos, señas y pagos parciales
- ✅ **Multi-propiedad**: Gestioná varios alojamientos desde una sola cuenta

### Para el huésped:
- ✅ **Experiencia premium**: Panel personalizado con toda la info de su estadía
- ✅ **Pre-checkin digital**: Completar datos antes de llegar
- ✅ **Info útil a un clic**: Wi-Fi, ubicación, inventario, clima, lugares recomendados
- ✅ **Comunicación directa**: WhatsApp integrado con el anfitrión
- ✅ **Guías personalizadas**: Recomendaciones del anfitrión sobre la zona

---

## 🏗️ Arquitectura Técnica

- **Frontend:** Next.js 16 (App Router) + React + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Deploy:** Vercel / Netlify
- **Multi-tenant:** Aislamiento por `tenant_id` + Row Level Security
- **APIs externas:** Open-Meteo (clima), BigDataCloud (geocoding), WhatsApp API

---

## 📦 Módulos Implementados

### 1. 🔐 Autenticación Multi-Rol
- Login de admin (dueño del alojamiento)
- Login de huésped (código de reserva + apellido)
- Sistema de tenants con slugs únicos
- Sesiones seguras con expiración

### 2. 📅 Gestión de Reservas
- Alta manual, importación CSV y parser de texto (WhatsApp/email)
- Estados: `booked` → `pre_checkin` → `checked_in` → `checked_out` / `cancelled`
- Filtros avanzados (fecha, estado, unidad, búsqueda)
- Dashboard con estadísticas (llegadas hoy, próximas, pre-checkin, total)

### 3. ✅ Check-in / Check-out Operativo
- Modal con campos opcionales (quién atendió, observaciones, estado de unidad)
- Registro de entrega/devolución de llaves
- Configuración: manual u automático (por fecha)
- Historial completo de operaciones (`checkin_logs`)

### 4. 💰 Gestión de Pagos
- Monto total, pagado y saldo pendiente
- Estados: `pending`, `partial`, `paid`
- Medios de pago: Efectivo, Transferencia, Tarjeta, Mercado Pago
- Registro de pagos parciales en cada check-in/out
- Barra visual tipo batería para el huésped

### 5. 📱 Mensajería WhatsApp
- 5 plantillas pre-configuradas (confirmación, recordatorio, durante estadía, gracias, reseña)
- Links directos al panel del huésped con código y apellido precargados
- Envío individual y masivo (planificado)
- Configuración: automático (4 días antes) o manual

### 6. 🏠 Gestión de Unidades
- Alta/edición de unidades (cabañas, departamentos, habitaciones)
- Tipos, capacidad, descripción, estado (activa/inactiva/mantenimiento)
- **Inventario por unidad**: categorías personalizables (ropa de cama, cocina, baño, custom)

### 7. 👥 Gestión de Huéspedes
- Datos de contacto, historial de reservas
- Pre-checkin digital con formulario personalizado
- Estados de completitud

### 8. ⚙️ Configuración Extendida del Tenant
- Logo, colores de marca (personalización visual)
- Datos de contacto (email, teléfono, WhatsApp)
- Google Maps (URL + coordenadas auto-extraídas)
- Redes Wi-Fi (múltiples)
- Horarios de check-in/check-out
- Instrucciones de llegada (pasos, estacionamiento, código de acceso)
- Instrucciones de check-out (pasos, dónde dejar llaves)
- Contactos de emergencia
- Link de reseña en Google
- Notas internas

### 9. 🌤️ Clima en Tiempo Real
- Pronóstico para el rango de estadía del huésped
- Ubicación automática (ciudad, región, país) vía reverse geocoding
- Iconos, temperaturas máx/mín, probabilidad de lluvia
- API gratuita Open-Meteo (sin API key)

### 10. 🗺️ Mapa Embebido
- Google Maps embebido en el panel del huésped
- Extracción automática de coordenadas desde URL
- Link directo a Google Maps

### 11. 📍 Guía del Destino
- Lugares recomendados por categoría (restaurante, actividad, punto de interés, compras, café, playa)
- Desplegable interactivo con detalles completos
- Imagen, descripción, dirección, horarios, teléfono, sitio web, tips del anfitrión
- Link a Google Maps de cada lugar

### 12. 📄 Guía del Alojamiento
- Contenido editable por el admin (normas, servicios, info útil)
- Acceso desde el panel del huésped

### 13. 🎨 Branding y White-label
- Logo personalizado por tenant
- Colores de marca configurables
- Dominio personalizado (planificado)

### 14. 🔒 Seguridad
- Row Level Security en todas las tablas
- Aislamiento total entre tenants
- Sesiones con expiración
- Validación de datos en frontend y backend

---

---

##  Roadmap - Próximas Fases

### Fase 5: Mensajería Automática Avanzada
- [ ] Toggle en configuración (automático/manual)
- [ ] Envío automático 4 días antes del check-in
- [ ] Tilde visual en lista de reservas (enviado/no enviado)
- [ ] Envío masivo con checkbox + filtros
- [ ] Personalización automática (nombre, fechas, link)
- [ ] Mensaje post-estadía automático

### Fase 6: Reportes y Analytics
- [ ] Dashboard de ingresos (mensual/anual)
- [ ] Tasa de ocupación por unidad
- [ ] Huéspedes recurrentes
- [ ] Gráficos con Recharts
- [ ] Exportación de reportes (PDF/Excel)

### Fase 7: Integraciones
- [ ] Calendarios externos (Google Calendar, Airbnb, Booking)
- [ ] Sincronización bidireccional de reservas
- [ ] Pasarelas de pago (Mercado Pago, Stripe)
- [ ] Email transaccional (Resend/SendGrid)

### Fase 8: Mobile App
- [ ] PWA para huéspedes
- [ ] App nativa para admins (React Native)
- [ ] Notificaciones push

### Fase 9: IA y Automatización
- [ ] Chatbot de atención al huésped
- [ ] Sugerencias de precios dinámicos
- [ ] Detección automática de duplicados en reservas
- [ ] Análisis de sentimiento en reseñas

### Fase 10: Escalabilidad
- [ ] Dominios personalizados por tenant
- [ ] Multi-idioma (ES/EN/PT)
- [ ] Multi-moneda
- [ ] API pública para integraciones

---

## 💼 Modelo de Negocio (Sugerido para Landing Page)

### Planes:

| Plan | Precio/mes | Unidades | Features |
|------|-----------|----------|----------|
| **Starter** | $9.990 ARS | 1-3 | Reservas, huéspedes, WhatsApp básico |
| **Professional** | $19.990 ARS | 4-10 | Todo lo anterior + pagos, inventario, guías, clima |
| **Business** | $34.990 ARS | 11-25 | Todo lo anterior + reportes, multi-usuario, API |
| **Enterprise** | A medida | Ilimitadas | Todo + dominios custom, soporte prioritario, SLA |

### Diferenciadores clave vs competencia:
1. **Panel del huésped premium** (la mayoría solo tiene panel admin)
2. **Check-in operativo con historial** (no solo cambio de estado)
3. **Gestión de pagos integrada** (no requiere software externo)
4. **Mensajería con links personalizados** (el huésped llega con todo precargado)
5. **Guía del destino interactiva** (valor agregado para el huésped)
6. **Clima en tiempo real** (detalle que marca la diferencia)
7. **Multi-tenant real** (un solo sistema, muchos alojamientos)

---

## 🎨 Identidad Visual

- **Colores primarios:** Verde teal (#0F766E), verde oscuro (#166534)
- **Colores secundarios:** Ámbar (#F59E0B), naranja (#EA580C)
- **Tipografía:** Geist Sans + Geist Mono
- **Logo:** Mi Estadía (pin de mapa con casa, montañas y sol)
- **Estilo:** Moderno, limpio, profesional, cálido

---

## 📊 Métricas de Éxito (KPIs)

- Tiempo promedio de creación de reserva: < 2 minutos
- Tasa de completitud de pre-checkin: > 80%
- Reducción de mensajes manuales: > 60%
- Satisfacción del huésped (NPS): > 70
- Churn rate mensual: < 5%

---

## 🛡️ Seguridad y Compliance

- Datos aislados por tenant (RLS en todas las tablas)
- Contraseñas hasheadas (Supabase Auth)
- Sesiones con expiración automática
- Backups automáticos diarios
- Logs de auditoría (checkin_logs)
- Cumplimiento LGPD/GDPR (datos personales de huéspedes)

---

##  Stack de Partners

- **Hosting:** Vercel / Supabase
- **Base de datos:** PostgreSQL (Supabase)
- **Clima:** Open-Meteo (gratuito)
- **Geocoding:** BigDataCloud (gratuito)
- **Maps:** Google Maps Embed
- **Pagos:** Mercado Pago / Stripe (planificado)
- **Email:** Resend / SendGrid (planificado)
- **Desarrollado por:** [buenpuerto.online](https://buenpuerto.online)

---

## 📞 Contacto Comercial

- **Web:** [buenpuerto.online](https://buenpuerto.online)
- **Email:** hola@buenpuerto.online
- **WhatsApp:** +54 9 11 XXXX-XXXX

---

*© 2026 Mi Estadía. Todos los derechos reservados.*  
*Desarrollado con ❤️ por buenpuerto.online*
