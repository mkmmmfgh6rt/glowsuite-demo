"use client";

import { useState, type FormEvent } from "react";

const PDF_URL =
  "/downloads/50-social-media-hooks-beauty-studios.pdf";

export default function HooksPage() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(true);
  const [error, setError] = useState("");

  const startDownload = () => {
    const link = document.createElement("a");
    link.href = PDF_URL;
    link.download = "50-Social-Media-Hooks-fuer-Beauty-Studios.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!firstName.trim() || !email.trim()) {
      setError("Bitte gib deinen Vornamen und deine E-Mail-Adresse ein.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/50-hooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          email: email.trim(),
          marketingConsent,
          company,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Die PDF konnte gerade nicht angefordert werden."
        );
      }

      setEmailSent(data.emailSent !== false);
      setSuccess(true);

      window.setTimeout(startDownload, 250);
    } catch (requestError) {
      console.error("50-Hooks-Anfrage fehlgeschlagen:", requestError);
      setError(
        "Das hat gerade nicht funktioniert. Bitte versuche es erneut."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <div className="glow glowOne" />
      <div className="glow glowTwo" />

      <div className="container">
        <header className="header">
          <a className="brand" href="/demo">
            GlowSuite <span>AI</span>
          </a>

          <div className="headerBadge">
            ✦ Kostenloser Social-Media-Guide
          </div>
        </header>

        <section className="hero">
          <div className="content">
            <div className="eyebrow">
              FÜR KOSMETIK-, NAGEL- UND BEAUTY-STUDIOS
            </div>

            <h1>
              50 Social-Media-Hooks, die sofort Aufmerksamkeit erzeugen.
            </h1>

            <p className="intro">
              Formulierte Einstiege für Instagram und TikTok, mit denen du
              deine nächsten Beauty-Posts schneller planen und stärker
              beginnen kannst.
            </p>

            <div className="benefits">
              <div className="benefit">
                <span>✓</span>
                50 sofort einsetzbare Hook-Ideen
              </div>

              <div className="benefit">
                <span>✓</span>
                Speziell für Beauty-Studios formuliert
              </div>

              <div className="benefit">
                <span>✓</span>
                Kostenlos als hochwertige PDF
              </div>
            </div>
          </div>

          <div className="guideArea">
            <div className="guideShadow" />

            <div className="guide">
              <div className="guideTop">
                <span>GLOWSUITE AI</span>
                <span>FREE GUIDE</span>
              </div>

              <div className="guideNumber">50</div>

              <h2>Social-Media-Hooks</h2>

              <p>für Beauty-Studios</p>

              <div className="guideLine" />

              <small>
                Mehr Aufmerksamkeit für deine nächsten Instagram- und
                TikTok-Posts
              </small>
            </div>
          </div>
        </section>

        <section className="formSection">
          {!success ? (
            <>
              <div className="formHeading">
                <div>
                  <div className="eyebrow dark">
                    DEIN KOSTENLOSER DOWNLOAD
                  </div>

                  <h2>Hol dir jetzt alle 50 Hooks.</h2>

                  <p>
                    Nach dem Absenden startet der Download sofort.
                    Zusätzlich erhältst du die PDF per E-Mail.
                  </p>
                </div>

                <div className="freeBadge">0 €</div>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="fields">
                  <div className="field">
                    <label htmlFor="firstName">Vorname</label>

                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(event) =>
                        setFirstName(event.target.value)
                      }
                      placeholder="z. B. Anna"
                      autoComplete="given-name"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="email">E-Mail-Adresse</label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="studio@beispiel.de"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="honeypot" aria-hidden="true">
                  <label htmlFor="company">Firma</label>
                  <input
                    id="company"
                    type="text"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                <label className="consent">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(event) =>
                      setMarketingConsent(event.target.checked)
                    }
                  />

                  <span>
                    Ich möchte freiwillig weitere Tipps zu Social Media,
                    Studio-Wachstum und Automatisierung per E-Mail erhalten.
                    Diese Einwilligung kann ich jederzeit widerrufen.
                  </span>
                </label>

                <p className="privacy">
                  Deine Angaben verwenden wir zur Bereitstellung der PDF.
                  Weitere Informationen findest du in unserer{" "}
                  <a
                    href="/datenschutz"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Datenschutzerklärung
                  </a>
                  . Das freiwillige Kästchen ist keine Voraussetzung für
                  den Download.
                </p>

                <button
                  className="submitButton"
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? "Dein Guide wird vorbereitet …"
                    : "50 Hooks kostenlos herunterladen →"}
                </button>

                {error && <div className="error">{error}</div>}
              </form>
            </>
          ) : (
            <div className="success">
              <div className="successIcon">✓</div>

              <div className="eyebrow dark">GESCHAFFT</div>

              <h2>Deine 50 Hooks sind bereit, {firstName}.</h2>

              <p>
                Der Download wurde automatisch gestartet.
                {emailSent
                  ? " Zusätzlich haben wir dir die PDF per E-Mail geschickt."
                  : " Falls dein Browser den Download blockiert hat, nutze den Button unten."}
              </p>

              <div className="successButtons">
                <button
                  type="button"
                  className="downloadButton"
                  onClick={startDownload}
                >
                  PDF erneut herunterladen
                </button>

                <a className="checkButton" href="/studio-check">
                  Kostenlosen Studio-Check starten →
                </a>
              </div>
            </div>
          )}
        </section>

        <section className="nextStep">
          <div>
            <div className="eyebrow">BONUS FÜR DEIN STUDIO</div>

            <h2>Wo verliert dein Studio aktuell noch Zeit?</h2>

            <p>
              Finde mit fünf kurzen Fragen heraus, wie digital dein
              Beauty-Studio bereits arbeitet und wo dein größtes
              Automatisierungspotenzial liegt.
            </p>
          </div>

          <a href="/studio-check">Studio kostenlos prüfen →</a>
        </section>

        <footer>
          <span>© 2026 GlowSuite AI</span>

          <a href="/datenschutz">Datenschutz</a>
        </footer>
      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          padding: 28px 20px 40px;
          color: #fff8ef;
          background:
            radial-gradient(
              circle at 12% 10%,
              rgba(213, 171, 109, 0.18),
              transparent 31%
            ),
            radial-gradient(
              circle at 88% 65%,
              rgba(179, 111, 80, 0.13),
              transparent 33%
            ),
            linear-gradient(160deg, #100b08, #1d130e 55%, #110c09);
        }

        .container {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1120px;
          margin: 0 auto;
        }

        .glow {
          position: absolute;
          border-radius: 999px;
          filter: blur(90px);
          pointer-events: none;
        }

        .glowOne {
          top: 30px;
          left: -180px;
          width: 420px;
          height: 420px;
          background: rgba(211, 164, 98, 0.12);
        }

        .glowTwo {
          right: -180px;
          bottom: 220px;
          width: 420px;
          height: 420px;
          background: rgba(179, 105, 72, 0.1);
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 70px;
        }

        .brand {
          color: #fff8ef;
          font-size: 23px;
          font-weight: 900;
          letter-spacing: -0.04em;
          text-decoration: none;
        }

        .brand span,
        .eyebrow {
          color: #dab373;
        }

        .headerBadge {
          padding: 9px 14px;
          border: 1px solid rgba(218, 179, 115, 0.3);
          border-radius: 999px;
          color: #dab373;
          background: rgba(255, 255, 255, 0.04);
          font-size: 12px;
          font-weight: 800;
        }

        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.85fr);
          align-items: center;
          gap: 72px;
          margin-bottom: 72px;
        }

        .eyebrow {
          margin-bottom: 14px;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.13em;
        }

        h1 {
          max-width: 720px;
          margin: 0 0 22px;
          font-size: clamp(42px, 6vw, 72px);
          line-height: 0.99;
          letter-spacing: -0.055em;
        }

        .intro {
          max-width: 650px;
          margin: 0 0 28px;
          color: rgba(255, 248, 239, 0.69);
          font-size: 17px;
          line-height: 1.7;
        }

        .benefits {
          display: grid;
          gap: 12px;
        }

        .benefit {
          display: flex;
          align-items: center;
          gap: 11px;
          color: rgba(255, 248, 239, 0.87);
          font-size: 14px;
          font-weight: 700;
        }

        .benefit span {
          display: grid;
          width: 24px;
          height: 24px;
          place-items: center;
          border: 1px solid rgba(218, 179, 115, 0.35);
          border-radius: 50%;
          color: #dab373;
          background: rgba(218, 179, 115, 0.1);
          font-size: 12px;
        }

        .guideArea {
          position: relative;
          display: flex;
          justify-content: center;
          padding: 20px;
        }

        .guideShadow {
          position: absolute;
          right: 11%;
          bottom: 0;
          width: 72%;
          height: 34px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.65);
          filter: blur(22px);
        }

        .guide {
          position: relative;
          width: 310px;
          min-height: 410px;
          padding: 26px;
          transform: rotate(2.5deg);
          border: 1px solid rgba(229, 195, 140, 0.55);
          border-radius: 7px 18px 18px 7px;
          color: #332118;
          background:
            radial-gradient(
              circle at 80% 10%,
              rgba(218, 179, 115, 0.5),
              transparent 28%
            ),
            linear-gradient(145deg, #fffaf2, #ead9c4);
          box-shadow:
            -12px 12px 0 #7c513a,
            0 34px 90px rgba(0, 0, 0, 0.48);
        }

        .guide::after {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 13px;
          width: 1px;
          content: "";
          background: rgba(96, 55, 34, 0.14);
        }

        .guideTop {
          display: flex;
          justify-content: space-between;
          color: #82583e;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.1em;
        }

        .guideNumber {
          margin-top: 72px;
          color: #a66d4c;
          font-size: 94px;
          font-weight: 900;
          line-height: 0.8;
          letter-spacing: -0.08em;
        }

        .guide h2 {
          margin: 17px 0 3px;
          font-size: 31px;
          line-height: 1;
          letter-spacing: -0.045em;
        }

        .guide p {
          margin: 0;
          color: #8c5b3c;
          font-size: 20px;
          font-weight: 800;
        }

        .guideLine {
          width: 48px;
          height: 3px;
          margin: 26px 0 18px;
          background: #bd8959;
        }

        .guide small {
          display: block;
          max-width: 220px;
          color: #765d4f;
          font-size: 12px;
          line-height: 1.55;
        }

        .formSection {
          margin-bottom: 28px;
          padding: 42px;
          border: 1px solid rgba(218, 179, 115, 0.32);
          border-radius: 30px;
          color: #271910;
          background: linear-gradient(135deg, #fffaf4, #f1dfca);
          box-shadow: 0 30px 100px rgba(0, 0, 0, 0.35);
        }

        .formHeading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 30px;
        }

        .dark {
          color: #9b643b;
        }

        .formHeading h2,
        .success h2 {
          margin: 0 0 9px;
          font-size: clamp(30px, 5vw, 45px);
          letter-spacing: -0.045em;
        }

        .formHeading p,
        .success p {
          max-width: 680px;
          margin: 0;
          color: #715d50;
          line-height: 1.65;
        }

        .freeBadge {
          display: grid;
          width: 68px;
          height: 68px;
          flex-shrink: 0;
          place-items: center;
          border-radius: 50%;
          color: #fff9f0;
          background: #342219;
          font-size: 19px;
          font-weight: 900;
        }

        .fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .field label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 900;
        }

        .field input {
          width: 100%;
          padding: 16px;
          border: 1px solid rgba(108, 68, 43, 0.18);
          border-radius: 14px;
          outline: none;
          color: #24160f;
          background: rgba(255, 255, 255, 0.75);
          font-size: 15px;
        }

        .field input:focus {
          border-color: #b87b50;
          box-shadow: 0 0 0 3px rgba(184, 123, 80, 0.12);
        }

        .honeypot {
          position: absolute;
          left: -10000px;
          opacity: 0;
          pointer-events: none;
        }

        .consent {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          margin-top: 18px;
          color: #5f4d42;
          font-size: 12px;
          line-height: 1.55;
          cursor: pointer;
        }

        .consent input {
          width: 17px;
          height: 17px;
          margin-top: 2px;
          accent-color: #6b4430;
        }

        .privacy {
          margin: 14px 0 20px;
          color: #806f64;
          font-size: 11px;
          line-height: 1.6;
        }

        .privacy a {
          color: #83542e;
          font-weight: 800;
        }

        .submitButton,
        .downloadButton,
        .checkButton {
          display: inline-flex;
          min-height: 50px;
          align-items: center;
          justify-content: center;
          padding: 14px 23px;
          border: 0;
          border-radius: 14px;
          color: #fff8ef;
          background: #21140e;
          font-size: 14px;
          font-weight: 900;
          text-decoration: none;
          cursor: pointer;
          box-shadow: 0 13px 30px rgba(38, 23, 15, 0.2);
        }

        .submitButton:disabled {
          cursor: wait;
          opacity: 0.65;
        }

        .error {
          margin-top: 15px;
          padding: 12px 14px;
          border: 1px solid rgba(151, 52, 39, 0.2);
          border-radius: 12px;
          color: #91382e;
          background: rgba(151, 52, 39, 0.08);
          font-size: 13px;
        }

        .success {
          text-align: center;
        }

        .successIcon {
          display: grid;
          width: 58px;
          height: 58px;
          margin: 0 auto 18px;
          place-items: center;
          border-radius: 50%;
          color: #fff9f0;
          background: #67452f;
          font-size: 25px;
          font-weight: 900;
        }

        .success p {
          margin-right: auto;
          margin-left: auto;
        }

        .successButtons {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-top: 25px;
          flex-wrap: wrap;
        }

        .downloadButton {
          color: #2b1a12;
          border: 1px solid rgba(86, 51, 31, 0.18);
          background: rgba(255, 255, 255, 0.5);
          box-shadow: none;
        }

        .nextStep {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
          padding: 34px;
          border: 1px solid rgba(218, 179, 115, 0.2);
          border-radius: 25px;
          background: rgba(255, 255, 255, 0.05);
        }

        .nextStep h2 {
          margin: 0 0 9px;
          font-size: clamp(25px, 4vw, 36px);
          letter-spacing: -0.04em;
        }

        .nextStep p {
          max-width: 700px;
          margin: 0;
          color: rgba(255, 248, 239, 0.65);
          line-height: 1.65;
        }

        .nextStep > a {
          flex-shrink: 0;
          padding: 14px 20px;
          border: 1px solid rgba(218, 179, 115, 0.42);
          border-radius: 14px;
          color: #2a1a12;
          background: linear-gradient(135deg, #fffaf4, #e7d3ba);
          font-size: 13px;
          font-weight: 900;
          text-decoration: none;
        }

        footer {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 28px 5px 0;
          color: rgba(255, 248, 239, 0.42);
          font-size: 11px;
        }

        footer a {
          color: inherit;
        }

        @media (max-width: 820px) {
          .header {
            margin-bottom: 48px;
          }

          .hero {
            grid-template-columns: 1fr;
            gap: 45px;
          }

          .content {
            text-align: center;
          }

          .intro {
            margin-right: auto;
            margin-left: auto;
          }

          .benefits {
            width: fit-content;
            margin: 0 auto;
            text-align: left;
          }

          .guide {
            width: 285px;
            min-height: 390px;
          }

          .nextStep {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 620px) {
          .page {
            padding: 20px 14px 30px;
          }

          .headerBadge {
            display: none;
          }

          .header {
            margin-bottom: 42px;
          }

          h1 {
            font-size: 43px;
          }

          .hero {
            margin-bottom: 50px;
          }

          .guideArea {
            padding: 10px;
          }

          .guide {
            width: 250px;
            min-height: 350px;
            padding: 23px;
          }

          .guideNumber {
            margin-top: 57px;
            font-size: 80px;
          }

          .guide h2 {
            font-size: 27px;
          }

          .formSection {
            padding: 29px 20px;
            border-radius: 23px;
          }

          .formHeading {
            flex-direction: column;
          }

          .freeBadge {
            width: 56px;
            height: 56px;
            font-size: 16px;
          }

          .fields {
            grid-template-columns: 1fr;
          }

          .submitButton {
            width: 100%;
          }

          .successButtons {
            flex-direction: column;
          }

          .successButtons > * {
            width: 100%;
          }

          .nextStep {
            padding: 28px 22px;
          }

          .nextStep > a {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}