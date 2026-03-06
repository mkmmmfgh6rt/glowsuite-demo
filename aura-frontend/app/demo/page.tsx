export default function DemoPage() {
  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 20px" }}>

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 40
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 20 }}>
          GlowSuite AI
        </div>

        <div style={{ fontSize: 14, opacity: 0.7 }}>
          Beauty Studio Automation
        </div>
      </div>


      {/* HERO */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 30,
          padding: "50px 30px",
          background: "linear-gradient(180deg,#ffffff,#f7f7f7)",
          borderRadius: 20
        }}
      >
        <h1 style={{ fontSize: 44, fontWeight: 700, marginBottom: 12 }}>
          Mehr Termine für dein Kosmetikstudio
        </h1>

        <p
          style={{
            fontSize: 18,
            opacity: 0.85,
            maxWidth: 680,
            margin: "0 auto"
          }}
        >
          GlowSuite AI beantwortet Kundenfragen, zeigt Preise und nimmt Termine
          automatisch entgegen – inklusive Bestätigung und WhatsApp-Erinnerung.
        </p>
      </div>


      {/* SOCIAL PROOF */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 30,
          fontSize: 15,
          opacity: 0.8
        }}
      >
        Beispielstudio: <b>Beauty Lounge Berlin</b> · ⭐ 4.9 Bewertung · 200+ Kunden
      </div>


      {/* DEMO HINWEIS */}
      <p
        style={{
          textAlign: "center",
          marginBottom: 20,
          fontWeight: 500
        }}
      >
        Teste den Beauty-Agent live 👇
      </p>


      {/* DEMO WIDGET */}
      <div
        style={{
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.06)",
          marginBottom: 40,
          boxShadow: "0 20px 60px rgba(0,0,0,0.08)"
        }}
      >
        <iframe
          src="http://localhost:8083/widget.html"
          style={{ width: "100%", height: 820, border: "none" }}
          title="GlowSuite Widget Demo"
        />
      </div>


      {/* BENEFITS */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 30,
          flexWrap: "wrap",
          marginBottom: 50,
          fontSize: 16,
          fontWeight: 500
        }}
      >
        <div>✓ automatische Terminbuchung rund um die Uhr</div>
        <div>✓ WhatsApp Erinnerungen gegen No-Shows</div>
        <div>✓ mehr Google Bewertungen durch Follow-ups</div>
      </div>


      {/* CTA */}
      <div
        style={{
          textAlign: "center",
          padding: "40px 30px",
          background: "#f7f7f7",
          borderRadius: 16
        }}
      >
        <h3 style={{ marginBottom: 10 }}>
          Kostenloses Setup für dein Studio
        </h3>

        <p style={{ opacity: 0.8, marginBottom: 20 }}>
          Wir richten GlowSuite für dein Studio ein und zeigen dir,
          wie du automatisch mehr Termine bekommst.
        </p>

        <button
          style={{
            padding: "14px 36px",
            fontSize: 16,
            background: "#cfa86f",
            color: "white",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 600,
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
          }}
        >
          Kostenlose Demo anfordern
        </button>
      </div>

    </main>
  );
}