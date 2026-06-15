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
    title: "WhatsApp Erinnerung gesendet",
    text: "Anna erhält automatisch ihre 24h Erinnerung für morgen um 14:30 Uhr.",
    badge: "No-Show Schutz",
  },
  {
    icon: "⭐",
    title: "Bewertung angefragt",
    text: "Nach dem Besuch fragt GlowSuite automatisch nach einer Google Bewertung.",
    badge: "Review Boost",
  },
  {
    icon: "🔄",
    title: "Kundin reaktiviert",
    text: "Lisa war 74 Tage inaktiv. A.U.R.A empfiehlt eine Rückhol-Kampagne.",
    badge: "Reaktivierung",
  },
  {
    icon: "🧠",
    title: "A.U.R.A Empfehlung",
    text: "Dienstag 13–16 Uhr ist schwach ausgelastet. Kampagne empfohlen.",
    badge: "AI Advisor",
  },
];

const stats = [
  ["24/7", "automatische Terminannahme"],
  ["2x", "WhatsApp Erinnerungen"],
  ["60+", "Tage Reaktivierung"],
  ["0%", "Provision pro Buchung"],
];

export default function DemoPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 20% 0%, rgba(212,175,116,0.22), transparent 35%), linear-gradient(180deg,#120d0a 0%,#1b130f 45%,#f8f3ec 100%)",
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
            Weniger Stress. Mehr Buchungen. Zufriedenere Kunden.
          </h1>

          <p
            style={{
              fontSize: 18,
              lineHeight: 1.7,
              color: "rgba(248,243,236,0.78)",
              maxWidth: 760,
              margin: "0 auto",
            }}
          >
            GlowSuite übernimmt Terminanfragen, WhatsApp-Erinnerungen und Kundenreaktivierung – automatisch.
            Damit du dich auf deine Kundinnen konzentrieren kannst.
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
              Eine Nachricht reicht — A.U.R.A übernimmt den Rest
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
              Kundinnen können ganz normal schreiben. GlowSuite erkennt automatisch
              Service, Datum, Uhrzeit und Mitarbeiterwunsch.
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
                1️⃣ Kunde schreibt
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
                2️⃣ A.U.R.A übernimmt
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
                3️⃣ Termin bestätigt
              </div>

              <div style={{ color: "#fff8ea", lineHeight: 1.9, fontSize: 16 }}>
                ✅ WhatsApp-Erinnerung<br />
                ✅ PDF-Bestätigung<br />
                ✅ Google-Bewertung<br />
                ✅ Kundenreaktivierung
              </div>
            </div>
          </div>
        </section>



        {/* WIDGET */}
        <section
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
              Echte Einblicke in WhatsApp-Automation, Kalender, Dashboard und Terminbestätigung.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
              gap: 20,
            }}
          >
            {[
              {
                src: "/demo.bilder/demo-whatsapp-upsell.webp",
                title: "WhatsApp Buchung & Upsell",
                text: "A.U.R.A erkennt Terminwunsch und empfiehlt automatisch passende Zusatzleistungen.",
              },
              {
                src: "/demo.bilder/demo-whatsapp-mitarbeiter.webp",
                title: "Fehlende Angaben erkannt",
                text: "Wenn eine Angabe fehlt, fragt GlowSuite automatisch nach und hält den Termin kurz frei.",
              },
              {
                src: "/demo.bilder/demo-whatsapp-storno.webp",
                title: "Storno über WhatsApp",
                text: "Kundinnen können Termine selbstständig stornieren, ohne dein Team zu belasten.",
              },
              {
                src: "/demo.bilder/demo-kalender.webp",
                title: "Automatischer Kalender",
                text: "Alle Buchungen landen übersichtlich im Kalender.",
              },
              {
                src: "/demo.bilder/demo-dashboard-kpis.webp",
                title: "Dashboard Kennzahlen",
                text: "Buchungen, Umsatz und aktive Kunden auf einen Blick.",
              },
              {
                src: "/demo.bilder/demo-dashboard-analytics.webp",
                title: "Umsatzanalyse",
                text: "GlowSuite erkennt Top-Services, Trends und Umsatzchancen.",
              },
              {
                src: "/demo.bilder/demo-terminbestaetigung.webp",
                title: "Premium Terminbestätigung",
                text: "Kundinnen erhalten eine hochwertige Bestätigung mit Kalenderintegration.",
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
              Was nach der Buchung automatisch passiert
            </h2>
            <p style={{ margin: 0, color: "#76675a", fontSize: 16 }}>
              Genau hier entsteht der Unterschied: GlowSuite hört nach der Buchung
              nicht auf — A.U.R.A arbeitet weiter.
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
              A.U.R.A erkennt Umsatzprobleme automatisch
            </h2>

            <p
              style={{
                color: "rgba(248,243,236,0.72)",
                lineHeight: 1.6,
                maxWidth: 760,
              }}
            >
              Während du arbeitest, analysiert A.U.R.A freie Termine,
              Kundenverluste und Umsatzchancen in Echtzeit
              — und schlägt automatisch passende Aktionen vor.
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


        {/* LIVE WHATSAPP AUTOMATION */}

        <section
          style={{
            marginBottom: 42,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
            gap: 22,
          }}
        >
          {/* REMINDER */}

          <div
            style={{
              borderRadius: 28,
              padding: 24,
              background:
                "linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04))",
              border: "1px solid rgba(212,175,116,0.22)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                padding: "7px 12px",
                borderRadius: 999,
                background: "rgba(212,175,116,0.16)",
                color: "#d4af74",
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              WhatsApp Reminder
            </div>

            <h3
              style={{
                margin: "0 0 12px",
                fontSize: 28,
                color: "#fff8ea",
              }}
            >
              Automatische Termin-Erinnerungen
            </h3>

            <p
              style={{
                color: "rgba(248,243,236,0.72)",
                lineHeight: 1.6,
                marginBottom: 22,
              }}
            >
              GlowSuite erinnert Kundinnen automatisch per WhatsApp —
              24 Stunden und 2 Stunden vor dem Termin.
            </p>

            <div
              style={{
                background: "#0f0f0f",
                borderRadius: 24,
                padding: 18,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "#7ef29a",
                  marginBottom: 10,
                  fontWeight: 700,
                }}
              >
                GlowSuite AI ✨
              </div>

              <div
                style={{
                  background: "#1b1b1b",
                  borderRadius: 18,
                  padding: 16,
                  color: "#f5f5f5",
                  lineHeight: 1.6,
                  fontSize: 15,
                }}
              >
                Hi Lisa 😊<br /><br />

                dein Termin morgen um 14:30 Uhr bei Beauty Lounge.<br /><br />

                Bitte bestätige kurz deinen Termin:
                <br /><br />

                ✅ Bestätigen<br />
                ❌ Absagen
              </div>
            </div>
          </div>

          {/* REVIEW BOOST */}

          <div
            style={{
              borderRadius: 28,
              padding: 24,
              background:
                "linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04))",
              border: "1px solid rgba(212,175,116,0.22)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                padding: "7px 12px",
                borderRadius: 999,
                background: "rgba(212,175,116,0.16)",
                color: "#d4af74",
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              Google Bewertungen
            </div>

            <h3
              style={{
                margin: "0 0 12px",
                fontSize: 28,
                color: "#fff8ea",
              }}
            >
              Bewertungen automatisch steigern
            </h3>

            <p
              style={{
                color: "rgba(248,243,236,0.72)",
                lineHeight: 1.6,
                marginBottom: 22,
              }}
            >
              Nach dem Termin fragt GlowSuite automatisch nach einer
              Google Bewertung — ohne dass dein Team schreiben muss.
            </p>

            <div
              style={{
                background: "#0f0f0f",
                borderRadius: 24,
                padding: 18,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "#7ef29a",
                  marginBottom: 10,
                  fontWeight: 700,
                }}
              >
                GlowSuite AI ✨
              </div>

              <div
                style={{
                  background: "#1b1b1b",
                  borderRadius: 18,
                  padding: 16,
                  color: "#f5f5f5",
                  lineHeight: 1.6,
                  fontSize: 15,
                }}
              >
                Danke für deinen Besuch 💖<br /><br />

                Wir hoffen du warst zufrieden.<br /><br />

                ⭐ Jetzt Google Bewertung abgeben
              </div>
            </div>
          </div>
        </section>

        {/* BEFORE AFTER */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 18,
            marginBottom: 42,
          }}
        >
          <div
            style={{
              padding: 28,
              borderRadius: 26,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <h3 style={{ color: "#f1b4a6", fontSize: 24 }}>Ohne GlowSuite</h3>
            <p>❌ Terminlücken bleiben unbesetzt</p>
            <p>❌ No-Shows kosten Umsatz</p>
            <p>❌ Kunden kommen nicht zurück</p>
            <p>❌ Bewertungen werden vergessen</p>
            <p>❌ Umsatzprobleme bleiben unentdeckt</p>
          </div>

          <div
            style={{
              padding: 28,
              borderRadius: 26,
              background: "rgba(212,175,116,0.14)",
              border: "1px solid rgba(212,175,116,0.28)",
            }}
          >
            <h3 style={{ color: "#d4af74", fontSize: 24 }}>Mit GlowSuite</h3>
            <p>✅ Termine werden automatisch gebucht</p>
            <p>✅ WhatsApp Erinnerungen reduzieren No-Shows</p>
            <p>✅ Kunden werden automatisch reaktiviert</p>
            <p>✅ Bewertungen werden automatisch angefragt</p>
            <p>✅ A.U.R.A erkennt Umsatzchancen frühzeitig</p>
          </div>
        </section>

        {/* CTA */}
        <section
          style={{
            textAlign: "center",
            padding: "42px 28px",
            borderRadius: 30,
            background: "linear-gradient(135deg,#d4af74,#b8795b)",
            color: "#1d120c",
            boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
          }}
        >
          <h2 style={{ fontSize: 34, margin: "0 0 10px" }}>
            Noch 12 kostenlose Testplätze verfügbar
          </h2>

          <p style={{ margin: "0 auto 24px", maxWidth: 680, lineHeight: 1.6 }}>
            Teste GlowSuite 30 Tage kostenlos und finde heraus,
            wie viel Zeit und Umsatz dein Studio zurückgewinnen kann.

          </p>

          <button
            onClick={() => {
              const text = encodeURIComponent(
                "Ich habe die GlowSuite Demo getestet und möchte auf die Testkunden-Liste 🚀"
              );

              window.open(`https://wa.me/491777875051?text=${text}`, "_blank");
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
            Kostenlosen Testplatz anfragen
          </button>
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