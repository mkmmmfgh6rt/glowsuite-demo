"use client";

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
          Mehr Termine für dein Kosmetikstudio – automatisch
        </h1>

        <p
          style={{
            fontSize: 18,
            opacity: 0.85,
            maxWidth: 680,
            margin: "0 auto"
          }}
        >
          Verliere keine Kundenanfragen mehr und buche Termine automatisch – rund um die Uhr.<br />
          Reduziere No-Shows mit WhatsApp-Erinnerungen und spare täglich Zeit im Studio.
        </p>
      </div>


      {/* SOCIAL PROOF / HOOK */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 30,
          fontSize: 15,
          opacity: 0.8
        }}
      >
        Teste jetzt live, wie dein Studio automatisch Termine & Kundenanfragen übernimmt 👇
      </div>


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
        <div>✓ nie wieder verpasste Kundenanfragen</div>
        <div>✓ automatische Terminbuchung 24/7</div>
        <div>✓ weniger No-Shows durch WhatsApp Erinnerungen</div>
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
          onClick={() => {
            const text = encodeURIComponent(
              "Ich habe die Demo getestet und möchte GlowSuite für mein Studio einrichten 🚀"
            );

            window.open(`https://wa.me/491777875051?text=${text}`, "_blank");
          }}
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
          Jetzt kostenlose Demo starten
        </button>
      </div>


      {/* AI HINWEIS */}
      <p style={{ fontSize: 12, opacity: 0.6, textAlign: "center", marginTop: 30 }}>
        Hinweis: Teile der Kommunikation erfolgen automatisiert durch einen KI-gestützten Assistenten.
      </p>

    </main>
  );
}