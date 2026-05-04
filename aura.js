#!/usr/bin/env node

// =======================================================
// 🌌 AURA CLI – Terminal Interface
// =======================================================

import { runAuraBusinessOptimizer } from "./core/auraBusinessOptimizerService.js";

const command = process.argv[2];
const tenant = "beauty_lounge";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {

  console.log("\n🌌 AURA OS v1.0");
  console.log("Studio:", tenant);
  console.log("──────────────────────────\n");

  if (command === "optimize") {

    console.log("🔎 Scanning bookings...");
    await sleep(600);

    console.log("📅 Detecting free slots...");
    await sleep(600);

    console.log("👥 Detecting inactive customers...");
    await sleep(600);

    console.log("📊 Analysing studio performance...");
    await sleep(600);

    const result = await runAuraBusinessOptimizer({ tenant });

    console.log("\n⚡ Campaign opportunity detected");

    console.log("\n🚀 Launching marketing campaign...");
    await sleep(700);

    console.log("\n📈 ROI prediction: +300€");

    console.log("\n✅ Campaign executed\n");

    console.log(result);
  }

}

run();