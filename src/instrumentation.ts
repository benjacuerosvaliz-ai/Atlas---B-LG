/**
 * Next 16 `instrumentation.ts` — se ejecuta una vez al boot del server.
 *
 * Scaffold inerte: no carga Sentry hasta que existan ambas condiciones:
 *   1. `process.env.NEXT_PUBLIC_SENTRY_DSN` está seteado
 *   2. `@sentry/nextjs` está instalado
 *
 * Para activar Sentry en este proyecto:
 *   1. `npm i @sentry/nextjs`
 *   2. Agregar a `.env.local` (y Vercel):
 *        NEXT_PUBLIC_SENTRY_DSN=https://...@...ingest.sentry.io/...
 *        SENTRY_AUTH_TOKEN=...        # solo para subir source maps en build
 *        SENTRY_ORG=...
 *        SENTRY_PROJECT=...
 *   3. (Opcional) Correr `npx @sentry/wizard@latest -i nextjs` para que
 *      genere `sentry.client.config.ts` y `sentry.server.config.ts`.
 *
 * Mientras no haya DSN, este archivo es no-op — cero overhead, cero deps.
 */

// Nombre del paquete vía variable para que el bundler NO intente resolverlo
// estáticamente (si no, Turbopack emite "Module not found" en cada build
// mientras el dep no esté instalado). Usar `import(varName)` lo evita.
const SENTRY_PKG = "@sentry/nextjs";

async function loadSentry(): Promise<unknown | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    return await (Function("p", "return import(p)") as (
      p: string,
    ) => Promise<unknown>)(SENTRY_PKG);
  } catch {
    return null;
  }
}

export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  const Sentry = (await loadSentry()) as
    | { init: (opts: { dsn: string; tracesSampleRate: number }) => void }
    | null;

  if (!Sentry) {
    console.warn(
      "[instrumentation] NEXT_PUBLIC_SENTRY_DSN set pero @sentry/nextjs no instalado — corré `npm i @sentry/nextjs` para activar.",
    );
    return;
  }

  if (
    process.env.NEXT_RUNTIME === "nodejs" ||
    process.env.NEXT_RUNTIME === "edge"
  ) {
    Sentry.init({ dsn, tracesSampleRate: 0.1 });
  }
}

/**
 * Hook server-side error capture. Solo reporta si Sentry está cargado.
 * Si no, deja que Next maneje el error normalmente.
 */
import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (
  ...args
) => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  const Sentry = (await loadSentry()) as {
    captureRequestError?: (...a: typeof args) => void;
  } | null;
  Sentry?.captureRequestError?.(...args);
};
