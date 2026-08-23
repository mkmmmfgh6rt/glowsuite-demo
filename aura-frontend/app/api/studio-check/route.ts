import { NextResponse } from "next/server";

export const runtime = "nodejs";

type StudioCheckPayload = {
  firstName: string;
  email: string;
  answers: {
    booking?: number;
    reminders?: number;
    communication?: number;
    reviews?: number;
    reactivation?: number;
  };
  recommendations?: string[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as StudioCheckPayload;

    const firstName = body.firstName?.trim();
    const email = body.email?.trim();

    if (!firstName || !email) {
      return NextResponse.json(
        { error: "Vorname und E-Mail sind erforderlich." },
        { status: 400 }
      );
    }

    const booking = Number(body.answers?.booking ?? 0);
    const reminders = Number(body.answers?.reminders ?? 0);
    const communication = Number(body.answers?.communication ?? 0);
    const reviews = Number(body.answers?.reviews ?? 0);
    const reactivation = Number(body.answers?.reactivation ?? 0);

    const score =
      booking +
      reminders +
      communication +
      reviews +
      reactivation;

    const potential = [
      {
        points: booking,
        label: "Terminorganisation",
      },
      {
        points: reminders,
        label: "Erinnerungen",
      },
      {
        points: communication,
        label: "Viele Kundenanfragen",
      },
      {
        points: reviews,
        label: "Google-Bewertungen",
      },
      {
        points: reactivation,
        label: "Kundenreaktivierung",
      },
    ]
      .sort((a, b) => a.points - b.points)
      .slice(0, 3)
      .map((item) => item.label);

    const airtableToken = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableId = process.env.AIRTABLE_TABLE_ID;

    if (!airtableToken || !baseId || !tableId) {
      console.error("Airtable Umgebungsvariablen fehlen.");

      return NextResponse.json(
        { error: "Server-Konfiguration unvollständig." },
        { status: 500 }
      );
    }

    const recommendations =
      body.recommendations?.filter(Boolean) ?? [];

    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${baseId}/${tableId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${airtableToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: [
            {
              fields: {
                Studio: `Studio-Check – ${firstName}`,
                Ansprechpartner: firstName,
                "E-Mail": email,

                Quelle: "Website",
                "Pipeline-Status": "Neu",
                "Lead-Temperatur": "Warm",

                "Probleme / Potenzial": potential,

                "Studio-Check Score": score,
                "Check Terminbuchung": booking,
                "Check Erinnerungen": reminders,
                "Check Kommunikation": communication,
                "Check Bewertungen": reviews,
                "Check Reaktivierung": reactivation,

                "Studio-Check Hebel":
                  recommendations.length > 0
                    ? recommendations
                      .map(
                        (text, index) =>
                          `${index + 1}. ${text}`
                      )
                      .join("\n")
                    : potential.join("\n"),

                "Studio-Check Antworten": [
                  `Terminbuchung: ${booking}/20`,
                  `Erinnerungen: ${reminders}/20`,
                  `Kommunikation: ${communication}/20`,
                  `Bewertungen: ${reviews}/20`,
                  `Reaktivierung: ${reactivation}/20`,
                ].join("\n"),

                "Studio-Check Datum":
                  new Date().toISOString(),

                Notizen:
                  "Lead automatisch über den GlowSuite Studio-Check erfasst.",
              },
            },
          ],
          typecast: true,
        }),
      }
    );

    const airtableData = await airtableResponse.json();

    if (!airtableResponse.ok) {
      console.error(
        "Airtable Fehler:",
        airtableData
      );

      return NextResponse.json(
        {
          error:
            "Der Lead konnte nicht gespeichert werden.",
        },
        { status: 500 }
      );
    }

    /* =========================================================
       BREVO – GLOWSUITE STUDIO-AUSWERTUNG V2
    ========================================================= */

    let emailSent = false;
    let brevoMessageId: string | null = null;

    try {
      const brevoApiKey = process.env.BREVO_API_KEY;
      const brevoSenderEmail =
        process.env.BREVO_SENDER_EMAIL;
      const brevoSenderName =
        process.env.BREVO_SENDER_NAME || "GlowSuite AI";

      if (!brevoApiKey || !brevoSenderEmail) {
        console.error(
          "Brevo Umgebungsvariablen fehlen."
        );
      } else {
        /* -----------------------------------------------------
           HTML-SICHERHEIT
        ----------------------------------------------------- */

        const escapeHtml = (value: string) =>
          value.replace(
            /[&<>"']/g,
            (character) =>
              ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;",
              })[character] || character
          );

        const safeFirstName =
          escapeHtml(firstName);

        /* -----------------------------------------------------
           SCORE-INTERPRETATION
        ----------------------------------------------------- */

        let scoreLabel = "";
        let scoreHeadline = "";
        let scoreDescription = "";

        if (score < 35) {
          scoreLabel = "Viel Potenzial";
          scoreHeadline =
            "In deinem Studio steckt noch viel Entlastungspotenzial.";

          scoreDescription =
            "Mehrere Abläufe scheinen aktuell noch Zeit und Aufmerksamkeit zu binden. Das Gute daran: Genau hier können schon gezielte Automatisierungen spürbar Struktur in den Alltag bringen.";
        } else if (score < 70) {
          scoreLabel = "Gute Basis";
          scoreHeadline =
            "Du bist auf einem guten Weg – aber einige Zeitfresser sind noch da.";

          scoreDescription =
            "Ein Teil deiner Abläufe ist bereits gut organisiert. Gleichzeitig gibt es Bereiche, die sich noch stärker automatisieren lassen, damit dein Team weniger wiederkehrende Aufgaben manuell erledigen muss.";
        } else {
          scoreLabel = "Starke Basis";
          scoreHeadline =
            "Dein Studio ist digital bereits gut aufgestellt.";

          scoreDescription =
            "Viele Grundlagen funktionieren schon gut. Jetzt geht es weniger um komplette Veränderung und mehr darum, einzelne Abläufe noch intelligenter miteinander zu verbinden.";
        }

        /* -----------------------------------------------------
           INDIVIDUELLE HEBEL
        ----------------------------------------------------- */

        const leverData = [
          {
            key: "booking",
            points: booking,
            title: "Terminbuchung",
            short:
              "Weniger Hin und Her rund um freie Termine.",
            text:
              booking <= 6
                ? "Bei der Terminbuchung scheint aktuell noch viel manuell zu laufen. Wiederkehrende Fragen zu freien Zeiten, Leistungen oder Buchungen können dein Team unnötig aus dem Arbeitsfluss holen."
                : booking <= 14
                  ? "Deine Terminbuchung hat bereits eine digitale Basis. Trotzdem gibt es noch Potenzial, wiederkehrende Buchungsanfragen stärker automatisch abzufangen."
                  : "Deine Terminbuchung ist bereits gut organisiert. Hier geht es vor allem noch um Feinschliff und eine möglichst nahtlose Kundenerfahrung.",
          },

          {
            key: "reminders",
            points: reminders,
            title: "Erinnerungen & No-Shows",
            short:
              "Weniger manuelles Nachfassen vor Terminen.",
            text:
              reminders <= 6
                ? "Automatische Erinnerungen sind bei dir noch ein besonders großer Hebel. Sie können wiederkehrendes Nachfassen reduzieren und Kundinnen rechtzeitig an ihren Termin erinnern."
                : reminders <= 14
                  ? "Ein Teil deiner Erinnerungsprozesse funktioniert bereits. Mehr Automatisierung könnte dir trotzdem zusätzliche Routinearbeit abnehmen."
                  : "Deine Erinnerungsprozesse sind bereits stark. Hier besteht vor allem noch Potenzial bei Details und der Verbindung mit Storno- und Umbuchungsprozessen.",
          },

          {
            key: "communication",
            points: communication,
            title: "Kundenkommunikation",
            short:
              "Weniger Unterbrechungen durch dieselben Fragen.",
            text:
              communication <= 6
                ? "Wiederkehrende Fragen über WhatsApp, Telefon oder Social Media können schnell viel Aufmerksamkeit binden. Genau diese Standardanfragen eignen sich besonders gut für Automatisierung."
                : communication <= 14
                  ? "Ein Teil deiner Kommunikation läuft bereits strukturiert. Bei wiederkehrenden Standardfragen steckt aber noch Potenzial für weniger Unterbrechungen im Studioalltag."
                  : "Deine Kundenkommunikation ist bereits gut organisiert. Eine intelligente Automatisierung könnte hier vor allem noch für zusätzliche Geschwindigkeit und Verfügbarkeit sorgen.",
          },

          {
            key: "reviews",
            points: reviews,
            title: "Google-Bewertungen",
            short:
              "Zufriedene Kundinnen systematischer sichtbar machen.",
            text:
              reviews <= 6
                ? "Neue Bewertungen entstehen bei dir offenbar noch nicht konsequent über einen festen Prozess. Automatische Bewertungsanfragen nach dem Besuch könnten hier für mehr Regelmäßigkeit sorgen."
                : reviews <= 14
                  ? "Du nutzt Bewertungen bereits teilweise. Mit einem konsequenteren automatischen Ablauf könnten zufriedene Kundinnen noch regelmäßiger um Feedback gebeten werden."
                  : "Dein Bewertungsprozess ist bereits gut aufgestellt. Hier geht es hauptsächlich darum, den Ablauf möglichst konstant und ohne zusätzlichen manuellen Aufwand zu halten.",
          },

          {
            key: "reactivation",
            points: reactivation,
            title: "Kundenreaktivierung",
            short:
              "Bestehende Kundinnen zum richtigen Zeitpunkt zurückholen.",
            text:
              reactivation <= 6
                ? "Ehemalige oder länger inaktive Kundinnen werden aktuell offenbar noch wenig systematisch reaktiviert. Hier kann ein automatischer Prozess helfen, ohne dass dein Team jede Kundin einzeln im Blick behalten muss."
                : reactivation <= 14
                  ? "Du nutzt bereits Ansätze zur Kundenreaktivierung. Mit festen automatischen Abläufen könnte daraus ein verlässlicherer Prozess werden."
                  : "Deine Kundenreaktivierung ist bereits gut organisiert. Weitere Automatisierung kann hier vor allem helfen, den Prozess dauerhaft konsequent laufen zu lassen.",
          },
        ]
          .sort((a, b) => a.points - b.points)
          .slice(0, 3);

        const priorityLever =
          leverData[0];

        /* -----------------------------------------------------
           PROGRESS-BALKEN
        ----------------------------------------------------- */

        const progressWidth =
          Math.max(
            6,
            Math.min(100, score)
          );

        /* -----------------------------------------------------
           HEBEL-KARTEN
        ----------------------------------------------------- */

        const leverCardsHtml =
          leverData
            .map(
              (lever, index) => `
            <tr>
              <td style="padding:0 0 14px 0;">
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="
                    background:#FBF6F0;
                    border:1px solid #E9D8C6;
                    border-radius:16px;
                  "
                >
                  <tr>
                    <td
                      width="54"
                      valign="top"
                      style="
                        padding:20px 0 20px 18px;
                      "
                    >
                      <div
                        style="
                          width:36px;
                          height:36px;
                          line-height:36px;
                          text-align:center;
                          border-radius:50%;
                          background:#3A281F;
                          color:#E5C38C;
                          font-size:12px;
                          font-weight:800;
                        "
                      >
                        0${index + 1}
                      </div>
                    </td>

                    <td
                      valign="top"
                      style="
                        padding:18px 20px 18px 12px;
                      "
                    >
                      <div
                        style="
                          font-size:17px;
                          line-height:1.3;
                          font-weight:800;
                          color:#33231C;
                          margin-bottom:5px;
                        "
                      >
                        ${escapeHtml(lever.title)}
                      </div>

                      <div
                        style="
                          font-size:13px;
                          line-height:1.5;
                          font-weight:700;
                          color:#A06B36;
                          margin-bottom:9px;
                        "
                      >
                        ${escapeHtml(lever.short)}
                      </div>

                      <div
                        style="
                          font-size:14px;
                          line-height:1.7;
                          color:#715C51;
                        "
                      >
                        ${escapeHtml(lever.text)}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          `
            )
            .join("");

        /* -----------------------------------------------------
           BREVO REQUEST
        ----------------------------------------------------- */

        const brevoResponse = await fetch(
          "https://api.brevo.com/v3/smtp/email",
          {
            method: "POST",
            headers: {
              accept: "application/json",
              "api-key": brevoApiKey,
              "content-type": "application/json",
            },

            body: JSON.stringify({
              sender: {
                name: brevoSenderName,
                email: brevoSenderEmail,
              },

              replyTo: {
                name: brevoSenderName,
                email: brevoSenderEmail,
              },

              to: [
                {
                  email,
                  name: firstName,
                },
              ],

              subject:
                `Deine persönliche GlowSuite Studio-Auswertung – ${score}/100`,

              tags: [
                "studio-check",
                "studio-check-v2",
              ],

              htmlContent: `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <style>
    @media only screen and (max-width: 640px) {
      .email-wrapper {
        width: 100% !important;
      }

      .email-padding {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }

      .hero-title {
        font-size: 27px !important;
      }

      .score-number {
        font-size: 48px !important;
      }

      .desktop-padding {
        padding: 24px 20px !important;
      }
    }
  </style>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#F3ECE5;
    -webkit-text-size-adjust:100%;
    -ms-text-size-adjust:100%;
  "
>

  <!-- PREHEADER -->
  <div
    style="
      display:none;
      max-height:0;
      overflow:hidden;
      opacity:0;
      color:transparent;
    "
  >
    Dein Studio-Score ist ${score}/100.
    Entdecke jetzt deine drei größten Hebel.
  </div>

  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="
      width:100%;
      background:#F3ECE5;
    "
  >
    <tr>
      <td
        align="center"
        style="
          padding:34px 14px;
        "
      >

        <!-- EMAIL CONTAINER -->
        <table
          role="presentation"
          width="620"
          cellspacing="0"
          cellpadding="0"
          border="0"
          class="email-wrapper"
          style="
            width:620px;
            max-width:620px;
            background:#FFFFFF;
            border-radius:24px;
            overflow:hidden;
            border:1px solid #E7D8CA;
            box-shadow:0 18px 60px rgba(59,37,27,0.10);
          "
        >

          <!-- PREMIUM HEADER -->
          <tr>
            <td
              class="email-padding"
              style="
                padding:30px 38px 27px;
                background:#2B1D17;
              "
            >
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >
                <tr>
                  <td>
                    <div
                      style="
                        font-size:12px;
                        line-height:1.2;
                        font-weight:800;
                        letter-spacing:1.3px;
                        text-transform:uppercase;
                        color:#D7B477;
                        margin-bottom:12px;
                      "
                    >
                      GlowSuite AI
                    </div>

                    <div
                      class="hero-title"
                      style="
                        font-size:32px;
                        line-height:1.12;
                        letter-spacing:-0.6px;
                        font-weight:800;
                        color:#FFF9F3;
                      "
                    >
                      Deine persönliche
                      <br>
                      Studio-Auswertung
                    </div>

                    <div
                      style="
                        margin-top:13px;
                        font-size:14px;
                        line-height:1.6;
                        color:#D9CDC5;
                      "
                    >
                      Klarheit über deine Abläufe.
                      Fokus auf die Hebel, die jetzt zählen.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>


          <!-- PERSONAL INTRO -->
          <tr>
            <td
              class="desktop-padding"
              style="
                padding:34px 38px 16px;
              "
            >
              <div
                style="
                  font-size:18px;
                  line-height:1.5;
                  font-weight:700;
                  color:#33231C;
                  margin-bottom:10px;
                "
              >
                Hallo ${safeFirstName},
              </div>

              <div
                style="
                  font-size:15px;
                  line-height:1.75;
                  color:#715C51;
                "
              >
                du hast dir ein paar Minuten genommen,
                um dein Studio ehrlich einzuschätzen.
                Genau daraus ist diese persönliche
                Auswertung entstanden.
              </div>

              <div
                style="
                  margin-top:10px;
                  font-size:15px;
                  line-height:1.75;
                  color:#715C51;
                "
              >
                Es geht dabei nicht darum, alles auf
                einmal zu verändern. Entscheidend ist,
                <strong style="color:#3B2921;">
                  zuerst den richtigen Hebel zu erkennen.
                </strong>
              </div>
            </td>
          </tr>


          <!-- SCORE HERO -->
          <tr>
            <td
              class="desktop-padding"
              style="
                padding:20px 38px 18px;
              "
            >
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  background:#FAF3EB;
                  border:1px solid #E8D5C1;
                  border-radius:20px;
                "
              >
                <tr>
                  <td
                    align="center"
                    style="
                      padding:28px 24px 26px;
                    "
                  >
                    <div
                      style="
                        font-size:11px;
                        line-height:1.2;
                        font-weight:800;
                        letter-spacing:1.3px;
                        text-transform:uppercase;
                        color:#A77A4B;
                      "
                    >
                      Dein Studio-Score
                    </div>

                    <div
                      class="score-number"
                      style="
                        margin-top:7px;
                        font-size:58px;
                        line-height:1;
                        letter-spacing:-2px;
                        font-weight:900;
                        color:#9A642C;
                      "
                    >
                      ${score}
                      <span
                        style="
                          font-size:24px;
                          color:#A99688;
                          letter-spacing:0;
                        "
                      >
                        /100
                      </span>
                    </div>

                    <div
                      style="
                        display:inline-block;
                        margin-top:12px;
                        padding:6px 12px;
                        border-radius:999px;
                        background:#EFE1D2;
                        color:#81542C;
                        font-size:12px;
                        font-weight:800;
                      "
                    >
                      ${escapeHtml(scoreLabel)}
                    </div>

                    <!-- PROGRESS -->
                    <table
                      role="presentation"
                      width="100%"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                      style="
                        margin-top:22px;
                      "
                    >
                      <tr>
                        <td
                          style="
                            height:8px;
                            background:#E5D8CB;
                            border-radius:999px;
                            overflow:hidden;
                          "
                        >
                          <div
                            style="
                              width:${progressWidth}%;
                              height:8px;
                              background:#B47A43;
                              border-radius:999px;
                            "
                          ></div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>


          <!-- SCORE MEANING -->
          <tr>
            <td
              class="desktop-padding"
              style="
                padding:16px 38px 25px;
              "
            >
              <div
                style="
                  font-size:22px;
                  line-height:1.3;
                  letter-spacing:-0.3px;
                  font-weight:800;
                  color:#33231C;
                  margin-bottom:10px;
                "
              >
                ${escapeHtml(scoreHeadline)}
              </div>

              <div
                style="
                  font-size:15px;
                  line-height:1.75;
                  color:#715C51;
                "
              >
                ${escapeHtml(scoreDescription)}
              </div>
            </td>
          </tr>


          <!-- PRIORITY -->
          <tr>
            <td
              class="desktop-padding"
              style="
                padding:4px 38px 30px;
              "
            >
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  background:#35251E;
                  border-radius:18px;
                "
              >
                <tr>
                  <td
                    style="
                      padding:22px 24px;
                    "
                  >
                    <div
                      style="
                        font-size:10px;
                        font-weight:800;
                        letter-spacing:1.2px;
                        text-transform:uppercase;
                        color:#D8B57B;
                        margin-bottom:8px;
                      "
                    >
                      Dein wichtigster nächster Hebel
                    </div>

                    <div
                      style="
                        font-size:21px;
                        line-height:1.3;
                        font-weight:800;
                        color:#FFF8F1;
                        margin-bottom:8px;
                      "
                    >
                      ${escapeHtml(priorityLever.title)}
                    </div>

                    <div
                      style="
                        font-size:14px;
                        line-height:1.65;
                        color:#DDD0C7;
                      "
                    >
                      ${escapeHtml(priorityLever.short)}
                      Du musst nicht zehn Dinge gleichzeitig
                      optimieren. Beginne dort, wo aktuell
                      der größte Unterschied entstehen kann.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>


          <!-- THREE LEVERS HEADING -->
          <tr>
            <td
              class="desktop-padding"
              style="
                padding:4px 38px 15px;
              "
            >
              <div
                style="
                  font-size:11px;
                  line-height:1.2;
                  font-weight:800;
                  letter-spacing:1.2px;
                  text-transform:uppercase;
                  color:#A77A4B;
                  margin-bottom:8px;
                "
              >
                Deine persönliche Prioritätenliste
              </div>

              <div
                style="
                  font-size:24px;
                  line-height:1.25;
                  letter-spacing:-0.3px;
                  font-weight:800;
                  color:#33231C;
                "
              >
                Diese 3 Bereiche verdienen
                zuerst deine Aufmerksamkeit.
              </div>
            </td>
          </tr>


          <!-- LEVERS -->
          <tr>
            <td
              class="desktop-padding"
              style="
                padding:12px 38px 24px;
              "
            >
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >
                ${leverCardsHtml}
              </table>
            </td>
          </tr>


          <!-- BRIDGE TO PRODUCT -->
          <tr>
            <td
              class="desktop-padding"
              style="
                padding:5px 38px 12px;
              "
            >
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  border-top:1px solid #E9DDD2;
                "
              >
                <tr>
                  <td
                    style="
                      padding:30px 0 0;
                    "
                  >
                    <div
                      style="
                        font-size:22px;
                        line-height:1.3;
                        font-weight:800;
                        color:#33231C;
                        margin-bottom:10px;
                      "
                    >
                      Was wäre, wenn genau diese
                      Abläufe nicht mehr ständig
                      deine Aufmerksamkeit brauchen?
                    </div>

                    <div
                      style="
                        font-size:15px;
                        line-height:1.75;
                        color:#715C51;
                      "
                    >
                      GlowSuite wurde dafür entwickelt,
                      wiederkehrende Abläufe rund um
                      Buchungen, Kommunikation,
                      Erinnerungen und Kundenbindung
                      stärker im Hintergrund arbeiten
                      zu lassen – während du die
                      Kontrolle behältst.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>


          <!-- CTA -->
          <tr>
            <td
              align="center"
              class="desktop-padding"
              style="
                padding:25px 38px 38px;
              "
            >
              <div
                style="
                  font-size:13px;
                  line-height:1.6;
                  color:#8A7568;
                  margin-bottom:14px;
                "
              >
                Schau dir in Ruhe an, wie der Ablauf
                für ein Beauty-Studio aussehen kann.
              </div>

              <a
                href="https://www.glowsuite-ai.de/demo#live-demo"
                style="
                  display:inline-block;
                  padding:16px 27px;
                  border-radius:14px;
                  background:#2B1D17;
                  color:#FFF9F3;
                  text-decoration:none;
                  font-size:14px;
                  line-height:1;
                  font-weight:800;
                  box-shadow:0 10px 26px rgba(43,29,23,0.18);
                "
              >
                GlowSuite live ansehen →
              </a>

              <div
                style="
                  margin-top:12px;
                  font-size:11px;
                  line-height:1.5;
                  color:#A39389;
                "
              >
                Unverbindlich ansehen · kein Kauf erforderlich
              </div>
            </td>
          </tr>


          <!-- SIGNATURE -->
          <tr>
            <td
              class="desktop-padding"
              style="
                padding:28px 38px;
                background:#F9F4EE;
                border-top:1px solid #E9DDD2;
              "
            >
              <div
                style="
                  font-size:14px;
                  line-height:1.7;
                  color:#715C51;
                "
              >
                Viele Grüße
                <br>

                <strong
                  style="
                    color:#33231C;
                  "
                >
                  GlowSuite AI
                </strong>
              </div>

              <div
                style="
                  margin-top:18px;
                  font-size:11px;
                  line-height:1.65;
                  color:#9A887D;
                "
              >
                Du erhältst diese E-Mail, weil du den
                GlowSuite Studio-Check durchgeführt
                und deine E-Mail-Adresse zur
                Bereitstellung deiner persönlichen
                Auswertung angegeben hast.
                Diese Nachricht ist kein Newsletter.
              </div>

              <div
                style="
                  margin-top:10px;
                  font-size:11px;
                "
              >
                <a
                  href="https://www.glowsuite-ai.de/datenschutz"
                  style="
                    color:#8E5F31;
                    text-decoration:underline;
                  "
                >
                  Datenschutzerklärung
                </a>
              </div>
            </td>
          </tr>

        </table>

        <!-- OUTER FOOTNOTE -->
        <table
          role="presentation"
          width="620"
          cellspacing="0"
          cellpadding="0"
          border="0"
          class="email-wrapper"
          style="
            width:620px;
            max-width:620px;
          "
        >
          <tr>
            <td
              align="center"
              style="
                padding:18px 20px 4px;
                font-size:10px;
                line-height:1.5;
                color:#A49387;
              "
            >
              © 2026 GlowSuite AI
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
          `,
            }),
          }
        );

        const brevoData =
          await brevoResponse
            .json()
            .catch(() => null);

        if (!brevoResponse.ok) {
          console.error(
            "Brevo Fehler:",
            brevoData
          );
        } else {
          emailSent = true;

          brevoMessageId =
            brevoData?.messageId ?? null;

          console.log(
            "GlowSuite Studio-Auswertung V2 versendet:",
            brevoMessageId
          );
        }
      }
    } catch (brevoError) {
      /*
       * Ein Fehler beim E-Mail-Versand darf
       * den bereits gespeicherten Airtable-Lead
       * niemals zerstören.
       */
      console.error(
        "Brevo Versandfehler:",
        brevoError
      );
    }

    return NextResponse.json({
      success: true,
      score,
      recordId:
        airtableData.records?.[0]?.id ?? null,
      emailSent,
      brevoMessageId,
    });
  } catch (error) {
    console.error(
      "Studio-Check API Fehler:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Beim Speichern der Studio-Auswertung ist ein Fehler aufgetreten.",
      },
      { status: 500 }
    );
  }
}