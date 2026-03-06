"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import { auraIntroMessage } from "../../components/config/auraPersona";

type Message = {
  sender: "user" | "aura";
  text: string;
};

function getSessionId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("aura_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("aura_session_id", id);
  }
  return id;
}

function AuraChatPageInner() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const focus = searchParams.get("focus");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const sessionId = useRef<string>("");
  const initialized = useRef(false);

  useEffect(() => {
    sessionId.current = getSessionId();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (source === "analysis" && focus) {
      send(
        `Ich komme aus der Analyse. Fokus ist: ${focus}. Bitte gib mir konkrete Empfehlungen.`
      );
    } else {
      setMessages([{ sender: "aura", text: auraIntroMessage }]);
    }
  }, [source, focus]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    setMessages((m) => [...m, { sender: "user", text: trimmed }]);
    setThinking(true);

    try {
      const res = await fetch("http://localhost:8083/api/aura/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          sessionId: sessionId.current,
          context: {
            source,
            focus,
          },
        }),
      });

      const data = await res.json();

      setMessages((m) => [...m, { sender: "aura", text: data.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          sender: "aura",
          text: "❌ Es gab ein technisches Problem. Bitte versuche es erneut.",
        },
      ]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col">

        {/* HEADER */}

        <div className="border-b border-white/5 px-8 py-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            AURA KI-Business-Chat
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Von Strategie → Umsetzung → Wachstum
          </p>
        </div>

        {/* CHAT */}

        <section className="flex-1 overflow-y-auto px-8 py-10 flex justify-center">
          <div className="w-full max-w-3xl space-y-6 px-8 py-10">

            {messages.map((m, i) => (
              <div
                key={i}
                className={`w-full flex ${
                  m.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[520px] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                    m.sender === "user"
                      ? "bg-purple-600 text-white"
                      : "bg-slate-800 border border-white/10"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="bg-slate-800 border border-white/10 px-4 py-2 rounded-xl text-sm text-slate-300">
                A.U.R.A schreibt …
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </section>

        {/* INPUT */}

        <div className="border-t border-white/5 px-8 py-5">
          <div className="max-w-2xl mx-auto flex gap-3">

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              className="flex-1 h-11 px-4 rounded-xl bg-slate-900 border border-white/10 text-sm focus:outline-none focus:border-purple-500"
              placeholder="Beschreib dein Problem oder sag JA …"
              disabled={thinking}
            />

            <button
              onClick={() => {
                send(input);
                setInput("");
              }}
              disabled={thinking}
              className="h-11 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 transition font-medium text-sm"
            >
              Senden
            </button>

          </div>
        </div>

      </main>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-white">Chat lädt…</div>}>
      <AuraChatPageInner />
    </Suspense>
  );
}