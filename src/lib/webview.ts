/**
 * Detección de in-app browsers (WebViews) donde mapas/libs externas pueden
 * fallar — IG/FB/LinkedIn/X/TikTok/WhatsApp normalmente abren los enlaces
 * dentro de su propia WebView, que en algunos OEMs y versiones bloquea
 * o entrega caído el fetch de topojson de jsdelivr (problema conocido de
 * react-simple-maps y derivados de d3 sobre Mapbox).
 *
 * El test es por User-Agent. No es 100 % perfecto (un user-agent se puede
 * spoofear), pero como heurística para mostrar un banner suave de "Mejor
 * en navegador externo" funciona bien y es lo que usan Twilio, Stripe, etc.
 *
 * No hacemos detección server-side acá — el componente debe llamar esto
 * en useEffect con window.navigator.userAgent para evitar mismatch SSR.
 */
export function isInAppBrowser(userAgent: string): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();

  // Instagram in-app browser.
  if (ua.includes("instagram")) return true;

  // Facebook in-app browser — marcas oficiales del SDK.
  // FBAN = Facebook App Name, FBAV = Facebook App Version, FB_IAB = Facebook In-App Browser.
  if (ua.includes("fban") || ua.includes("fbav") || ua.includes("fb_iab")) {
    return true;
  }

  // Messenger (también WebView de FB) — algunos device la mandan así.
  if (ua.includes("messenger") || ua.includes("fbmessenger")) return true;

  // LinkedIn in-app.
  if (ua.includes("linkedinapp") || ua.includes("linkedin")) return true;

  // Twitter / X in-app browser.
  // Twitter mete "twitter" en el UA; X (el rebrand) mantiene la cadena
  // en iOS por compatibilidad y agrega "TwitterAndroid" en Android.
  if (ua.includes("twitter") || ua.includes("twitterandroid")) return true;

  // TikTok in-app browser — marcas: BytedanceWebview, musical_ly, Bytedance.
  if (
    ua.includes("tiktok") ||
    ua.includes("bytedancewebview") ||
    ua.includes("musical_ly") ||
    ua.includes("bytedance")
  ) {
    return true;
  }

  // WhatsApp in-app browser.
  if (ua.includes("whatsapp")) return true;

  return false;
}

/**
 * Devuelve la URL ideal para escapar del WebView. En iOS la única forma
 * confiable es location.href con un x-safari-https:// scheme (no funciona
 * en todos los WebViews), o simplemente abrir target=_blank. En Android,
 * un intent:// URI lleva al navegador externo. Devolvemos `null` cuando
 * no podemos hacer nada inteligente — el caller debe usar target=_blank.
 */
export function buildEscapeUrl(currentUrl: string, userAgent: string): string | null {
  if (!currentUrl) return null;
  const ua = userAgent.toLowerCase();

  // Android intent — fuerza el navegador externo (Chrome generalmente).
  if (ua.includes("android")) {
    try {
      const u = new URL(currentUrl);
      // intent://path#Intent;scheme=https;package=com.android.chrome;end;
      // Si Chrome no está, Android pide al usuario elegir navegador.
      return `intent://${u.host}${u.pathname}${u.search}${u.hash}#Intent;scheme=${u.protocol.replace(":", "")};package=com.android.chrome;end;`;
    } catch {
      return null;
    }
  }

  // iOS — no hay forma estándar de saltar fuera del WebView con un click,
  // pero algunos browsers reconocen x-safari-https:// (no oficial). El
  // fallback razonable es devolver la URL tal cual y dejar que el caller
  // la abra con window.open(url, "_blank").
  return currentUrl;
}
