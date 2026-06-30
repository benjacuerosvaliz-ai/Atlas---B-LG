import Link from "next/link";
import type { Metadata } from "next";
import { LegalLayout, Section } from "@/components/legal-layout";

// Mantener esta fecha sincronizada con /terminos y /cookies cuando se
// actualicen juntas. Es lo primero que ve el usuario bajo el título.
const UPDATED_AT = "16 de junio de 2026";

export const metadata: Metadata = {
  title: "Política de privacidad · BØLG Atlas",
  description:
    "Qué datos recolectamos en BØLG Atlas, por qué, con quién los compartimos y cómo ejerces tus derechos.",
};

// Ancla compartida con la TOC sticky. Centralizada para evitar drift entre
// el sidebar y los <section id>.
const sections = [
  { id: "responsable", label: "01 · Responsable" },
  { id: "datos", label: "02 · Datos que recolectamos" },
  { id: "uso", label: "03 · Para qué los usamos" },
  { id: "subprocesadores", label: "04 · Sub-procesadores" },
  { id: "derechos", label: "05 · Tus derechos" },
  { id: "borrar", label: "06 · Cómo borrar tu cuenta" },
  { id: "retencion", label: "07 · Retención" },
  { id: "cookies", label: "08 · Cookies y sesión" },
  { id: "ninos", label: "09 · Menores de 14" },
  { id: "cambios", label: "10 · Cambios" },
  { id: "contacto", label: "11 · Contacto" },
] as const;

// Sub-procesadores actuales. Si cambian, actualiza esta tabla — los usuarios
// la ven literal en la página. Todos están fuera de Chile (US), así que
// hacerlo explícito es parte de la transparencia GDPR/Ley 19.628.
const subprocesadores = [
  {
    nombre: "Supabase",
    rol: "Base de datos PostgreSQL y autenticación",
    region: "Estados Unidos (us-east)",
    url: "https://supabase.com/privacy",
  },
  {
    nombre: "Cloudinary",
    rol: "Almacenamiento y entrega de fotos de viajes",
    region: "Estados Unidos",
    url: "https://cloudinary.com/privacy",
  },
  {
    nombre: "Mapbox",
    rol: "Mapas, geocoding y autocompletado de ciudades",
    region: "Estados Unidos",
    url: "https://www.mapbox.com/legal/privacy",
  },
  {
    nombre: "Resend",
    rol: "Envío de correos transaccionales (acceso, notificaciones)",
    region: "Estados Unidos",
    url: "https://resend.com/legal/privacy-policy",
  },
] as const;

// Tabla de datos personales y su propósito. Igual de literal: si agregas
// un campo nuevo a la cuenta o al perfil, súmalo acá.
const datosTabla = [
  {
    dato: "Correo electrónico",
    proposito:
      "Autenticación (enlace mágico), notificaciones del servicio y recuperación de cuenta.",
  },
  {
    dato: "Nombre y nombre de usuario",
    proposito:
      "Identificarte en tu perfil público y en la comunidad. Tu username es único y visible.",
  },
  {
    dato: "Ciudad",
    proposito:
      "Mostrar de dónde eres en tu perfil y en estadísticas agregadas de la comunidad.",
  },
  {
    dato: "Instagram (opcional)",
    proposito:
      "Enlazar tu perfil con tu Instagram si tú lo decides. Puedes dejarlo en blanco.",
  },
  {
    dato: "Fotos de viajes",
    proposito:
      "Mostrarlas en tu bitácora y en el atlas público asociadas a cada viaje.",
  },
  {
    dato: "Ubicación de viajes (lat/lng)",
    proposito:
      "Dibujar tus rutas en el mapa, calcular kilómetros y agrupar por país.",
  },
  {
    dato: "Modelos BØLG asociados al viaje",
    proposito:
      "Conectar tu equipaje con tus rutas y alimentar estadísticas de uso real de cada modelo.",
  },
  {
    dato: "PIN hasheado",
    proposito:
      "Acceso rápido sin contraseñas. Lo guardamos hasheado, nunca en texto plano.",
  },
] as const;

