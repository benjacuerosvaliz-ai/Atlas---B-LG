BØLG Atlas — Handoff a Claude Code
Este documento es la guía para construir BØLG Atlas con Claude Code. Léelo completo antes de empezar a escribir código. El concepto estratégico completo está en BOLG_ATLAS_concepto.md — siempre referénciate ahí para decisiones de UX, branding, tono.


CONTEXTO INMEDIATO
Eres Claude Code trabajando con Benja (founder de BØLG Concept, marca lifestyle premium chilena de mochilas/botellas/accesorios outdoor). Vamos a construir BØLG Atlas: una plataforma web donde cada producto BØLG tiene perfil propio con kilómetros acumulados, historial de viajes y dueños sucesivos, y donde la comunidad sube aventuras que pintan un globo terráqueo 3D en vivo.

Es una mezcla de Strava + Spotify Wrapped + Patagonia journal + Apple Health, aplicado a productos outdoor.

Lee BOLG_ATLAS_concepto.md antes de hacer cualquier cosa. Ese documento tiene todo: schema de DB, stack, roadmap, UX, diseño, gamificación. No re-pienses esas decisiones — están tomadas. Tu trabajo es ejecutar.


STACK NO NEGOCIABLE
No exploremos alternativas en cada sesión. Estas son las decisiones tomadas:

	•	Frontend: Next.js 14 App Router · TypeScript estricto · Tailwind CSS · shadcn/ui · Framer Motion
	•	Globo 3D: Three.js + react-three-fiber + drei
	•	Mapas 2D: Mapbox GL JS (custom dark style)
	•	Backend/DB/Auth/Storage: Supabase (Postgres + Auth + Storage + Realtime + Edge Functions)
	•	Geo: PostGIS extension habilitada
	•	Imágenes: Cloudinary para transforms responsive
	•	Email transaccional: Resend (react-email templates)
	•	Analytics: PostHog
	•	Hosting: Vercel (frontend) + Supabase Cloud (DB)
	•	Pagos (cuando aplique): Stripe + Mercado Pago para Chile

Si una librería no está en esta lista y la necesitas, propón antes de instalar.


ESTILO DE TRABAJO
	•	Sesiones de scope limitado. Cada sesión termina con algo funcional y comiteado. No me dejes con 14 archivos a medio escribir.
	•	Comitea seguido. Mensajes descriptivos en inglés (convención Conventional Commits: feat:, fix:, chore:).
	•	Si una decisión es ambigua → pregúntame. No improvises lógica de negocio sin avisar.
	•	TypeScript estricto. Nada de any sin razón documentada.
	•	Server Components por default. Client Components solo donde haya estado/interactividad.
	•	Diseño tokens centralizados. Crea un archivo lib/tokens.ts con todos los HEX de la paleta BØLG (ink, bone, fog, mist, ember, aurora, blood — ver concepto §4).
	•	Mobile-first. Cada componente prueba primero en 375px de ancho.
	•	Animaciones con propósito. Cualquier motion debe tener duration ≤400ms y easing definido (no tween default).
	•	Accesibilidad básica. Alt text en imágenes, focus rings, semántica correcta.


ROADMAP DE SESIONES
Sesión 1 — Scaffold + diseño base (3-4h)
Objetivo: que npm run dev muestre el home con globo girando, sin backend.

Tareas:

	•	npx create-next-app@latest bolg-atlas --typescript --tailwind --app --src-dir
	•	Instalar deps: framer-motion three @react-three/fiber @react-three/drei lucide-react clsx tailwind-merge
	•	Configurar shadcn/ui: npx shadcn@latest init (tema neutral, gris-stone base)
	•	Crear src/lib/tokens.ts con paleta BØLG.
	•	Crear src/components/globe/Globe.tsx (Three.js, react-three-fiber): esfera con textura earth dark, atmósfera halo, rotación lenta automática, control de drag con damping.
	•	Earth texture: usa la de threejs.org/examples/textures/planets/earth_atmos_2048.jpg o equivalente CC-licensed
	•	Tamaño: full-width container, viewport height: min(80vh, 700px)
	•	Crear src/app/page.tsx — home con:
	•	Navbar minimalista (logo BØLG · "Atlas" · "Ingresar")
	•	Hero: globo a la izquierda, copy a la derecha (Las olas no se quedan quietas. / La bitácora de todas las BØLG del mundo.)
	•	KPI strip (números hardcoded por ahora): 12.483.927 km · 47.318 trips · 89 países
	•	CTA: "Próximamente · únete a la lista" → email capture (todavía sin backend, solo UI)
	•	Setup tipografía: Inter Tight (display) + Inter (body) + JetBrains Mono. Via next/font/google.
	•	Commit + push a un repo GitHub nuevo.
	•	Deploy a Vercel (Benja conecta el repo desde dashboard.vercel.com).

