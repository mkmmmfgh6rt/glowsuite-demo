"use client";

import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import AuraPanel from "../../components/AuraPanel";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Fake-Daten zu Testzwecken
    setStats({
      totalRevenue: 1200,
      bookingCount: 42,
      utilizationRate: 68,
    });
  }, []);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6">A.U.R.A Dashboard</h1>

        <AuraPanel />

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-6 mt-6">

          <div className="p-6 bg-gray-800 rounded-xl">
            <p className="text-sm opacity-70">Gesamtumsatz</p>
            <p className="text-2xl font-bold">{stats?.totalRevenue} €</p>
          </div>

          <div className="p-6 bg-gray-800 rounded-xl">
            <p className="text-sm opacity-70">Buchungen</p>
            <p className="text-2xl font-bold">{stats?.bookingCount}</p>
          </div>

          <div className="p-6 bg-gray-800 rounded-xl">
            <p className="text-sm opacity-70">Auslastung</p>
            <p className="text-2xl font-bold">{stats?.utilizationRate}%</p>
          </div>

        </div>
      </main>
    </div>
  );
}
