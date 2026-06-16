/**
 * Los 100 Destinos BØLG — la lista curada de la marca.
 *
 * No es "las 100 ciudades más grandes" ni "las 100 más visitadas". Es
 * la voz BØLG diciendo: estos son los lugares que importan en el mundo
 * outdoor / aventura / cultura icónica. Mezcla iconos masivos (Cusco,
 * Tokyo) con joyas escondidas (Cochamó, Lofoten).
 *
 * Distribución intencional:
 *   - 26 Sudamérica (peso de casa: Chile concentra)
 *   - 10 Norteamérica
 *   - 18 Europa
 *   - 18 Asia
 *   - 12 África
 *   - 10 Oceanía
 *   -  2 Antártida (porque sí)
 *   -  4 Centroamérica + extras
 *
 * Categorías:
 *   - "iconic"   → lo que aparece en revistas
 *   - "hidden"   → joya escondida, prestigio entre conocedores
 *   - "natural"  → naturaleza pura
 *   - "cultural" → ruinas, ciudades históricas
 *   - "extreme"  → frontera / aventura
 *
 * Matching: cuando un city_visit cae a ≤80km de un destino BØLG, cuenta
 * como "tocado". Usamos lat/lng porque Mapbox normaliza nombres distinto.
 */

export type Bolg100Category = "iconic" | "hidden" | "natural" | "cultural" | "extreme";

export type Bolg100Destination = {
  id: string;
  name: string;
  country: string;
  countryCode: string; // alpha-2 lowercase
  continentCode: "SA" | "NA" | "EU" | "AS" | "AF" | "OC" | "AN";
  lat: number;
  lng: number;
  category: Bolg100Category;
  hook: string; // 1 línea de copy BØLG
};

