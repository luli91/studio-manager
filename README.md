# PoleKitty - Studio Manager & Portal Web 🐈‍⬛💃

PoleKitty es un sistema integral de gestión y administración de estudios de pole dance y disciplinas afines. Su arquitectura se basa en **tres paneles interconectados** (Administradora, Profesora y Alumna) que trabajan en sincronía para automatizar la facturación, asistencia, liquidación de sueldos y la página web pública del estudio.

---

## 👑 1. Portal Administrador 

El corazón operativo del estudio, diseñado para tener control absoluto sin depender de terceros.

### 📊 Dashboard Estratégico
- **Métricas Generales:** Recaudación mensual en tiempo real y total de alumnas inscriptas en el mes.
- **Radar 48hs:** Monitoreo de próximas reservas y alertas de **cupos liberados** para que el estudio pueda reasignar lugares vacantes de inmediato.
- **Geolocalización Comercial:** Gráfico de zonas de mayor afluencia (barrios con más alumnas) para analizar viabilidad de futuras sucursales.
- **Rendimiento de Clases:** Ranking de las clases más solicitadas y populares para ajustar la oferta de la grilla.

### 👥 Gestión de Alumnas
- **Ficha Personal:** Historial completo de clases tomadas, datos de contacto y emergencias.
- **Carga Manual de Saldos:** Posibilidad de sumar packs de clases manualmente (ideal para pagos en efectivo o transferencias directas).

### 👩‍🏫 Gestión del Staff (Profesoras)
- **Directorio y Asignación:** Asignación de clases a cada integrante del staff.
- **Liquidación de Sueldos:** Visualización del contador de clases dictadas (por semana o mes) para calcular el pago de cada profesora.
- **Gestión de Ausencias:** Si la administradora marca a una profesora como "Ausente" en su clase, dicha clase no se suma a su liquidación mensual.

### 📅 Control de Clases y Eventos
- **Gestión de Grilla:** Edición de clases, listados de asistencia en tiempo real y carga manual de alumnas (override administrativo).
- **Eventos Especiales:** Conversión de clases normales a eventos/workshops. Los eventos pueden configurarse para descontar créditos del pack regular, o cobrarse como entrada aparte (efectivo o Mercado Pago).
- **Devoluciones Inteligentes:** Al eliminar a una alumna de una clase, el sistema pregunta si se desea devolver el crédito a su cuenta o no.

### 💻 CMS (Gestor de Contenidos de la Landing Page)
Edición en vivo de la página web pública:
- **Portada:** Edición de foto de portada.
- **Sobre Mí:** Gestión de la sección "Sobre Mí" (Biografía y foto de la directora).
- **Clases:** Catálogo dinámico de disciplinas y eventos públicos con flyers.
- **Estudio:** Subida y gestión de fotos para mostrar las instalaciones en la galería pública. 
- **Música:** Integración mediante link de Spotify para mostrar la playlist del estudio en la landing.

### 💳 Finanzas y ⚙️ Configuración Global
- **Caja Automática:** Registro de ventas de packs y eventos separados por método de pago (Mercado Pago vs. Efectivo).
- **Reglas del Estudio:** Edición de políticas (Ej: Límite de 5 horas de anticipación para que las alumnas puedan cancelar una clase sin perder el crédito).
- **Precios y Cronograma:** Modificación dinámica del precio de los packs y de la grilla base semanal.

---

## 🧘‍♀️ 2. Portal Alumna (Autogestión)

Panel diseñado para la independencia de las estudiantes y la automatización de ventas.

- **Mis Clases:** Visualización prioritaria de las próximas clases en las que está inscripta.
- **Inscripción y Cancelación:** Reserva de lugares disponibles (si posee saldo) y cancelación autónoma (regida por el límite estricto de horas configurado por la administradora).
- **Mis Pagos (Comprobantes):** Historial transparente de todas las transacciones, detallando la fecha, el pack adquirido y el método de pago utilizado.
- **Eventos:** Sección exclusiva para ver e inscribirse a los próximos workshops (abonando entrada independiente si el evento lo requiere).
- **Perfil:** Edición autónoma de datos de contacto, emergencia y domicilio.

---

## 💃 3. Portal Profesora

Herramienta enfocada en la operatividad diaria de los instructores.

- **Mi Grilla:** Vista rápida de las clases asignadas para el día de hoy y a futuro.
- **Liquidación Personal:** Contador de clases dictadas (semanal/mensual) para transparencia en el cobro de honorarios.
- **Directorio de Alumnas:** Acceso restringido a las fichas de datos de las alumnas para contacto rápido en caso de emergencias durante la clase.
- **Perfil:** Actualización de datos de contacto personales.

---

## 🛠️ Arquitectura y Stack Tecnológico

El proyecto está construido con las últimas herramientas del ecosistema frontend:

- **Framework Core:** Next.js 16 (App Router) + React 19.
- **Estilos & UI:** Tailwind CSS v4, Radix UI, componentes de Shadcn, integrando `tw-animate-css` para animaciones y `lucide-react` para iconografía.
- **Notificaciones:** Sonner (Toasts optimizados).
- **Manejo de Fechas:** Date-fns para cálculos precisos de calendario y límites de horas.
- **Base de Datos & Auth:** Supabase (PostgreSQL), Supabase SSR y Auth Helpers. Protegido mediante **Row Level Security (RLS)** y Middleware perimetral.
- **Almacenamiento:** Supabase Storage para recursos multimedia (fotos del estudio, flyers).
- **Pagos Automáticos:** SDK oficial de Mercado Pago con procesamiento de Webhooks vía Route Handlers.

---

## 💻 Puesta en Marcha (Entorno Local)

1. **Instalación:**
   ```bash
   git clone [https://github.com/tu-usuario/studio-manager.git](https://github.com/luli91/studio-manager.git)
   cd studio-manager
   npm install
Variables de Entorno (.env.local):

Fragmento de código
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://[PROYECTO].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]
MP_ACCESS_TOKEN=[TOKEN_MERCADO_PAGO]
Ejecución:

Bash
npm run dev

Diseñado para mi hermana con ❤️  por Cynthia Medina