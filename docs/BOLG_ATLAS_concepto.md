BØLG ATLAS
El mundo medido en BØLG
Una plataforma donde cada producto BØLG es un testigo silencioso de las vidas que lo cargan, y cada kilómetro recorrido se convierte en un acto de pertenencia a algo más grande que un objeto.


0. TL;DR — Lo que estamos construyendo
BØLG Atlas es la primera plataforma del mundo donde un objeto y su dueño comparten una bitácora de viaje. Los productos BØLG dejan de ser mercancía y se vuelven artefactos vivos: cada uno tiene perfil, kilómetros acumulados, países visitados, historias y dueños sucesivos. Los usuarios suben sus aventuras, etiquetan productos BØLG, y entre todos van pintando un globo terráqueo que late con la actividad de la comunidad.

Es Strava para objetos. Es Spotify Wrapped que dura todo el año. Es Patagonia narrada por sus dueños. Es la diferencia entre "compré una mochila" y "compré una historia que sigue escribiéndose".

Tagline candidato: "Las olas no se quedan quietas." (BØLG = "ola" en noruego antiguo) Alternativos: "El mundo cabe en una BØLG." · "Cada bolsa es un atlas." · "Lo que cargas, te carga."


1. VISIÓN DEL PRODUCTO
Qué es
Una capa digital sobre cada producto BØLG. Compras una mochila Oslo, escaneas el QR/NFC interno, le pones nombre, y desde ese momento la mochila tiene una página web propia — pública, hermosa, actualizada cada vez que tú o un futuro dueño la mete en un viaje y sube fotos. Tú también tienes tu perfil, con tu mapa, tus kilómetros, tus medallas, tu passport digital.

Pero la plataforma no es solo cuentas individuales. El corazón es un globo terráqueo público que muestra en tiempo real dónde está la comunidad BØLG — luces parpadeantes en Patagonia, Islandia, Pucón, Marruecos, Atacama, Tokio — con trayectos animados entre puntos, contadores globales arriba a la derecha que no paran de subir.
Cómo se siente
	•	Premium sin ser frío. Cinematográfico sin ser pretencioso.
	•	Como abrir Spotify Wrapped en pleno diciembre, pero permanente.
	•	Como mirar el tablero de salidas de un aeropuerto antiguo — esa mezcla rara de paz y urgencia.
	•	Tipografía servif/sans elegante, blacks profundos, animaciones suaves tipo Apple, audio sutil opcional (wind/ocean ambient cuando giras el globo).
	•	Una mezcla precisa entre Patagonia journal, Apple Fitness ring, Arc Browser, Strava heatmap, Airbnb hero shots.
Por qué la gente vuelve
Tres motores de retención superpuestos:

	•	Vanidad sana: subir tu última escapada y ver tu mapa crecer es dopamínico. Tu perfil es tu portfolio de vida.
	•	Pertenencia: el globo global muestra que no estás solo — hay otros 12.000 BØLG en movimiento ahora mismo. Eres parte de una flota.
	•	Coleccionismo: badges, países, productos pasaportados, niveles (con nombres nórdicos), expediciones limitadas. Hay siempre algo por desbloquear.

Y un cuarto, lento y poderoso: legado. La idea de que dentro de 10 años tu mochila siga sumando km con un nuevo dueño y siga apareciendo en tu timeline porque tú la heredaste, vendiste, o regalaste — eso genera apego.
Las emociones que tocamos
Emoción
Cómo la activamos
Orgullo
"Has recorrido 12.847 km. Eres top 0.3% de Chile."
Nostalgia
"Hace un año estabas acá:" + foto + lugar + ruta
Aspiración
Feed cinematográfico de viajes ajenos que te dan ganas de salir
Pertenencia
"12.000 BØLG en 47 países ahora mismo"
Legado
"Esta mochila ha tenido 3 dueños y ha visto 28 países antes que tú"


2. IDENTIDAD Y STORYTELLING
El concepto en una frase
Tus productos BØLG no son tuyos. Son del mundo. Y tú eres su capítulo.
Naming del producto (recomendaciones priorizadas)
	•	BØLG Atlas ★ (mi recomendación: corto, evocador, expandible — "Atlas Society", "Atlas Awards", "Atlas Recap")
	•	BØLG Worldmap
	•	Kilómetros BØLG (utilitario; bueno para landing inicial pero limitante para sub-features)
	•	The BØLG Log
Narrativa fundacional (texto del hero)
En noruego antiguo, bølg significa ola. Las olas no nacen para quedarse quietas — nacen para cruzar océanos, para llegar lejos, para volver.

Esta es la bitácora de las olas BØLG: kilómetros acumulados por nuestra comunidad, países visitados por nuestros productos, historias que ningún manual de producto puede contar.

Tu BØLG ya viajó antes que tú. Va a viajar después de ti. Cuéntanos hasta dónde la llevaste.
Cómo la marca habla aquí (voice & tone)
	•	Humilde-épico: nunca presumimos. Dejamos que los datos y las fotos hablen.
	•	Concreto: nada de "vive tu pasión". Decimos "12.318 km" / "el lago Skadar, Montenegro" / "junio 2024, 04:47 AM".
	•	Nórdico-andino: nuestro outdoor es Patagonia tanto como Lofoten. Mezclamos ambos imaginarios sin caer en cliché de glaciar.
	•	Casi sin emojis. Usamos tipografía y espaciado para mostrar respeto al objeto.
