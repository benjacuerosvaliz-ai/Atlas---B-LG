/**
 * Rate-limiter in-memory simple, sliding-window puro.
 *
 * Trade-offs deliberados:
 *  - Se guarda en un Map a nivel de módulo, así que sobrevive entre
 *    requests DENTRO de la misma instancia serverless. En Vercel cada
 *    instancia tiene su propio Map; un atacante puede pegarle a varias
 *    instancias en paralelo y "resetar" su límite. Eso lo hace inútil
 *    contra ataques distribuidos serios.
 *  - Se pierde con cada cold-start. No es persistente.
 *  - Suficiente para frenar al usuario torpe / bot simple que mete el
 *    submit 200 veces en 30s desde una sola IP. Para algo serio, mover a
 *    Upstash Redis o el rate-limit nativo de Vercel.
 *
 * No usar para login/2FA — ahí necesitas persistencia real.
 */

type Bucket = {
  // Timestamps (ms) de cada hit dentro de la ventana.
  hits: number[];
};

const buckets = new Map<string, Bucket>();

// GC cada 5 min para que el Map no crezca para siempre con keys muertas.
const GC_INTERVAL_MS = 5 * 60 * 1000;
let lastGcAt = Date.now();

function maybeGc(now: number, maxWindowMs: number) {
  if (now - lastGcAt < GC_INTERVAL_MS) return;
  lastGcAt = now;
  for (const [key, bucket] of buckets) {
    const cutoff = now - maxWindowMs;
    const fresh = bucket.hits.filter((t) => t > cutoff);
    if (fresh.length === 0) {
      buckets.delete(key);
    } else {
      bucket.hits = fresh;
    }
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
};

/**
 * Chequea + registra un hit contra el bucket `key`. Permite hasta `max`
 * hits en una ventana deslizante de `windowSec` segundos.
 *
 * Si `allowed === false`, el hit NO se registró (el caller no consume
 * cuota por intentos bloqueados).
 *
 * @param key       Identificador opaco del bucket. Ej: `"trip:<user.id>"`.
 * @param max       Máximo de hits permitidos en la ventana.
 * @param windowSec Tamaño de la ventana en segundos.
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowSec: number,
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSec * 1000;
  maybeGc(now, windowMs);

  const bucket = buckets.get(key) ?? { hits: [] };
  const cutoff = now - windowMs;
  // Sliding window: descartamos hits viejos.
  const recentHits = bucket.hits.filter((t) => t > cutoff);

  if (recentHits.length >= max) {
    // Bloqueado. Tiempo hasta que el hit más viejo salga de la ventana.
    const oldest = recentHits[0];
    const retryAfterMs = Math.max(0, oldest + windowMs - now);
    // Persistimos el bucket podado por si la próxima llamada GC no corre.
    buckets.set(key, { hits: recentHits });
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.ceil(retryAfterMs / 1000),
    };
  }

  recentHits.push(now);
  buckets.set(key, { hits: recentHits });
  return {
    allowed: true,
    remaining: max - recentHits.length,
    retryAfterSec: 0,
  };
}
