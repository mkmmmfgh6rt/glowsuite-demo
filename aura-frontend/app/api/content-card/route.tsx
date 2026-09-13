import { ImageResponse } from "next/og";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type ContentCardPayload = {
  headline?: string;
  body?: string;
  purpose?: string;
  slideNumber?: number;
  slideTotal?: number;
  contentTitle?: string;
};

function cleanText(value: unknown, maximumLength: number) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximumLength);
}

function safeNumber(value: unknown, fallback: number) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.round(number);
}

export async function GET() {
  return Response.json({
    success: true,
    service: "GlowSuite Content Card Renderer",
  });
}

export async function POST(request: Request) {
  const expectedKey = process.env.CONTENT_RENDER_KEY;
  const providedKey = request.headers.get("x-content-key");

  if (!expectedKey) {
    return Response.json(
      {
        error: "CONTENT_RENDER_KEY ist nicht eingerichtet.",
      },
      { status: 500 }
    );
  }

  if (providedKey !== expectedKey) {
    return Response.json(
      {
        error: "Nicht autorisiert.",
      },
      { status: 401 }
    );
  }

  let payload: ContentCardPayload;

  try {
    payload = (await request.json()) as ContentCardPayload;
  } catch {
    return Response.json(
      {
        error: "Ungültige JSON-Daten.",
      },
      { status: 400 }
    );
  }

  const headline = cleanText(payload.headline, 100);
  const body = cleanText(payload.body, 240);
  const purpose = cleanText(payload.purpose, 30) || "Inhalt";
  const contentTitle = cleanText(payload.contentTitle, 80);

  const slideTotal = Math.min(
    10,
    Math.max(1, safeNumber(payload.slideTotal, 5))
  );

  const slideNumber = Math.min(
    slideTotal,
    Math.max(1, safeNumber(payload.slideNumber, 1))
  );

  if (!headline) {
    return Response.json(
      {
        error: "Eine Überschrift wird benötigt.",
      },
      { status: 400 }
    );
  }

  const isCta = purpose.toLowerCase() === "cta";

  const purposeLabels: Record<string, string> = {
    hook: "AUFMERKSAMKEIT",
    problem: "STUDIO-ALLTAG",
    erkenntnis: "ERKENNTNIS",
    lösung: "LÖSUNG",
    cta: "DEIN NÄCHSTER SCHRITT",
  };

  const purposeLabel =
    purposeLabels[purpose.toLowerCase()] ??
    purpose.toUpperCase();

  const headlineSize =
    headline.length > 70
      ? 58
      : headline.length > 45
        ? 66
        : 76;

  const bodySize =
    body.length > 180
      ? 34
      : body.length > 110
        ? 38
        : 42;

  const background = isCta
    ? "linear-gradient(145deg, #241713 0%, #3B251E 52%, #6E4938 100%)"
    : "linear-gradient(145deg, #FFF9F2 0%, #F1E3D4 55%, #D8BFA7 100%)";

  const mainColor = isCta ? "#FFF9F2" : "#2F201B";
  const bodyColor = isCta ? "#F0DDD0" : "#5F493F";
  const accentColor = "#B88746";

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          padding: "76px 82px 66px",
          background,
          color: mainColor,
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            borderRadius: 999,
            right: -230,
            top: -190,
            background: isCta
              ? "rgba(184,135,70,0.18)"
              : "rgba(255,255,255,0.42)",
            display: "flex",
          }}
        />

        <div
          style={{
            position: "absolute",
            width: 360,
            height: 360,
            borderRadius: 999,
            left: -210,
            bottom: -170,
            background: isCta
              ? "rgba(255,255,255,0.06)"
              : "rgba(111,73,56,0.09)",
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 1.5,
            }}
          >
            <div
              style={{
                width: 17,
                height: 17,
                borderRadius: 999,
                marginRight: 13,
                background: accentColor,
                display: "flex",
              }}
            />

            GLOWSUITE AI
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 25,
              fontWeight: 700,
              color: isCta ? "#E3BD82" : "#8B623A",
            }}
          >
            {slideNumber}/{slideTotal}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            zIndex: 2,
            maxWidth: 880,
          }}
        >
          <div
            style={{
              alignSelf: "flex-start",
              display: "flex",
              padding: "13px 22px",
              marginBottom: 34,
              borderRadius: 999,
              background: isCta
                ? "rgba(227,189,130,0.15)"
                : "rgba(139,98,58,0.10)",
              color: isCta ? "#E3BD82" : "#805A37",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            {purposeLabel}
          </div>

          <div
            style={{
              width: 90,
              height: 7,
              marginBottom: 34,
              borderRadius: 999,
              background: accentColor,
              display: "flex",
            }}
          />

          <div
            style={{
              display: "flex",
              fontSize: headlineSize,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: -2,
              marginBottom: body ? 34 : 0,
            }}
          >
            {headline}
          </div>

          {body ? (
            <div
              style={{
                display: "flex",
                fontSize: bodySize,
                fontWeight: 400,
                lineHeight: 1.35,
                color: bodyColor,
                maxWidth: 850,
              }}
            >
              {body}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: "flex",
              maxWidth: 700,
              fontSize: 21,
              color: isCta ? "#D8C5BA" : "#745C50",
            }}
          >
            {contentTitle || "Mehr Ruhe und Wachstum für dein Studio"}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            {Array.from({ length: slideTotal }).map((_, index) => (
              <div
                key={index}
                style={{
                  width: index + 1 === slideNumber ? 30 : 10,
                  height: 10,
                  marginLeft: 9,
                  borderRadius: 999,
                  background:
                    index + 1 === slideNumber
                      ? accentColor
                      : isCta
                        ? "rgba(255,255,255,0.28)"
                        : "rgba(47,32,27,0.20)",
                  display: "flex",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1350,
    }
  );

  image.headers.set("Cache-Control", "no-store");

  return image;
}