Por qué la gente quiere participar (status game)
	•	Mostrar identidad: "Soy de los que viaja con BØLG" señala un tipo de consumidor — outdoor educado, no Decathlon, no Louis Vuitton. Está en su propia categoría.
	•	Validación del gasto: si gastaste $159K en una mochila, quieres contar que ya recorriste 8.000 km con ella. Justifica.
	•	Legado pequeño: cada usuario empieza a entender que está construyendo un pequeño objeto biográfico — eso es raro y adictivo.


3. ARQUITECTURA COMPLETA DEL PRODUCTO
Sitemap
/                            Home (globe hero + KPIs globales + feed)

/atlas                       Globo interactivo full-screen

/feed                        Feed de aventuras (cards verticales tipo IG)

/explorar                    Búsqueda por país/ciudad/producto/usuario

/rankings                    Leaderboards multi-categoría

/expediciones                Challenges activos (mensuales/temporales)

/u/[username]                Perfil público de usuario

/p/[product_id]              Perfil público de un producto individual

/t/[trip_id]                 Página de un viaje específico (compartible)

/sku/[sku]                   Página de modelo (todos los productos Oslo, ej.)

/passport                    Mi passport digital (privado)

/recap/[year]                Mi recap anual estilo Spotify Wrapped

/admin                       Backoffice (validaciones, badges, premios)

/registro-producto           Onboarding: escanear QR y vincular producto
Pantallas hero (las que importan)
1. Home / Atlas público
	•	Sobre el viewport: globo 3D girando lento, autoplay.
	•	Puntos pulsantes representan trips recientes; líneas curvas trazan rutas.
	•	Topbar minimalista: logo BØLG · "Atlas" · login.
	•	Esquina superior derecha, contadores globales que se actualizan:
	•	12.483.927 km recorridos
	•	47.318 trips compartidos
	•	89 países pisados
	•	8.214 productos en circulación
	•	Scroll → debajo del globo, Feed Editorial (3 historias destacadas curadas + grid de últimas aventuras).
	•	Bottom: módulo "Top travelers este mes" + CTA "Crea tu cuenta".
2. Globo interactivo / Atlas full-screen (la pieza)
	•	Globo 3D ocupa 100% del viewport.
	•	HUD lateral izquierdo (overlay vidrio esmerilado / glassmorphism):
	•	Filtros: por país, por modelo, por fecha, por tipo de viaje (mountain, urban, sea, desert).
	•	Stats globales en vivo.
	•	Toggle: "ver heatmap / ver puntos / ver rutas / ver fotos".
	•	Hover sobre punto: card flotante con foto + usuario + producto + lugar.
	•	Click en punto: abre side-panel con el trip completo (galería, ruta, kms, día, año, productos involucrados).
	•	Click sostenido + arrastre: rotar globo (con inercia tipo Apple).
	•	Scroll wheel: zoom suave (no pixelado tipo Google Earth).
	•	Doble click en un país: vuela hasta ese país y muestra todos los trips ahí.
3. Perfil de usuario /u/[username]
	•	Hero: cover photo (la última foto que subió) + avatar + nombre + ubicación + título BØLG ("Skald · Nivel 6").
	•	KPI strip horizontal:
	•	47.382 km totales
	•	28 países
	•	156 trips
	•	4 productos vinculados
	•	Globo personal pequeño a la izquierda (mismo render que el grande, sólo con tus puntos).
	•	Tabs: Trips · Productos · Medallas · Recaps · Estadísticas.
	•	Feed de trips en grid 2-col (foto grande + título de lugar + km + fecha).
	•	Sticky sidebar derecha: "comparar con un amigo".
4. Perfil de producto /p/[product_id]
Esta es la pantalla con potencial viral más alto.

	•	Hero: foto de estudio del producto + foto en uso (la mejor de su historia) lado a lado.
	•	Sub-hero: nombre del producto (asignado por el dueño → "Oslo de Benja", "La Negra", "Vagabunda") + modelo + número de serie.
	•	KPI strip:
	•	12.847 km recorridos
	•	17 países
	•	3 dueños en su historia
	•	4 años, 2 meses
	•	Timeline temporal (vertical, izquierda): cada item es un trip — fecha, lugar, dueño en ese entonces, foto.
	•	Mapa miniatura con todos los puntos por los que pasó.
	•	Sección "Dueños": cards con foto y duración (estilo créditos de película).
	•	Sección "Heritage status": si supera ciertos thresholds, gana etiqueta — "Wayfarer (>10.000 km)", "Skald (>5 países)", "Legendary BØLG (>50.000 km · 3+ dueños · >5 años activa)".
	•	Botón "Ver modelo Oslo" → lleva a /sku/oslo donde están todas las Oslos del mundo.
5. Recap anual /recap/2026
	•	Lockscreen oscura. Click "play" → secuencia animada tipo Spotify Wrapped:
	•	Slide 1: "En 2026 recorriste 18.482 km con BØLG"
	•	Slide 2: "Visitaste 9 países — más que el 87% de usuarios"
	•	Slide 3: "Tu modelo favorito fue tu Oslo Negra. Vivió 11 países contigo."
	•	Slide 4: "Tu mejor viaje fue Salar de Uyuni · julio" + foto destacada
	•	Slide 5: "Eres oficialmente nivel Skald. Recibes una insignia física por correo."
	•	Final: share card optimizada para IG Stories.
