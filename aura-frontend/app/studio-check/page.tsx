"use client";

import { useMemo, useState } from "react";

type Question = {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  options: {
    label: string;
    description: string;
    points: number;
  }[];
  recommendation: string;
};

const questions: Question[] = [
  {
    id: "booking",
    eyebrow: "Terminbuchung",
    title: "Wie buchen deine Kundinnen aktuell Termine?",
    text: "Wähle die Antwort, die deinem Studio-Alltag am nächsten kommt.",
    options: [
      {
        label: "Über WhatsApp, Instagram oder DM",
        description: "Ich beantworte Anfragen überwiegend selbst.",
        points: 0,
      },
      {
        label: "Über Telefon und Nachrichten",
        description: "Mehrere Kanäle laufen parallel.",
        points: 6,
      },
      {
        label: "Teilweise über ein Online-System",
        description: "Ein Teil ist digital, einiges läuft noch manuell.",
        points: 13,
      },
      {
        label: "Weitgehend automatisch",
        description: "Freie Termine können digital direkt gebucht werden.",
        points: 20,
      },
    ],
    recommendation:
      "Bei der Terminbuchung liegt Potenzial darin, wiederkehrende Anfragen und freie Termine stärker zu automatisieren.",
  },
  {
    id: "reminders",
    eyebrow: "Terminerinnerungen",
    title: "Wie erinnerst du Kundinnen an ihre Termine?",
    text: "Gerade hier entstehen häufig vermeidbare No-Shows.",
    options: [
      {
        label: "Gar nicht",
        description: "Kundinnen müssen selbst an ihren Termin denken.",
        points: 0,
      },
      {
        label: "Ich schreibe selbst",
        description: "Erinnerungen werden manuell verschickt.",
        points: 6,
      },
      {
        label: "Teilweise automatisch",
        description: "Ein Teil der Termine wird automatisch erinnert.",
        points: 14,
      },
      {
        label: "Vollständig automatisch",
        description: "Erinnerungen laufen ohne manuellen Aufwand.",
        points: 20,
      },
    ],
    recommendation:
      "Automatische Erinnerungen könnten dein Team entlasten und das Risiko vergessener Termine reduzieren.",
  },
  {
    id: "communication",
    eyebrow: "Kundenkommunikation",
    title: "Wer beantwortet wiederkehrende Kundenfragen?",
    text: "Zum Beispiel Fragen zu Preisen, Behandlungen, freien Terminen oder Vorbereitung.",
    options: [
      {
        label: "Fast immer ich selbst",
        description: "Viele ähnliche Fragen landen täglich bei mir.",
        points: 0,
      },
      {
        label: "Ich und mein Team",
        description: "Die Kommunikation verteilt sich auf mehrere Personen.",
        points: 6,
      },
      {
        label: "Teilweise automatisiert",
        description: "Einige Standardfragen werden schon digital beantwortet.",
        points: 14,
      },
      {
        label: "Weitgehend automatisiert",
        description: "Standardfragen benötigen kaum noch manuelle Arbeit.",
        points: 20,
      },
    ],
    recommendation:
      "Wiederkehrende Standardfragen sind ein guter Ansatzpunkt, um Zeit im täglichen Kundenkontakt zurückzugewinnen.",
  },
  {
    id: "reviews",
    eyebrow: "Google-Bewertungen",
    title: "Wie fragst du Kundinnen nach einer Google-Bewertung?",
    text: "Bewertungen stärken Vertrauen, werden im Studio-Alltag aber schnell vergessen.",
    options: [
      {
        label: "Eigentlich gar nicht",
        description: "Bewertungen entstehen eher zufällig.",
        points: 0,
      },
      {
        label: "Ab und zu persönlich",
        description: "Wenn ich daran denke, spreche ich Kundinnen darauf an.",
        points: 6,
      },
      {
        label: "Regelmäßig manuell",
        description: "Wir fragen aktiv nach Bewertungen.",
        points: 14,
      },
      {
        label: "Automatisch nach dem Termin",
        description: "Die Anfrage wird automatisch ausgelöst.",
        points: 20,
      },
    ],
    recommendation:
      "Eine automatische Bewertungsanfrage nach dem Besuch könnte konstanter neue Google-Bewertungen erzeugen.",
  },
  {
    id: "reactivation",
    eyebrow: "Kundenreaktivierung",
    title: "Was passiert mit Kundinnen, die länger nicht gebucht haben?",
    text: "Bestehende Kundinnen geraten ohne festen Prozess schnell aus dem Blick.",
    options: [
      {
        label: "Eigentlich nichts",
        description: "Ich habe dafür aktuell keinen festen Prozess.",
        points: 0,
      },
      {
        label: "Ich schreibe gelegentlich selbst",
        description: "Manchmal kontaktiere ich frühere Kundinnen.",
        points: 6,
      },
      {
        label: "Wir machen gelegentliche Aktionen",
        description: "Es gibt einzelne Rückholaktionen oder Angebote.",
        points: 14,
      },
      {
        label: "Das läuft automatisch",
        description: "Inaktive Kundinnen werden systematisch erkannt.",
        points: 20,
      },
    ],
    recommendation:
      "Bei inaktiven Kundinnen steckt häufig Potenzial in einem systematischen Reaktivierungsprozess.",
  },
];

