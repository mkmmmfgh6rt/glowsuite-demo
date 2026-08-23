import Link from "next/link";

export default function DatenschutzPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        color: "#f7efe7",
        background:
          "radial-gradient(circle at 20% 0%, rgba(212,175,116,0.18), transparent 32%), radial-gradient(circle at 80% 75%, rgba(184,121,91,0.10), transparent 38%), linear-gradient(180deg,#120d0a 0%,#1b130f 48%,#120d0a 100%)",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* HEADER */}
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(18,13,10,0.88)",
          backdropFilter: "blur(18px)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "18px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <Link
            href="/"
            style={{
              color: "#fff8f0",
              textDecoration: "none",
              fontWeight: 800,
              fontSize: 20,
              letterSpacing: "-0.02em",
            }}
          >
            GlowSuite AI
          </Link>

          <Link
            href="/"
            style={{
              color: "#eadcc9",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 700,
              padding: "10px 15px",
              borderRadius: 12,
              border: "1px solid rgba(234,220,201,0.20)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            ← Zurück zu GlowSuite
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "82px 24px 30px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "7px 12px",
            borderRadius: 999,
            background: "rgba(212,175,116,0.10)",
            border: "1px solid rgba(212,175,116,0.22)",
            color: "#d9bc8b",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: ".04em",
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          Datenschutz
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "clamp(38px, 6vw, 64px)",
            lineHeight: 1.02,
            letterSpacing: "-0.045em",
            color: "#fffaf4",
          }}
        >
          Deine Daten.
          <br />
          Transparent behandelt.
        </h1>

        <p
          style={{
            maxWidth: 690,
            margin: "22px auto 0",
            color: "#cdbfb4",
            fontSize: 17,
            lineHeight: 1.75,
          }}
        >
          Hier informieren wir darüber, welche personenbezogenen Daten bei
          GlowSuite AI verarbeitet werden, warum wir sie benötigen und welche
          Rechte dir zustehen.
        </p>
      </section>

      {/* CONTENT */}
      <section
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "38px 24px 100px",
        }}
      >
        <div
          style={{
            padding: "clamp(24px, 5vw, 52px)",
            borderRadius: 28,
            background:
              "linear-gradient(145deg, rgba(255,250,244,0.97), rgba(239,225,209,0.96))",
            color: "#35261f",
            border: "1px solid rgba(212,175,116,0.24)",
            boxShadow: "0 28px 80px rgba(0,0,0,0.28)",
          }}
        >
          <LegalSection title="1. Verantwortlicher">
            <p>
              Verantwortlich für die Datenverarbeitung im Sinne der
              Datenschutz-Grundverordnung (DSGVO) ist:
            </p>

            <p>
              <strong>Jennifer Nowicki</strong>
              <br />
              Oderstraße 24
              <br />
              16303 Schwedt/Oder
              <br />
              <br />
              E-Mail:{" "}
              <a href="mailto:mmazur871@gmail.com">
                mmazur871@gmail.com
              </a>
            </p>
          </LegalSection>

          <LegalSection title="2. Verarbeitung personenbezogener Daten">
            <p>
              Wir verarbeiten personenbezogene Daten nur, soweit dies für die
              Bereitstellung unserer Website, die Durchführung des GlowSuite
              Studio-Checks, die Bearbeitung von Anfragen oder die Anbahnung
              einer möglichen Geschäftsbeziehung erforderlich ist.
            </p>

            <p>
              Abhängig von der jeweiligen Nutzung können insbesondere folgende
              Daten verarbeitet werden:
            </p>

            <ul>
              <li>Name bzw. Vorname</li>
              <li>E-Mail-Adresse</li>
              <li>freiwillig mitgeteilte Kontaktdaten</li>
              <li>Angaben aus dem GlowSuite Studio-Check</li>
              <li>ermittelter Studio-Score</li>
              <li>erkannte Optimierungs- und Automatisierungspotenziale</li>
              <li>Zeitpunkt der Übermittlung</li>
              <li>technisch erforderliche Verbindungs- und Serverdaten</li>
            </ul>
          </LegalSection>

          <LegalSection title="3. GlowSuite Studio-Check">
            <p>
              Auf unserer Website kann ein kostenloser Studio-Check
              durchgeführt werden. Dabei werden Fragen zu ausgewählten
              organisatorischen und digitalen Abläufen des Studios
              beantwortet.
            </p>

            <p>
              Zur Erstellung und Bereitstellung der persönlichen Auswertung
              verarbeiten wir insbesondere Vorname, E-Mail-Adresse, Antworten,
              den daraus berechneten Studio-Score sowie die daraus abgeleiteten
              Optimierungspotenziale.
            </p>

            <p>
              Die Verarbeitung erfolgt zur Durchführung des angeforderten
              Studio-Checks und zur Bearbeitung einer daraus entstehenden
              Kontakt- oder Geschäftsanfrage.
            </p>

            <p>
              Rechtsgrundlage ist insbesondere Art. 6 Abs. 1 lit. b DSGVO,
              soweit die Verarbeitung zur Durchführung vorvertraglicher
              Maßnahmen auf Anfrage der betroffenen Person erforderlich ist.
            </p>

            <p>
              Soweit darüber hinaus eine Verarbeitung zur Organisation,
              Dokumentation und Bearbeitung eingehender Interessentenanfragen
              erforderlich ist, kann die Verarbeitung auf Grundlage unseres
              berechtigten Interesses gemäß Art. 6 Abs. 1 lit. f DSGVO
              erfolgen.
            </p>
          </LegalSection>

          <LegalSection title="4. Verwendung von Airtable">
            <p>
              Zur strukturierten Verwaltung von Anfragen und Studio-Check-Daten
              nutzen wir Airtable.
            </p>

            <p>
              Anbieter:
              <br />
              <strong>Formagrid Inc. dba Airtable</strong>
              <br />
              1 Front Street, Floor 28
              <br />
              San Francisco, CA 94111
              <br />
              USA
            </p>

            <p>
              In Airtable können insbesondere Name, E-Mail-Adresse,
              Studio-Check-Ergebnisse, Studio-Score, erkannte Potenziale,
              Kontaktstatus sowie interne Bearbeitungsvermerke gespeichert
              werden.
            </p>

            <p>
              Airtable wird zur Verwaltung und Bearbeitung von Interessenten-
              und Kundenanfragen eingesetzt.
            </p>

            <p>
              Dabei kann eine Verarbeitung personenbezogener Daten außerhalb
              der Europäischen Union bzw. des Europäischen Wirtschaftsraums
              stattfinden. Soweit erforderlich, werden geeignete Garantien nach
              den geltenden Datenschutzvorschriften eingesetzt.
            </p>
          </LegalSection>

          <LegalSection title="5. Hosting und technische Bereitstellung">
            <p>
              Unsere Website und die für den Studio-Check erforderlichen
              technischen Funktionen werden über externe Hosting- und
              Infrastruktur-Dienstleister bereitgestellt.
            </p>

            <p>
              Beim Aufruf unserer Website können technisch notwendige Daten
              verarbeitet werden. Hierzu können insbesondere IP-Adresse, Datum
              und Uhrzeit des Zugriffs, aufgerufene Seite,
              Browserinformationen sowie technische Fehler- und
              Protokolldaten gehören.
            </p>

            <p>
              Diese Verarbeitung dient der sicheren, stabilen und technisch
              funktionsfähigen Bereitstellung der Website.
            </p>

            <p>
              Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser
              berechtigtes Interesse besteht in der sicheren und zuverlässigen
              Bereitstellung unseres Online-Angebots.
            </p>
          </LegalSection>

          <LegalSection title="6. Keine automatische Einwilligung in Werbung">
            <p>
              Die Angabe einer E-Mail-Adresse im Rahmen des Studio-Checks
              bedeutet nicht automatisch, dass ein Newsletter oder regelmäßige
              Werbe-E-Mails abonniert werden.
            </p>

            <p>
              Sollten wir künftig einen Newsletter oder andere
              einwilligungsbasierte Marketing-Kommunikation anbieten, wird
              hierfür eine gesonderte Einwilligung eingeholt, soweit dies
              gesetzlich erforderlich ist.
            </p>
          </LegalSection>

          <LegalSection title="7. Speicherdauer und Löschung">
            <p>
              Personenbezogene Daten werden nur so lange gespeichert, wie dies
              für den jeweiligen Verarbeitungszweck erforderlich ist oder
              gesetzliche Aufbewahrungspflichten bestehen.
            </p>

            <p>
              Daten aus Anfragen und dem Studio-Check können insbesondere so
              lange gespeichert werden, wie dies für die Bearbeitung der
              Anfrage, die angeforderte Auswertung oder eine daraus entstehende
              Geschäftsbeziehung erforderlich ist.
            </p>

            <p>
              Entfällt der Zweck der Verarbeitung und bestehen keine
              gesetzlichen Aufbewahrungspflichten oder sonstigen
              Rechtsgrundlagen für eine weitere Speicherung, werden die Daten
              gelöscht.
            </p>
          </LegalSection>

          <LegalSection title="8. Datensicherheit">
            <p>
              Wir treffen angemessene technische und organisatorische
              Maßnahmen, um personenbezogene Daten vor Verlust, unbefugtem
              Zugriff, Veränderung oder unzulässiger Offenlegung zu schützen.
            </p>

            <p>
              Die Übertragung unserer Website erfolgt grundsätzlich
              verschlüsselt über HTTPS.
            </p>
          </LegalSection>

          <LegalSection title="9. Deine Rechte">
            <p>
              Nach Maßgabe der gesetzlichen Voraussetzungen bestehen
              insbesondere folgende Datenschutzrechte:
            </p>

            <ul>
              <li>Recht auf Auskunft</li>
              <li>Recht auf Berichtigung</li>
              <li>Recht auf Löschung</li>
              <li>Recht auf Einschränkung der Verarbeitung</li>
              <li>Recht auf Datenübertragbarkeit</li>
              <li>Recht auf Widerspruch gegen bestimmte Verarbeitungen</li>
              <li>
                Recht auf Widerruf einer erteilten Einwilligung mit Wirkung für
                die Zukunft
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="10. Widerspruchsrecht">
            <p>
              Soweit wir personenbezogene Daten auf Grundlage von Art. 6 Abs. 1
              lit. f DSGVO verarbeiten, besteht unter den gesetzlichen
              Voraussetzungen das Recht, dieser Verarbeitung zu widersprechen.
            </p>
          </LegalSection>

          <LegalSection title="11. Beschwerderecht">
            <p>
              Es besteht das Recht, sich bei einer
              Datenschutz-Aufsichtsbehörde über die Verarbeitung
              personenbezogener Daten zu beschweren.
            </p>
          </LegalSection>

          <LegalSection title="12. Änderungen dieser Datenschutzerklärung">
            <p>
              Wir können diese Datenschutzerklärung anpassen, wenn sich unsere
              Website, eingesetzte Dienste oder gesetzliche Anforderungen
              ändern.
            </p>

            <p>
              <strong>Stand: August 2026</strong>
            </p>
          </LegalSection>

          <div
            style={{
              marginTop: 48,
              paddingTop: 28,
              borderTop: "1px solid rgba(82,56,43,0.13)",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "13px 20px",
                borderRadius: 14,
                color: "#2b1d17",
                textDecoration: "none",
                fontWeight: 800,
                background: "linear-gradient(135deg,#d4af74,#b8795b)",
                boxShadow: "0 10px 28px rgba(120,75,45,0.18)",
              }}
            >
              ← Zurück zu GlowSuite
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        padding: "28px 0",
        borderBottom: "1px solid rgba(82,56,43,0.10)",
      }}
    >
      <h2
        style={{
          margin: "0 0 14px",
          color: "#3a261e",
          fontSize: "clamp(20px, 3vw, 26px)",
          lineHeight: 1.25,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h2>

      <div
        style={{
          color: "#695247",
          fontSize: 15,
          lineHeight: 1.8,
        }}
      >
        {children}
      </div>
    </section>
  );
}