6. Passport digital /passport
	•	Estética de pasaporte físico moderno: textura papel oscuro, sellos virtuales por país visitado.
	•	Cada país visitado = stamp animado (un sello rotativo que aparece con sonido).
	•	Países sin pisar quedan en gris, intrigan.
	•	Total countries / continents conquered.
	•	Niveles: explorador (1 país), nómada (5), vagamundo (15), oceánico (4 continentes), atlas (6 continentes).
7. Expediciones (challenges)
	•	Cards en grid: "Andes 2026 · Sube cualquier trip andino antes del 15 de junio · 312 participantes · 3 ganadores".
	•	"Costa Pacífico · Recorre 1.000 km en cualquier costa pacífica · sponsored by Quiksilver".
	•	"Travesía nórdica · 5 trips en países nórdicos · gift edition Lofoten".
	•	Cada expedición: leaderboard propio, premios físicos, badge especial al ganador.


4. DISEÑO UX/UI
Sistema de color
Token
HEX
Uso
--ink
#0A0A0A
Backgrounds primarios, tipografía hero
--bone
#F4F1EA
Paper/secondary surfaces, alternativa a blanco puro
--fog
#1F1F1F
Cards sobre ink
--mist
#E8E4DC
Hairlines, bordes
--ember
#D4A373
Color acento (ya existe en dashboard) — usar con extrema parsimonia
--aurora
#5BC0BE
Acento alternativo, sólo para destacar km de productos legendary
--blood
#A8201A
Solo alertas / quiebres

Regla de oro: la pantalla siempre tiene 90% ink+bone+grises, 10% acentos. Apple, no Wrapped.
Tipografía
	•	Display / hero: Söhne Breit o Founders Grotesk (geométrica, levemente cóncava) — fallback: Inter Tight 900.
	•	Body: Söhne o Inter (regular).
	•	Mono (km, coordenadas, fechas técnicas, serial numbers): Söhne Mono o JetBrains Mono.
	•	Editorial / quotes (los snippets emocionales): Newsreader o Source Serif Pro, peso medium italic.

Cuatro fuentes máximo. Tracking generoso en mayúsculas (letter-spacing: 0.14em).
Motion design
	•	Globo: rotación constante muy lenta (1 rev cada ~120s). Inercia suave al arrastrar. Auto-pause cuando el usuario interactúa.
	•	Number tickers: los KPIs globales no son números estáticos — usan Framer Motion para subir con micro-animaciones cada cierto rato (cuando llega un nuevo trip al sistema, el contador sube ante tus ojos).
	•	Pulse points: los puntos en el globo respiran con un radial-glow sutil. Cuando llega un trip nuevo en tiempo real, se ilumina el punto correspondiente con una onda expansiva (referencia: Stripe ondas).
	•	Page transitions: tipo Arc — overlays slide-up con masking. No fades genéricos.
	•	Hover states: ligera elevación + scale (1.0 → 1.02) + sombra. No exageración.
	•	Stamp animations en passport: un sello rotativo cae con peso + spring + un click sonoro.
Componentes clave
	•	<Globe /> — el centerpiece. Three.js + react-three-fiber. Acepta props: data points, mode (heatmap/dots/routes), filtros.
	•	<TripCard /> — card vertical con foto cover, título de lugar, distancia, fecha, productos involucrados (iconos pequeños).
	•	<KPICounter /> — número grande con animación de incremento.
	•	<ProductChip /> — pildora con miniatura del producto + nombre asignado + km.
	•	<UserStamp /> — avatar circular + nombre + nivel BØLG.
	•	<TripTimeline /> — vertical, tipo línea de tiempo con marcadores.
	•	<Heatmap /> — capa overlay del globo para zonas más densas.
	•	<ShareCard /> — generador automático de imagen 1080×1920 para subir a IG/TikTok con los datos del trip o del recap.
Microinteracciones premium (las que enamoran)
	•	Cuando subes un trip nuevo y se valida, el globo se anima hasta ese punto, le pone un pulso de 3 ondas, y suma los km al contador global en vivo. Un sutil sonido tipo "ding" (opcional).
	•	Al hover sobre tu km counter, aparece un tooltip con "Te quedan 7.518 km para el siguiente nivel (Vagamundo)".
	•	Al hacer scroll horizontal en tu timeline, los productos involucrados en cada trip se iluminan abajo.
	•	En recap, la primera vez que ves "Eres top 0.3%", aparece confetti minimalista (puntos blancos que caen una sola vez, no anime de fiesta).


5. LA EXPERIENCIA DEL GLOBO (deep dive)
Este es el alma del producto. Es lo que la gente abre en pantalla completa y deja correr 20 minutos. Detalles concretos:
Render
	•	Tecnología: Three.js + react-three-fiber + drei. Para producción evaluar también CesiumJS o deck.gl (si necesitamos integración con datos geo más serios).
	•	Tile source: Mapbox Streets para textura base (custom dark style), o satellite tiles (Mapbox satellite-streets-v12) para vibe outdoor.
	•	Atmósfera: Halo sutil azul-blanco alrededor del globo (shader propio o postprocessing bloom).
	•	Estrellas: Background sphere con starfield (textura). Densidad mediana, no abrumar.
	•	Performance: Render a 60fps en laptops modernos. Mobile: simplificamos a 30fps + menos puntos.
