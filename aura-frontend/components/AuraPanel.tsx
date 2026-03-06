"use client";

import { useState } from "react";

type Recommendation = {
  emoji: string;
  message: string;
};

export default function AuraPanel() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadAura() {
    if (loading) return;

    setLoading(true);

    try {
      // 🔒 MOCK-Analyse (Backend / KI folgt später)
      await new Promise((r) => setTimeout(r, 800));

      setRecommendations([
        {
          emoji: "💡",
          message: "Optimiere deine Randzeiten mit speziellen Einstiegsangeboten.",
        },
        {
          emoji: "📈",
          message: "Erhöhe den Durchschnittsbon durch klar strukturierte Service-Pakete.",
        },
        {
          emoji: "🔥",
          message: "Reels mit Vorher/Nachher erzielen aktuell die höchste Terminrate.",
        },
      ]);
    } catch (error) {
      console.error("A.U.R.A Analyse fehlgeschlagen", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-800 p-6 rounded-xl mb-6 border border-purple-500/20">
      <h2 className="text-xl font-bold mb-4">A.U.R.A Empfehlungen</h2>

      <button
        onClick={loadAura}
        disabled={loading}
        className="bg-purple-600 px-5 py-2 rounded hover:bg-purple-700 font-semibold mb-5 disabled:opacity-50"
      >
        {loading ? "Analyse läuft …" : "Analyse starten"}
      </button>

      {recommendations.length > 0 && (
        <div className="space-y-3">
          {recommendations.map((item, i) => (
            <div
              key={i}
              className="bg-gray-700 p-4 rounded-lg flex items-start gap-3"
            >
              <span className="text-xl">{item.emoji}</span>
              <span>{item.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}