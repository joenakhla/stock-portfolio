"use client";

import { useState, useEffect } from "react";
import { getMarketStatus } from "@/lib/marketHours";

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userName?: string;
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
    label: "Stocks",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: "watchlist",
    label: "Watch",
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
  {
    id: "news",
    label: "News",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
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

function MarketStatusBadge({ compact }: { compact?: boolean }) {
  const [status, setStatus] = useState(getMarketStatus());

  useEffect(() => {
    const timer = setInterval(() => {
      setStatus(getMarketStatus());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  if (compact) {
    return (
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
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
        <span>{status.isOpen ? "Open" : "Closed"}</span>
      </div>
    );
  }

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
  userName,
  onSignOut,
  lastUpdated,
  onRefresh,
  isRefreshing,
}: NavbarProps) {
  return (
    <>
      {/* ===== TOP BAR ===== */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 md:px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <svg className="w-7 h-7 md:w-8 md:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <h1 className="text-lg md:text-xl font-bold text-gray-900 hidden sm:block">My Stock Tracker</h1>
            </div>

            {/* Desktop Tabs — hidden on mobile (shown in bottom bar instead) */}
            <nav className="hidden md:flex gap-0.5">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? tab.id === "trending"
                        ? "bg-orange-50 text-orange-700"
                        : tab.id === "news"
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {tab.icon}
                  <span className="hidden lg:inline">{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Mobile: compact market status */}
              <div className="md:hidden">
                <MarketStatusBadge compact />
              </div>
              {/* Desktop: full market status */}
              <MarketStatusBadge />

              {/* Refresh button — desktop only */}
              {lastUpdated && (
                <div className="hidden lg:flex items-center">
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

              {userName && (
                <>
                  <span className="text-sm font-medium text-gray-700 hidden lg:inline">
                    {userName}
                  </span>
                  <button
                    onClick={onSignOut}
                    className="px-2.5 md:px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== MOBILE BOTTOM TAB BAR ===== */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
        <div className="flex items-stretch">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 pb-3 text-[10px] font-medium transition-colors ${
                activeTab === tab.id
                  ? tab.id === "trending"
                    ? "text-orange-600"
                    : tab.id === "news"
                      ? "text-indigo-600"
                      : "text-blue-600"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`p-1 rounded-lg ${
                  activeTab === tab.id
                    ? tab.id === "trending"
                      ? "bg-orange-50"
                      : tab.id === "news"
                        ? "bg-indigo-50"
                        : "bg-blue-50"
                    : ""
                }`}
              >
                {tab.icon}
              </div>
              <span className="mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
