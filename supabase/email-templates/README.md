# BØLG Atlas — Supabase Auth Email Templates

Templates HTML branded BØLG para los emails que dispara Supabase Auth.
Viven aquí versionados; la fuente de verdad en producción es el Dashboard de Supabase.

## Cómo copiar estos templates a Supabase

1. Entra al **Dashboard de Supabase** → proyecto BØLG Atlas.
2. Sidebar: **Authentication → Email Templates**.
3. Selecciona el template que vas a actualizar (ver mapeo abajo).
4. Pega el contenido completo del archivo `.html` correspondiente en el editor.
5. Actualiza el **Subject** (ver mapeo abajo).
6. Click **Save**.
7. Manda un email de prueba desde **Auth → Users → Send magic link** (o el flujo correspondiente).

## Mapeo archivo ↔ template Supabase

| Archivo                | Template en Supabase    | Subject                                  |
| ---------------------- | ----------------------- | ---------------------------------------- |
| `magic-link.html`      | **Magic Link**          | Tu link para entrar al Atlas BØLG        |
| `confirm-signup.html`  | **Confirm signup**      | Confirma tu cuenta BØLG Atlas            |
| `change-email.html`    | **Change Email Address**| Confirma tu nuevo correo BØLG Atlas      |
| `reset-password.html`  | **Reset Password**      | Resetea tu PIN BØLG Atlas                |

## Variables disponibles (Supabase)

Las variables se reemplazan server-side al enviar. Usar EXACTAMENTE este formato (Go template), con espacios:

- `{{ .Email }}` — email del destinatario.
- `{{ .ConfirmationURL }}` — link de acción (magic link, confirmación, reset, etc.).
- `{{ .Token }}` — token OTP (6 dígitos) cuando aplica.
- `{{ .TokenHash }}` — hash del token (para construir URLs custom).
- `{{ .SiteURL }}` — `Site URL` configurada en Auth → URL Configuration.
- `{{ .RedirectTo }}` — destino post-auth si se pasó como parámetro.
- `{{ .Data }}` — `raw_user_meta_data` del usuario (acceso via `{{ .Data.nombre }}`).

## Configuración recomendada (Dashboard)

- **Site URL**: `https://bolg-atlas.vercel.app` (o dominio prod actual).
- **Redirect URLs**: agregar `https://bolg-atlas.vercel.app/auth/callback` y `http://localhost:3000/auth/callback` para dev.
- **Sender Name**: `BØLG Atlas`.
- **Sender Email**: si está conectado SMTP custom, usar dominio propio (mejora deliverability vs el sender default de Supabase).

## Decisiones de diseño

- **Layout**: table-based (no flex/grid) para compat con Outlook/Gmail/Apple Mail/clientes corporativos.
- **Estilos**: 100% inline (Gmail strippea `<style>` en muchos casos).
- **Fonts**: stack `'Inter Tight'/'Inter'/'JetBrains Mono'` con fallback a system sans/mono. Los clientes de email **no descargan webfonts** salvo Apple Mail y algunos iOS; el resto verá Helvetica/Arial — esto es esperado.
- **Bg dark** (#0a0a0a): respetado por todos los clientes modernos. Outlook Web/Desktop también lo respeta gracias al `bgcolor` en tabla.
- **Ancho**: 560px max, responsive via `width:100%` + `max-width`. Sin media queries (no son confiables; el diseño aguanta hasta ~320px).
- **CTA**: bulletproof button con fallback VML para Outlook (Word-renderer no soporta `padding` en `<a>`).
- **Preview text**: bloque oculto al inicio del body — controla el snippet que ve el usuario en la inbox.
- **Plain-text fallback**: comentado al final de cada archivo como referencia. Para shippearlo de verdad hay que pegarlo en el campo "Plain text" del template si Supabase lo expone (no todos los proyectos lo tienen). Recomendado para mejorar deliverability.

## Compatibilidad de email clients — warnings

- **Outlook 2007–2019 (Windows desktop)** renderiza con Word, no con un browser. Ya está cubierto con el bloque `<!--[if mso]>` (VML roundrect para el botón) y `font-family` forzado a Arial dentro de `mso`. Los `border` finos pueden verse más gruesos — aceptable.
- **Gmail Web** strippea `<style>` tags y media queries dentro de `<head>` en algunos casos. Por eso **todo va inline**.
- **Gmail Mobile (iOS/Android)** respeta el dark bg y los inline styles, pero puede invertir colores si el usuario tiene "dark mode override" — el fondo ya es oscuro, así que el riesgo es bajo.
- **Apple Mail (macOS/iOS)** es el mejor cliente: soporta todo, incluso webfonts si llegan. Allí se ve "como en Figma".
- **Outlook.com (web)** y **Outlook 365 (web)** ya usan motor moderno, sin problemas.
- **Yahoo/AOL**: ok con tabla + inline styles.
- **Webfonts (Inter/Inter Tight/JetBrains Mono)** NO se cargan en Gmail/Outlook/Yahoo. Es un trade-off conocido — los fallbacks Helvetica/Arial/Courier se ven dignos y mantienen jerarquía.
- **Dark mode auto-invert** (iOS Mail, Outlook Mobile) puede alterar colores claros sobre fondo oscuro. El diseño ya es dark-first, así que el efecto es mínimo; si aparece algo raro, agregar `<meta name="color-scheme" content="dark">` y `<meta name="supported-color-schemes" content="dark">` al `<head>` (no incluido por defecto porque puede confundir clientes light-only).

## Cambios futuros

- Si BØLG migra a SMTP propio (Resend/Postmark/SES), revisar `From` + DKIM/SPF/DMARC antes de cualquier envío masivo.
- Si se agrega 2FA por OTP, crear template adicional `magic-link-otp.html` usando `{{ .Token }}` en lugar (o además) del link.
- Mantener este folder en sync con el Dashboard: cualquier cambio en el Dashboard debe reflejarse acá (y al revés). Es la única manera de tener history y review en PR.
