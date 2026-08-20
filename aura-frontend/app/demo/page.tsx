"use client";


import Image from "next/image";

import dashboardKpis from "../../public/demo.bilder/demo-dashboard-kpis.webp";
import dashboardAnalytics from "../../public/demo.bilder/demo-dashboard-analytics.webp";
import kalender from "../../public/demo.bilder/demo-kalender.webp";
import whatsappUpsell from "../../public/demo.bilder/demo-whatsapp-upsell.webp";
import whatsappMitarbeiter from "../../public/demo.bilder/demo-whatsapp-mitarbeiter.webp";
import whatsappStorno from "../../public/demo.bilder/demo-whatsapp-storno.webp";
import terminbestaetigung from "../../public/demo.bilder/demo-terminbestaetigung.webp";

const automationEvents = [
  {
    icon: "📲",
    title: "Vor dem Termin",
    text: "GlowSuite erinnert Kundinnen automatisch und reduziert vergessene Termine.",
    badge: "Erinnerung",
  },
  {
    icon: "⭐",
    title: "Nach dem Termin",
    text: "Zufriedene Kundinnen werden automatisch um eine Google-Bewertung gebeten.",
    badge: "Bewertung",
  },
  {
    icon: "🔄",
    title: "Wochen später",
    text: "Länger inaktive Kundinnen können gezielt wieder angesprochen werden.",
    badge: "Reaktivierung",
  },
];

const stats = [
  ["24/7", "Kundenanfragen beantworten"],
  ["0%", "Provision pro Buchung"],
  ["1", "System für Termine & Kundenkommunikation"],
];

