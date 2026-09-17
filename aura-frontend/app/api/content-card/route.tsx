import { ImageResponse } from "next/og";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type ContentCardPayload = {
  headline?: string;
  body?: string;
  purpose?: string;
  role?: string;
  layout?: string;
  swipeCue?: string;
  screenToShow?: string;
  slideNumber?: number | string;
  slideTotal?: number | string;
  contentTitle?: string;
  backgroundImage?: string;
};

function cleanText(value: unknown, maximumLength: number) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximumLength);
}

function safeNumber(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : fallback;
}

function formText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length))
    );
  }

  return btoa(binary);
}

async function readPayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const background = formData.get("background");

    if (!(background instanceof File)) {
      throw new Error("Das Hintergrundbild im Feld 'background' fehlt.");
    }

    if (!background.type.startsWith("image/")) {
      throw new Error("Die hochgeladene Datei ist kein Bild.");
    }

    if (background.size > 5 * 1024 * 1024) {
      throw new Error("Das Hintergrundbild darf höchstens 5 MB groß sein.");
    }

    const base64 = arrayBufferToBase64(await background.arrayBuffer());

    return {
      headline: formText(formData, "headline"),
      body: formText(formData, "body"),
      purpose: formText(formData, "purpose"),
      role: formText(formData, "role"),
      layout: formText(formData, "layout"),
      swipeCue: formText(formData, "swipeCue"),
      screenToShow: formText(formData, "screenToShow"),
      slideNumber: formText(formData, "slideNumber"),
      slideTotal: formText(formData, "slideTotal"),
      contentTitle: formText(formData, "contentTitle"),
      backgroundImage: `data:${background.type || "image/png"};base64,${base64}`,
    } satisfies ContentCardPayload;
  }

  return (await request.json()) as ContentCardPayload;
}

export async function GET() {
  return Response.json({
    success: true,
    service: "GlowSuite Visual Carousel Renderer",
    format: "1080x1920",
  });
}

