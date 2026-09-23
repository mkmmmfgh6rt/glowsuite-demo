import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum | GlowSuite AI",
  description: "Anbieterinformationen und Kontaktdaten von GlowSuite AI.",
  alternates: {
    canonical: "/impressum",
  },
};

export default function ImpressumPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 20px 64px",
        background:
          "radial-gradient(circle at top,#3a2a1d 0%,#1d150f 46%,#100c09 100%)",
        color: "#fff8ea",
      }}
    >
      <div style={{ width: "100%", maxWidth: 900, margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            marginBottom: 24,
            color: "#d4af74",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          ← Zurück zu GlowSuite
        </Link>

        <section
          style={{
            padding: "clamp(26px,5vw,48px)",
            borderRadius: 30,
            background: "rgba(255,250,244,0.96)",
            color: "#211710",
            border: "1px solid rgba(212,175,116,0.30)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.28)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              marginBottom: 16,
              padding: "7px 13px",
              borderRadius: 999,
              background: "#f1dfc7",
              color: "#8a5b25",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            RECHTLICHE INFORMATIONEN
          </div>

          <h1
            style={{
              margin: "0 0 12px",
              fontSize: "clamp(34px,7vw,54px)",
              letterSpacing: "-0.05em",
            }}
          >
            Impressum
          </h1>

          <p
            style={{
              margin: "0 0 34px",
              color: "#78695d",
              lineHeight: 1.7,
            }}
          >
            Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
              gap: 18,
            }}
          >
            <div
              style={{
                padding: 24,
                borderRadius: 20,
                background: "#ffffff",
                border: "1px solid rgba(138,91,37,0.16)",
              }}
            >
              <h2 style={{ margin: "0 0 14px", fontSize: 20 }}>
                Anbieterin
              </h2>

              <p style={{ margin: 0, lineHeight: 1.75, color: "#5e5046" }}>
                <strong style={{ color: "#211710" }}>GlowSuite AI</strong>
                <br />
                Inhaberin: Jennifer Nowicki
                <br />
                Oderstraße 24
                <br />
                16303 Schwedt/Oder
                <br />
                Deutschland
              </p>
            </div>

            <div
              style={{
                padding: 24,
                borderRadius: 20,
                background: "#ffffff",
                border: "1px solid rgba(138,91,37,0.16)",
              }}
            >
              <h2 style={{ margin: "0 0 14px", fontSize: 20 }}>
                Kontakt
              </h2>

              <p style={{ margin: 0, lineHeight: 1.75, color: "#5e5046" }}>
                E-Mail:
                <br />
                <a
                  href="mailto:auswertung.glowsuite@gmail.com"
                  style={{
                    color: "#8a5b25",
                    fontWeight: 700,
                    overflowWrap: "anywhere",
                  }}
                >
                  auswertung.glowsuite@gmail.com
                </a>
              </p>
            </div>
          </div>

          <div
            style={{
              marginTop: 18,
              padding: 24,
              borderRadius: 20,
              background: "#f7eee3",
              color: "#5e5046",
              lineHeight: 1.7,
            }}
          >
            <h2
              style={{
                margin: "0 0 10px",
                color: "#211710",
                fontSize: 20,
              }}
            >
              Verbraucherstreitbeilegung
            </h2>

            <p style={{ margin: 0 }}>
              Wir sind nicht bereit oder verpflichtet, an
              Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </div>

          <p
            style={{
              margin: "28px 0 0",
              color: "#8a7a6d",
              fontSize: 13,
            }}
          >
            Stand: September 2026
          </p>
        </section>
      </div>
    </main>
  );
}