export default function StudioCheckPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");

  const question = questions[currentQuestion];

  const score = useMemo(() => {
    return Object.values(answers).reduce((sum, value) => sum + value, 0);
  }, [answers]);

  const recommendations = useMemo(() => {
    return questions
      .map((item) => ({
        id: item.id,
        points: answers[item.id] ?? 0,
        recommendation: item.recommendation,
      }))
      .sort((a, b) => a.points - b.points)
      .slice(0, 3);
  }, [answers]);

  const progress = showLeadForm
    ? 100
    : ((currentQuestion + 1) / questions.length) * 100;

  const selectAnswer = (points: number) => {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: points,
    }));
  };

  const nextQuestion = () => {
    if (answers[question.id] === undefined) return;

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setShowLeadForm(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const previousQuestion = () => {
    if (showLeadForm) {
      setShowLeadForm(false);
      setCurrentQuestion(questions.length - 1);
      return;
    }

    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const showStudioResult = () => {
    if (!firstName.trim() || !email.trim()) return;

    setShowResult(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getResultHeadline = () => {
    if (score < 35) {
      return "In deinem Studio steckt viel Automatisierungspotenzial.";
    }

    if (score < 70) {
      return "Du hast bereits eine gute Basis – aber noch klare Zeitfresser.";
    }

    return "Dein Studio ist digital schon gut aufgestellt.";
  };

  const restartCheck = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setShowLeadForm(false);
    setShowResult(false);
    setFirstName("");
    setEmail("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 20% 0%, rgba(212,175,116,0.18), transparent 32%), radial-gradient(circle at 80% 75%, rgba(184,121,91,0.10), transparent 38%), linear-gradient(180deg,#120d0a 0%,#1b130f 48%,#120d0a 100%)",
        color: "#f8f3ec",
        padding: "28px 20px 60px",
      }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        {/* HEADER */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 36,
          }}
        >
          <button
            onClick={() => {
              window.location.href = "/demo";
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "#f8f3ec",
              fontWeight: 800,
              fontSize: 21,
              cursor: "pointer",
              padding: 0,
            }}
          >
            GlowSuite AI
          </button>

          <div
            style={{
              padding: "8px 13px",
              borderRadius: 999,
              border: "1px solid rgba(212,175,116,0.30)",
              background: "rgba(255,255,255,0.04)",
              color: "#d4af74",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            ✦ Kostenloser Studio-Check
          </div>
        </header>

        {!showResult && (
          <>
            {/* INTRO */}
            <section
              style={{
                textAlign: "center",
                marginBottom: 26,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  padding: "7px 13px",
                  borderRadius: 999,
                  background: "rgba(212,175,116,0.13)",
                  color: "#d4af74",
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                Dein Studio in ca. 5 Minuten analysieren
              </div>

              <h1
                style={{
                  fontSize: "clamp(34px,7vw,58px)",
                  lineHeight: 1.04,
                  letterSpacing: "-0.05em",
                  margin: "0 auto 16px",
                  maxWidth: 800,
                }}
              >
                Wie digital arbeitet dein Beauty-Studio wirklich?
              </h1>

              <p
                style={{
                  maxWidth: 700,
                  margin: "0 auto",
                  color: "rgba(248,243,236,0.70)",
                  lineHeight: 1.7,
                  fontSize: 16,
                }}
              >
                Beantworte fünf kurze Fragen und entdecke, wo in deinem
                Studio noch unnötig Zeit verloren geht.
              </p>
            </section>

            {/* PROGRESS */}
            <section
              style={{
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 9,
                  fontSize: 12,
                  color: "rgba(248,243,236,0.62)",
                }}
              >
                <span>
                  {showLeadForm
                    ? "Fast geschafft"
                    : `Frage ${currentQuestion + 1} von ${questions.length}`}
                </span>

                <span>{Math.round(progress)} %</span>
              </div>

              <div
                style={{
                  height: 7,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                  border: "1px solid rgba(212,175,116,0.12)",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    borderRadius: 999,
                    background:
                      "linear-gradient(90deg,#d4af74,#e3bf83,#c88f62)",
                    transition: "width .3s ease",
                  }}
                />
              </div>
            </section>
          </>
        )}

        {!showLeadForm && !showResult && (
          <section
            style={{
              padding: "36px 30px",
              borderRadius: 30,
              background:
                "linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.045))",
              border: "1px solid rgba(212,175,116,0.22)",
              boxShadow: "0 30px 90px rgba(0,0,0,0.32)",
            }}
          >
            <div
              style={{
                color: "#d4af74",
                fontSize: 13,
                fontWeight: 800,
                marginBottom: 12,
              }}
            >
              {question.eyebrow}
            </div>

            <h2
              style={{
                fontSize: "clamp(28px,5vw,40px)",
                lineHeight: 1.12,
                letterSpacing: "-0.035em",
                margin: "0 0 10px",
              }}
            >
              {question.title}
            </h2>

            <p
              style={{
                margin: "0 0 28px",
                color: "rgba(248,243,236,0.66)",
                lineHeight: 1.6,
              }}
            >
              {question.text}
            </p>

            <div
              style={{
                display: "grid",
                gap: 12,
              }}
            >
              {question.options.map((option) => {
                const selected =
                  answers[question.id] === option.points;

                return (
                  <button
                    key={option.label}
                    onClick={() => selectAnswer(option.points)}
                    style={{
                      textAlign: "left",
                      padding: "18px 18px",
                      borderRadius: 18,
                      border: selected
                        ? "1px solid rgba(227,191,131,0.90)"
                        : "1px solid rgba(255,255,255,0.10)",
                      background: selected
                        ? "linear-gradient(135deg,rgba(212,175,116,0.22),rgba(184,121,91,0.12))"
                        : "rgba(255,255,255,0.045)",
                      color: "#fff8ea",
                      cursor: "pointer",
                      transition: "all .18s ease",
                      boxShadow: selected
                        ? "0 12px 34px rgba(0,0,0,0.20)"
                        : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 16,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 800,
                            marginBottom: 5,
                          }}
                        >
                          {option.label}
                        </div>

                        <div
                          style={{
                            fontSize: 13,
                            lineHeight: 1.5,
                            color: "rgba(248,243,236,0.61)",
                          }}
                        >
                          {option.description}
                        </div>
                      </div>

                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 999,
                          border: selected
                            ? "1px solid #e3bf83"
                            : "1px solid rgba(255,255,255,0.22)",
                          background: selected
                            ? "#d4af74"
                            : "transparent",
                          color: "#1d120c",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 900,
                          flexShrink: 0,
                        }}
                      >
                        {selected ? "✓" : ""}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent:
                  currentQuestion === 0 ? "flex-end" : "space-between",
                gap: 12,
                marginTop: 28,
                flexWrap: "wrap",
              }}
            >
              {currentQuestion > 0 && (
                <button
                  onClick={previousQuestion}
                  style={{
                    padding: "13px 20px",
                    borderRadius: 14,
                    background: "transparent",
                    color: "rgba(248,243,236,0.72)",
                    border: "1px solid rgba(255,255,255,0.13)",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  ← Zurück
                </button>
              )}

              <button
                onClick={nextQuestion}
                disabled={answers[question.id] === undefined}
                style={{
                  padding: "14px 24px",
                  borderRadius: 14,
                  border: "1px solid rgba(212,175,116,0.48)",
                  background:
                    answers[question.id] === undefined
                      ? "rgba(255,255,255,0.08)"
                      : "linear-gradient(135deg,#fffaf4,#eadcc9)",
                  color:
                    answers[question.id] === undefined
                      ? "rgba(255,255,255,0.32)"
                      : "#2a1a12",
                  fontWeight: 800,
                  fontSize: 14,
                  cursor:
                    answers[question.id] === undefined
                      ? "not-allowed"
                      : "pointer",
                  boxShadow:
                    answers[question.id] === undefined
                      ? "none"
                      : "0 10px 28px rgba(0,0,0,0.20)",
                }}
              >
                {currentQuestion === questions.length - 1
                  ? "Auswertung vorbereiten →"
                  : "Weiter →"}
              </button>
            </div>
          </section>
        )}

        {/* LEAD FORM */}
        {showLeadForm && !showResult && (
          <section
            style={{
              padding: "38px 30px",
              borderRadius: 30,
              background:
                "linear-gradient(135deg,#fffaf4 0%,#f4e5d2 60%,#ead0ae 100%)",
              color: "#1d120c",
              border: "1px solid rgba(212,175,116,0.35)",
              boxShadow: "0 30px 90px rgba(0,0,0,0.32)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                padding: "7px 12px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.45)",
                border: "1px solid rgba(184,121,91,0.18)",
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 16,
                color: "#704326",
              }}
            >
              ✦ Deine Auswertung ist bereit
            </div>

            <h2
              style={{
                margin: "0 0 12px",
                fontSize: "clamp(30px,5vw,44px)",
                letterSpacing: "-0.04em",
              }}
            >
              Wohin dürfen wir deine Studio-Auswertung zuordnen?
            </h2>

            <p
              style={{
                margin: "0 0 28px",
                maxWidth: 680,
                color: "#6d594b",
                lineHeight: 1.7,
              }}
            >
              Gib kurz deinen Vornamen und deine E-Mail-Adresse an.
              Anschließend siehst du sofort deinen Studio-Score und deine
              drei größten Verbesserungspotenziale.
            </p>

            <div
              style={{
                display: "grid",
                gap: 14,
                maxWidth: 620,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 800,
                    marginBottom: 7,
                  }}
                >
                  Vorname
                </label>

                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="z. B. Anna"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "15px 16px",
                    borderRadius: 14,
                    border: "1px solid rgba(130,85,50,0.18)",
                    background: "rgba(255,255,255,0.72)",
                    color: "#1d120c",
                    fontSize: 15,
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 800,
                    marginBottom: 7,
                  }}
                >
                  E-Mail-Adresse
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="studio@beispiel.de"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "15px 16px",
                    borderRadius: 14,
                    border: "1px solid rgba(130,85,50,0.18)",
                    background: "rgba(255,255,255,0.72)",
                    color: "#1d120c",
                    fontSize: 15,
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <p
              style={{
                fontSize: 11,
                color: "#77665b",
                margin: "12px 0 0",
                lineHeight: 1.5,
              }}
            >
              Deine Angaben verwenden wir ausschließlich im Zusammenhang
              mit deiner GlowSuite Studio-Auswertung.
            </p>

            <div
              style={{
                marginTop: 26,
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={previousQuestion}
                style={{
                  padding: "14px 20px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.35)",
                  color: "#4b3427",
                  border: "1px solid rgba(110,70,40,0.15)",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                ← Zurück
              </button>

              <button
                onClick={showStudioResult}
                disabled={!firstName.trim() || !email.trim()}
                style={{
                  padding: "14px 24px",
                  borderRadius: 14,
                  border: "none",
                  background:
                    !firstName.trim() || !email.trim()
                      ? "rgba(29,18,12,0.28)"
                      : "#120d0a",
                  color:
                    !firstName.trim() || !email.trim()
                      ? "rgba(255,255,255,0.65)"
                      : "#fff8ea",
                  fontWeight: 800,
                  fontSize: 14,
                  cursor:
                    !firstName.trim() || !email.trim()
                      ? "not-allowed"
                      : "pointer",
                  boxShadow:
                    !firstName.trim() || !email.trim()
                      ? "none"
                      : "0 12px 30px rgba(0,0,0,0.20)",
                }}
              >
                Meine Auswertung anzeigen →
              </button>
            </div>
          </section>
        )}

        {/* RESULT */}
        {showResult && (
          <>
            <section
              style={{
                textAlign: "center",
                padding: "42px 28px",
                marginBottom: 22,
                borderRadius: 30,
                background:
                  "linear-gradient(135deg,#fffaf4 0%,#f4e5d2 60%,#ead0ae 100%)",
                color: "#1d120c",
                border: "1px solid rgba(212,175,116,0.35)",
                boxShadow: "0 30px 90px rgba(0,0,0,0.32)",
              }}
            >
              <div
                style={{
                  color: "#8a5b25",
                  fontSize: 13,
                  fontWeight: 800,
                  marginBottom: 12,
                }}
              >
                DEINE GLOWSUITE STUDIO-AUSWERTUNG
              </div>

              <h1
                style={{
                  margin: "0 0 8px",
                  fontSize: "clamp(30px,6vw,48px)",
                  letterSpacing: "-0.04em",
                }}
              >
                {firstName}, dein Studio-Score:
              </h1>

              <div
                style={{
                  fontSize: "clamp(60px,12vw,96px)",
                  lineHeight: 1,
                  fontWeight: 900,
                  color: "#b8795b",
                  letterSpacing: "-0.06em",
                  margin: "18px 0 12px",
                }}
              >
                {score}
                <span
                  style={{
                    fontSize: "0.38em",
                    color: "#8a6a52",
                    marginLeft: 5,
                  }}
                >
                  /100
                </span>
              </div>

              <h2
                style={{
                  margin: "16px auto 8px",
                  maxWidth: 720,
                  fontSize: "clamp(24px,4vw,34px)",
                }}
              >
                {getResultHeadline()}
              </h2>

              <p
                style={{
                  maxWidth: 680,
                  margin: "0 auto",
                  color: "#6d594b",
                  lineHeight: 1.7,
                }}
              >
                Der Score zeigt, wie stark wichtige Abläufe rund um
                Terminbuchung, Kommunikation und Kundenbindung bereits
                automatisiert sind.
              </p>
            </section>

            <section
              style={{
                padding: "34px 28px",
                marginBottom: 22,
                borderRadius: 30,
                background:
                  "linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.045))",
                border: "1px solid rgba(212,175,116,0.22)",
              }}
            >
              <div
                style={{
                  color: "#d4af74",
                  fontSize: 13,
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                DEINE 3 GRÖSSTEN HEBEL
              </div>

              <h2
                style={{
                  fontSize: "clamp(28px,5vw,40px)",
                  margin: "0 0 24px",
                }}
              >
                Hier lohnt sich ein genauerer Blick.
              </h2>

              <div
                style={{
                  display: "grid",
                  gap: 14,
                }}
              >
                {recommendations.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      gap: 16,
                      alignItems: "flex-start",
                      padding: 20,
                      borderRadius: 20,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(212,175,116,0.15)",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(212,175,116,0.16)",
                        color: "#d4af74",
                        fontWeight: 900,
                      }}
                    >
                      {index + 1}
                    </div>

                    <p
                      style={{
                        margin: 0,
                        color: "rgba(248,243,236,0.78)",
                        lineHeight: 1.65,
                      }}
                    >
                      {item.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section
              style={{
                textAlign: "center",
                padding: "42px 28px",
                borderRadius: 30,
                background:
                  "linear-gradient(135deg,rgba(212,175,116,0.18),rgba(184,121,91,0.13))",
                border: "1px solid rgba(212,175,116,0.28)",
                boxShadow: "0 24px 70px rgba(0,0,0,0.24)",
              }}
            >
              <div
                style={{
                  color: "#d4af74",
                  fontSize: 13,
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                NÄCHSTER SCHRITT
              </div>

              <h2
                style={{
                  fontSize: "clamp(28px,5vw,40px)",
                  margin: "0 auto 12px",
                  maxWidth: 700,
                }}
              >
                Möchtest du sehen, wie GlowSuite diese Abläufe übernehmen
                könnte?
              </h2>

              <p
                style={{
                  margin: "0 auto 24px",
                  maxWidth: 680,
                  lineHeight: 1.7,
                  color: "rgba(248,243,236,0.68)",
                }}
              >
                Teste die GlowSuite-Demo und erlebe Terminbuchung,
                Erinnerungen und Kundenkommunikation direkt aus Sicht einer
                Kundin.
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => {
                    window.location.href = "/demo#live-demo";
                  }}
                  style={{
                    padding: "14px 24px",
                    borderRadius: 14,
                    border: "1px solid rgba(212,175,116,0.48)",
                    background: "linear-gradient(135deg,#fffaf4,#eadcc9)",
                    color: "#2a1a12",
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: "pointer",
                    boxShadow: "0 10px 28px rgba(0,0,0,0.20)",
                  }}
                >
                  GlowSuite live ansehen →
                </button>

                <button
                  onClick={restartCheck}
                  style={{
                    padding: "14px 22px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.13)",
                    background: "transparent",
                    color: "rgba(248,243,236,0.72)",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Check erneut starten
                </button>
              </div>
            </section>
          </>
        )}

        <p
          style={{
            marginTop: 28,
            textAlign: "center",
            fontSize: 11,
            color: "rgba(248,243,236,0.42)",
          }}
        >
          GlowSuite AI · Studio-Check für Beauty-Studios
        </p>
      </div>
    </main>
  );
}