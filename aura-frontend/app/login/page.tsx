"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const router = useRouter();

  function handleLogin() {
    if (password === "1234") {
      localStorage.setItem("loggedIn", "true");
      router.push("/dashboard");
    } else {
      alert("Falsches Passwort!");
    }
  }

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-10 rounded-xl shadow-xl w-80">
        <h1 className="text-2xl font-bold mb-6 text-center">A.U.R.A Login</h1>

        <input
          type="password"
          placeholder="Passwort eingeben"
          className="w-full p-2 rounded bg-gray-700 mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full p-2 rounded bg-purple-600 hover:bg-purple-700 transition font-bold"
        >
          Login
        </button>
      </div>
    </div>
  );
}
