// =======================================================
// 🧠 serviceFinder.js – Smarte Service-Erkennung (Variante 2)
// - Nutzt einfache, aber starke Ähnlichkeitslogik
// - Arbeitet mit Name + Beschreibung der Services
// =======================================================

function normalize(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")                    // Umlaute trennen
    .replace(/[\u0300-\u036f]/g, "")    // Akzent-Reste entfernen
    .replace(/[^a-z0-9äöüß\s]/g, " ")   // Sonderzeichen raus
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

// Einfacher Levenshtein für kurze Wörter
function levenshtein(a, b) {
  a = normalize(a);
  b = normalize(b);
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // löschen
        dp[i][j - 1] + 1,      // einfügen
        dp[i - 1][j - 1] + cost // ersetzen
      );
    }
  }
  return dp[m][n];
}

function editSimilarity(a, b) {
  const dist = levenshtein(a, b);
  const maxLen = Math.max(normalize(a).length, normalize(b).length) || 1;
  const sim = 1 - dist / maxLen;
  return sim < 0 ? 0 : sim;
}

// Haupt-Similarity-Funktion
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

  // Gewichtung: Jaccard + Edit
  const combined = 0.5 * jac + 0.5 * bestEdit;
  return combined;
}

// =======================================================
// 🔎 findBestServices(query, index, options)
// - index: { serviceName: "Name + Beschreibung" }
// - options: { maxResults, minScore }
// =======================================================
export function findBestServices(query, index, options = {}) {
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
