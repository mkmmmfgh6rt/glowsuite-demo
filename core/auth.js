// ===============================================
// auth.js – Basic-Auth Middleware v5 (SaaS ready)
// ===============================================
// ✅ Admin Login (.env)
// ✅ Studio Login (config JSON)
// ✅ Timing-Safe Vergleich
// ✅ Stripe Subscription Status Check
// ===============================================

import crypto from "crypto";
import fs from "fs";
import path from "path";

const CONFIG_BASE = path.resolve("Datein/config/kunden");

/** Zeitkonstante String-Vergleich (gegen Timing-Angriffe) */
function safeEqual(a = "", b = "") {
  const ab = Buffer.from(String(a), "utf8");
  const bb = Buffer.from(String(b), "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** Middleware für Basic-Auth-Schutz */
export function authMiddleware(req, res, next) {

  // =======================================================
  // 🔒 STRIPE SUBSCRIPTION CHECK
  // =======================================================

  try {

    const tenant = req.query.tenant || process.env.TENANT_DEFAULT || "beauty_lounge";

    const configPath = path.join(CONFIG_BASE, `${tenant}.json`);

    if (fs.existsSync(configPath)) {

      const data = JSON.parse(fs.readFileSync(configPath,"utf8"));

      if (data?.stripe?.status === "inactive") {

        console.warn("⛔ Zugriff blockiert – Subscription inactive:", tenant);

        return res.status(403).json({
          error: "Subscription inactive"
        });

      }

    }

  } catch (err) {

    console.error("❌ Stripe Status Check Fehler:", err.message);

  }

  // =======================================================
  // BASIC AUTH HEADER
  // =======================================================

  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Basic ")) {

    res.setHeader("WWW-Authenticate", 'Basic realm="GlowSuite Admin"');

    return res.status(401).json({ error: "Unauthorized" });

  }

  let u = "";
  let p = "";

  try {

    const base64 = authHeader.split(" ")[1];

    const decoded = Buffer.from(base64,"base64").toString("utf8");

    [u,p] = decoded.split(":");

  } catch (err) {

    console.error("❌ Auth Decode Fehler:", err);

    return res.status(401).json({ error: "Unauthorized" });

  }

  // =======================================================
  // ADMIN LOGIN (.env)
  // =======================================================

  const adminUser = process.env.ADMIN_USER || process.env.WEBHOOK_USER || "";
  const adminPass = process.env.ADMIN_PASS || process.env.WEBHOOK_PASS || "";

  if (adminUser && adminPass) {

    if (safeEqual(u, adminUser) && safeEqual(p, adminPass)) {

      req.isAdmin = true;

      return next();

    }

  }

  // =======================================================
  // STUDIO LOGIN (config JSON)
  // =======================================================

  try {

    const files = fs.readdirSync(CONFIG_BASE);

    for (const file of files) {

      if (!file.endsWith(".json")) continue;

      const config = JSON.parse(
        fs.readFileSync(path.join(CONFIG_BASE,file),"utf8")
      );

      if (!config.auth) continue;

      if (
        safeEqual(u, config.auth.user) &&
        safeEqual(p, config.auth.password)
      ) {

        req.isAdmin = false;

        req.tenant = file.replace(".json","");

        return next();

      }

    }

  } catch (err) {

    console.error("❌ Studio Login Fehler:", err.message);

  }

  // =======================================================
  // ACCESS DENIED
  // =======================================================

  res.setHeader("WWW-Authenticate", 'Basic realm="GlowSuite Login"');

  return res.status(401).json({ error: "Unauthorized" });

}