Capas de información (toggles del HUD)
	•	Dots (default): un punto por trip. Color por antigüedad (los recientes brillan, los viejos atenúan).
	•	Heatmap: densidad por zona — los Andes brillan rojo, las Islas Cook apenas se ven.
	•	Routes: trayectorias entre puntos consecutivos del mismo usuario en arcos curvos sutiles (great-circle arcs animados).
	•	Photos: en zoom alto, los puntos se vuelven miniaturas circulares de la foto cover de cada trip (estilo Apple Photos memories).
	•	Live: muestra solo trips de los últimos 30 días.
Interacción
	•	Drag: rotar (con inercia, tipo Apple Watch crown).
	•	Pinch / scroll: zoom (limitado entre nivel mundo y nivel ciudad).
	•	Click en punto: side panel slide-in derecho con el trip.
	•	Doble-click en zona vacía: re-centra cámara ahí.
	•	Click sostenido en país: highlight todo el país + muestra estadísticas del país.
	•	Tecla F o icono fullscreen: viewport completo.
	•	Tecla R: reset cámara.
Modos especiales
	•	Mode: Hoy: animación rápida que reproduce todos los trips subidos las últimas 24h en orden cronológico — los puntos aparecen al ritmo del día, el globo gira para mostrar cada uno.
	•	Mode: Tu año: solo en /recap/[year] — animación que recorre tus trips uno por uno.
	•	Mode: Producto: solo en /p/[product_id] — globo muestra únicamente la ruta de vida de ese producto.


6. GAMIFICACIÓN
Niveles personales (basados en km recorridos con cualquier producto BØLG)
Nombrados con guiño nórdico-andino. Cada uno desbloquea perks digitales y físicos.

Nivel
Km requeridos
Título
Perks
1
0 - 500
Aprendiz
Badge digital
2
500 - 2.000
Caminante
Badge digital + 10% en próxima compra
3
2.000 - 5.000
Drengr
Badge físico bordado por correo
4
5.000 - 12.000
Nómada
Acceso a expediciones exclusivas
5
12.000 - 30.000
Skald
Producto edición limitada anual
6
30.000 - 60.000
Cartógrafo
Acceso a expediciones BØLG oficiales (gratis)
7
60.000 - 100.000
Hugin (el cuervo de Odín, mensajero)
Customización gratis + lifetime warranty
8
100.000+
Yggdrasil
Hall of Fame permanente + producto co-firmado
Badges (achievements no lineales)
	•	Aurora: viaje arriba del paralelo 60°.
	•	Antípoda: dos viajes en puntos opuestos del planeta.
	•	Volcanero: 5 trips en volcanes.
	•	Sal del Mundo: salar/playa/desierto en mismo año.
	•	First Mover: primer usuario en pisar un nuevo país BØLG.
	•	Caudillo: traes 3+ amigos que se inscriben y suben al menos un trip.
	•	Equinoccio: trip subido el día del equinoccio.
	•	Maratonista: trip con >100 km caminados/corridos.
	•	Anti-turista: trip en ciudad fuera del top-1000 mundial.
	•	Heritage Keeper: heredas/compras un producto usado y le sumas >500 km.
Premios mensuales (concretos)
	•	Trip del mes — votado por la comunidad → producto edición especial + IG takeover de @bolgconcept.
	•	Top kilometrador del mes → discount 30% próxima compra.
	•	Top país — el país más activo del mes → pop-up en esa ciudad.
Premios anuales
	•	BØLG Atlas Awards — ceremonia digital en enero, con categorías:
	•	Aventurero del año
	•	Producto del año (legendary)
	•	Mejor historia (curada)
	•	Comunidad nueva (mejor cluster regional emergente)
	•	Edición física anual de "The Atlas Book": libro impreso con las 100 mejores historias del año. Vende a $39.990. Gratis para nivel 5+.
Incentivos a participación constante
	•	Streak semanal: si subes un trip cualquier semana, mantienes streak. 12 semanas seguidas = badge "Cronista".
	•	Notificaciones suaves (push opt-in): "Hace 3 semanas estuviste en La Junta. Sube ese trip antes que se enfríe."
	•	Comparaciones casuales en el feed: "Mati Cordero está 312 km adelante tuyo este mes."
	•	Misiones de descubrimiento (mensuales): "Visita un país nuevo en mayo y gana 2x km bonus."


7. SISTEMA SOCIAL
Minimalista. No queremos ser otra red social — queremos que la acción (viajar) sea el centro, no el scroll.

	•	Follow (no friendship — relación asimétrica tipo Twitter).
	•	Likes (con icono propio: una ola, no un corazón).
	•	Comments moderados (toxicidad detection con IA básica antes de publicar).
	•	Share: cada trip y cada perfil de producto tienen URL públicas hermosas (OG image generada server-side: globo + ruta del trip + foto cover).
	•	Highlights: cada usuario puede pinear 5 trips como "destacados" en su perfil.
	•	Activity feed (lateral, no central): "Mati Cordero subió un trip en San Pedro." "Tu Oslo Negra pasó nivel Drengr." "Alejandra te empezó a seguir."
	•	Comparar perfiles: side-by-side de stats con un amigo (UX tipo Strava compare).

Lo que NO hacemos: stories de 24h, DMs (al inicio), reels, scroll infinito vertical sin contexto. Esto NO es Instagram.