Output: URL pública con globo girando. Suficiente para hacer screenshot teaser y mandar a Instagram.


Sesión 2 — Supabase + Auth + schema (3-4h)
	•	Crear proyecto Supabase (Benja lo hace en supabase.com).
	•	Habilitar extensiones: postgis, uuid-ossp.
	•	Crear supabase/migrations/0001_initial_schema.sql con TODAS las tablas del documento §9 (users, product_models, products, product_owners, trips, trip_products, trip_photos, badges, user_badges, follows, likes, comments, expeditions, expedition_participants).
	•	Crear índices recomendados (§9 final).
	•	Crear Row Level Security (RLS) policies para cada tabla. Default: users solo pueden modificar su propia data; trips públicos visibles para todos; productos públicos.
	•	Seed inicial: insertar product_models con los 8-10 modelos top de BØLG (sacarlos del dashboard actual de Benja).
	•	Configurar Supabase Auth: magic link via email (Resend).
	•	Wire up Auth en Next.js: @supabase/ssr package, middleware, server actions de signin/signout.
	•	Crear /login y /dashboard (placeholder protegido).

Output: usuario puede crear cuenta y entrar a /dashboard. La DB está lista para recibir trips.


Sesión 3 — Crear primer trip (4h)
Pantalla más importante del MVP. Si esto no es delicioso de usar, todo se cae.

	•	Página /trip/new con form multi-step:
	•	Step 1: Lugar — input con autocomplete de Mapbox Geocoding API (Benja crea token en mapbox.com).
	•	Step 2: Fechas (start/end) — date picker shadcn/ui.
	•	Step 3: Distancia + tipo de actividad — selector visual (hike, run, bike, drive, fly, ski).
	•	Step 4: Fotos — drag&drop, max 5, sube a Cloudinary (vía API key). Mostrar previews.
	•	Step 5: Productos BØLG — multiselect de productos del usuario (si no tiene ninguno vinculado, mostrar "Vincula tu primer BØLG primero").
	•	Step 6: Preview + submit.
	•	Server action que guarda el trip en trips + relaciones en trip_products + trip_photos.
	•	Cálculo de km: si solo start/end manuales, usa turf.distance() great-circle. Si hay GPS de Strava/manual, usa eso.
	•	Después de submit → redirige a /t/[trip_id] con animación de éxito.

Output: Benja puede subir su primer trip de verdad.


Sesión 4 — Perfil de usuario + globo personal (4h)
	•	Página /u/[username] pública.
	•	Layout:
	•	Hero con cover (la última foto del trip más reciente)
	•	Avatar + nombre + ubicación + nivel BØLG
	•	KPI strip (total km, países, trips, productos)
	•	Mini-globo personal (mismo componente Globe.tsx pero con points filtrados al user)
	•	Tabs: Trips · Productos · Medallas
	•	Grid de TripCards
	•	Trigger en DB que recalcula users.total_km cuando un trip se inserta/actualiza/elimina.
	•	Función edge que calcula users.level basado en total_km (lookup table del concepto §6).

Output: Benja sube 3 trips y ve su perfil cobrar vida.


Sesión 5 — Perfil de producto + Heritage Mode (4h)
LA pantalla diferencial.

	•	Página /p/[product_id] pública.
	•	Hero con producto + foto en uso.
	•	KPIs (km totales, países, dueños, antigüedad).
	•	Timeline vertical de trips del producto.
	•	Globo del producto (solo sus puntos).
	•	Sección "Dueños" con cards.
	•	Botón "Transferir propiedad" (solo dueño actual):
	•	Genera código único.
	•	Email al nuevo dueño con link.
	•	Nuevo dueño activa → product_owners.released_at = now() para dueño viejo, nuevo row con acquired_at = now().
	•	Página /registro-producto para activar QR codes nuevos.

Output: Heritage Mode funciona end-to-end.


Sesión 6 — Globo global con data real + Atlas full-screen (4h)
	•	/atlas full viewport.
	•	Globe.tsx en modo global: fetch todos los trips públicos desde Supabase, plot puntos.
	•	Hover sobre punto → tooltip con foto + usuario + lugar.
	•	Click → side panel slide-in con el trip completo.
	•	HUD lateral con filtros (país, modelo, fecha, tipo).
	•	Toggles de capa: dots / heatmap / routes / photos.
	•	Realtime via Supabase: cuando alguien sube un trip nuevo en el mundo, el globo lo recibe en vivo (suscripción a tabla trips).

Output: el corazón del producto, funcionando.


Sesión 7 — Leaderboards + Badges (3h)
	•	/rankings con tabs (km total, este mes, países visitados, productos legendary).
	•	Materialized views en Postgres refrescadas cada hora con pg_cron.
	•	Sistema de badges: tabla badges seedeada + función que verifica criterios cuando se inserta un trip.
	•	Mostrar badges desbloqueados en perfil de usuario.

Output: capa de competencia funcionando.


