"use client";

import { useState, useEffect } from "react";
import { getMarketStatus } from "@/lib/marketHours";

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userEmail?: string;
  onSignOut?: () => void;
  lastUpdated?: Date | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const TABS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: "portfolio",
    label: "My Stocks",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: "watchlist",
    label: "Watchlist",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
  {
    id: "trending",
    label: "Trending",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
];

function TimeAgo({ date }: { date: Date }) {
  const [text, setText] = useState("");

  useEffect(() => {
    function update() {
      const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
      if (seconds < 5) setText("just now");
      else if (seconds < 60) setText(`${seconds}s ago`);
      else setText(`${Math.floor(seconds / 60)}m ago`);
    }
    update();
    const timer = setInterval(update, 5000);
    return () => clearInterval(timer);
  }, [date]);

  return <span>{text}</span>;
}

function MarketStatusBadge() {
  const [status, setStatus] = useState(getMarketStatus());

  useEffect(() => {
    const timer = setInterval(() => {
      setStatus(getMarketStatus());
    }, 30000); // update every 30s
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
        status.isOpen
          ? "bg-green-50 text-green-700"
          : "bg-gray-100 text-gray-500"
      }`}
      title={status.nextEvent}
    >
      <span className="relative flex h-2 w-2">
        {status.isOpen ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-400" />
        )}
      </span>
      <span>{status.isOpen ? "Market Open" : "Market Closed"}</span>
      <span className="text-gray-400 hidden lg:inline">&middot; {status.nextEvent}</span>
    </div>
  );
}

export default function Navbar({
  activeTab,
  onTabChange,
  userEmail,
  onSignOut,
  lastUpdated,
  onRefresh,
  isRefreshing,
}: NavbarProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">My Stock Tracker</h1>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? tab.id === "trending"
                      ? "bg-orange-50 text-orange-700"
                      : "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Right side: Market Status + Live indicator + User */}
          <div className="flex items-center gap-3">
            {/* Market Status */}
            <MarketStatusBadge />

            {/* Live update indicator */}
            {lastUpdated && (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
                  title="Click to refresh prices now"
                >
                  {isRefreshing ? (
                    <>
                      <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <TimeAgo date={lastUpdated} />
                    </>
                  )}
                </button>
              </div>
            )}

            {userEmail && (
              <>
                <span className="text-sm text-gray-500 hidden lg:inline">
                  {userEmail}
                </span>
                <button
                  onClick={onSignOut}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
