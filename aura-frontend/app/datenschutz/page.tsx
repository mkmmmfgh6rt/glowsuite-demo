import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Datenschutz | GlowSuite AI",
  description:
    "Informationen zur Verarbeitung personenbezogener Daten bei GlowSuite AI.",
  alternates: { canonical: "/datenschutz" },
};

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
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(18,13,10,0.88)",
          backdropFilter: "blur(18px)",
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
            fontSize: "clamp(38px,6vw,64px)",
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

      <section
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "38px 24px 100px",
        }}
      >
        <div
          style={{
            padding: "clamp(24px,5vw,52px)",
            borderRadius: 28,
            background:
              "linear-gradient(145deg,rgba(255,250,244,0.97),rgba(239,225,209,0.96))",
            color: "#35261f",
            border: "1px solid rgba(212,175,116,0.24)",
            boxShadow: "0 28px 80px rgba(0,0,0,0.28)",
          }}
        >
          <LegalSection title="1. Verantwortliche Stelle">
            <p>
              Verantwortlich für die Datenverarbeitung im Sinne der
              Datenschutz-Grundverordnung (DSGVO) ist:
            </p>
            <p>
              <strong>GlowSuite AI</strong>
              <br />
              Inhaberin: Jennifer Nowicki
              <br />
              Oderstraße 24
              <br />
              16303 Schwedt/Oder
              <br />
              Deutschland
            </p>
            <p>
              E-Mail: {" "}
              <a href="mailto:auswertung.glowsuite@gmail.com">
                auswertung.glowsuite@gmail.com
              </a>
            </p>
          </LegalSection>

          <LegalSection title="2. Grundsätze der Datenverarbeitung">
            <p>
              Wir verarbeiten personenbezogene Daten nur, soweit dies für die
              Bereitstellung unserer Website, angeforderte Inhalte, den
              Studio-Check, die Bearbeitung von Anfragen, die Durchführung
              vorvertraglicher Maßnahmen oder die Erbringung unserer Leistungen
              erforderlich ist.
            </p>
            <p>Abhängig von der Nutzung können insbesondere verarbeitet werden:</p>
            <ul>
              <li>Name und Kontaktdaten</li>
              <li>Studio- und Unternehmensangaben</li>
              <li>Antworten und Ergebnisse aus dem Studio-Check</li>
              <li>Nachrichten und Buchungsangaben</li>
              <li>Einwilligungsstatus und Zeitpunkt einer Einwilligung</li>
              <li>Herkunfts- und Kampagneninformationen wie UTM-Parameter</li>
              <li>IP-Adresse, Browser-, Geräte- und Serverprotokolldaten</li>
            </ul>
            <p>
              Rechtsgrundlagen sind je nach Verarbeitung insbesondere Art. 6
              Abs. 1 lit. a DSGVO bei einer Einwilligung, Art. 6 Abs. 1 lit. b
              DSGVO bei Verträgen und vorvertraglichen Maßnahmen, Art. 6 Abs. 1
              lit. c DSGVO bei gesetzlichen Pflichten sowie Art. 6 Abs. 1 lit. f
              DSGVO bei berechtigten Interessen.
            </p>
          </LegalSection>

          <LegalSection title="3. Hosting über Vercel">
            <p>
              Unsere Website wird über <strong>Vercel Inc.</strong> technisch
              bereitgestellt. Beim Aufruf der Website können insbesondere
              IP-Adresse, Zeitpunkt des Zugriffs, aufgerufene Seite,
              Browserinformationen, Geräteinformationen sowie technische
              Protokoll- und Fehlerdaten verarbeitet werden.
            </p>
            <p>
              Die Verarbeitung dient der sicheren, stabilen und schnellen
              Bereitstellung unseres Online-Angebots. Rechtsgrundlage ist Art. 6
              Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt im
              zuverlässigen und sicheren Betrieb der Website.
            </p>
            <p>
              Eine Verarbeitung in Staaten außerhalb der Europäischen Union
              kann nicht ausgeschlossen werden. Dabei werden die gesetzlich
              vorgesehenen Schutzmechanismen eingesetzt.
            </p>
            <ProviderLink href="https://vercel.com/legal/privacy-notice">
              Datenschutzhinweise von Vercel
            </ProviderLink>
          </LegalSection>

          <LegalSection title="4. Kontaktaufnahme per E-Mail">
            <p>
              Wenn du uns per E-Mail kontaktierst, verarbeiten wir deine
              E-Mail-Adresse, den Inhalt deiner Nachricht und weitere freiwillig
              übermittelte Angaben zur Bearbeitung deines Anliegens.
            </p>
            <p>
              Die Kontaktadresse wird über Google-Dienste bereitgestellt. Dabei
              kann eine Verarbeitung durch Google Ireland Limited und verbundene
              Unternehmen stattfinden.
            </p>
            <p>
              Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, wenn sich die
              Anfrage auf einen Vertrag oder vorvertragliche Maßnahmen bezieht.
              Im Übrigen erfolgt die Verarbeitung auf Grundlage von Art. 6 Abs.
              1 lit. f DSGVO.
            </p>
            <ProviderLink href="https://policies.google.com/privacy?hl=de">
              Datenschutzhinweise von Google
            </ProviderLink>
          </LegalSection>

          <LegalSection title="5. Download der 50 Social-Media-Hooks">
            <p>
              Für die Bereitstellung der kostenlosen Hook-Sammlung verarbeiten
              wir insbesondere Vorname, E-Mail-Adresse, Zeitpunkt der Anfrage,
              Einwilligungsstatus sowie gegebenenfalls Herkunfts- und
              Kampagneninformationen.
            </p>
            <p>
              Die Verarbeitung zur Bereitstellung und Zusendung der angeforderten
              PDF erfolgt gemäß Art. 6 Abs. 1 lit. b DSGVO. Eine freiwillige
              Einwilligung für weitere E-Mail-Tipps ist keine Voraussetzung für
              den Download und wird getrennt erfasst. Sie kann jederzeit mit
              Wirkung für die Zukunft widerrufen werden.
            </p>
          </LegalSection>

          <LegalSection title="6. GlowSuite Studio-Check">
            <p>
              Beim kostenlosen Studio-Check werden Angaben zu organisatorischen
              und digitalen Abläufen eines Studios verarbeitet. Hierzu gehören
              insbesondere Vorname, E-Mail-Adresse, Antworten, der errechnete
              Studio-Score und daraus abgeleitete Optimierungshinweise.
            </p>
            <p>
              Die Verarbeitung erfolgt zur Erstellung und Zusendung der
              angeforderten Auswertung sowie zur Bearbeitung einer daraus
              entstehenden Anfrage. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b
              DSGVO. Die Organisation und Dokumentation eingehender Anfragen kann
              ergänzend auf Art. 6 Abs. 1 lit. f DSGVO gestützt werden.
            </p>
            <p>
              Der Studio-Score dient ausschließlich der unverbindlichen
              Orientierung. Er entfaltet keine rechtliche Wirkung und führt nicht
              zu einer ausschließlich automatisierten Entscheidung mit einer
              vergleichbaren erheblichen Beeinträchtigung.
            </p>
          </LegalSection>

          <LegalSection title="7. Verarbeitung mit Airtable">
            <p>
              Zur Verwaltung von Downloads, Studio-Checks, Interessenten- und
              Kundenanfragen nutzen wir <strong>Airtable</strong>, einen Dienst
              der Formagrid Inc. dba Airtable, 1 Front Street, Floor 28, San
              Francisco, CA 94111, USA.
            </p>
            <p>
              Dabei können insbesondere Name, E-Mail-Adresse, Studioangaben,
              Ergebnisse, Einwilligungsstatus, Kontaktstatus,
              Kampagneninformationen und interne Bearbeitungsvermerke gespeichert
              werden.
            </p>
            <p>
              Rechtsgrundlage ist je nach Vorgang Art. 6 Abs. 1 lit. a, b oder f
              DSGVO. Bei Übermittlungen in Drittländer werden geeignete
              Garantien, insbesondere Angemessenheitsbeschlüsse oder
              Standardvertragsklauseln, eingesetzt.
            </p>
            <ProviderLink href="https://www.airtable.com/company/privacy">
              Datenschutzhinweise von Airtable
            </ProviderLink>
          </LegalSection>

          <LegalSection title="8. E-Mail-Versand mit Brevo">
            <p>
              Für transaktionale E-Mails, beispielsweise die Zusendung der
              Hook-Sammlung oder einer Studio-Auswertung, sowie bei freiwilliger
              Einwilligung für weitere Informationen nutzen wir
              <strong> Brevo</strong>.
            </p>
            <p>
              Dabei können insbesondere Name, E-Mail-Adresse, Inhalt und Status
              der versendeten Nachricht sowie der dokumentierte
              Einwilligungsstatus verarbeitet werden. Die Zusendung einer
              angeforderten Datei oder Auswertung führt nicht automatisch zu
              einem Newsletter-Abonnement.
            </p>
            <p>
              Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO für angeforderte
              E-Mails und Art. 6 Abs. 1 lit. a DSGVO für freiwillige
              Marketing-Einwilligungen.
            </p>
            <ProviderLink href="https://www.brevo.com/de/legal/privacypolicy/">
              Datenschutzhinweise von Brevo
            </ProviderLink>
          </LegalSection>

          <LegalSection title="9. Automatisierungen mit n8n">
            <p>
              Zur technischen Automatisierung einzelner Abläufe nutzen wir
              <strong> n8n Cloud</strong> der n8n GmbH, Novalisstraße 10, 10115
              Berlin. n8n kann Daten zwischen den von uns eingesetzten Systemen
              übertragen und Verarbeitungsschritte ausführen.
            </p>
            <p>
              Abhängig vom Vorgang können dabei Kontaktdaten, Datensatz-IDs,
              Statusinformationen sowie Ergebnisse aus Anfragen und Studio-Checks
              verarbeitet werden. Rechtsgrundlage richtet sich nach dem
              zugrunde liegenden Vorgang und ist insbesondere Art. 6 Abs. 1 lit.
              b oder f DSGVO sowie bei freiwilliger Kommunikation Art. 6 Abs. 1
              lit. a DSGVO.
            </p>
            <ProviderLink href="https://n8n.io/legal/privacy/">
              Datenschutzhinweise von n8n
            </ProviderLink>
          </LegalSection>

          <LegalSection title="10. KI-gestützter Assistent A.U.R.A.">
            <p>
              Bei Nutzung unseres KI-gestützten Assistenten A.U.R.A. werden die
              eingegebenen Nachrichten, technische Sitzungsinformationen und der
              für die Beantwortung notwendige Kontext verarbeitet. Vor Beginn
              der Kommunikation wird darauf hingewiesen, dass die Unterhaltung
              mit einem KI-System erfolgt.
            </p>
            <p>
              Zur Erzeugung von Antworten können KI-Dienste von
              <strong> OpenAI</strong> eingesetzt werden. Dabei können Inhalte
              der Eingabe an OpenAI übermittelt werden. Bitte übermittle im Chat
              keine Gesundheitsdaten, Zahlungsdaten, Passwörter oder andere
              besonders sensible Informationen.
            </p>
            <p>
              Soweit der Chat zur Bearbeitung einer konkreten Anfrage oder zur
              Durchführung vorvertraglicher Maßnahmen genutzt wird, ist Art. 6
              Abs. 1 lit. b DSGVO die Rechtsgrundlage. Für darüber hinausgehende
              freiwillige Verarbeitungen wird eine gesonderte Einwilligung nach
              Art. 6 Abs. 1 lit. a DSGVO eingeholt.
            </p>
            <ProviderLink href="https://openai.com/de-DE/policies/eu-privacy-policy/">
              Datenschutzhinweise von OpenAI
            </ProviderLink>
          </LegalSection>

          <LegalSection title="11. WhatsApp-Kommunikation und Twilio">
            <p>
              Wenn eine Kommunikation über WhatsApp angeboten und von dir
              genutzt wird, können Telefonnummer, Profilinformationen,
              Nachrichteninhalte, Zeitstempel sowie Zustell- und Statusdaten
              verarbeitet werden.
            </p>
            <p>
              Für die technische Nachrichtenübermittlung können Dienste von
              <strong> Twilio</strong> und WhatsApp Ireland Limited eingesetzt
              werden. Bei diesen Diensten kann eine Verarbeitung außerhalb der
              Europäischen Union stattfinden.
            </p>
            <p>
              Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, wenn die
              Kommunikation zur Bearbeitung einer Anfrage oder Durchführung
              eines Vertrags erforderlich ist. Im Übrigen kommt Art. 6 Abs. 1
              lit. a oder f DSGVO in Betracht.
            </p>
            <ProviderLink href="https://www.twilio.com/en-us/legal/privacy">
              Datenschutzhinweise von Twilio
            </ProviderLink>
            <br />
            <ProviderLink href="https://www.whatsapp.com/legal/privacy-policy-eea">
              Datenschutzhinweise von WhatsApp
            </ProviderLink>
          </LegalSection>

          <LegalSection title="12. Zahlungsabwicklung mit Stripe">
            <p>
              Wenn kostenpflichtige Leistungen gebucht werden, kann die
              Zahlungsabwicklung über <strong>Stripe</strong> erfolgen. Dabei
              verarbeitet Stripe insbesondere Kontakt-, Rechnungs-, Zahlungs-
              und Transaktionsdaten. Vollständige Zahlungsdaten werden nicht von
              uns selbst gespeichert, sondern vom Zahlungsdienstleister
              verarbeitet.
            </p>
            <p>
              Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO zur Durchführung
              des Vertrags sowie Art. 6 Abs. 1 lit. c DSGVO, soweit gesetzliche
              Aufbewahrungs- und Nachweispflichten bestehen.
            </p>
            <ProviderLink href="https://stripe.com/de/privacy">
              Datenschutzhinweise von Stripe
            </ProviderLink>
          </LegalSection>

          <LegalSection title="13. Lokale Speicherung und technisch notwendige Funktionen">
            <p>
              Für technisch notwendige Funktionen können Informationen lokal im
              Browser gespeichert werden. Dazu können eine zufällig erzeugte
              Sitzungs-ID für den KI-Chat, eine gewählte Darstellung oder ein
              technisch notwendiger Anmeldestatus gehören.
            </p>
            <p>
              Diese Speicherungen dienen ausschließlich der Bereitstellung der
              angeforderten Funktion. Sie werden nicht für personalisierte
              Werbung verwendet. Rechtsgrundlage ist § 25 Abs. 2 TDDDG und,
              soweit personenbezogene Daten verarbeitet werden, Art. 6 Abs. 1
              lit. b oder f DSGVO.
            </p>
          </LegalSection>

          <LegalSection title="14. Einwilligungen und Werbekommunikation">
            <p>
              Die Angabe einer E-Mail-Adresse für einen Download, eine Auswertung
              oder eine konkrete Anfrage bedeutet nicht automatisch die
              Einwilligung in regelmäßige Werbung.
            </p>
            <p>
              Soweit eine Einwilligung angeboten wird, ist sie freiwillig,
              zweckbezogen und kann jederzeit mit Wirkung für die Zukunft
              widerrufen werden. Der Widerruf kann per E-Mail an
              auswertung.glowsuite@gmail.com erfolgen. Die Rechtmäßigkeit der bis
              zum Widerruf erfolgten Verarbeitung bleibt unberührt.
            </p>
          </LegalSection>

          <LegalSection title="15. Empfänger und Drittlandübermittlungen">
            <p>
              Daten werden nur an Dienstleister und Empfänger übermittelt, wenn
              dies für den jeweiligen Zweck erforderlich ist, eine gesetzliche
              Pflicht besteht oder eine wirksame Einwilligung vorliegt.
            </p>
            <p>
              Bei Dienstleistern außerhalb der Europäischen Union oder des
              Europäischen Wirtschaftsraums können Daten in Drittländern
              verarbeitet werden. Soweit erforderlich, stützen wir solche
              Übermittlungen auf einen Angemessenheitsbeschluss, das EU-US Data
              Privacy Framework, EU-Standardvertragsklauseln oder andere
              gesetzlich vorgesehene Garantien.
            </p>
          </LegalSection>

          <LegalSection title="16. Speicherdauer und Löschung">
            <p>
              Wir speichern personenbezogene Daten nur so lange, wie sie für den
              jeweiligen Zweck erforderlich sind oder gesetzliche
              Aufbewahrungspflichten bestehen. Maßgebliche Kriterien sind Art,
              Umfang und Zweck der Daten, der Bearbeitungsstand einer Anfrage,
              eine bestehende Vertragsbeziehung sowie gesetzliche Nachweis- und
              Aufbewahrungspflichten.
            </p>
            <p>
              Entfällt der Verarbeitungszweck und besteht keine weitere
              Rechtsgrundlage, werden die Daten gelöscht oder anonymisiert.
            </p>
          </LegalSection>

          <LegalSection title="17. Datensicherheit">
            <p>
              Wir treffen angemessene technische und organisatorische Maßnahmen,
              um personenbezogene Daten vor Verlust, unbefugtem Zugriff,
              Veränderung und unzulässiger Offenlegung zu schützen. Die
              Übertragung unserer Website erfolgt grundsätzlich verschlüsselt
              über HTTPS.
            </p>
          </LegalSection>

          <LegalSection title="18. Deine Datenschutzrechte">
            <p>
              Nach Maßgabe der gesetzlichen Voraussetzungen stehen dir
              insbesondere folgende Rechte zu:
            </p>
            <ul>
              <li>Auskunft über deine personenbezogenen Daten</li>
              <li>Berichtigung unrichtiger oder unvollständiger Daten</li>
              <li>Löschung deiner Daten</li>
              <li>Einschränkung der Verarbeitung</li>
              <li>Datenübertragbarkeit</li>
              <li>Widerspruch gegen bestimmte Verarbeitungen</li>
              <li>Widerruf einer Einwilligung mit Wirkung für die Zukunft</li>
              <li>Beschwerde bei einer Datenschutzaufsichtsbehörde</li>
            </ul>
            <p>
              Zur Ausübung deiner Rechte kannst du dich an
              auswertung.glowsuite@gmail.com wenden.
            </p>
          </LegalSection>

          <LegalSection title="19. Widerspruchsrecht">
            <p>
              Erfolgt eine Verarbeitung auf Grundlage von Art. 6 Abs. 1 lit. f
              DSGVO, kannst du aus Gründen, die sich aus deiner besonderen
              Situation ergeben, jederzeit Widerspruch gegen die Verarbeitung
              einlegen. Gegen Direktwerbung kannst du jederzeit ohne Angabe
              besonderer Gründe widersprechen.
            </p>
          </LegalSection>

          <LegalSection title="20. Zuständige Datenschutzaufsicht">
            <p>
              Du hast das Recht, dich bei einer Datenschutzaufsichtsbehörde zu
              beschweren. Für unsere verantwortliche Stelle ist insbesondere
              folgende Behörde zuständig:
            </p>
            <p>
              <strong>
                Die Landesbeauftragte für den Datenschutz und für das Recht auf
                Akteneinsicht Brandenburg
              </strong>
              <br />
              Stahnsdorfer Damm 77
              <br />
              14532 Kleinmachnow
              <br />
              E-Mail: Poststelle@LDA.Brandenburg.de
            </p>
            <ProviderLink href="https://www.lda.brandenburg.de/">
              Website der Datenschutzaufsicht
            </ProviderLink>
          </LegalSection>

          <LegalSection title="21. Änderungen dieser Datenschutzerklärung">
            <p>
              Wir passen diese Datenschutzerklärung an, wenn sich unsere
              Website, eingesetzte Dienste, Verarbeitungsabläufe oder gesetzliche
              Anforderungen ändern.
            </p>
            <p>
              <strong>Stand: September 2026</strong>
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
  children: ReactNode;
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
          fontSize: "clamp(20px,3vw,26px)",
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

function ProviderLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: "#8a5b25",
        fontWeight: 750,
        overflowWrap: "anywhere",
      }}
    >
      {children}
    </a>
  );
}
