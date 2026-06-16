"use client";

import { memo, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";

/**
 * Mapa-mundi 2D para el Atlas v2 — versión "pins por ciudad".
 *
 * Cambio de diseño (Sesión post-v2): antes pintábamos países enteros
 * según su status de conquista, pero eso engaña (alguien va a Filadelfia
 * y todo USA queda verde). Ahora todos los países quedan en mist crema
 * neutro y la conquista se dibuja como pins (círculos) en cada lat/lng
 * visitado. Aurora = BØLG visible, mist oscuro = visita sin BØLG.
 *
 * El topojson se carga desde JSDelivr (~30KB) — react-simple-maps lo
 * fetchea client-side la primera vez. Para offline o producción ultra
 * seria, mover a /public/world-110m.json.
 */

const TOPOJSON_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export type CityPin = {
  cityId: string;
  lat: number;
  lng: number;
  name: string;
  countryCode: string; // alpha-2 lowercase, para tintar el país de fondo
  bolgVisible: boolean;
  conquerorUsername: string | null;
};

export type Bolg100Pin = {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  touched: boolean;
  touchedByMe: boolean;
  bolgVisibleHit: boolean;
  hook: string;
};

export type WorldMapProps = {
  /** Pins por cada ciudad conquistada en la comunidad. */
  cityPins: CityPin[];
  /** 100 destinos BØLG. Los `touched: false` se renderizan como targets vacíos. */
  bolg100Pins?: Bolg100Pin[];
  /** Pin actualmente seleccionado (se dibuja más grande). */
  selectedCityId?: string | null;
  /** Click sobre un país (alpha-2 lowercase). Se usa para el drill-down. */
  onCountryClick?: (countryCode: string) => void;
  /** Click sobre un pin de ciudad. */
  onCityClick?: (cityId: string) => void;
  /** Click sobre un destino BØLG-100. */
  onBolg100Click?: (bolg100Id: string) => void;
  /** País actualmente seleccionado (se resalta con stroke). */
  selectedCountry?: string | null;
};

// Mapa numérico ISO 3166-1 numeric (lo que trae world-atlas/countries-110m)
// → alpha-2 lowercase. world-atlas usa el código numérico como `id` de
// cada Geography. Lo mantenemos acá para evitar otra dependencia.
const NUMERIC_TO_ALPHA2: Record<string, string> = {
  "004": "af", "008": "al", "010": "aq", "012": "dz", "016": "as", "020": "ad",
  "024": "ao", "028": "ag", "031": "az", "032": "ar", "036": "au", "040": "at",
  "044": "bs", "048": "bh", "050": "bd", "051": "am", "052": "bb", "056": "be",
  "060": "bm", "064": "bt", "068": "bo", "070": "ba", "072": "bw", "074": "bv",
  "076": "br", "084": "bz", "086": "io", "090": "sb", "092": "vg", "096": "bn",
  "100": "bg", "104": "mm", "108": "bi", "112": "by", "116": "kh", "120": "cm",
  "124": "ca", "132": "cv", "136": "ky", "140": "cf", "144": "lk", "148": "td",
  "152": "cl", "156": "cn", "158": "tw", "162": "cx", "166": "cc", "170": "co",
  "174": "km", "175": "yt", "178": "cg", "180": "cd", "184": "ck", "188": "cr",
  "191": "hr", "192": "cu", "196": "cy", "203": "cz", "204": "bj", "208": "dk",
  "212": "dm", "214": "do", "218": "ec", "222": "sv", "226": "gq", "231": "et",
  "232": "er", "233": "ee", "234": "fo", "238": "fk", "239": "gs", "242": "fj",
  "246": "fi", "248": "ax", "250": "fr", "254": "gf", "258": "pf", "260": "tf",
  "262": "dj", "266": "ga", "268": "ge", "270": "gm", "275": "ps", "276": "de",
  "288": "gh", "292": "gi", "296": "ki", "300": "gr", "304": "gl", "308": "gd",
  "312": "gp", "316": "gu", "320": "gt", "324": "gn", "328": "gy", "332": "ht",
  "334": "hm", "336": "va", "340": "hn", "344": "hk", "348": "hu", "352": "is",
  "356": "in", "360": "id", "364": "ir", "368": "iq", "372": "ie", "376": "il",
  "380": "it", "384": "ci", "388": "jm", "392": "jp", "398": "kz", "400": "jo",
  "404": "ke", "408": "kp", "410": "kr", "414": "kw", "417": "kg", "418": "la",
  "422": "lb", "426": "ls", "428": "lv", "430": "lr", "434": "ly", "438": "li",
  "440": "lt", "442": "lu", "446": "mo", "450": "mg", "454": "mw", "458": "my",
  "462": "mv", "466": "ml", "470": "mt", "474": "mq", "478": "mr", "480": "mu",
  "484": "mx", "492": "mc", "496": "mn", "498": "md", "499": "me", "500": "ms",
  "504": "ma", "508": "mz", "512": "om", "516": "na", "520": "nr", "524": "np",
  "528": "nl", "531": "cw", "533": "aw", "534": "sx", "535": "bq", "540": "nc",
  "548": "vu", "554": "nz", "558": "ni", "562": "ne", "566": "ng", "570": "nu",
  "574": "nf", "578": "no", "580": "mp", "583": "fm", "584": "mh", "585": "pw",
  "586": "pk", "591": "pa", "598": "pg", "600": "py", "604": "pe", "608": "ph",
  "612": "pn", "616": "pl", "620": "pt", "624": "gw", "626": "tl", "630": "pr",
  "634": "qa", "638": "re", "642": "ro", "643": "ru", "646": "rw", "652": "bl",
  "654": "sh", "659": "kn", "660": "ai", "662": "lc", "663": "mf", "666": "pm",
  "670": "vc", "674": "sm", "678": "st", "682": "sa", "686": "sn", "688": "rs",
  "690": "sc", "694": "sl", "702": "sg", "703": "sk", "704": "vn", "705": "si",
  "706": "so", "710": "za", "716": "zw", "724": "es", "728": "ss", "729": "sd",
  "732": "eh", "740": "sr", "744": "sj", "748": "sz", "752": "se", "756": "ch",
  "760": "sy", "762": "tj", "764": "th", "768": "tg", "772": "tk", "776": "to",
  "780": "tt", "784": "ae", "788": "tn", "792": "tr", "795": "tm", "796": "tc",
  "798": "tv", "800": "ug", "804": "ua", "807": "mk", "818": "eg", "826": "gb",
  "831": "gg", "832": "je", "833": "im", "834": "tz", "840": "us", "850": "vi",
  "854": "bf", "858": "uy", "860": "uz", "862": "ve", "876": "wf", "882": "ws",
  "887": "ye", "894": "zm",
};

// Paleta BØLG. Los países no-visitados usan el mist neutro. Los países
// CON ciudades visitadas reciben un tinte sutil (no es "el país entero
// conquistado" — solo un hint visual de que ese territorio está tocado).
const COUNTRY_FILL = "#dcd8d0"; // mist — país sin actividad
const COUNTRY_FILL_TOUCHED = "#c5d6d3"; // mist con tinte aurora suave — al menos 1 ciudad visitada
const PIN_BOLG = "#5bc0be"; // aurora — visita con BØLG visible
const PIN_NO_BOLG = "#5a5754"; // gris más oscuro — visita sin BØLG
const PIN_STROKE = "#0a0a0a"; // borde oscuro para legibilidad sobre el mist
const HALO_BOLG = "#5bc0be"; // halo aurora
const HALO_NO_BOLG = "#5a5754";
const BOLG100_TARGET = "#d4a373"; // ember — target sin conquistar
const BOLG100_TARGET_STROKE = "#0a0a0a";

export const WorldMap = memo(function WorldMap({
  cityPins,
  bolg100Pins,
  selectedCityId,
  onCountryClick,
  onCityClick,
  onBolg100Click,
  selectedCountry,
}: WorldMapProps) {
  const pins = useMemo(() => cityPins, [cityPins]);
  // Set de países con al menos 1 ciudad visitada — alimentamos el tinte
  // suave de Geography para dar la sensación de "territorio tocado" sin
  // pintar todo el país.
  const touchedCountries = useMemo(() => {
    const s = new Set<string>();
    for (const p of cityPins) {
      if (p.countryCode) s.add(p.countryCode.toLowerCase());
    }
    return s;
  }, [cityPins]);

  return (
    <ComposableMap
      projection="geoNaturalEarth1"
      projectionConfig={{ scale: 165 }}
      style={{ width: "100%", height: "100%" }}
    >
      <ZoomableGroup
        center={[-30, -10]}
        zoom={1.1}
        maxZoom={6}
        minZoom={0.8}
      >
        <Geographies geography={TOPOJSON_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const numeric = String(geo.id);
              const alpha2 =
                NUMERIC_TO_ALPHA2[numeric] ??
                NUMERIC_TO_ALPHA2[numeric.padStart(3, "0")] ??
                null;
              const isSelected = alpha2 && alpha2 === selectedCountry;
              const isTouched = alpha2 && touchedCountries.has(alpha2);
              const isInteractive = !!alpha2;
              const baseFill = isTouched ? COUNTRY_FILL_TOUCHED : COUNTRY_FILL;
              const hoverFill = isTouched ? "#b6cdca" : "#cfcabf";
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => {
                    if (alpha2 && onCountryClick) onCountryClick(alpha2);
                  }}
                  style={{
                    default: {
                      fill: baseFill,
                      stroke: isSelected ? "#0a0a0a" : "#f4f1ea",
                      strokeWidth: isSelected ? 1.2 : 0.4,
                      outline: "none",
                      cursor: isInteractive ? "pointer" : "default",
                    },
                    hover: {
                      fill: hoverFill,
                      stroke: "#0a0a0a",
                      strokeWidth: 0.6,
                      outline: "none",
                      cursor: isInteractive ? "pointer" : "default",
                    },
                    pressed: {
                      fill: isTouched ? "#a8c0bd" : "#c4bfb3",
                      stroke: "#0a0a0a",
                      strokeWidth: 0.6,
                      outline: "none",
                    },
                  }}
                />
              );
            })
          }
        </Geographies>

        {/* Ghost pins de los BØLG-100 sin conquistar — markers tipo "target"
            con anillo ember discontinuo. Si touched=true, los saltamos
            (esa ciudad ya aparece como pin normal abajo). */}
        {(bolg100Pins ?? [])
          .filter((d) => !d.touched)
          .map((d) => (
            <Marker
              key={`b100-${d.id}`}
              coordinates={[d.lng, d.lat]}
              onClick={(event) => {
                event.stopPropagation();
                if (onBolg100Click) onBolg100Click(d.id);
              }}
              style={{
                default: { cursor: "pointer", outline: "none" },
                hover: { cursor: "pointer", outline: "none" },
                pressed: { cursor: "pointer", outline: "none" },
              }}
            >
              <circle
                r={5.5}
                fill="transparent"
                stroke={BOLG100_TARGET}
                strokeWidth={1.4}
                strokeDasharray="2 1.6"
              >
                <title>{`${d.name} · ${d.country} — destino BØLG sin conquistar`}</title>
              </circle>
              {/* Estrella pequeña al centro para el reconocimiento visual */}
              <path
                d="M0,-2.4 L0.7,-0.7 L2.4,-0.7 L1,0.4 L1.5,2.2 L0,1.2 L-1.5,2.2 L-1,0.4 L-2.4,-0.7 L-0.7,-0.7 Z"
                fill={BOLG100_TARGET}
                stroke={BOLG100_TARGET_STROKE}
                strokeWidth={0.3}
              />
            </Marker>
          ))}

        {pins.map((pin) => {
          const isActive = pin.cityId === selectedCityId;
          const innerR = isActive ? 6 : 4.5;
          const haloR = isActive ? 14 : 11;
          const fill = pin.bolgVisible ? PIN_BOLG : PIN_NO_BOLG;
          const haloFill = pin.bolgVisible ? HALO_BOLG : HALO_NO_BOLG;
          // Solo los pins BØLG pulsan — diferenciación visual.
          const pulses = pin.bolgVisible;
          return (
            <Marker
              key={pin.cityId}
              coordinates={[pin.lng, pin.lat]}
              onClick={(event) => {
                // Evita que el click llegue al país de abajo y abra el
                // CountryPanel a la vez que el CityPanel.
                event.stopPropagation();
                if (onCityClick) onCityClick(pin.cityId);
              }}
              style={{
                default: { cursor: "pointer", outline: "none" },
                hover: { cursor: "pointer", outline: "none" },
                pressed: { cursor: "pointer", outline: "none" },
              }}
            >
              {/* Halo exterior — siempre, da peso visual y sensación de
                  territorio. Los BØLG pulsan para destacar aún más. */}
              <circle
                r={haloR}
                fill={haloFill}
                fillOpacity={0.18}
                stroke="none"
              >
                {pulses && (
                  <>
                    <animate
                      attributeName="r"
                      values={`${haloR};${haloR + 6};${haloR}`}
                      dur="2.4s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="fill-opacity"
                      values="0.22;0.06;0.22"
                      dur="2.4s"
                      repeatCount="indefinite"
                    />
                  </>
                )}
              </circle>
              {/* Pin interior — el punto sólido que el usuario "ve" como
                  la conquista. */}
              <circle
                r={innerR}
                fill={fill}
                stroke={PIN_STROKE}
                strokeWidth={isActive ? 1.6 : 1.2}
                style={{
                  transition: "r 140ms ease, stroke-width 140ms ease",
                }}
              >
                <title>{pin.name}</title>
              </circle>
            </Marker>
          );
        })}
      </ZoomableGroup>
    </ComposableMap>
  );
});
