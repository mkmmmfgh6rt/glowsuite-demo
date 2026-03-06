import React from "react";

export default function Sidebar() {
  return (
    <div className="w-64 bg-slate-950 border-r border-white/10 p-6 flex flex-col">
      
      <div className="mb-10">
        <h2 className="text-2xl font-bold tracking-wide">A.U.R.A</h2>
        <p className="text-xs text-slate-400 mt-1">
          AI Business System
        </p>
      </div>

      <nav className="flex flex-col gap-4 text-sm">

        <a
          href="/dashboard"
          className="hover:text-purple-400 transition"
        >
          Dashboard
        </a>

        <a
          href="/aura"
          className="hover:text-purple-400 transition"
        >
          A.U.R.A Analyse
        </a>

        <a
          href="/chat"
          className="hover:text-purple-400 transition"
        >
          A.U.R.A Chat
        </a>

      </nav>

      <div className="mt-auto pt-10">
        <a
          href="/login"
          className="text-sm text-slate-400 hover:text-red-400 transition"
        >
          Logout
        </a>
      </div>

    </div>
  );
}