export async function POST(request: Request) {
  const expectedKey = process.env.CONTENT_RENDER_KEY;
  const providedKey = request.headers.get("x-content-key");

  if (!expectedKey) {
    return Response.json(
      { error: "CONTENT_RENDER_KEY ist nicht eingerichtet." },
      { status: 500 }
    );
  }

  if (providedKey !== expectedKey) {
    return Response.json(
      { error: "Nicht autorisiert." },
      { status: 401 }
    );
  }

  let payload: ContentCardPayload;

  try {
    payload = await readPayload(request);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ungültige Anfrage.",
      },
      { status: 400 }
    );
  }

  const headline = cleanText(payload.headline, 100);
  const body = cleanText(payload.body, 220);
  const purpose = cleanText(payload.purpose, 30) || "INHALT";
  const role = cleanText(payload.role, 30);
  const layout = cleanText(payload.layout, 40);
  const swipeCue = cleanText(payload.swipeCue, 40);
  const contentTitle = cleanText(payload.contentTitle, 90);
  const backgroundImage = String(payload.backgroundImage ?? "").trim();

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
      { error: "Eine Überschrift wird benötigt." },
      { status: 400 }
    );
  }

  if (!backgroundImage.startsWith("data:image/")) {
    return Response.json(
      { error: "Ein gültiges Hintergrundbild wird benötigt." },
      { status: 400 }
    );
  }

  const normalizedPurpose = purpose.toLowerCase();
  const normalizedRole = role.toLowerCase();
  const isCta = normalizedPurpose === "cta" || normalizedRole === "cta";

  const purposeLabels: Record<string, string> = {
    schmerz: "STUDIO-ALLTAG",
    hook: "STUDIO-ALLTAG",
    eskalation: "DER DRUCK STEIGT",
    erkenntnis: "DER WAHRE GRUND",
    beweis: "DIE LÖSUNG",
    lösung: "DIE LÖSUNG",
    cta: "DEIN NÄCHSTER SCHRITT",
  };

  const purposeLabel =
    purposeLabels[normalizedPurpose] ??
    purposeLabels[normalizedRole] ??
    purpose.toUpperCase();

  const upperLayouts = new Set(["hero_full_bleed", "contrast_reveal"]);
  const placeTextAtTop = upperLayouts.has(layout) && !isCta;

  const headlineSize =
    headline.length > 70
      ? 70
      : headline.length > 48
        ? 78
        : headline.length > 30
          ? 88
          : 98;

  const bodySize = body.length > 120 ? 35 : body.length > 75 ? 39 : 43;
  const accentColor = "#D5A45B";

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
          background: "#251712",
          color: "#FFF9F2",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <img
          src={backgroundImage}
          width="1080"
          height="1920"
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "linear-gradient(180deg, rgba(25,13,9,0.72) 0%, rgba(25,13,9,0.06) 31%, rgba(25,13,9,0.10) 54%, rgba(25,13,9,0.90) 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 58,
            right: 58,
            top: 58,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 5,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "13px 19px",
              borderRadius: 999,
              background: "rgba(34,20,15,0.72)",
              border: "1px solid rgba(255,255,255,0.20)",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 1.5,
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                marginRight: 11,
                borderRadius: 999,
                background: accentColor,
                display: "flex",
              }}
            />
            GLOWSUITE AI
          </div>

          <div
            style={{
              display: "flex",
              padding: "13px 18px",
              borderRadius: 999,
              background: "rgba(34,20,15,0.72)",
              border: "1px solid rgba(255,255,255,0.20)",
              fontSize: 23,
              fontWeight: 800,
            }}
          >
            {slideNumber}/{slideTotal}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 58,
            right: 58,
            top: placeTextAtTop ? 245 : 820,
            ...(placeTextAtTop ? {} : { bottom: 160 }),
            display: "flex",
            flexDirection: "column",
            justifyContent: placeTextAtTop ? "flex-start" : "flex-end",
            alignItems: "flex-start",
            zIndex: 4,
          }}
        >
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              padding: "34px 38px 38px",
              borderRadius: 32,
              background: isCta
                ? "rgba(47,27,20,0.90)"
                : "rgba(35,20,15,0.80)",
              border: "1px solid rgba(255,255,255,0.20)",
              boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                alignSelf: "flex-start",
                display: "flex",
                padding: "10px 16px",
                marginBottom: 24,
                borderRadius: 999,
                background: "rgba(213,164,91,0.18)",
                color: "#F0C987",
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: 1.8,
              }}
            >
              {purposeLabel}
            </div>

            <div
              style={{
                display: "flex",
                maxWidth: 910,
                fontSize: headlineSize,
                fontWeight: 900,
                lineHeight: 1.02,
                letterSpacing: -2.7,
              }}
            >
              {headline}
            </div>

            {body ? (
              <div
                style={{
                  display: "flex",
                  maxWidth: 900,
                  marginTop: 24,
                  color: "#F4E9E0",
                  fontSize: bodySize,
                  fontWeight: 500,
                  lineHeight: 1.3,
                }}
              >
                {body}
              </div>
            ) : null}

            {swipeCue ? (
              <div
                style={{
                  alignSelf: "flex-end",
                  display: "flex",
                  alignItems: "center",
                  marginTop: 30,
                  color: "#F0C987",
                  fontSize: 27,
                  fontWeight: 800,
                }}
              >
                {swipeCue}
                <div
                  style={{
                    display: "flex",
                    marginLeft: 12,
                    fontSize: 35,
                    lineHeight: 1,
                  }}
                >
                  →
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 62,
            bottom: 58,
            display: "flex",
            maxWidth: 690,
            color: "rgba(255,249,242,0.76)",
            fontSize: 19,
            fontWeight: 600,
            zIndex: 5,
          }}
        >
          {contentTitle || "Mehr Ruhe für deinen Studio-Alltag"}
        </div>

        <div
          style={{
            position: "absolute",
            right: 62,
            bottom: 62,
            display: "flex",
            alignItems: "center",
            zIndex: 5,
          }}
        >
          {Array.from({ length: slideTotal }).map((_, index) => (
            <div
              key={index}
              style={{
                width: index + 1 === slideNumber ? 28 : 9,
                height: 9,
                marginLeft: 8,
                borderRadius: 999,
                background:
                  index + 1 === slideNumber
                    ? accentColor
                    : "rgba(255,255,255,0.38)",
                display: "flex",
              }}
            />
          ))}
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
    }
  );

  image.headers.set("Cache-Control", "no-store");
  return image;
}
