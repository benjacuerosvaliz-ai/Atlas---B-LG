import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { CookieBanner } from "@/components/cookie-banner";
import { Footer } from "@/components/footer";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BØLG Atlas — Las olas no se quedan quietas",
    template: "%s · BØLG Atlas",
  },
  description:
    "La bitácora de todas las BØLG del mundo. Cada producto suma kilómetros, países y dueños sucesivos. Cada viaje pinta el globo terráqueo.",
  openGraph: {
    title: "BØLG Atlas",
    description: "Las olas no se quedan quietas.",
    type: "website",
    locale: "es_CL",
  },
  // Declaramos color-scheme: dark para que iOS Safari NO intente
  // auto-oscurecer los colores cuando el iPhone está en modo oscuro
  // del sistema (causa que territorios sutiles se vuelvan invisibles).
  other: {
    "color-scheme": "dark",
  },
};

export const viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`dark ${interTight.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground min-h-full flex flex-col">
        {children}
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
