import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";

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
    <div className="relative min-h-screen bg-background">
      <Navbar />

      <main className="relative px-6 pb-24 pt-28 md:px-10 lg:pt-32">
        {/* Hero */}
        <section className="mx-auto flex max-w-4xl flex-col gap-5">
          <span className="text-[10px] uppercase tracking-[0.36em] text-foreground/40">
            Legal · BØLG Atlas
          </span>
          <h1 className="font-display text-4xl font-black leading-[1.04] tracking-tight md:text-5xl lg:text-[3.75rem]">
            Política de cookies.
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">
            Última actualización: {UPDATED_AT}
          </p>
        </section>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-12 lg:grid-cols-[200px_1fr] lg:gap-16">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/40">
              Índice
            </span>
            <ol className="mt-4 flex flex-col gap-2">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground/55 hover:text-foreground transition-colors"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ol>
          </aside>

          <article className="flex flex-col gap-12 leading-relaxed text-foreground/75">
            <Section id="que-son" n={1} title="Qué son">
              <p>
                Las cookies son pequeños archivos que el navegador guarda
                cuando visitas un sitio. Sirven principalmente para recordar
                cosas entre visitas — por ejemplo, que ya iniciaste sesión.
              </p>
              <p>
                Atlas las usa solo para lo estrictamente necesario para que el
                servicio funcione. <strong>No usamos cookies de tracking,
                analítica de terceros ni publicidad.</strong>
              </p>
            </Section>

            <Section id="esenciales" n={2} title="Cookies esenciales">
              <p>
                Estas cookies son necesarias para autenticarte. Sin ellas no
                podemos saber que sigues siendo tú entre páginas, así que no
                hay opción de rechazarlas: si las desactivas, no puedes usar
                tu cuenta.
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
                dispositivo y no nos llegan a nosotros — viven solo en tu
                máquina para mejorar la experiencia.
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
                <strong>No tenemos.</strong> No usamos Google Analytics, Meta
                Pixel, TikTok Pixel ni ningún otro tag de tracking publicitario.
                Tampoco compartimos cookies con redes sociales.
              </p>
              <p>
                Si en el futuro agregamos alguna, actualizaremos esta política y
                te pediremos consentimiento explícito antes de cargarla.
              </p>
            </Section>

            <Section id="borrar" n={5} title="Cómo borrarlas">
              <p>
                Puedes borrar las cookies y el local storage de Atlas en
                cualquier momento desde la configuración de tu navegador. Estos
                son los caminos directos:
              </p>
              <ul className="ml-5 flex list-disc flex-col gap-2 text-foreground/75 marker:text-foreground/30">
                <li>
                  <strong>Chrome / Edge:</strong> Configuración → Privacidad y
                  seguridad → Borrar datos de navegación.
                </li>
                <li>
                  <strong>Safari:</strong> Preferencias → Privacidad →
                  Administrar datos de sitios web.
                </li>
                <li>
                  <strong>Firefox:</strong> Preferencias → Privacidad y
                  seguridad → Cookies y datos de sitios.
                </li>
              </ul>
              <p>
                Si borras las cookies de sesión, te desconectaremos y tendrás
                que volver a iniciar sesión.
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
          </article>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}

function Section({
  id,
  n,
  title,
  children,
}: {
  id: string;
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex scroll-mt-28 flex-col gap-4 border-t border-border pt-6">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs uppercase tracking-[0.28em] text-foreground/40">
          {String(n).padStart(2, "0")}
        </span>
      </div>
      <h2 className="font-display text-2xl font-black leading-tight tracking-tight md:text-3xl">
        {title}
      </h2>
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-foreground/70 md:text-base">
        {children}
      </div>
    </section>
  );
}

function LegalFooter() {
  return (
    <footer className="border-t border-border px-6 py-8 md:px-10">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-foreground/45">
          BØLG Atlas · {new Date().getFullYear()}
        </span>
        <div className="flex flex-wrap gap-6">
          <Link
            href="/terminos"
            className="text-[10px] uppercase tracking-[0.28em] text-foreground/55 hover:text-foreground transition-colors"
          >
            Términos
          </Link>
          <Link
            href="/privacidad"
            className="text-[10px] uppercase tracking-[0.28em] text-foreground/55 hover:text-foreground transition-colors"
          >
            Privacidad
          </Link>
          <Link
            href="/cookies"
            className="text-[10px] uppercase tracking-[0.28em] text-foreground/55 hover:text-foreground transition-colors"
          >
            Cookies
          </Link>
          <Link
            href="/sobre"
            className="text-[10px] uppercase tracking-[0.28em] text-foreground/55 hover:text-foreground transition-colors"
          >
            Sobre Atlas
          </Link>
          <a
            href="https://www.bolg.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] uppercase tracking-[0.28em] text-foreground/55 hover:text-foreground transition-colors"
          >
            bolg.cl ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