export default function PrivacidadPage() {
  return (
    <LegalLayout
      title="Política de privacidad."
      lastUpdated={UPDATED_AT}
      sections={sections}
    >
      <Section id="responsable" n={1} title="Responsable del tratamiento">
        <p>
          Los datos personales en BØLG Atlas son tratados por{" "}
          <strong>KHUMBU SPA</strong>, RUT{" "}
          <span className="font-mono">77.726.339-0</span>, con domicilio en
          Vitacura, Santiago de Chile. Para todo lo relacionado con esta
          política escríbenos a{" "}
          <a
            href="mailto:hola@bolg.cl"
            className="underline underline-offset-4 hover:text-foreground"
          >
            hola@bolg.cl
          </a>
          .
        </p>
      </Section>

      <Section id="datos" n={2} title="Datos que recolectamos">
        <p>
          Esta es la lista completa de datos personales que pueden quedar
          guardados en Atlas y para qué los usamos. Algunos los entregas tú
          directamente, otros se generan al usar la aplicación.
        </p>
        <div className="overflow-hidden border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-foreground/[0.03] text-left">
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/55">
                  Dato
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/55">
                  Propósito
                </th>
              </tr>
            </thead>
            <tbody>
              {datosTabla.map((d) => (
                <tr
                  key={d.dato}
                  className="border-b border-border last:border-b-0 align-top"
                >
                  <td className="px-4 py-3 font-medium text-foreground/85">
                    {d.dato}
                  </td>
                  <td className="px-4 py-3 text-foreground/70">
                    {d.proposito}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="uso" n={3} title="Para qué los usamos">
        <p>
          Usamos tus datos solo para hacer funcionar Atlas: autenticarte,
          guardar tus viajes, calcular tus kilómetros, mostrar tu perfil,
          armar rankings y estadísticas de la comunidad, y notificarte cosas
          relevantes de tu cuenta (acceso, premios mensuales, cambios
          importantes).
        </p>
        <p>
          <strong>
            No vendemos tus datos. No los usamos para publicidad de terceros.
          </strong>{" "}
          No te perfilamos con cookies de tracking.
        </p>
      </Section>

      <Section id="subprocesadores" n={4} title="Sub-procesadores">
        <p>
          Para operar el servicio, encargamos algunas tareas técnicas a
          proveedores especializados. Cada uno trata datos solo para ejecutar
          la función que les pedimos. Todos están actualmente en Estados
          Unidos, por lo que tus datos pueden ser transferidos fuera de Chile
          bajo las salvaguardas contractuales de cada proveedor.
        </p>
        <div className="overflow-hidden border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-foreground/[0.03] text-left">
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/55">
                  Proveedor
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/55">
                  Rol
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.28em] text-foreground/55">
                  Región
                </th>
              </tr>
            </thead>
            <tbody>
              {subprocesadores.map((s) => (
                <tr
                  key={s.nombre}
                  className="border-b border-border last:border-b-0 align-top"
                >
                  <td className="px-4 py-3 font-medium text-foreground/85">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4 hover:text-foreground"
                    >
                      {s.nombre} ↗
                    </a>
                  </td>
                  <td className="px-4 py-3 text-foreground/70">{s.rol}</td>
                  <td className="px-4 py-3 text-foreground/70">{s.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="derechos" n={5} title="Tus derechos">
        <p>
          Bajo la Ley 19.628 sobre protección de la vida privada (Chile) y
          regulaciones equivalentes (incluido el GDPR si nos visitas desde la
          Unión Europea), tienes derecho a:
        </p>
        <ul className="ml-5 flex list-disc flex-col gap-2 text-foreground/75 marker:text-foreground/30">
          <li>
            <strong>Acceder</strong> a tus datos personales guardados en Atlas.
          </li>
          <li>
            <strong>Corregirlos</strong> si están incorrectos o desactualizados.
          </li>
          <li>
            <strong>Eliminarlos</strong> (borrar tu cuenta y todo el contenido
            asociado).
          </li>
          <li>
            <strong>Oponerte</strong> a usos específicos o solicitar
            portabilidad de tus datos.
          </li>
        </ul>
        <p>
          Para cualquiera de estos derechos escribe a{" "}
          <a
            href="mailto:hola@bolg.cl"
            className="underline underline-offset-4 hover:text-foreground"
          >
            hola@bolg.cl
          </a>
          . Respondemos en un plazo razonable, normalmente dentro de los 15
          días hábiles.
        </p>
      </Section>

      <Section id="borrar" n={6} title="Cómo borrar tu cuenta">
        <p>
          Puedes pedir la eliminación de tu cuenta desde{" "}
          <Link
            href="/settings"
            className="underline underline-offset-4 hover:text-foreground"
          >
            /settings
          </Link>{" "}
          o escribiendo a{" "}
          <a
            href="mailto:hola@bolg.cl"
            className="underline underline-offset-4 hover:text-foreground"
          >
            hola@bolg.cl
          </a>
          . Eliminaremos tu perfil, tus viajes y tus fotos en los plazos
          indicados abajo.
        </p>
      </Section>

      <Section id="retencion" n={7} title="Retención de datos">
        <p>
          Mantenemos tus datos mientras tu cuenta esté activa. Cuando la
          eliminas, conservamos un <strong>buffer de 30 días</strong> para
          cubrir solicitudes de restauración o errores humanos; pasado ese
          plazo, los datos personales se borran de nuestra base y se ordena el
          borrado de las fotos en Cloudinary.
        </p>
        <p>
          Pueden quedar copias en respaldos cifrados por hasta 90 días
          adicionales antes de su rotación natural.
        </p>
      </Section>

      <Section id="cookies" n={8} title="Cookies y sesión">
        <p>
          Atlas usa solo cookies esenciales para mantener tu sesión iniciada
          (las que necesita Supabase Auth). No usamos cookies de tracking,
          analítica de terceros ni publicidad. Detalles completos en nuestra{" "}
          <Link
            href="/cookies"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Política de cookies
          </Link>
          .
        </p>
      </Section>

      <Section id="ninos" n={9} title="Menores de 14 años">
        <p>
          Atlas no está pensado para menores de <strong>14 años</strong>. No
          solicitamos ni recolectamos datos de menores conscientemente. Si
          crees que un menor de 14 nos entregó datos, escríbenos a{" "}
          <a
            href="mailto:hola@bolg.cl"
            className="underline underline-offset-4 hover:text-foreground"
          >
            hola@bolg.cl
          </a>{" "}
          y eliminaremos la cuenta de inmediato.
        </p>
      </Section>

      <Section id="cambios" n={10} title="Cambios a esta política">
        <p>
          Si hacemos cambios relevantes te avisaremos por correo o dentro de
          la aplicación antes de que entren en vigencia. La versión vigente
          siempre está acá, con su fecha de última actualización arriba.
        </p>
      </Section>

      <Section id="contacto" n={11} title="Contacto">
        <p>
          Cualquier duda sobre privacidad:{" "}
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
