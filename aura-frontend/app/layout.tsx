import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.glowsuite-ai.de"),

  title: {
    default: "GlowSuite AI – Digitale Studio-Assistenz für Beauty-Studios",
    template: "%s | GlowSuite AI",
  },

  description:
    "GlowSuite unterstützt Beauty-Studios bei Terminbuchung, Kundenkommunikation, Erinnerungen, Bewertungen und Reaktivierung – automatisch und ohne Provision pro Buchung.",

  keywords: [
    "Beauty-Studio Software",
    "Terminbuchung Beauty-Studio",
    "WhatsApp Automatisierung",
    "Kosmetikstudio Software",
    "GlowSuite AI",
  ],

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "/",
    siteName: "GlowSuite AI",
    title: "GlowSuite AI – Digitale Studio-Assistenz für Beauty-Studios",
    description:
      "Weniger WhatsApp-Chaos, weniger No-Shows und mehr Zeit für deine Kundinnen.",
  },

  twitter: {
    card: "summary",
    title: "GlowSuite AI – Digitale Studio-Assistenz",
    description:
      "Terminbuchung und Kundenkommunikation für Beauty-Studios automatisieren.",
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/assets/logo-glowsuite.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}