8. SISTEMA DE PRODUCTOS (el diferencial radical)
Este es el moat. Nadie más lo tiene.
Vinculación física → digital
Cada producto BØLG nuevo sale de fábrica con:

	•	QR code dentro de un bolsillo escondido (también NFC tag en productos premium / V2).
	•	Tarjeta de bienvenida con instrucciones: "Escanea para darle nombre a tu BØLG. Vas a entender por qué."
	•	Serial number único.

Al escanear:

	•	Si no tienes cuenta → te lleva a crear una.
	•	Te pide ponerle nombre al producto (sugerimos noruegos: Astrid, Magnus, Sigrid, Sven; o que invente — "La Negra", "Vagabunda", "Salty").
	•	Te pregunta cuándo lo compraste (para tener fecha de inicio).
	•	Vinculas. Listo: tu producto tiene perfil propio.
Cómo se acumulan km
Tres mecánicas (priorizadas):

	•	Trips manuales (default): subes una aventura, marcas qué productos llevaste, los km se calculan de origen a destino (con GPS si está disponible, o estimado por ruta entre dos ciudades).
	•	Strava/Garmin sync (V2): autorizas la conexión; cada actividad tuya con etiqueta "BØLG" suma km a los productos que indicaste estaban contigo.
	•	AI photo parsing (V3): subes fotos del viaje, la IA detecta el modelo BØLG (con foto reference de catálogo) y propone autocompletar productos en el trip.
Cambio de dueño (Heritage Mode)
Mecánica única: cuando alguien revende, regala, o hereda su producto BØLG:

	•	Va a /p/[product_id] → opción "Transferir propiedad".
	•	Genera un código que se entrega al nuevo dueño.
	•	El nuevo dueño activa el código → la propiedad cambia, pero toda la historia previa queda visible en el perfil del producto ("Magnus tuvo a Benja como dueño 2022-2026, recorrió 8.483 km con él").
	•	El producto sigue sumando km, ahora con su nuevo dueño.
	•	Esto le sube el precio de reventa real: una mochila con 5.000 km documentados vale más que una nueva si BØLG vale como marca aspiracional.

Imagina ver esto en Yapo o Mercado Libre: "Vendo Oslo BØLG · 12.847 km · 4 países · perfil público: bolg.cl/p/A02AH02-7791". Eso es marketing orgánico y aumenta el valor percibido de tu marca de forma estructural.
Productos legendarios (Hall of Fame)
/legendary muestra los 100 productos más viajeros del mundo. Cada uno con:

	•	Nombre asignado por dueños
	•	Total km
	•	Cantidad de dueños
	•	Países pisados
	•	Año de fabricación
	•	Foto de cada dueño en miniatura con su período

Apostamos que los primeros productos BØLG (los que llevan más años en circulación) van a ser pequeñas celebridades en 3-5 años.
Página de modelo /sku/oslo
Agrega TODAS las Oslo del mundo:

	•	"Hay 3.482 Oslo activas en el mundo"
	•	"Recorrido total Oslo: 2.847.392 km — 4× la circunferencia de la luna 47×"
	•	Globo solo con Oslos
	•	Top 10 Oslo más viajeras
	•	"Compra una Oslo y empieza a sumar" → e-commerce link


9. ESTRUCTURA DE BASE DE DATOS
Postgres (vía Supabase o similar). Diseño relacional simple, índices fuertes en lat/lng y fechas.

-- Users

users (

  id uuid primary key,

  username text unique not null,

  email text unique not null,

  display_name text,

  bio text,

  avatar_url text,

  cover_url text,

  country_code text,

  city text,

  created_at timestamptz default now(),

  level int default 1,

  total_km numeric default 0,

  is_verified bool default false

)

-- BØLG Product Models (catálogo)

product_models (

  id text primary key,        -- "OSLO", "BERLIN", etc.

  sku text unique,            -- "A02AH02"

  name text,

  category text,              -- mochilas, botellas, accesorios

  description text,

  hero_image_url text,

  launched_year int

)

-- BØLG Product Units (cada producto físico individual)

products (

  id uuid primary key,        -- serial único

  model_id text references product_models(id),

  serial_number text unique,  -- código grabado físicamente

  manufactured_at date,

  current_owner_id uuid references users(id),

  given_name text,            -- "La Negra", "Magnus"

  total_km numeric default 0,

  countries_visited int default 0,

  trips_count int default 0,

  status text default 'active',  -- active, lost, retired

  legendary_tier text          -- null, wayfarer, skald, legendary

)

-- Historial de propietarios (heritage)

product_owners (

  id uuid primary key,

  product_id uuid references products(id),

  user_id uuid references users(id),

  acquired_at date,

  released_at date,            -- null si es dueño actual

  acquired_via text            -- purchase, gift, inheritance, second_hand

)

-- Trips (la unidad atómica)

trips (

  id uuid primary key,

  user_id uuid references users(id),

  title text,

  description text,

  cover_photo_url text,

  start_at timestamptz,

  end_at timestamptz,

  distance_km numeric,

  elevation_gain_m numeric,

  start_lat double precision,

  start_lng double precision,

  end_lat double precision,

  end_lng double precision,

  start_place_name text,

  end_place_name text,

  country_codes text[],        -- ISO 3166-1 alpha-2

  activity_type text,          -- hike, run, bike, drive, fly, walk, climb, ski

  geom geography(linestring),  -- ruta completa (PostGIS extension)

  is_validated bool default false,

  validation_method text,      -- gps, photo_exif, manual, strava

  visibility text default 'public', -- public, followers, private

  counts_for_bolg bool default false, -- si etiqueta producto BØLG

  created_at timestamptz default now()

)

