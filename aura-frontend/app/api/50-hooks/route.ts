import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PDF_URL =
  "https://www.glowsuite-ai.de/downloads/50-social-media-hooks-beauty-studios.pdf";

const STUDIO_CHECK_URL =
  "https://www.glowsuite-ai.de/studio-check";

type HooksPayload = {
  firstName?: string;
  email?: string;
  marketingConsent?: boolean;
  company?: string;
};

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

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HooksPayload;

    const firstName = body.firstName?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const marketingConsent = body.marketingConsent === true;
    

    /*
     * Unsichtbares Feld gegen einfache Spam-Bots.
     * Echte Besucher lassen dieses Feld leer.
     */

    if (!firstName || !email) {
      return NextResponse.json(
        {
          error: "Vorname und E-Mail-Adresse sind erforderlich.",
        },
        { status: 400 }
      );
    }

    if (firstName.length > 80 || !isValidEmail(email)) {
      return NextResponse.json(
        {
          error: "Bitte überprüfe deine Angaben.",
        },
        { status: 400 }
      );
    }

    const airtableToken = process.env.AIRTABLE_TOKEN;
    const airtableBaseId = process.env.AIRTABLE_BASE_ID;
    const airtableTableId = process.env.AIRTABLE_TABLE_ID;

    if (!airtableToken || !airtableBaseId || !airtableTableId) {
      console.error("Airtable Umgebungsvariablen fehlen.");

      return NextResponse.json(
        {
          error: "Server-Konfiguration unvollständig.",
        },
        { status: 500 }
      );
    }

    const createdAt = new Date().toISOString();

    const notes = [
      "Lead automatisch über den kostenlosen 50-Hooks-Guide erfasst.",
      "Lead-Magnet: 50 Social-Media-Hooks für Beauty-Studios",
      `PDF: ${PDF_URL}`,
      `Freiwillige Einwilligung für weitere E-Mail-Tipps: ${
        marketingConsent ? "Ja" : "Nein"
      }`,
      marketingConsent
        ? `Einwilligung erteilt am: ${createdAt}`
        : null,
      marketingConsent
        ? "Einwilligungstext: Tipps zu Social Media, Studio-Wachstum und Automatisierung per E-Mail. Jederzeit widerrufbar."
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    /*
     * LEAD IN AIRTABLE SPEICHERN
     */
    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableId}`,
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
                Studio: `50-Hooks – ${firstName}`,
                Ansprechpartner: firstName,
                "E-Mail": email,
                Quelle: "Website",
                "Pipeline-Status": "Neu",
                "Lead-Temperatur": "Warm",
                Notizen: notes,
              },
            },
          ],
          typecast: true,
        }),
      }
    );

    const airtableData = await airtableResponse
      .json()
      .catch(() => null);

    if (!airtableResponse.ok) {
      console.error("Airtable Fehler:", airtableData);

      return NextResponse.json(
        {
          error: "Der Download konnte gerade nicht vorbereitet werden.",
        },
        { status: 500 }
      );
    }

    /*
     * TRANSAKTIONS-E-MAIL ÜBER BREVO
     */
    const brevoApiKey = process.env.BREVO_API_KEY;
    const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL;
    const brevoSenderName =
      process.env.BREVO_SENDER_NAME || "GlowSuite AI";

    let emailSent = false;
    let brevoMessageId: string | null = null;

    if (!brevoApiKey || !brevoSenderEmail) {
      console.error("Brevo Umgebungsvariablen fehlen.");
    } else {
      const safeFirstName = escapeHtml(firstName);

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
              "Deine 50 Social-Media-Hooks für dein Beauty-Studio",
            tags: ["50-hooks", "lead-magnet"],
            htmlContent: `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f2e9e0;
    font-family:Arial,Helvetica,sans-serif;
    color:#33231c;
  "
