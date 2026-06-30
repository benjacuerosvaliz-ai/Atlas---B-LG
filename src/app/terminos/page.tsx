import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";

// Última actualización legal — manténla sincronizada con /privacidad y /cookies
// si se actualizan en bloque. Es la fecha que el usuario ve arriba del hero.
const UPDATED_AT = "16 de junio de 2026";

export const metadata: Metadata = {
  title: "Términos de uso · BØLG Atlas",
  description:
    "Las reglas para usar BØLG Atlas: qué hace el servicio, qué esperamos de ti y qué pasa con tu contenido.",
};

// Ancla compartida con la TOC sticky. Centralizada para evitar drift entre
// el sidebar y los <section id>.
const sections = [
  { id: "operador", label: "01 · Quién opera Atlas" },
  { id: "servicio", label: "02 · Qué es Atlas" },
  { id: "cuenta", label: "03 · Tu cuenta" },
  { id: "comunidad", label: "04 · Reglas de la comunidad" },
  { id: "contenido", label: "05 · Tu contenido" },
  { id: "suspension", label: "06 · Suspensión" },
  { id: "garantias", label: "07 · Sin garantías" },
  { id: "cambios", label: "08 · Cambios" },
  { id: "ley", label: "09 · Ley aplicable" },
  { id: "contacto", label: "10 · Contacto" },
] as const;

export default function TerminosPage() {
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
            Términos de uso.
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/45">
            Última actualización: {UPDATED_AT}
          </p>
        </section>

        {/* Cuerpo en dos columnas: TOC sticky + contenido */}
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
            <Section id="operador" n={1} title="Quién opera Atlas">
              <p>
                BØLG Atlas es operado por <strong>KHUMBU SPA</strong>, RUT{" "}
                <span className="font-mono">77.726.339-0</span>, con domicilio
                en Vitacura, Santiago de Chile. KHUMBU SPA es la sociedad detrás
                de la marca BØLG Concept.
              </p>
              <p>
                Cuando en estos términos decimos &laquo;nosotros&raquo;,{" "}
                &laquo;BØLG&raquo; o &laquo;Atlas&raquo;, nos referimos a
                KHUMBU SPA en su rol de operador de este servicio.
              </p>
            </Section>

            <Section id="servicio" n={2} title="Qué es Atlas">
              <p>
                Atlas es un servicio web <strong>gratuito</strong> para registrar
                viajes con los productos BØLG que llevas contigo, ver tus
                kilómetros y países acumulados, y compartir tu bitácora con la
                comunidad.
              </p>
              <p>
                No prometemos disponibilidad perpetua: Atlas se ofrece como un
                proyecto vivo, en evolución constante. Podemos agregar, cambiar
                o retirar funcionalidades sin previo aviso.
              </p>
            </Section>

            <Section id="cuenta" n={3} title="Tu cuenta">
              <p>
                Para subir viajes necesitas una cuenta. Te pediremos correo,
                nombre y un nombre de usuario único. Eres responsable de mantener
                tu PIN o sesión seguros — si alguien entra a tu cuenta usando tus
                credenciales, asumimos que fuiste tú.
              </p>
              <p>
                Atlas no es para menores de 14 años (ver Política de privacidad).
              </p>
            </Section>

            <Section id="comunidad" n={4} title="Reglas de la comunidad">
              <p>Para usar Atlas te comprometes a:</p>
              <ul className="ml-5 flex list-disc flex-col gap-2 text-foreground/75 marker:text-foreground/30">
                <li>No publicar contenido sexual, violento u ofensivo.</li>
                <li>
                  No inventar viajes ni inflar kilómetros para subir en el
                  ranking.
                </li>
                <li>
                  No suplantar a otra persona ni hacerte pasar por una marca que
                  no eres.
                </li>
                <li>
                  No usar Atlas para spam, scraping masivo, scripting automático
                  ni promoción comercial sin autorización.
                </li>
                <li>
                  Respetar al resto de la comunidad: nada de acoso, amenazas ni
                  discurso de odio.
                </li>
              </ul>
            </Section>

            <Section id="contenido" n={5} title="Tu contenido">
              <p>
                Las fotos, descripciones y ubicaciones que subes siguen siendo
                tuyas. Al publicarlas en Atlas nos das una{" "}
                <strong>
                  licencia mundial, gratuita y no exclusiva para alojarlas,
                  mostrarlas y distribuirlas
                </strong>{" "}
                dentro del servicio: en tu perfil, en el atlas público, en los
                rankings y en piezas de comunicación sobre la comunidad BØLG
                (ej. resúmenes mensuales).
              </p>
              <p>
                Esa licencia dura mientras tu contenido esté publicado en Atlas.
                Si borras un viaje o tu cuenta, dejamos de exhibirlo (ver
                Política de privacidad para los plazos de borrado real).
              </p>
              <p>
                Nos das también permiso para procesar tus fotos (compresión,
                generación de miniaturas, optimización) y para mostrar los datos
                derivados de tus viajes — como kilómetros recorridos, países
                visitados y modelos BØLG asociados — en estadísticas y rankings
                de la comunidad.
              </p>
            </Section>

            <Section id="suspension" n={6} title="Suspensión">
              <p>
                Podemos suspender o eliminar tu cuenta si rompes estas reglas, si
                tu contenido infringe derechos de terceros o si tu uso pone en
                riesgo el servicio o a la comunidad. Cuando sea posible, te
                avisaremos antes; cuando no, te explicaremos después por qué.
              </p>
            </Section>

            <Section id="garantias" n={7} title="Sin garantías">
              <p>
                Atlas se entrega &laquo;tal cual&raquo; (<em>as is</em>). Hacemos
                nuestro mejor esfuerzo para que esté online, los datos estén
                seguros y los kilómetros se calculen bien, pero no garantizamos
                disponibilidad ni exactitud perfectas. No nos hacemos responsables
                por pérdida de datos, lucro cesante ni daños indirectos derivados
                del uso del servicio, dentro de lo permitido por la ley chilena.
              </p>
            </Section>

            <Section id="cambios" n={8} title="Cambios a estos términos">
              <p>
                Podemos actualizar estos términos. Si el cambio es relevante,
                avisaremos por correo o dentro de la aplicación. La versión
                vigente siempre está en esta página, con su fecha de última
                actualización arriba.
              </p>
            </Section>

            <Section id="ley" n={9} title="Ley aplicable">
              <p>
                Estos términos se rigen por las leyes de la República de Chile.
                Cualquier controversia que no logremos resolver conversando se
                someterá a los tribunales ordinarios de justicia con sede en la
                comuna de Santiago.
              </p>
            </Section>

            <Section id="contacto" n={10} title="Contacto">
              <p>
                Cualquier pregunta sobre estos términos:{" "}
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