-- Productos involucrados en cada trip

trip_products (

  trip_id uuid references trips(id),

  product_id uuid references products(id),

  primary key (trip_id, product_id)

)

-- Fotos del trip

trip_photos (

  id uuid primary key,

  trip_id uuid references trips(id),

  url text,

  exif_lat double precision,

  exif_lng double precision,

  taken_at timestamptz,

  ordering int

)

-- Badges

badges (

  id text primary key,         -- "aurora", "antipoda", etc.

  name text,

  description text,

  icon_url text,

  rarity text                  -- common, rare, epic, legendary

)

user_badges (

  user_id uuid references users(id),

  badge_id text references badges(id),

  earned_at timestamptz default now(),

  primary key (user_id, badge_id)

)

-- Social

follows (

  follower_id uuid references users(id),

  followee_id uuid references users(id),

  created_at timestamptz default now(),

  primary key (follower_id, followee_id)

)

likes (

  id uuid primary key,

  user_id uuid references users(id),

  trip_id uuid references trips(id),

  created_at timestamptz default now()

)

comments (

  id uuid primary key,

  trip_id uuid references trips(id),

  user_id uuid references users(id),

  body text,

  created_at timestamptz default now()

)

-- Expediciones / challenges

expeditions (

  id uuid primary key,

  name text,

  description text,

  starts_at timestamptz,

  ends_at timestamptz,

  rules jsonb,                 -- criterios programables

  prize_description text,

  cover_url text

)

expedition_participants (

  expedition_id uuid references expeditions(id),

  user_id uuid references users(id),

  trips_count int default 0,

  km_accumulated numeric default 0,

  primary key (expedition_id, user_id)

)

Índices clave: trips(user_id), trips(start_at), trips USING GIST(geom), trip_products(product_id), products(current_owner_id).

Materialized views para los rankings (refresh cada hora):

	•	mv_top_users_global_km
	•	mv_top_products_km
	•	mv_country_activity


10. STACK TÉCNICO RECOMENDADO
Frontend
	•	Next.js 14 (App Router) — SSR para SEO (perfiles de productos públicos = oro para SEO), edge functions, React Server Components.
	•	TypeScript estricto.
	•	Three.js + react-three-fiber + drei para el globo.
	•	Framer Motion para animaciones.
	•	Tailwind CSS + sistema de tokens custom (colores BØLG).
	•	shadcn/ui como base de componentes (extensible y editable).
	•	TanStack Query para data fetching.
Backend / Datos
	•	Supabase (Postgres + Auth + Storage + Realtime + Edge Functions) — recomendación primaria. Trade-off: vendor lock-in moderado, pero te ahorra 6 meses de boilerplate.
	•	Alternativa más control: Postgres en Neon + auth via Clerk o Better Auth + storage en Cloudflare R2.
	•	PostGIS extension activada para queries geoespaciales (rutas, distance, intersections).
Maps & Globe
	•	Mapbox GL JS para tiles base + heatmaps 2D.
	•	Three.js para el globo 3D (con textura earth map de Natural Earth Data).
	•	Turf.js para cálculos geoespaciales en cliente.
Image upload & processing
	•	Uploadthing o Cloudinary (Cloudinary mejor por las transforms automáticas — generar variantes responsive sin código).
	•	EXIF parsing: exifr (lee GPS de las fotos directamente).
	•	Para evitar abuso: límite 20 fotos/trip, max 10MB c/u.
Real-time
	•	Supabase Realtime para los contadores globales que suben en vivo y las notificaciones de actividad.
Búsqueda
	•	Postgres full-text search al inicio. Si escala: Meilisearch o Typesense.
Analytics & Product
	•	PostHog (autohosted o cloud) — eventos, funnels, session recordings.
	•	Vercel Analytics + Speed Insights.
Email transaccional
	•	Resend (developer-friendly, react-email templates).
Hosting
	•	Vercel para Next.js (CI/CD automático desde GitHub).
	•	Supabase Cloud para base de datos.
	•	Cloudflare delante para CDN/cache de imágenes.
Pagos (cuando habilitemos premium / merch)
	•	Stripe (recurring + one-off).
	•	Mercado Pago para Chile (subscripciones nacionales y métodos locales).
Gamificación
	•	No usar una librería externa — el sistema es simple y específico. Triggers en Postgres + edge functions que escuchan trip.validated → calculan badges/levels/km → updatean.
Stack TL;DR
Next.js + TS + Tailwind + shadcn

↓

Three.js (globe) · Mapbox · Framer Motion

↓

Supabase (Postgres + Auth + Storage + Realtime)

↓

Cloudinary · Resend · PostHog · Stripe

↓

Vercel · Cloudflare

Costo aproximado para 5K usuarios activos: US$200-400/mes en infra. Para 50K: US$1.500-3.000/mes.


11. ROADMAP
MVP (mes 1-3) — "Que funcione, sin que sea bonito"
Scope:

	•	Auth (email + magic link).
	•	Crear perfil básico (username, avatar, bio).
	•	Crear trip manual: título, lugares (autocomplete con Mapbox), km, fecha, fotos (drag&drop max 5), productos involucrados (selección manual del catálogo).
	•	Globo público en home con todos los trips (Three.js render básico).
	•	Perfil de usuario con sus trips listados.
	•	Perfil de producto básico (sin heritage, sin niveles).
	•	Leaderboard global por km (top 100).
	•	Sistema simple de QR: al comprar, enviamos email con link único de activación de producto.