export default function DemoPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 20% 0%, rgba(212,175,116,0.18), transparent 32%), radial-gradient(circle at 80% 75%, rgba(184,121,91,0.10), transparent 38%), linear-gradient(180deg,#120d0a 0%,#1b130f 48%,#120d0a 100%)",
        color: "#f8f3ec",
        padding: "34px 20px 60px",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 36,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.03em" }}>
            GlowSuite AI
          </div>

          <div
            style={{
              fontSize: 13,
              padding: "9px 14px",
              border: "1px solid rgba(212,175,116,0.35)",
              borderRadius: 999,
              color: "#d4af74",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            ● A.U.R.A Autonomous Salon OS
          </div>
        </div>

        {/* HERO */}
        <section
          style={{
            textAlign: "center",
            marginBottom: 34,
            padding: "52px 28px",
            borderRadius: 28,
            background:
              "linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.035))",
            border: "1px solid rgba(212,175,116,0.22)",
            boxShadow: "0 30px 90px rgba(0,0,0,0.35)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              marginBottom: 18,
              padding: "8px 14px",
              borderRadius: 999,
              background: "rgba(212,175,116,0.13)",
              color: "#d4af74",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Für Beauty Studios, Kosmetikstudios & Salons
          </div>

          <h1
            style={{
              fontSize: "clamp(30px, 8vw, 68px)",
              lineHeight: 1.04,
              margin: "0 auto 20px",
              maxWidth: 900,
              letterSpacing: "-0.06em",
            }}
          >
            Mehr Buchungen. Weniger WhatsApp-Chaos.
          </h1>

          <p
            style={{
              fontSize: 18,
              lineHeight: 1.7,
              color: "rgba(248,243,236,0.78)",
              maxWidth: 760,
              margin: "0 auto 24px",
            }}
          >
            GlowSuite übernimmt Terminanfragen, Erinnerungen,
            Umbuchungen und wiederkehrende Kundenfragen für dein
            Beauty-Studio – automatisch und rund um die Uhr.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() =>
                document
                  .getElementById("studio-check")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              style={{
                padding: "14px 24px",
                borderRadius: 14,
                border: "1px solid rgba(212,175,116,0.48)",
                background: "linear-gradient(135deg,#fffaf4,#eadcc9)",
                color: "#2a1a12",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                letterSpacing: "-0.01em",
                boxShadow: "0 10px 28px rgba(0,0,0,0.20)",
              }}
            >
              Kostenlosen Studio-Check starten
            </button>

            <button
              onClick={() =>
                document
                  .getElementById("live-demo")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              style={{
                padding: "15px 28px",
                borderRadius: 999,
                border: "1px solid rgba(212,175,116,0.4)",
                background: "rgba(255,255,255,0.04)",
                color: "#fff8ea",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              GlowSuite live ansehen
            </button>
          </div>

          <p
            style={{
              marginTop: 16,
              fontSize: 13,
              color: "rgba(248,243,236,0.62)",
            }}
          >
            Keine neue App für deine Kundinnen · 0 % Provision pro Buchung
          </p>
        </section>

        {/* STATS */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
            gap: 14,
            marginBottom: 34,
          }}
        >
          {stats.map(([value, label]) => (
            <div
              key={label}
              style={{
                padding: 22,
                borderRadius: 22,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(212,175,116,0.18)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 32, fontWeight: 800, color: "#d4af74" }}>
                {value}
              </div>
              <div style={{ fontSize: 13, color: "rgba(248,243,236,0.72)" }}>
                {label}
              </div>
            </div>
          ))}
        </section>


        {/* PROBLEM */}
        <section
          style={{
            marginBottom: 42,
            padding: "34px 28px",
            borderRadius: 30,
            background: "#fffaf4",
            color: "#1d1713",
            boxShadow: "0 30px 80px rgba(0,0,0,0.18)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div
              style={{
                display: "inline-flex",
                marginBottom: 14,
                padding: "7px 12px",
                borderRadius: 999,
                background: "#f1dfc7",
                color: "#8a5b25",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Kommt dir das bekannt vor?
            </div>

            <h2
              style={{
                fontSize: "clamp(28px,5vw,42px)",
                margin: "0 0 12px",
              }}
            >
              Während du behandelst, arbeitet dein Handy weiter.
            </h2>

            <p
              style={{
                maxWidth: 760,
                margin: "0 auto",
                color: "#76675a",
                lineHeight: 1.7,
                fontSize: 16,
              }}
            >
              Eine Kundin fragt nach einem Termin. Die nächste möchte
              umbuchen. Jemand fragt nach Preisen. Eine andere Kundin
              erscheint nicht – und eigentlich wolltest du noch nach
              einer Bewertung fragen.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
              gap: 14,
            }}
          >
            {[
              "Terminanfragen bleiben liegen",
              "Immer dieselben Fragen",
              "Umbuchungen & Absagen kosten Zeit",
              "No-Shows reißen Lücken in den Kalender",
              "Ehemalige Kundinnen werden vergessen",
            ].map((item) => (
              <div
                key={item}
                style={{
                  padding: 18,
                  borderRadius: 18,
                  background: "#fffdf9",
                  border: "1px solid rgba(184,121,91,0.20)",
                  boxShadow: "0 8px 24px rgba(80,45,20,0.06)",
                  fontWeight: 700,
                }}
              >
                <span style={{ color: "#b8795b", marginRight: 8 }}>✕</span>
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* CORE BENEFITS */}
        <section
          style={{
            marginBottom: 42,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
            gap: 18,
          }}
        >
          {[
            {
              icon: "💬",
              title: "Weniger Admin",
              text: "Terminanfragen, Bestätigungen und wiederkehrende Fragen automatisch bearbeiten.",
            },
            {
              icon: "📅",
              title: "Weniger No-Shows",
              text: "Automatische Erinnerungen sowie einfache Umbuchung und Stornierung.",
            },
            {
              icon: "⭐",
              title: "Mehr aus deinem Kundenstamm",
              text: "Bewertungen, Reaktivierung und passende Zusatzleistungen automatisieren.",
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                padding: 24,
                borderRadius: 24,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(212,175,116,0.18)",
              }}
            >
              <div style={{ fontSize: 30, marginBottom: 12 }}>{item.icon}</div>
              <h3
                style={{
                  color: "#fff8ea",
                  margin: "0 0 8px",
                  fontSize: 22,
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  color: "rgba(248,243,236,0.72)",
                  lineHeight: 1.6,
                }}
              >
                {item.text}
              </p>
            </div>
          ))}
        </section>


        {/* HOW IT WORKS */}
        <section
          style={{
            marginBottom: 42,
            padding: "34px 28px",
            borderRadius: 30,
            background:
              "linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04))",
            border: "1px solid rgba(212,175,116,0.22)",
            boxShadow: "0 25px 70px rgba(0,0,0,0.28)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div
              style={{
                display: "inline-flex",
                marginBottom: 14,
                padding: "8px 14px",
                borderRadius: 999,
                background: "rgba(212,175,116,0.16)",
                color: "#d4af74",
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              So einfach funktioniert es
            </div>

            <h2
              style={{
                fontSize: "clamp(28px,5vw,42px)",
                margin: "0 0 10px",
                color: "#fff8ea",
                letterSpacing: "-0.04em",
              }}
            >
              So einfach funktioniert GlowSuite
            </h2>

            <p
              style={{
                margin: "0 auto",
                maxWidth: 760,
                color: "rgba(248,243,236,0.72)",
                lineHeight: 1.6,
                fontSize: 16,
              }}
            >
              Deine Kundinnen schreiben wie gewohnt.
              GlowSuite übernimmt die wiederkehrenden Abläufe – du behältst jederzeit die Kontrolle.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
              gap: 18,
            }}
          >
            <div
              style={{
                padding: 24,
                borderRadius: 24,
                background: "#16110d",
                border: "1px solid rgba(212,175,116,0.22)",
              }}
            >
              <div style={{ color: "#d4af74", fontWeight: 800, marginBottom: 12 }}>
                1️⃣ Deine Kundin schreibt
              </div>

              <div
                style={{
                  padding: 18,
                  borderRadius: 18,
                  background: "#0f0f0f",
                  color: "#fff8ea",
                  lineHeight: 1.6,
                  fontSize: 16,
                }}
              >
                💬 „Augenbrauenlifting
                am 24.06. um 10 Uhr
                bei Anna.“

                💬 „Finger morgen
                um 17 Uhr.“

                💬 „Maniküre morgen
                11:00.“
              </div>
            </div>

            <div
              style={{
                padding: 24,
                borderRadius: 24,
                background: "#16110d",
                border: "1px solid rgba(212,175,116,0.22)",
              }}
            >
              <div style={{ color: "#d4af74", fontWeight: 800, marginBottom: 12 }}>
                2️⃣ GlowSuite übernimmt
              </div>

              <div style={{ color: "#fff8ea", lineHeight: 1.9, fontSize: 16 }}>
                ✅ erkennt Service<br />
                ✅ erkennt Datum<br />
                ✅ erkennt Mitarbeiter<br />
                ✅ prüft freie Termine
              </div>
            </div>

            <div
              style={{
                padding: 24,
                borderRadius: 24,
                background: "#16110d",
                border: "1px solid rgba(212,175,116,0.22)",
              }}
            >
              <div style={{ color: "#d4af74", fontWeight: 800, marginBottom: 12 }}>
                3️⃣ Dein Studio läuft weiter
              </div>

              <div style={{ color: "#fff8ea", lineHeight: 1.9, fontSize: 16 }}>
                ✅ Terminbestätigung<br />
                ✅ automatische Erinnerung<br />
                ✅ einfache Stornierung<br />
                ✅ Bewertungsanfrage
              </div>
            </div>
          </div>

          <p
            style={{
              textAlign: "center",
              marginTop: 22,
              color: "#d4af74",
              fontWeight: 700,
            }}
          >
            Du behältst jederzeit die Kontrolle.
          </p>
        </section>



        {/* WIDGET */}
        <section
          id="live-demo"
          style={{
            marginBottom: 42,
            padding: 12,
            borderRadius: 30,
            background:
              "linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04))",
            border: "1px solid rgba(212,175,116,0.22)",
            boxShadow: "0 35px 100px rgba(0,0,0,0.35)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <h2 style={{ margin: 0, fontSize: 26 }}>Live Beauty AI testen</h2>
            <p style={{ margin: "8px 0 0", color: "rgba(248,243,236,0.70)" }}>
              Buche einen Testtermin und sieh, wie automatisch PDF, Kalender und
              Folgeprozesse starten.
            </p>
          </div>

          <div
            style={{
              borderRadius: 24,
              overflow: "hidden",
              border: "1px solid rgba(212,175,116,0.22)",
              background: "#120d0a",
            }}
          >
            <iframe
              src="/widget.html"
              style={{ width: "100%", height: 650, border: "none" }}
              title="GlowSuite Widget Demo"
            />
          </div>
        </section>


        {/* DEMO SCREENSHOTS */}
        <section
          style={{
            marginBottom: 42,
            padding: "34px 28px",
            borderRadius: 30,
            background:
              "linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04))",
            border: "1px solid rgba(212,175,116,0.22)",
            boxShadow: "0 25px 70px rgba(0,0,0,0.28)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h2
              style={{
                fontSize: "clamp(28px,5vw,42px)",
                margin: "0 0 10px",
                color: "#fff8ea",
              }}
            >
              So arbeitet GlowSuite im Studio-Alltag
            </h2>

            <p
              style={{
                margin: "0 auto",
                maxWidth: 760,
                color: "rgba(248,243,236,0.72)",
                lineHeight: 1.6,
              }}
            >
              Echte Einblicke in Dashboard, WhatsApp-Automation, Kalender,
              Terminbestätigung, Erinnerungen und Bewertungsanfragen.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
              gap: 18,
            }}
          >
            {[
              {
                src: "/demo.bilder/demo-dashboard-kpis.webp",
                title: "Dashboard Übersicht",
                text: "Buchungen, Umsatz, aktive Kunden und wichtige Kennzahlen auf einen Blick.",
              },
              {
                src: "/demo.bilder/demo-dashboard-analytics.webp",
                title: "Umsatzanalyse",
                text: "GlowSuite erkennt Top-Services, Trends und Umsatzchancen im Studio.",
              },
              {
                src: "/demo.bilder/demo-kalender.webp",
                title: "Automatischer Kalender",
                text: "Alle Buchungen landen übersichtlich und strukturiert im Kalender.",
              },
              {
                src: "/demo.bilder/demo-terminbestaetigung.webp",
                title: "Premium Terminbestätigung",
                text: "Kundinnen erhalten automatisch eine hochwertige Bestätigung mit PDF und Kalenderdatei.",
              },
              {
                src: "/demo.bilder/demo-whatsapp-upsell.webp",
                title: "Intelligente Empfehlung",
                text: "GlowSuite kann passende Zusatzleistungen empfehlen, bevor der Termin abgeschlossen wird.",
              },
              {
                src: "/demo.bilder/demo-whatsapp-mitarbeiter.webp",
                title: "Mitarbeiter-Auswahl",
                text: "Kundinnen können direkt per WhatsApp den passenden Mitarbeiter auswählen.",
              },
              {
                src: "/demo.bilder/demo-whatsapp-storno.webp",
                title: "Storno per WhatsApp",
                text: "Falls ein Termin nicht passt, kann die Kundin einfach per WhatsApp absagen.",
              },
              {
                src: "/demo.bilder/demo-erinnerung.webp",
                title: "Automatische Erinnerung",
                text: "GlowSuite erinnert Kundinnen automatisch vor dem Termin und reduziert dadurch No-Shows.",
              },
              {
                src: "/demo.bilder/demo-google-review.webp",
                title: "Google Bewertung nach dem Termin",
                text: "Nach dem Besuch fragt GlowSuite automatisch nach einer Bewertung und stärkt so das Studio.",
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  overflow: "hidden",
                  borderRadius: 24,
                  background: "#16110d",
                  border: "1px solid rgba(212,175,116,0.22)",
                  boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
                }}
              >
                <div style={{ padding: 20 }}>
                  <h3
                    style={{
                      margin: "0 0 8px",
                      color: "#fff8ea",
                      fontSize: 20,
                    }}
                  >
                    {item.title}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: "rgba(248,243,236,0.70)",
                      lineHeight: 1.55,
                      fontSize: 14,
                    }}
                  >
                    {item.text}
                  </p>
                </div>

                <Image
                  src={item.src}
                  alt={item.title}
                  width={1200}
                  height={720}
                  style={{
                    width: "100%",
                    height: 235,
                    objectFit: "contain",
                    background: "#0f0f0f",
                    display: "block",
                    borderTop: "1px solid rgba(212,175,116,0.16)",
                  }}
                />
              </div>
            ))}
          </div>
        </section>


        {/* TRUST FEATURES */}
        <section
          style={{
            marginBottom: 34,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 16,
          }}
        >
          {
            [
              {
                icon: "📲",
                title: "WhatsApp & Website",
                text: "für Kundinnen einfach nutzbar",
              },
              {
                icon: "🛠️",
                title: "Persönliche Einrichtung",
                text: "auf dein Studio abgestimmt",
              },
              {
                icon: "💄",
                title: "Für Beauty Studios",
                text: "nicht für irgendeine Branche",
              },
              {
                icon: "🔒",
                title: "Du behältst Kontrolle",
                text: "persönliche Fragen bleiben beim Team",
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(212,175,116,0.18)",
                  borderRadius: 22,
                  padding: "22px 18px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    marginBottom: 10,
                  }}
                >
                  {item.icon}
                </div>

                <div
                  style={{
                    color: "#f8f3ec",
                    fontWeight: 700,
                    fontSize: 16,
                    marginBottom: 4,
                  }}
                >
                  {item.title}
                </div>

                <div
                  style={{
                    color: "rgba(248,243,236,0.72)",
                    fontSize: 14,
                  }}
                >
                  {item.text}
                </div>
              </div>
            ))}
        </section>



        {/* AUTOMATION FEED */}
        <section
          style={{
            marginBottom: 42,
            padding: "34px 26px",
            borderRadius: 30,
            background: "#fffaf4",
            color: "#1d1713",
            boxShadow: "0 30px 80px rgba(0,0,0,0.18)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h2 style={{ fontSize: 34, margin: "0 0 10px" }}>
              GlowSuite hört nach der Buchung nicht auf
            </h2>
            <p style={{ margin: 0, color: "#76675a", fontSize: 16 }}>
              Vor dem Termin, nach dem Termin und Wochen später laufen wichtige Kundenprozesse automatisch weiter.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
              gap: 16,
            }}
          >
            {automationEvents.map((item) => (
              <div
                key={item.title}
                style={{
                  padding: 22,
                  borderRadius: 22,
                  background: "linear-gradient(180deg,#ffffff,#f8efe5)",
                  border: "1px solid rgba(180,130,75,0.20)",
                  boxShadow: "0 14px 40px rgba(120,70,25,0.10)",
                }}
              >
                <div style={{ fontSize: 30, marginBottom: 12 }}>{item.icon}</div>
                <div
                  style={{
                    display: "inline-flex",
                    marginBottom: 12,
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "#f1dfc7",
                    color: "#8a5b25",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {item.badge}
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>{item.title}</h3>
                <p style={{ margin: 0, color: "#6f6259", lineHeight: 1.55 }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* AURA DECISION CENTER */}

        <section
          style={{
            marginBottom: 42,
            padding: "34px 28px",
            borderRadius: 30,
            background:
              "linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04))",
            border: "1px solid rgba(212,175,116,0.22)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "inline-flex",
                padding: "7px 12px",
                borderRadius: 999,
                background: "rgba(212,175,116,0.16)",
                color: "#d4af74",
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 14,
              }}
            >
              A.U.R.A Decision Center
            </div>

            <h2
              style={{
                margin: "0 0 12px",
                fontSize: "clamp(28px,5vw,34px)",
                color: "#fff8ea",
              }}
            >
              Mehr als Terminbuchung
            </h2>

            <p
              style={{
                color: "rgba(248,243,236,0.72)",
                lineHeight: 1.6,
                maxWidth: 760,
              }}
            >
              GlowSuite analysiert freie Termine, inaktive Kundinnen
              und wichtige Kennzahlen und zeigt dir,
              wo im Studio noch Potenzial liegt.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
              gap: 18,
            }}
          >
            {/* AUTOPILOT STATUS */}

            <section
              style={{
                marginBottom: 42,
                padding: "34px 28px",
                borderRadius: 30,
                background:
                  "linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04))",
                border: "1px solid rgba(212,175,116,0.22)",
                boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
              }}
            >
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: "inline-flex",
                    padding: "7px 12px",
                    borderRadius: 999,
                    background: "rgba(212,175,116,0.16)",
                    color: "#d4af74",
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 14,
                  }}
                >
                  Autopilot Status
                </div>

                <h2
                  style={{
                    margin: "0 0 12px",
                    fontSize: "clamp(28px,5vw,34px)",
                    color: "#fff8ea",
                  }}
                >
                  GlowSuite arbeitet automatisch im Hintergrund
                </h2>

                <p
                  style={{
                    color: "rgba(248,243,236,0.72)",
                    lineHeight: 1.6,
                  }}
                >
                  Während du Kundinnen behandelst, übernimmt GlowSuite
                  automatisch die wichtigsten Aufgaben.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                  gap: 16,
                }}
              >
                {[
                  "WhatsApp Erinnerungen aktiv",
                  "Google Bewertungen aktiv",
                  "Kundenreaktivierung aktiv",
                  "Umsatzanalyse aktiv",
                  "Kampagnen Optimierung aktiv",
                  "Freie Slots Überwachung aktiv",
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      padding: 18,
                      borderRadius: 20,
                      background: "#16110d",
                      border: "1px solid rgba(212,175,116,0.22)",
                      color: "#fff8ea",
                      fontWeight: 600,
                    }}
                  >
                    🟢 {item}
                  </div>
                ))}
              </div>
            </section>
            {/* REVENUE ALERT */}

            <div
              style={{
                padding: 24,
                borderRadius: 24,
                background: "#16110d",
                border: "1px solid rgba(255,120,120,0.18)",
              }}
            >
              <div
                style={{
                  color: "#ff9f9f",
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 14,
                }}
              >
                Umsatz Analyse
              </div>

              <h3
                style={{
                  margin: "0 0 12px",
                  fontSize: 24,
                  color: "#fff8ea",
                }}
              >
                ⚠️ Diese Woche 18% weniger Buchungen
              </h3>

              <p
                style={{
                  color: "rgba(248,243,236,0.72)",
                  lineHeight: 1.6,
                }}
              >
                A.U.R.A hat das Problem erkannt und empfiehlt automatisch eine Rückgewinnungskampagne für inaktive Kundinnen.

              </p>

              <div
                style={{
                  marginTop: 18,
                  padding: 14,
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <div style={{ color: "#d4af74", fontWeight: 700 }}>
                  A.U.R.A Empfehlung
                </div>

                <div
                  style={{
                    marginTop: 8,
                    color: "#f5f5f5",
                    lineHeight: 1.6,
                  }}
                >
                  → Rückholkampagne starten<br />
                  → Stammkunden reaktivieren<br />
                  → WhatsApp Broadcast senden
                </div>
              </div>
            </div>

            {/* CAMPAIGN GENERATED */}

            <div
              style={{
                padding: 24,
                borderRadius: 24,
                background: "#16110d",
                border: "1px solid rgba(212,175,116,0.22)",
              }}
            >
              <div
                style={{
                  color: "#d4af74",
                  fontSize: 13,
                  fontWeight: 700,
                  marginBottom: 14,
                }}
              >
                🤖 Automatisch von A.U.R.A erstellt
              </div>

              <h3
                style={{
                  margin: "0 0 12px",
                  fontSize: 24,
                  color: "#fff8ea",
                }}
              >
                „Wir vermissen dich 💛“
              </h3>

              <div
                style={{
                  background: "#0f0f0f",
                  borderRadius: 18,
                  padding: 16,
                  color: "#f5f5f5",
                  lineHeight: 1.7,
                  fontSize: 15,
                  marginTop: 18,
                }}
              >
                Hi Lisa ✨<br /><br />

                dein letzter Besuch ist schon etwas her.<br /><br />

                Diese Woche haben wir noch freie Termine
                für dich 💅<br /><br />

                Jetzt Termin sichern.
              </div>

              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "rgba(212,175,116,0.14)",
                    color: "#d4af74",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  WhatsApp
                </div>

                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.08)",
                    color: "#fff8ea",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Auto-generiert
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* ROI RECHNER */}
        <section
          style={{
            marginBottom: 42,
            padding: "34px 28px",
            borderRadius: 30,
            background:
              "linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04))",
            border: "1px solid rgba(212,175,116,0.22)",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(28px,5vw,42px)",
              marginBottom: 12,
            }}
          >
            Rechnet sich GlowSuite?
          </h2>

          <p
            style={{
              color: "rgba(248,243,236,0.78)",
              marginBottom: 22,
              maxWidth: 760,
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.7,
              fontSize: 16,
            }}
          >
            GlowSuite bringt nicht einfach „magisch“ neue Kundinnen.
            Der zusätzliche Umsatz entsteht durch Dinge, die in vielen Studios
            jeden Monat verloren gehen: verpasste Anfragen, vergessene Termine,
            No-Shows, fehlende Bewertungen und Kundinnen, die nicht erneut buchen.
          </p>

          <div
            style={{
              display: "grid",
              gap: 12,
              maxWidth: 760,
              margin: "0 auto 28px",
              textAlign: "left",
              color: "rgba(248,243,236,0.82)",
              fontSize: 15,
              lineHeight: 1.7,
            }}
          >
            <div>✅ weniger vergessene Termine durch automatische Erinnerungen</div>
            <div>✅ weniger No-Shows durch einfache STORNO-Antwort per WhatsApp</div>
            <div>✅ mehr Wiederbuchungen durch automatische Kundenreaktivierung</div>
            <div>✅ mehr Vertrauen durch automatische Google-Bewertungsanfragen</div>
            <div>✅ weniger verlorene Anfragen, weil GlowSuite sofort antwortet</div>
          </div>

          <div
            style={{
              marginTop: 28,
              padding: "26px 20px",
              borderRadius: 24,
              background: "linear-gradient(135deg,#18110d,#241810)",
              border: "1px solid rgba(212,175,116,0.32)",
              boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
            }}
          >
            <div
              style={{
                fontSize: "clamp(26px,5vw,40px)",
                fontWeight: 800,
                color: "#d4af74",
              }}
            >
              3 Termine × 70 € = 210 €
            </div>

            <p
              style={{
                color: "rgba(248,243,236,0.72)",
                marginBottom: 0,
              }}
            >
              Beispiel für zusätzliche oder gerettete Termine pro Monat.
            </p>
          </div>
        </section>



        {/* STUDIO CHECK CTA */}
        <section
          id="studio-check"
          style={{
            textAlign: "center",
            padding: "46px 28px",
            borderRadius: 30,
            background: "linear-gradient(135deg,#d4af74,#b8795b)",
            color: "#1d120c",
            border: "1px solid rgba(212,175,116,0.28)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "7px 13px",
              marginBottom: 16,
              borderRadius: 999,
              background: "rgba(255,255,255,0.20)",
              border: "1px solid rgba(255,255,255,0.28)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.02em",
              color: "#3b2418",
            }}
          >
            ✦ Kostenloser Studio-Check · ca. 5 Minuten
          </div>

          <h2
            style={{
              fontSize: "clamp(30px,5vw,42px)",
              margin: "0 0 12px",
            }}
          >
            Wo verliert dein Studio heute noch unnötig Zeit?
          </h2>

          <p
            style={{
              margin: "0 auto 24px",
              maxWidth: 680,
              lineHeight: 1.7,
            }}
          >
            Finde heraus, wo du bei Terminbuchung,
            Kundenkommunikation und Kundenbindung noch
            Potenzial liegen lässt.
          </p>

          <button
            onClick={() => {
              alert("Studio-Check Formular bauen wir als nächsten Schritt.");
            }}
            style={{
              padding: "15px 34px",
              fontSize: 16,
              background: "#120d0a",
              color: "#fff8ea",
              border: "none",
              borderRadius: 999,
              cursor: "pointer",
              fontWeight: 800,
              boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
            }}
          >
            Kostenlosen Studio-Check starten
          </button>

          <p
            style={{
              marginTop: 16,
              fontSize: 13,
              opacity: 0.75,
            }}
          >
            Du möchtest GlowSuite direkt ausprobieren?
            Testphase später jederzeit möglich.
          </p>
        </section>

        <p
          style={{
            fontSize: 12,
            opacity: 0.55,
            textAlign: "center",
            marginTop: 28,
          }}
        >
          Hinweis: Teile der Kommunikation erfolgen automatisiert durch einen
          KI-gestützten Assistenten.
        </p>
      </div>
    </main>
  );
}