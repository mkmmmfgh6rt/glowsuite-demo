// ===============================================
// auth.js – Basic-Auth Middleware v3 (sicher & flexibel)
// ===============================================
// ✅ Kompatibel mit ADMIN_USER / ADMIN_PASS & WEBHOOK_USER / WEBHOOK_PASS
// ✅ Timing-Safe-Vergleich gegen Brute-Force-Angriffe
// ✅ Entwicklermodus: Wenn keine Logins gesetzt sind → offen (lokal testen)
// ===============================================

import crypto from "crypto";

/** Zeitkonstante String-Vergleich (gegen Timing-Angriffe) */
function safeEqual(a = "", b = "") {
  const ab = Buffer.from(String(a), "utf8");
  const bb = Buffer.from(String(b), "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** Middleware für Basic-Auth-Schutz */
export function authMiddleware(req, res, next) {
  // Admin-Login aus .env (Fallbacks für Kompatibilität)
  const user = process.env.ADMIN_USER || process.env.WEBHOOK_USER || "";
  const pass = process.env.ADMIN_PASS || process.env.WEBHOOK_PASS || "";

  // 🔓 Wenn keine Zugangsdaten gesetzt → offen lassen (z. B. lokale Tests)
  if (!user || !pass) {
    // ❗ bewusst: kein Admin-Kontext im offenen Modus
    req.isAdmin = false;
    console.warn("⚠️ Basic-Auth deaktiviert (keine ADMIN_USER/PASS in .env gesetzt)");
    return next();
  }

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Beauty Lounge Admin"');
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const base64 = authHeader.split(" ")[1];
    const decoded = Buffer.from(base64, "base64").toString("utf8");
    const [u, p] = decoded.split(":");

    if (safeEqual(u, user) && safeEqual(p, pass)) {
      // ✅ ECHTER ADMIN
      req.isAdmin = true;
      return next();
    }
  } catch (err) {
    console.error("❌ Authentifizierungsfehler:", err);
  }

  req.isAdmin = false;
  res.setHeader("WWW-Authenticate", 'Basic realm="Beauty Lounge Admin"');
  return res.status(401).json({ error: "Unauthorized" });
}