Lo que NO está en MVP: social (likes/comments/follow), badges, recaps, expediciones, heritage mode, Strava sync.

Stack: Next.js + Supabase + Mapbox + Cloudinary + Vercel. Equipo: 1 full-stack senior + 1 designer part-time.

Timeline realista: 12 semanas con un dev senior dedicado.
V2 (mes 4-7) — "Que enganche"
	•	Social layer (follow, like, comment).
	•	Badges + niveles (sistema completo).
	•	Heritage Mode (transferencia de productos).
	•	Strava integration.
	•	Expediciones (challenges mensuales).
	•	Mobile responsive depth (no app nativa todavía).
	•	Notificaciones (web push + email digests semanales).
	•	Admin panel para curar trip del mes.
V3 (mes 8-12) — "Que escale y monetice"
	•	App nativa iOS (React Native o Swift).
	•	AI photo parsing (detección automática de productos).
	•	Recap anual generado.
	•	Atlas Book (libro impreso anual).
	•	Premium membership "BØLG Society" (US$99/año o $79.990 CLP).
	•	Brand partnerships UI (sponsored expeditions).
	•	API pública para integradores (gear shops, journalists).
V4+ (año 2) — "Que se vuelva movimiento"
	•	AR layer en mobile (apunta cámara a un producto BØLG → ves su historia flotante en AR).
	•	NFC en productos premium (acercas el celular y se abre el perfil del producto).
	•	Eventos físicos BØLG en ciudades top (meetups, expediciones grupales).
	•	Marketplace second-hand BØLG (con perfil de producto incluido = confianza alta).
	•	Co-branded productos con destinos (BØLG × Torres del Paine edition con perfil pre-cargado).


12. MONETIZACIÓN
La plataforma misma no es el producto que se vende — es el motor del producto que se vende. Pero igual hay capas concretas de monetización:
Tier 1: Aumenta el valor del producto físico (LTV efecto halo)
	•	El producto vale más porque tiene una historia digital documentada.
	•	Heritage mode → mercado secundario activo → más ingreso por unidad fabricada (royalty implícito vía marca).
	•	Mayor justificación de precio premium → mejor margen.
	•	Estimación impacto: +15% en willingness-to-pay en compradores nuevos. +30% en retorno de compradores existentes.
Tier 2: BØLG Society (membership)
	•	US$99/año o $79.990 CLP.
	•	Perks:
	•	Acceso anticipado a drops.
	•	10% descuento permanente.
	•	Atlas Book gratis cada año.
	•	Acceso a expediciones oficiales (con grupo BØLG real, asistencia logística).
	•	Badge dorado en perfil.
	•	Customización de productos.
	•	Estimación 5K usuarios activos: 8% conversion = 400 miembros × US$99 = US$39.600/año recurrente.
Tier 3: Brand partnerships
	•	Marcas outdoor adyacentes (no competencia): Patagonia, Garmin, Strava, hostels, boutique tour operators.
	•	Modalidades:
	•	Sponsored expeditions ("Expedición Atacama 2026 by Garmin").
	•	Display partners en heatmap de zona ("Estás en Pucón. Hostal X tiene 15% desc para BØLG users").
	•	Co-branded products.
	•	Estimación: 4-6 partnerships/año × US$5K-15K c/u = US$30K-70K/año.
Tier 4: Atlas Book (libro físico anual)
	•	$39.990 CLP edición regular, gratis nivel 5+.
	•	Curaduría editorial real, calidad coffee table.
	•	Estimación 1.000 copias/año: $40M CLP gross, ~$15M neto.
Tier 5: BØLG Concierge (servicios travel)
	•	Largo plazo: la base de usuarios premium outdoor es muy interesante para travel partners.
	•	Itinerarios curados, pre-armados, comisión sobre booking.
	•	Modelo affiliate: 5-10% sobre cada booking referido.
Tier 6: Marketplace second-hand (V4+)
	•	Comisión 8% sobre cada reventa BØLG en marketplace propio.
	•	Confianza alta porque cada producto tiene perfil verificable.
Total potencial año 3 (escenario realista)
	•	25K usuarios activos
	•	2K members BØLG Society
	•	US$200K membership + US$80K partnerships + US$30K book + US$50K concierge + halo en ventas físicas: US$1.5M+ en ventas atribuibles.


