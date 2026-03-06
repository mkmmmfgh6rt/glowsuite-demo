"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type AuraAction = {
  type: "campaign";
  goal: string;
};

type AuraResult = {
  emoji: string;
  message: string;
  action?: AuraAction;
};

// 🔧 ZENTRAL
const API_BASE = "http://localhost:8083";
const TENANT = "beauty_lounge"; // 🔑 später aus Auth / Session

export default function AuraAnalysisPage() {
  const searchParams = useSearchParams();
  const focusFromUrl = searchParams.get("focus");

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AuraResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<any | null>(null);

  useEffect(() => {
    if (focusFromUrl) {
      startAnalysis(focusFromUrl);
    }
  }, [focusFromUrl]);

  async function startAnalysis(focus?: string) {
    setLoading(true);
    setError(null);
    setResults([]);
    setActionResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/aura/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant: TENANT,
          source: "dashboard",
          focus,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Analyse fehlgeschlagen (${res.status}): ${text}`);
      }

      const data = await res.json();

      // 🔒 defensiv
      setResults(Array.isArray(data.focusAreas) ? data.focusAreas : []);
    } catch (err: any) {
      console.error("AURA Analyse Fehler:", err);
      setError(err.message || "Analyse konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  async function runAction(action: AuraAction) {
    setActionResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/aura/campaign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant: TENANT,
          goal: action.goal,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Aktion fehlgeschlagen (${res.status}): ${text}`);
      }

      const data = await res.json();
      setActionResult(data);
    } catch (err) {
      console.error("AURA Action Fehler:", err);
      setActionResult({ error: true });
    }
  }

  return (
    <div className="p-10 text-white">
      <h1 className="text-3xl font-bold mb-6">A.U.R.A Analyse</h1>

      <button
        onClick={() => startAnalysis()}
        disabled={loading}
        className={`px-6 py-3 rounded mb-6 transition ${
          loading
            ? "bg-purple-400 cursor-not-allowed"
            : "bg-purple-600 hover:bg-purple-700"
        }`}
      >
        {loading ? "Analyse läuft..." : "Analyse starten"}
      </button>

      {loading && (
        <div className="text-purple-300 animate-pulse mb-6">
          KI analysiert deine Studio-Daten…
        </div>
      )}

      {error && <div className="text-red-400 mb-6">❌ {error}</div>}

      {results.length > 0 && (
        <div className="space-y-4 mt-4">
          {results.map((item, i) => (
            <div key={i} className="bg-gray-900 p-5 rounded shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{item.emoji}</span>
                <p className="text-gray-200">{item.message}</p>
              </div>

              {item.action && (
                <button
                  onClick={() => runAction(item.action!)}
                  className="mt-3 bg-indigo-600 px-4 py-2 rounded text-sm hover:bg-indigo-700"
                >
                  Empfehlung umsetzen
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {actionResult && !actionResult.error && (
        <div className="mt-8 bg-black/40 p-5 rounded">
          <h2 className="font-bold mb-2">✨ A.U.R.A Kampagnen-Vorschlag</h2>
          <p className="mb-1">
            <strong>Headline:</strong> {actionResult.headline}
          </p>
          <p className="mb-1">
            <strong>Kanäle:</strong>{" "}
            {actionResult.channelSuggestions?.join(", ")}
          </p>
          <p>
            <strong>Angebote:</strong>{" "}
            {actionResult.offerIdeas?.join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}