Sesión 8 — Social mínimo + Feed (3h)
	•	Follow/unfollow.
	•	Like en trips.
	•	Comments básicos.
	•	/feed con trips de la gente que sigues (default) + tab "Explorar" (público).
	•	Notificaciones email digest semanal (Resend + react-email).

Output: MVP completo.


Sesión 9-10 — Pulido + responsive + landing teaser (4h c/u)
	•	Animaciones finas (Framer Motion).
	•	Mobile depth: cada pantalla revisada en 375/768/1024.
	•	SEO: meta tags, OG images dinámicas (perfiles de producto y de usuario generan OG image custom con el globo + ruta).
	•	Empty states cuidados.
	•	Loading states con skeleton screens, no spinners.
	•	404 y error pages on-brand.
	•	Cookie banner GDPR mínimo (solo PostHog).

Output: listo para beta privada con 100 clientes.


PRINCIPIOS DE DISEÑO QUE NO SE NEGOCIAN
(Repite estos en cada sesión si Claude Code se desvía:)

	•	90% ink+bone+grises, 10% acentos. Nunca más de un color de acento por pantalla.
	•	Tracking generoso en uppercase (letter-spacing: 0.14em o más). Letterspacing es el detalle premium #1.
	•	Bordes negros > fondos negros. Para el branding nórdico, hairlines/bordes 1.5-2px son mejores que box-shadow o backgrounds grandes.
	•	Tipografía mono para datos técnicos: km, fechas, serial numbers, IDs. JetBrains Mono.
	•	Números grandes con peso 800-900, pero solo los héroes (km totales, countdown, etc.). Resto en weight 500-600.
	•	Animaciones tipo Apple/Arc, no tipo TikTok. Easing [0.22, 1, 0.36, 1] (out-expo), duration 200-400ms.
	•	No emojis en UI. Reemplaza con iconos de lucide-react.
	•	Imagen full-bleed > containers. Las fotos cover deben respirar sin padding.


VARIABLES DE ENTORNO QUE BENJA NECESITA PROVISIONARTE
Antes de Sesión 2:

NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_MAPBOX_TOKEN=

CLOUDINARY_URL=

RESEND_API_KEY=

NEXT_PUBLIC_POSTHOG_KEY=

NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

Si Benja no las tiene listas, pregúntale al inicio de cada sesión. No improvises con valores falsos que rompan el deploy.


CUANDO CLAUDE CODE TENGA DUDA
Orden de prioridad para resolver ambigüedades:

	•	¿Está en BOLG_ATLAS_concepto.md? → seguir lo que dice.
	•	¿Está en este handoff? → seguir esto.
	•	Si sigue sin claridad → preguntar a Benja antes de codear.

Nunca asumas valores de negocio (precios, niveles, criterios de badge). Esas son decisiones de Benja.


CÓMO ARRANCAR LA PRIMERA SESIÓN
Después de instalar Claude Code (npm install -g @anthropic-ai/claude-code) y hacer login con tu cuenta Claude, Benja debería:

	•	Crear carpeta vacía: mkdir bolg-atlas && cd bolg-atlas
	•	Abrir Claude Code ahí: claude
	•	Copiar y pegar este prompt inicial:

Hola Claude. Voy a construir BØLG Atlas, una plataforma de comunidad/travel para mi marca outdoor BØLG Concept. Tengo dos documentos de contexto que te voy a pegar antes de empezar. Léelos completos antes de proponer cualquier código.

Después de leer, no escribas código todavía. Confirma que entendiste el concepto, el stack no-negociable, y propón el plan concreto para la Sesión 1 (scaffold + diseño base + home con globo girando + deploy a Vercel). Pregúntame lo que necesites antes de arrancar.

Ahora te paso los documentos:

[pegar contenido de BOLG_ATLAS_concepto.md]

[pegar contenido de este archivo, BOLG_ATLAS_handoff_claude_code.md]

A partir de ahí, Claude Code lleva la batuta de la implementación.


ESTIMACIÓN DE COSTOS REALES (para que Benja no se sorprenda)
Concepto
Setup
Mes 1
Mes 6 (con 1K users)
Claude Code (Pro tier)
$0
$20-100/mes según uso
$100-300
Vercel
$0
$0 (hobby)
$20 (Pro)
Supabase
$0
$0 (free tier)
$25 (Pro)
Mapbox
$0
$0 (50K reqs free)
$0-50
Cloudinary
$0
$0 (25GB free)
$0-40
Resend
$0
$0 (100/día free)
$20
PostHog
$0
$0 (1M events free)
$0-50
Dominio atlas.bolg.cl
$15/año
–
–
Total
~$15
~$20
~$200/mes

Costo principal: tu tiempo dirigiendo Claude Code. Si tienes 6 horas semanales libres, MVP en 10-12 semanas es realista.



Listo. Buena suerte. Las olas no se quedan quietas.

