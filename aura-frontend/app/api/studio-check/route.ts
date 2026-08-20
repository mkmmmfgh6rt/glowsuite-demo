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

    return NextResponse.json({
      success: true,
      score,
      recordId:
        airtableData.records?.[0]?.id ?? null,
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