>
  <div
    style="
      display:none;
      max-height:0;
      overflow:hidden;
      opacity:0;
    "
  >
    Deine 50 Social-Media-Hooks stehen jetzt zum Download bereit.
  </div>

  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="background:#f2e9e0;"
  >
    <tr>
      <td align="center" style="padding:34px 14px;">
        <table
          role="presentation"
          width="620"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            width:100%;
            max-width:620px;
            overflow:hidden;
            border:1px solid #e2d0bf;
            border-radius:24px;
            background:#ffffff;
            box-shadow:0 18px 60px rgba(59,37,27,0.10);
          "
        >
          <tr>
            <td
              style="
                padding:34px 30px;
                background:
                  linear-gradient(135deg,#160f0b,#352219);
                color:#fff8ef;
              "
            >
              <div
                style="
                  margin-bottom:28px;
                  color:#dfb97c;
                  font-size:13px;
                  font-weight:800;
                  letter-spacing:1px;
                "
              >
                GLOWSUITE AI
              </div>

              <div
                style="
                  margin-bottom:10px;
                  color:#dfb97c;
                  font-size:12px;
                  font-weight:800;
                  letter-spacing:1px;
                "
              >
                DEIN KOSTENLOSER GUIDE
              </div>

              <h1
                style="
                  margin:0 0 14px;
                  font-size:34px;
                  line-height:1.12;
                  letter-spacing:-1px;
                "
              >
                Deine 50 Social-Media-Hooks sind bereit.
              </h1>

              <p
                style="
                  margin:0;
                  color:rgba(255,248,239,0.72);
                  font-size:15px;
                  line-height:1.7;
                "
              >
                Neue Einstiege für deine nächsten Instagram- und
                TikTok-Posts.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:34px 30px 14px;">
              <p
                style="
                  margin:0 0 16px;
                  font-size:16px;
                  line-height:1.7;
                "
              >
                Hallo ${safeFirstName},
              </p>

              <p
                style="
                  margin:0 0 24px;
                  color:#705c50;
                  font-size:15px;
                  line-height:1.75;
                "
              >
                hier ist dein kostenloser GlowSuite-Guide mit
                50 Social-Media-Hooks speziell für Beauty-Studios.
                Du kannst die Formulierungen direkt verwenden oder
                an deine Leistungen anpassen.
              </p>

              <table
                role="presentation"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="margin-bottom:28px;"
              >
                <tr>
                  <td
                    style="
                      border-radius:13px;
                      background:#251710;
                    "
                  >
                    <a
                      href="${PDF_URL}"
                      target="_blank"
                      style="
                        display:inline-block;
                        padding:16px 24px;
                        color:#fff8ef;
                        font-size:14px;
                        font-weight:800;
                        text-decoration:none;
                      "
                    >
                      50 Hooks als PDF herunterladen →
                    </a>
                  </td>
                </tr>
              </table>

              <div
                style="
                  margin-bottom:26px;
                  padding:21px;
                  border:1px solid #ead8c6;
                  border-radius:16px;
                  background:#fbf6f0;
                "
              >
                <div
                  style="
                    margin-bottom:7px;
                    color:#9b643b;
                    font-size:12px;
                    font-weight:800;
                  "
                >
                  KOSTENLOSER BONUS
                </div>

                <div
                  style="
                    margin-bottom:8px;
                    font-size:19px;
                    font-weight:800;
                  "
                >
                  Wie digital arbeitet dein Studio?
                </div>

                <div
                  style="
                    margin-bottom:15px;
                    color:#715d50;
                    font-size:14px;
                    line-height:1.65;
                  "
                >
                  Beantworte fünf kurze Fragen und entdecke deine
                  drei größten Automatisierungspotenziale.
                </div>

                <a
                  href="${STUDIO_CHECK_URL}"
                  target="_blank"
                  style="
                    color:#8d5c34;
                    font-size:14px;
                    font-weight:800;
                  "
                >
                  Kostenlosen Studio-Check starten →
                </a>
              </div>

              <p
                style="
                  margin:0 0 25px;
                  color:#715d50;
                  font-size:14px;
                  line-height:1.7;
                "
              >
                Viel Freude beim Erstellen deiner nächsten Posts!
                <br>
                <strong style="color:#33231c;">GlowSuite AI</strong>
              </p>

              <div
                style="
                  padding-top:18px;
                  border-top:1px solid #eee1d5;
                  color:#9a887d;
                  font-size:11px;
                  line-height:1.65;
                "
              >
                Du erhältst diese E-Mail, weil du den kostenlosen
                50-Hooks-Guide angefordert hast. Diese Nachricht ist
                kein Newsletter.

                <br><br>

                <a
                  href="https://www.glowsuite-ai.de/datenschutz"
                  style="color:#8e5f31;"
                >
                  Datenschutzerklärung
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td
              align="center"
              style="
                padding:18px 20px 24px;
                color:#a49387;
                font-size:10px;
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

      const brevoData = await brevoResponse
        .json()
        .catch(() => null);

      if (!brevoResponse.ok) {
        console.error("Brevo Fehler:", brevoData);
      } else {
        emailSent = true;
        brevoMessageId = brevoData?.messageId ?? null;
      }

      /*
       * FREIWILLIGE TIPPS-EINWILLIGUNG
       *
       * Funktioniert automatisch, sobald in Vercel zusätzlich
       * BREVO_50_HOOKS_LIST_ID hinterlegt wurde.
       */
      const brevoListId = Number(
        process.env.BREVO_50_HOOKS_LIST_ID
      );

      if (
        marketingConsent &&
        Number.isInteger(brevoListId) &&
        brevoListId > 0
      ) {
        const contactResponse = await fetch(
          "https://api.brevo.com/v3/contacts",
          {
            method: "POST",
            headers: {
              accept: "application/json",
              "api-key": brevoApiKey,
              "content-type": "application/json",
            },
            body: JSON.stringify({
              email,
              listIds: [brevoListId],
              updateEnabled: true,
            }),
          }
        );

        if (!contactResponse.ok) {
          const contactError = await contactResponse
            .json()
            .catch(() => null);

          console.error(
            "Brevo Kontakt konnte nicht hinzugefügt werden:",
            contactError
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      emailSent,
      recordId: airtableData?.records?.[0]?.id ?? null,
      brevoMessageId,
    });
  } catch (error) {
    console.error("50-Hooks API Fehler:", error);

    return NextResponse.json(
      {
        error:
          "Beim Vorbereiten deines Downloads ist ein Fehler aufgetreten.",
      },
      { status: 500 }
    );
  }
}