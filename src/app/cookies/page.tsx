import type { Metadata } from "next";
import { LegalLayout, Section } from "@/components/legal-layout";

// Mantener esta fecha sincronizada con /terminos y /privacidad cuando se
// actualicen juntas. Es lo primero que ve el usuario bajo el título.
const UPDATED_AT = "16 de junio de 2026";

export const metadata: Metadata = {
  title: "Política de cookies · BØLG Atlas",
  description:
    "Atlas usa solo cookies esenciales para tu sesión. Acá explicamos cuáles, por qué y cómo borrarlas.",
};

const sections = [
  { id: "que-son", label: "01 · Qué son" },
  { id: "esenciales", label: "02 · Cookies esenciales" },
  { id: "local-storage", label: "03 · Local storage" },
  { id: "terceros", label: "04 · Cookies de terceros" },
  { id: "borrar", label: "05 · Cómo borrarlas" },
  { id: "cambios", label: "06 · Cambios" },
] as const;

// Tabla de cookies y entradas de localStorage realmente usadas hoy en Atlas.
// Si agregas o quitas, edita esta tabla — el usuario la lee literal.
const esenciales = [
  {
    nombre: "sb-* (Supabase Auth)",
    proposito:
      "Mantener tu sesión iniciada y refrescar tu token de acceso. Sin estas cookies no puedes usar tu cuenta.",
    duracion: "Hasta que cierres sesión",
  },
] as const;

const localStorageEntries = [
  {
    clave: "bolg-onboarding-tour",
    proposito:
      "Recordar que ya viste el tour de bienvenida para no repetírtelo.",
  },
  {
    clave: "bolg-hero-dismissed",
    proposito: "Recordar que cerraste el hero de la portada.",
  },
  {
    clave: "bolg-cookie-consent",
    proposito:
      "Recordar tu respuesta al banner de cookies para no preguntarte de nuevo.",
  },
] as const;

export default function CookiesPage() {
  return (
    <LegalLayout
      title="Política de cookies."
      lastUpdated={UPDATED_AT}
      sections={sections}
    >
      <Section id="que-son" n={1} title="Qué son">
        <p>
          Las cookies son pequeños archivos que el navegador guarda cuando
          visitas un sitio. Sirven principalmente para recordar cosas entre
          visitas — por ejemplo, que ya iniciaste sesión.
        </p>
        <p>
          Atlas las usa solo para lo estrictamente necesario para que el
          servicio funcione.{" "}
          <strong>
            No usamos cookies de tracking, analítica de terceros ni publicidad.
          </strong>
        </p>
      </Section>

      <Section id="esenciales" n={2} title="Cookies esenciales">
        <p>
          Estas cookies son necesarias para autenticarte. Sin ellas no podemos
          saber que sigues siendo tú entre páginas, así que no hay opción de
          rechazarlas: si las desactivas, no puedes usar tu cuenta.
        </p>
        <div className="overflow-hidden border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-foreground/[0.03] text-left">
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/55">
                  Nombre
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/55">
                  Propósito
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/55">
                  Duración
                </th>
              </tr>
            </thead>
            <tbody>
              {esenciales.map((c) => (
                <tr
                  key={c.nombre}
                  className="border-b border-border last:border-b-0 align-top"
                >
                  <td className="px-4 py-3 font-mono text-xs text-foreground/85">
                    {c.nombre}
                  </td>
                  <td className="px-4 py-3 text-foreground/70">
                    {c.proposito}
                  </td>
                  <td className="px-4 py-3 text-foreground/70">
                    {c.duracion}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="local-storage" n={3} title="Local storage">
        <p>
          Además de cookies, Atlas guarda algunas preferencias en el{" "}
          <strong>local storage</strong> de tu navegador. No salen de tu
          dispositivo y no nos llegan a nosotros — viven solo en tu máquina
          para mejorar la experiencia.
        </p>
        <div className="overflow-hidden border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-foreground/[0.03] text-left">
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/55">
                  Clave
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/55">
                  Propósito
                </th>
              </tr>
            </thead>
            <tbody>
              {localStorageEntries.map((e) => (
                <tr
                  key={e.clave}
                  className="border-b border-border last:border-b-0 align-top"
                >
                  <td className="px-4 py-3 font-mono text-xs text-foreground/85">
                    {e.clave}
                  </td>
                  <td className="px-4 py-3 text-foreground/70">
                    {e.proposito}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="terceros" n={4} title="Cookies de terceros">
        <p>
          <strong>No tenemos.</strong> No usamos Google Analytics, Meta Pixel,
          TikTok Pixel ni ningún otro tag de tracking publicitario. Tampoco
          compartimos cookies con redes sociales.
        </p>
        <p>
          Si en el futuro agregamos alguna, actualizaremos esta política y te
          pediremos consentimiento explícito antes de cargarla.
        </p>
      </Section>

      <Section id="borrar" n={5} title="Cómo borrarlas">
        <p>
          Puedes borrar las cookies y el local storage de Atlas en cualquier
          momento desde la configuración de tu navegador. Estos son los
          caminos directos:
        </p>
        <ul className="ml-5 flex list-disc flex-col gap-2 text-foreground/75 marker:text-foreground/30">
          <li>
            <strong>Chrome / Edge:</strong> Configuración → Privacidad y
            seguridad → Borrar datos de navegación.
          </li>
          <li>
            <strong>Safari:</strong> Preferencias → Privacidad → Administrar
            datos de sitios web.
          </li>
          <li>
            <strong>Firefox:</strong> Preferencias → Privacidad y seguridad →
            Cookies y datos de sitios.
          </li>
        </ul>
        <p>
          Si borras las cookies de sesión, te desconectaremos y tendrás que
          volver a iniciar sesión.
        </p>
      </Section>

      <Section id="cambios" n={6} title="Cambios a esta política">
        <p>
          Si agregamos o cambiamos cookies actualizaremos esta página. La
          fecha arriba indica siempre la última revisión. Para preguntas
          escríbenos a{" "}
          <a
            href="mailto:hola@bolg.cl"
            className="underline underline-offset-4 hover:text-foreground"
          >
            hola@bolg.cl
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}