13. IDEAS QUE NO ME PEDISTE (las que cierran la jugada)
"The Twin"
Cada producto BØLG tiene un gemelo digital con nombre propio. Pero la sutileza: el dueño puede grabar mensajes de audio cortos (≤30s) que quedan asociados a momentos específicos del trip. Cuando alguien (incluyendo futuros dueños) abre el perfil del producto, puede escuchar la voz del dueño anterior contando dónde estaba ese día. Es íntimo, raro, y nadie lo hace. Es la diferencia entre IG y un diario.
"Echoes" — productos que se cruzan
Notificación cuando un producto BØLG distinto al tuyo pasa por un lugar donde tú estuviste antes con el tuyo. "Un usuario en Lofoten acaba de pasar por el mismo café donde estuviste hace 14 meses con tu Oslo Negra." No hay contacto directo entre usuarios, sólo el ecosistema mostrándote que tu paso dejó huella en una red más grande.
"Constelaciones"
En tu perfil hay una pestaña secreta: si vas a "tu constelación", se conectan con líneas todos los lugares por los que has pasado, formando un dibujo. Algunas constelaciones son tan icónicas que reciben nombre y se vuelven badges desbloqueables ("La Cruz del Sur": pisas Santiago + Buenos Aires + Río + La Paz).
"Skald" feature
Botón en cada trip: "Pídele al Skald que cuente este viaje". Una IA (Claude / GPT-4o) genera una breve narración poética en estilo nórdico-andino sobre tu viaje, usando los datos: ruta, km, lugares, hora del día, productos involucrados. La gente va a viralizar esto. La narración es compartible como imagen/audio. Es Spotify Wrapped pero por viaje individual.
"Producto fantasma"
Si pierdes un producto BØLG y lo declaras perdido, su perfil queda en estado "Fantasma" — sigue visible, sin nuevos km, pero su última ubicación queda como pin permanente. Si alguien futuro lo encuentra y lo re-vincula a su cuenta, el producto resucita y le notifica al dueño original. Esto es magia pura para el marketing.
"Old World Atlas"
Cada mes elegimos una zona del mundo poco visitada por BØLG ("este mes: Asia Central"). Bonus 3× km a los trips ahí. Esto sesga la actividad orgánicamente hacia destinos diversos, fortalece el mapa global, y crea storytelling editorial mes a mes.
"Pulse Map" en home
En vez de mostrar todos los trips siempre, el globo por defecto muestra solo los trips de las últimas 6 horas del mundo, en tiempo real. Sales a una fiesta, vuelves, abres BØLG Atlas en el computador, y ves cómo el mundo brilla diferente. Es hipnótico. La gente lo deja abierto como salvapantallas.
"Stamps" físicos
Cada nivel BØLG (Drengr, Skald, Cartógrafo) viene con un sello físico bordado o stamp metálico que mandamos por correo. Coleccionables, fotografiables. La gente los pone en sus mochilas. Marketing orgánico permanente.
"Atlas para corporativos" (cross-selling con tu pestaña de cotizaciones)
Las empresas que compran corporativo (Hotel Singular, Bayer, etc.) reciben un mini-Atlas privado para su empresa: ven dónde están sus productos BØLG repartidos, los empleados pueden sumar km a la marca corporativa. Esto convierte un sale B2B en un sale recurrente con engagement.
"The Last Trip" (un easter egg emocional)
Si un usuario está inactivo más de 24 meses, su perfil entra a un estado "Dormido". El sistema preserva sus trips. Si vuelve, hay una animación de bienvenida. Si nunca vuelve... su contribución al globo sigue ahí, en silencio. Es respetuoso.
Integraciones invisibles (lo que se siente mágico)
	•	Apple Health import: caminatas/runs entran automáticamente como trips (con su autorización).
	•	Mapbox GL JS con custom style oscuro BØLG (de regalo a la comunidad como theme).
	•	Spotify last listened on trip: en la página del trip puedes ver qué canciones escuchabas (vía API Spotify, opt-in). Pequeño extra emocional brutal.


14. SÍNTESIS — POR QUÉ ESTO FUNCIONA
Pregunta
Respuesta
¿Por qué BØLG y no Gnomo/Trauko?
Porque BØLG ya tiene productos durables que sí viajan. El medio del mensaje calza con el producto.
¿Por qué la gente subiría un trip?
Porque su perfil es un objeto de status que crece. Y porque cada trip suma a su mochila — algo nadie más le da.
¿Por qué volvería?
Por el globo en pantalla completa, por su recap, por el ranking que cambia semanalmente, por las expediciones, por el streak.
¿Por qué le ahorra valor a BØLG?
Porque cada perfil de producto público con miles de km es marketing eterno indexado en Google, justificación de precio, y argumento de reventa.
¿Cuál es el moat?
El dataset. En 3 años tenemos un mapa que ninguna marca outdoor puede replicar — porque está construido por una comunidad real, no inventado.
¿Cuándo se rompe?
Si los QRs no se escanean al recibir el producto. Por eso el packaging debe gritar "ESCANEA. TE VA A GUSTAR." — y el onboarding tiene que ser brutal (≤90s primer trip subido).


15. PRIMER PASO CONCRETO (siguiente acción)
Si quieres avanzar esto:

	•	Validar el concepto con 20 clientes BØLG actuales en una llamada de 15min (mostrarles mockups estáticos, preguntar si lo usarían y por qué).
	•	Comprar el dominio atlas.bolg.cl y subir landing teaser con email capture: "Próximamente: la bitácora de todas las BØLG del mundo."
	•	Mockup hi-fi de 4 pantallas clave (Home + Atlas + Perfil usuario + Perfil producto) en Figma — antes de tocar código.
	•	Decision crítica: ¿lo construimos in-house o contratamos un equipo? Mi recomendación: un dev senior full-stack contratado dedicado + designer freelance + tú como product. Costo realista: $4-6M CLP/mes por equipo, MVP en 3 meses.
	•	Producir los primeros 500 QR codes insertados en los próximos packagings → arrancar el flywheel desde día 0 incluso sin plataforma todavía (el QR redirige a la landing teaser hasta que esté el producto).



El insight final: la mayoría de marcas outdoor cuentan sus propias historias. La tuya va a contar las de tus clientes. Esa inversión de poder narrativo es lo que va a hacer que esto se vuelva movimiento, no producto.

Las olas no se quedan quietas.

— Documento estratégico v1 · BØLG Atlas

