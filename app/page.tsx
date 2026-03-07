"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Dashboard from "@/components/Dashboard";
import Portfolio from "@/components/Portfolio";
import Watchlist from "@/components/Watchlist";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "portfolio" && <Portfolio />}
        {activeTab === "watchlist" && <Watchlist />}
      </main>

      <footer className="text-center py-6 text-sm text-gray-400 border-t border-gray-200 mt-8">
        <p>
          Stock data provided by Yahoo Finance. Prices may be delayed.
        </p>
        <p className="mt-1">
          This is not financial advice. Always do your own research before investing.
        </p>
      </footer>
    </div>
  );
}