export const BOLG_100: Bolg100Destination[] = [
  // ───────────── CHILE (10) ─────────────
  { id: "pucon", name: "Pucón", country: "Chile", countryCode: "cl", continentCode: "SA", lat: -39.27, lng: -71.97, category: "iconic", hook: "El volcán Villarrica humeando sobre el lago." },
  { id: "atacama", name: "San Pedro de Atacama", country: "Chile", countryCode: "cl", continentCode: "SA", lat: -22.91, lng: -68.20, category: "natural", hook: "El desierto más seco del mundo y cielo de estrellas." },
  { id: "natales", name: "Puerto Natales", country: "Chile", countryCode: "cl", continentCode: "SA", lat: -51.73, lng: -72.51, category: "iconic", hook: "Puerta de las Torres del Paine." },
  { id: "valpo", name: "Valparaíso", country: "Chile", countryCode: "cl", continentCode: "SA", lat: -33.05, lng: -71.62, category: "cultural", hook: "Cerros bohemios y arte rayado en cada esquina." },
  { id: "coyhaique", name: "Coyhaique", country: "Chile", countryCode: "cl", continentCode: "SA", lat: -45.57, lng: -72.07, category: "hidden", hook: "Capital de la Carretera Austral." },
  { id: "punta-arenas", name: "Punta Arenas", country: "Chile", countryCode: "cl", continentCode: "SA", lat: -53.16, lng: -70.92, category: "extreme", hook: "Donde el viento del Estrecho de Magallanes corta." },
  { id: "cochamo", name: "Cochamó", country: "Chile", countryCode: "cl", continentCode: "SA", lat: -41.50, lng: -72.32, category: "hidden", hook: "El Yosemite chileno. Granito puro." },
  { id: "chiloe", name: "Castro, Chiloé", country: "Chile", countryCode: "cl", continentCode: "SA", lat: -42.48, lng: -73.76, category: "cultural", hook: "Palafitos, brujería e iglesias de madera." },
  { id: "la-serena", name: "La Serena", country: "Chile", countryCode: "cl", continentCode: "SA", lat: -29.91, lng: -71.25, category: "natural", hook: "Valle de Elqui y cielos de observatorio." },
  { id: "rapa-nui", name: "Hanga Roa, Rapa Nui", country: "Chile", countryCode: "cl", continentCode: "SA", lat: -27.15, lng: -109.42, category: "iconic", hook: "Moais mirando el Pacífico." },

  // ───────────── ARGENTINA (5) ─────────────
  { id: "el-chalten", name: "El Chaltén", country: "Argentina", countryCode: "ar", continentCode: "SA", lat: -49.33, lng: -72.89, category: "iconic", hook: "Capital nacional del trekking. Fitz Roy." },
  { id: "bariloche", name: "Bariloche", country: "Argentina", countryCode: "ar", continentCode: "SA", lat: -41.13, lng: -71.31, category: "iconic", hook: "Andes argentinos + chocolate suizo." },
  { id: "mendoza", name: "Mendoza", country: "Argentina", countryCode: "ar", continentCode: "SA", lat: -32.89, lng: -68.84, category: "cultural", hook: "Malbec a los pies del Aconcagua." },
  { id: "salta", name: "Salta", country: "Argentina", countryCode: "ar", continentCode: "SA", lat: -24.78, lng: -65.41, category: "cultural", hook: "Noroeste colonial andino." },
  { id: "ushuaia", name: "Ushuaia", country: "Argentina", countryCode: "ar", continentCode: "SA", lat: -54.81, lng: -68.30, category: "extreme", hook: "Fin del mundo. Embarcadero a la Antártida." },

  // ───────────── BRASIL (3) ─────────────
  { id: "rio", name: "Río de Janeiro", country: "Brasil", countryCode: "br", continentCode: "SA", lat: -22.91, lng: -43.17, category: "iconic", hook: "Playa, samba y montañas en la misma postal." },
  { id: "salvador-ba", name: "Salvador da Bahia", country: "Brasil", countryCode: "br", continentCode: "SA", lat: -12.97, lng: -38.51, category: "cultural", hook: "Color, candomblé y atabaques." },
  { id: "noronha", name: "Fernando de Noronha", country: "Brasil", countryCode: "br", continentCode: "SA", lat: -3.85, lng: -32.43, category: "hidden", hook: "Archipiélago volcánico con visibilidad submarina absurda." },

  // ───────────── PERÚ (3) ─────────────
  { id: "cusco", name: "Cusco", country: "Perú", countryCode: "pe", continentCode: "SA", lat: -13.53, lng: -71.97, category: "iconic", hook: "Capital incaica. Puerta a Machu Picchu." },
  { id: "huaraz", name: "Huaraz", country: "Perú", countryCode: "pe", continentCode: "SA", lat: -9.53, lng: -77.53, category: "natural", hook: "Cordillera Blanca y nieves perpetuas." },
  { id: "iquitos", name: "Iquitos", country: "Perú", countryCode: "pe", continentCode: "SA", lat: -3.74, lng: -73.25, category: "extreme", hook: "Ciudad sin caminos. Solo Amazonas." },

  // ───────────── BOLIVIA (2) ─────────────
  { id: "uyuni", name: "Uyuni", country: "Bolivia", countryCode: "bo", continentCode: "SA", lat: -20.46, lng: -66.83, category: "iconic", hook: "El espejo del cielo más grande del planeta." },
  { id: "la-paz", name: "La Paz", country: "Bolivia", countryCode: "bo", continentCode: "SA", lat: -16.49, lng: -68.15, category: "extreme", hook: "3.640m. La capital más alta del mundo." },

  // ───────────── RESTO SUDAMÉRICA (3) ─────────────
  { id: "quito", name: "Quito", country: "Ecuador", countryCode: "ec", continentCode: "SA", lat: -0.18, lng: -78.47, category: "cultural", hook: "Centro histórico colonial sobre los Andes." },
  { id: "galapagos", name: "Puerto Ayora, Galápagos", country: "Ecuador", countryCode: "ec", continentCode: "SA", lat: -0.74, lng: -90.32, category: "natural", hook: "Donde Darwin entendió todo." },
  { id: "cartagena", name: "Cartagena", country: "Colombia", countryCode: "co", continentCode: "SA", lat: 10.39, lng: -75.51, category: "cultural", hook: "Caribe colonial amurallado." },

  // ───────────── NORTEAMÉRICA (10) ─────────────
  { id: "banff", name: "Banff", country: "Canadá", countryCode: "ca", continentCode: "NA", lat: 51.18, lng: -115.57, category: "iconic", hook: "Rockies canadienses + lagos turquesa." },
  { id: "whistler", name: "Whistler", country: "Canadá", countryCode: "ca", continentCode: "NA", lat: 50.12, lng: -122.96, category: "iconic", hook: "Esquí grande + biking serio en verano." },
  { id: "whitehorse", name: "Whitehorse, Yukón", country: "Canadá", countryCode: "ca", continentCode: "NA", lat: 60.72, lng: -135.05, category: "extreme", hook: "Auroras boreales y tundra ártica." },
  { id: "jackson", name: "Jackson, Wyoming", country: "Estados Unidos", countryCode: "us", continentCode: "NA", lat: 43.48, lng: -110.76, category: "iconic", hook: "Puerta a Yellowstone + Grand Tetons." },
  { id: "moab", name: "Moab, Utah", country: "Estados Unidos", countryCode: "us", continentCode: "NA", lat: 38.57, lng: -109.55, category: "natural", hook: "Desierto rojo. Arches + Canyonlands." },
  { id: "mariposa", name: "Mariposa (Yosemite), California", country: "Estados Unidos", countryCode: "us", continentCode: "NA", lat: 37.48, lng: -119.97, category: "iconic", hook: "El Cap, granito y secuoyas." },
  { id: "aspen", name: "Aspen, Colorado", country: "Estados Unidos", countryCode: "us", continentCode: "NA", lat: 39.19, lng: -106.82, category: "iconic", hook: "Esquí icónico americano." },
  { id: "anchorage", name: "Anchorage, Alaska", country: "Estados Unidos", countryCode: "us", continentCode: "NA", lat: 61.22, lng: -149.90, category: "extreme", hook: "Puerta al wilderness más salvaje de EE.UU." },
  { id: "tulum", name: "Tulum", country: "México", countryCode: "mx", continentCode: "NA", lat: 20.21, lng: -87.46, category: "iconic", hook: "Ruinas maya frente al Caribe." },
  { id: "oaxaca", name: "Oaxaca", country: "México", countryCode: "mx", continentCode: "NA", lat: 17.07, lng: -96.72, category: "cultural", hook: "Mezcal, mole y artesanos zapotecas." },

  // ───────────── CENTROAMÉRICA (4) ─────────────
  { id: "monteverde", name: "Monteverde", country: "Costa Rica", countryCode: "cr", continentCode: "NA", lat: 10.30, lng: -84.81, category: "natural", hook: "Bosque nuboso. Quetzales sobre la niebla." },
  { id: "boquete", name: "Boquete", country: "Panamá", countryCode: "pa", continentCode: "NA", lat: 8.78, lng: -82.43, category: "hidden", hook: "Café premium + Volcán Barú." },
  { id: "tikal", name: "Tikal", country: "Guatemala", countryCode: "gt", continentCode: "NA", lat: 17.22, lng: -89.62, category: "cultural", hook: "Templos mayas saliendo de la selva." },

  // ───────────── EUROPA (18) ─────────────
  { id: "chamonix", name: "Chamonix", country: "Francia", countryCode: "fr", continentCode: "EU", lat: 45.92, lng: 6.87, category: "iconic", hook: "Capital mundial del alpinismo. Mont Blanc." },
  { id: "zermatt", name: "Zermatt", country: "Suiza", countryCode: "ch", continentCode: "EU", lat: 46.02, lng: 7.75, category: "iconic", hook: "El Matterhorn detrás de cada esquina." },
  { id: "interlaken", name: "Interlaken", country: "Suiza", countryCode: "ch", continentCode: "EU", lat: 46.69, lng: 7.85, category: "natural", hook: "Dos lagos turquesas y los Alpes Berneses." },
  { id: "lofoten", name: "Reine, Lofoten", country: "Noruega", countryCode: "no", continentCode: "EU", lat: 67.94, lng: 13.09, category: "hidden", hook: "Fiordos árticos con cabañas rojas." },
  { id: "tromso", name: "Tromsø", country: "Noruega", countryCode: "no", continentCode: "EU", lat: 69.65, lng: 18.96, category: "natural", hook: "Auroras boreales sobre la ciudad ártica." },
  { id: "reykjavik", name: "Reykjavík", country: "Islandia", countryCode: "is", continentCode: "EU", lat: 64.15, lng: -21.94, category: "iconic", hook: "Fuego y hielo en cada kilómetro." },
  { id: "akureyri", name: "Akureyri", country: "Islandia", countryCode: "is", continentCode: "EU", lat: 65.68, lng: -18.09, category: "hidden", hook: "Norte islandés. Ballenas y volcanes." },
  { id: "bled", name: "Bled", country: "Eslovenia", countryCode: "si", continentCode: "EU", lat: 46.37, lng: 14.10, category: "iconic", hook: "El lago con la iglesia en una isla." },
  { id: "vernazza", name: "Vernazza, Cinque Terre", country: "Italia", countryCode: "it", continentCode: "EU", lat: 44.13, lng: 9.69, category: "iconic", hook: "Casas pastel sobre el Ligurio." },
  { id: "cortina", name: "Cortina d'Ampezzo", country: "Italia", countryCode: "it", continentCode: "EU", lat: 46.54, lng: 12.13, category: "iconic", hook: "Dolomitas: rocas verticales y prosecco." },
  { id: "roma", name: "Roma", country: "Italia", countryCode: "it", continentCode: "EU", lat: 41.90, lng: 12.50, category: "iconic", hook: "La ciudad eterna. Coliseo + Foro." },
  { id: "granada", name: "Granada", country: "España", countryCode: "es", continentCode: "EU", lat: 37.18, lng: -3.60, category: "cultural", hook: "La Alhambra al pie de Sierra Nevada." },
  { id: "soller", name: "Sóller, Mallorca", country: "España", countryCode: "es", continentCode: "EU", lat: 39.76, lng: 2.71, category: "hidden", hook: "Tramuntana, naranjos y costa salvaje." },
  { id: "donosti", name: "Donostia / San Sebastián", country: "España", countryCode: "es", continentCode: "EU", lat: 43.32, lng: -1.98, category: "cultural", hook: "Pintxos + ola perfecta." },
  { id: "sintra", name: "Sintra", country: "Portugal", countryCode: "pt", continentCode: "EU", lat: 38.80, lng: -9.39, category: "cultural", hook: "Palacios coloridos entre la bruma." },
  { id: "plitvice", name: "Korenica, Plitvice", country: "Croacia", countryCode: "hr", continentCode: "EU", lat: 44.74, lng: 15.71, category: "natural", hook: "16 lagos turquesas en cascada." },
  { id: "kotor", name: "Kotor", country: "Montenegro", countryCode: "me", continentCode: "EU", lat: 42.43, lng: 18.77, category: "hidden", hook: "El único fiordo del Mediterráneo." },
  { id: "edimburgo", name: "Edimburgo", country: "Reino Unido", countryCode: "gb", continentCode: "EU", lat: 55.95, lng: -3.18, category: "cultural", hook: "Puerta a las Highlands escocesas." },

  // ───────────── ASIA (18) ─────────────
  { id: "kyoto", name: "Kyoto", country: "Japón", countryCode: "jp", continentCode: "AS", lat: 35.01, lng: 135.77, category: "iconic", hook: "1.000 años de templos, cerezos y geishas." },
  { id: "sapporo", name: "Sapporo, Hokkaido", country: "Japón", countryCode: "jp", continentCode: "AS", lat: 43.06, lng: 141.35, category: "natural", hook: "Nieve seca legendaria + onsen." },
  { id: "fuji", name: "Fujiyoshida, Mt Fuji", country: "Japón", countryCode: "jp", continentCode: "AS", lat: 35.49, lng: 138.81, category: "iconic", hook: "La montaña sagrada de Japón." },
  { id: "seoul", name: "Seúl", country: "Corea del Sur", countryCode: "kr", continentCode: "AS", lat: 37.57, lng: 126.98, category: "iconic", hook: "Megaciudad eléctrica con templos escondidos." },
  { id: "busan", name: "Busan", country: "Corea del Sur", countryCode: "kr", continentCode: "AS", lat: 35.18, lng: 129.08, category: "cultural", hook: "Costa coreana + Gamcheon de colores." },
  { id: "ubud", name: "Ubud, Bali", country: "Indonesia", countryCode: "id", continentCode: "AS", lat: -8.51, lng: 115.26, category: "iconic", hook: "Selva, terrazas de arroz y templos hindúes." },
  { id: "komodo", name: "Labuan Bajo, Komodo", country: "Indonesia", countryCode: "id", continentCode: "AS", lat: -8.50, lng: 119.89, category: "extreme", hook: "Dragones reales en archipiélago tropical." },
  { id: "luang-prabang", name: "Luang Prabang", country: "Laos", countryCode: "la", continentCode: "AS", lat: 19.89, lng: 102.13, category: "cultural", hook: "Procesión de monjes naranjas al amanecer." },
  { id: "chiang-mai", name: "Chiang Mai", country: "Tailandia", countryCode: "th", continentCode: "AS", lat: 18.78, lng: 98.99, category: "cultural", hook: "Norte de Tailandia + festival de linternas." },
  { id: "hoi-an", name: "Hoi An", country: "Vietnam", countryCode: "vn", continentCode: "AS", lat: 15.88, lng: 108.34, category: "iconic", hook: "Ciudad antigua iluminada por linternas." },
  { id: "sapa", name: "Sapa", country: "Vietnam", countryCode: "vn", continentCode: "AS", lat: 22.34, lng: 103.84, category: "hidden", hook: "Terrazas de arroz al norte profundo." },
  { id: "pokhara", name: "Pokhara", country: "Nepal", countryCode: "np", continentCode: "AS", lat: 28.21, lng: 83.98, category: "iconic", hook: "Lago a los pies del Annapurna." },
  { id: "katmandu", name: "Katmandú", country: "Nepal", countryCode: "np", continentCode: "AS", lat: 27.71, lng: 85.32, category: "cultural", hook: "Puerta del Himalaya. Templos y stupas." },
  { id: "leh", name: "Leh, Ladakh", country: "India", countryCode: "in", continentCode: "AS", lat: 34.16, lng: 77.58, category: "extreme", hook: "3.500m. Pequeño Tíbet indio." },
  { id: "petra", name: "Wadi Musa (Petra)", country: "Jordania", countryCode: "jo", continentCode: "AS", lat: 30.32, lng: 35.45, category: "iconic", hook: "La ciudad rosa tallada en piedra." },
  { id: "wadi-rum", name: "Wadi Rum", country: "Jordania", countryCode: "jo", continentCode: "AS", lat: 29.58, lng: 35.42, category: "natural", hook: "Desierto rojo donde se filmó Marte." },
  { id: "goreme", name: "Göreme, Capadocia", country: "Turquía", countryCode: "tr", continentCode: "AS", lat: 38.64, lng: 34.83, category: "iconic", hook: "Globos al amanecer sobre chimeneas de roca." },
  { id: "estambul", name: "Estambul", country: "Turquía", countryCode: "tr", continentCode: "AS", lat: 41.01, lng: 28.98, category: "cultural", hook: "Donde Europa y Asia se besan." },

  // ───────────── ÁFRICA (12) ─────────────
  { id: "marrakech", name: "Marrakech", country: "Marruecos", countryCode: "ma", continentCode: "AF", lat: 31.63, lng: -7.99, category: "iconic", hook: "Medina, especias y djembés." },
  { id: "chefchaouen", name: "Chefchaouen", country: "Marruecos", countryCode: "ma", continentCode: "AF", lat: 35.17, lng: -5.27, category: "iconic", hook: "El pueblo entero pintado de azul." },
  { id: "merzouga", name: "Merzouga, Sahara", country: "Marruecos", countryCode: "ma", continentCode: "AF", lat: 31.10, lng: -4.01, category: "natural", hook: "Dunas naranjas. Dormir bajo estrellas." },
  { id: "cairo", name: "El Cairo", country: "Egipto", countryCode: "eg", continentCode: "AF", lat: 30.04, lng: 31.24, category: "iconic", hook: "Las pirámides y la mirada de la Esfinge." },
  { id: "luxor", name: "Luxor", country: "Egipto", countryCode: "eg", continentCode: "AF", lat: 25.69, lng: 32.64, category: "cultural", hook: "El museo a cielo abierto del Nilo." },
  { id: "cape-town", name: "Ciudad del Cabo", country: "Sudáfrica", countryCode: "za", continentCode: "AF", lat: -33.92, lng: 18.42, category: "iconic", hook: "Table Mountain mirando al Atlántico." },
  { id: "kruger", name: "Hazyview, Kruger", country: "Sudáfrica", countryCode: "za", continentCode: "AF", lat: -25.04, lng: 31.13, category: "natural", hook: "Big Five en safari abierto." },
  { id: "serengeti", name: "Seronera, Serengeti", country: "Tanzania", countryCode: "tz", continentCode: "AF", lat: -2.43, lng: 34.83, category: "natural", hook: "La gran migración de los ñúes." },
  { id: "zanzibar", name: "Stone Town, Zanzíbar", country: "Tanzania", countryCode: "tz", continentCode: "AF", lat: -6.16, lng: 39.20, category: "cultural", hook: "Especias, swahili y dhows en el Índico." },
  { id: "moshi", name: "Moshi (Kilimanjaro)", country: "Tanzania", countryCode: "tz", continentCode: "AF", lat: -3.35, lng: 37.34, category: "extreme", hook: "Base del techo de África. 5.895m." },
  { id: "lalibela", name: "Lalibela", country: "Etiopía", countryCode: "et", continentCode: "AF", lat: 12.03, lng: 39.04, category: "hidden", hook: "Iglesias talladas en roca, 800 años." },
  { id: "antananarivo", name: "Antananarivo", country: "Madagascar", countryCode: "mg", continentCode: "AF", lat: -18.88, lng: 47.51, category: "extreme", hook: "Lémures y baobabs. Otra evolución." },

  // ───────────── OCEANÍA (10) ─────────────
  { id: "queenstown", name: "Queenstown", country: "Nueva Zelanda", countryCode: "nz", continentCode: "OC", lat: -45.03, lng: 168.66, category: "iconic", hook: "Capital mundial de los deportes de adrenalina." },
  { id: "milford", name: "Te Anau, Milford", country: "Nueva Zelanda", countryCode: "nz", continentCode: "OC", lat: -45.41, lng: 167.72, category: "natural", hook: "El fiordo más fotografiado del hemisferio sur." },
  { id: "wanaka", name: "Wanaka", country: "Nueva Zelanda", countryCode: "nz", continentCode: "OC", lat: -44.70, lng: 169.13, category: "hidden", hook: "Lago, montañas y ese árbol famoso." },
  { id: "sydney", name: "Sídney", country: "Australia", countryCode: "au", continentCode: "OC", lat: -33.86, lng: 151.21, category: "iconic", hook: "Ópera, puente y bahía perfecta." },
  { id: "uluru", name: "Yulara, Uluru", country: "Australia", countryCode: "au", continentCode: "OC", lat: -25.24, lng: 130.99, category: "iconic", hook: "El corazón rojo de Australia." },
  { id: "cairns", name: "Cairns, Gran Barrera", country: "Australia", countryCode: "au", continentCode: "OC", lat: -16.92, lng: 145.77, category: "natural", hook: "El arrecife coralino más grande del planeta." },
  { id: "hobart", name: "Hobart, Tasmania", country: "Australia", countryCode: "au", continentCode: "OC", lat: -42.88, lng: 147.33, category: "hidden", hook: "Wilderness tasmano + arte contemporáneo." },
  { id: "bora-bora", name: "Bora Bora", country: "Polinesia Francesa", countryCode: "pf", continentCode: "OC", lat: -16.50, lng: -151.74, category: "iconic", hook: "Laguna turquesa. El paraíso cliché." },
  { id: "suva", name: "Suva", country: "Fiji", countryCode: "fj", continentCode: "OC", lat: -18.14, lng: 178.44, category: "hidden", hook: "Capital del Pacífico Sur." },
  { id: "port-vila", name: "Port Vila", country: "Vanuatu", countryCode: "vu", continentCode: "OC", lat: -17.73, lng: 168.31, category: "extreme", hook: "Volcán activo a la vista." },

  // ───────────── ASIA EXTRA / RUSIA (1) ─────────────
  { id: "kamchatka", name: "Petropávlovsk-Kamchatski", country: "Rusia", countryCode: "ru", continentCode: "AS", lat: 53.02, lng: 158.65, category: "extreme", hook: "Volcanes y osos pardos. La última frontera." },

  // ───────────── ANTÁRTIDA (2) ─────────────
  { id: "frei", name: "Base Presidente Frei", country: "Antártida Chilena", countryCode: "aq", continentCode: "AN", lat: -62.20, lng: -58.96, category: "extreme", hook: "Base científica chilena. Pingüinos como vecinos." },
  { id: "paradise-bay", name: "Bahía Paraíso", country: "Antártida", countryCode: "aq", continentCode: "AN", lat: -64.83, lng: -62.85, category: "extreme", hook: "Icebergs azules y silencio total." },
];

// Sanidad: el conteo debe ser exactamente 100.
if (
  typeof process !== "undefined" &&
  process.env.NODE_ENV !== "production" &&
  BOLG_100.length !== 100
) {
  console.warn(`[bolg-100] Lista tiene ${BOLG_100.length} destinos, esperado 100.`);
}

/**
 * Devuelve el destino BØLG-100 más cercano dentro de un radio (default 80km),
 * o null si no hay match. Usa haversine.
 */
export function matchBolg100(
  lat: number,
  lng: number,
  radiusKm = 80,
): Bolg100Destination | null {
  let best: Bolg100Destination | null = null;
  let bestD = Infinity;
  for (const d of BOLG_100) {
    const dKm = haversine(lat, lng, d.lat, d.lng);
    if (dKm <= radiusKm && dKm < bestD) {
      best = d;
      bestD = dKm;
    }
  }
  return best;
}

function haversine(la1: number, lo1: number, la2: number, lo2: number): number {
  const R = 6371; // km
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLa = toRad(la2 - la1);
  const dLo = toRad(lo2 - lo1);
  const a =
    Math.sin(dLa / 2) ** 2 +
    Math.cos(toRad(la1)) * Math.cos(toRad(la2)) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
