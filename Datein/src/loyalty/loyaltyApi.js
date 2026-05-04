import express from "express";
import { addVisit, generateCustomerQR, getCustomerCard } from "./loyaltyEngine.js";

const router = express.Router();

const REQUIRED_VISITS = 10;


// =============================
// QR CODE GENERIEREN
// =============================
router.get("/loyalty/qr/:phone", async (req, res) => {

  try {

    const { phone } = req.params;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: "Telefonnummer fehlt"
      });
    }

    const qr = await generateCustomerQR(phone);

    return res.json({
      success: true,
      phone,
      qr
    });

  } catch (error) {

    console.error("QR Fehler:", error);

    return res.status(500).json({
      success: false,
      error: "QR konnte nicht erstellt werden"
    });

  }

});


// =============================
// QR CODE SCAN (Besuch speichern)
// =============================
router.get("/loyalty/scan/:phone", async (req, res) => {

  try {

    const { phone } = req.params;

    if (!phone) {
      return res.status(400).send("Telefonnummer fehlt");
    }

    await addVisit({
      tenant: "default",
      phone
    });

    const card = getCustomerCard(phone);

    const visits = card?.visits ?? 0;
    const points = card?.points ?? 0;

    const remaining = Math.max(REQUIRED_VISITS - visits, 0);
    const progress = Math.min((visits / REQUIRED_VISITS) * 100, 100);

    res.send(`
<!DOCTYPE html>
<html>
<head>

<meta charset="UTF-8">
<title>Beauty Bonuskarte</title>

<style>

body{
font-family: Arial, sans-serif;
background:#f7f7f7;
text-align:center;
padding:40px;
}

.card{
background:white;
padding:35px;
border-radius:16px;
max-width:420px;
margin:auto;
box-shadow:0 12px 30px rgba(0,0,0,0.1);
}

.visits{
font-size:42px;
font-weight:bold;
margin:20px 0;
}

.points{
font-size:20px;
margin-top:10px;
color:#444;
}

.progress{
height:10px;
background:#eee;
border-radius:20px;
margin-top:20px;
overflow:hidden;
}

.progress-bar{
height:10px;
width:${progress}%;
background:#ff7a7a;
}

</style>

</head>

<body>

<div class="card">

<h2>⭐ Beauty Bonuskarte</h2>

<div class="visits">
${visits} / ${REQUIRED_VISITS}
</div>

<div class="progress">
<div class="progress-bar"></div>
</div>

<p>Noch <b>${remaining}</b> Besuche bis zur Gratis Behandlung</p>

<div class="points">
Punkte: <b>${points}</b>
</div>

<hr>

<p>
Vielen Dank für deinen Besuch 💖
</p>

</div>

</body>
</html>
`);

  } catch (error) {

    console.error("Loyalty Scan Fehler:", error);

    res.status(500).send(`
<h2>⚠ Fehler</h2>
<p>Der Besuch konnte nicht gespeichert werden.</p>
`);

  }

});


// =============================
// LOYALTY POSTER GENERATOR
// =============================
router.get("/loyalty/poster", async (req, res) => {

  try {

    const qr = await generateCustomerQR("bonus");

    res.send(`
<!DOCTYPE html>
<html>
<head>

<meta charset="UTF-8">
<title>Beauty Bonuskarte Poster</title>

<style>

body{
font-family: Arial;
background:#f4f4f4;
display:flex;
justify-content:center;
align-items:center;
height:100vh;
}

.poster{
background:white;
padding:40px;
border-radius:20px;
box-shadow:0 15px 40px rgba(0,0,0,0.1);
text-align:center;
max-width:420px;
}

.qr{
margin:25px 0;
}

</style>

</head>

<body>

<div class="poster">

<h1>⭐ Beauty Bonuskarte</h1>

<p>
Scanne den QR Code und sammle Punkte bei jedem Besuch
</p>

<div class="qr">
<img src="${qr}" width="220">
</div>

<p><b>${REQUIRED_VISITS} Besuche = Gratis Behandlung</b></p>

</div>

</body>
</html>
`);

  } catch (error) {

    console.error("Poster Fehler:", error);

    res.status(500).send("Poster konnte nicht erstellt werden");

  }

});


// =============================
// REFERRAL LINK
// =============================
router.get("/loyalty/ref/:phone", async (req, res) => {

  try {

    const { phone } = req.params;

    if (!phone) {
      return res.status(400).send("Telefonnummer fehlt");
    }

    const card = getCustomerCard(phone);

    if (card) {
      card.points += 20;
    }

    res.send(`
<!DOCTYPE html>
<html>
<head>

<meta charset="UTF-8">
<title>Freund eingeladen</title>

<style>

body{
font-family:Arial;
background:#f7f7f7;
text-align:center;
padding:40px;
}

.box{
background:white;
padding:40px;
border-radius:20px;
max-width:420px;
margin:auto;
box-shadow:0 10px 30px rgba(0,0,0,0.1);
}

</style>

</head>

<body>

<div class="box">

<h2>🎉 Einladung erfolgreich</h2>

<p>Du hast einen Freund eingeladen.</p>

<p><b>+20 Bonuspunkte</b> wurden gutgeschrieben.</p>

<p>Dein Freund bekommt ebenfalls Punkte beim ersten Besuch.</p>

</div>

</body>
</html>
`);

  } catch (error) {

    console.error("Referral Fehler:", error);

    res.status(500).send("Referral Fehler");

  }

});


// =============================
// REFERRAL QR GENERATOR
// =============================
router.get("/loyalty/ref-qr/:phone", async (req, res) => {

  try {

    const { phone } = req.params;

    const qr = await generateCustomerQR(`ref-${phone}`);

    res.json({
      success: true,
      phone,
      qr
    });

  } catch (error) {

    console.error("Referral QR Fehler:", error);

    res.status(500).json({
      success:false
    });

  }

});


export default router;
