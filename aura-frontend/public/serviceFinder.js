// =======================================================
// 🧠 serviceFinder.js – Hybrid Service Matching
// - Lokales Matching (Jaccard + Levenshtein)
// - Fallback: KI API /api/service-match
// =======================================================

// =======================================================
// 🧠 serviceFinder.js – Hybrid Service Matching
// =======================================================

// 🔥 SERVICES AUS BACKEND LADEN
let SERVICE_INDEX = null;

async function loadServicesFromBackend() {
  try {
    const res = await fetch("/api/services");
    const data = await res.json();

    const index = {};

    for (const s of data) {
      index[s.name] = s.name + " " + (s.description || "");
    }

    SERVICE_INDEX = index;

  } catch (err) {
    console.error("❌ Services laden fehlgeschlagen:", err);
    SERVICE_INDEX = {};
  }
}

function normalize(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9äöüß\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(str) {
  return normalize(str).split(" ").filter(Boolean);
}

function jaccard(tokensA, tokensB) {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter++;
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

function levenshtein(a, b) {
  a = normalize(a);
  b = normalize(b);

  const m = a.length;
  const n = b.length;

  if (!m) return n;
  if (!n) return m;

  const dp = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

function editSimilarity(a, b) {
  const dist = levenshtein(a, b);
  const maxLen =
    Math.max(normalize(a).length, normalize(b).length) || 1;

  const sim = 1 - dist / maxLen;
  return sim < 0 ? 0 : sim;
}

function computeSimilarity(query, target) {
  const qNorm = normalize(query);
  const tNorm = normalize(target);

  if (!qNorm || !tNorm) return 0;

  if (qNorm === tNorm) return 1;

  if (tNorm.includes(qNorm) || qNorm.includes(tNorm)) {
    return 0.9;
  }

  const qTokens = tokenize(query);
  const tTokens = tokenize(target);

  const jac = jaccard(qTokens, tTokens);

  let bestEdit = 0;

  for (const qt of qTokens) {
    for (const tt of tTokens) {
      const sim = editSimilarity(qt, tt);
      if (sim > bestEdit) bestEdit = sim;
    }
  }

  return 0.5 * jac + 0.5 * bestEdit;
}

// =======================================================
// 🔎 LOKALES MATCHING
// =======================================================

function findBestServicesLocal(query, index, options = {}) {

  const { maxResults = 3, minScore = 0.35 } = options;

  const results = [];

  for (const [key, text] of Object.entries(index || {})) {

    const score = computeSimilarity(query, text);

    if (score >= minScore) {
      results.push({ key, text, score });
    }
  }

  results.sort((a, b) => b.score - a.score);

  return results.slice(0, maxResults);
}

// =======================================================
// 🤖 KI FALLBACK
// =======================================================

async function findServiceAI(query) {

  try {

    const res = await fetch("/api/service-match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: query })
    });

    const data = await res.json();

    if (data?.service) {
      return [{ key: data.service, score: 1 }];
    }

  } catch (err) {
    console.warn("AI Service Match fehlgeschlagen:", err);
  }

  return [];
}

// =======================================================
// 🚀 HAUPTFUNKTION (JETZT FIX)
// =======================================================

export async function findBestServices(query, index, options = {}) {

  // 🔥 einmal laden
  if (!SERVICE_INDEX) {
    await loadServicesFromBackend();
  }

  const localResults = findBestServicesLocal(query, SERVICE_INDEX, options);

  if (localResults.length > 0 && localResults[0].score > 0.55) {
    return localResults;
  }

  const aiResults = await findServiceAI(query);

  if (aiResults.length) {
    return aiResults;
  }

  return localResults;
}
