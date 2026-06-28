"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { getMarketStatus } from "@/lib/marketHours";
import { MarketId, MARKETS, ALL_MARKET_IDS } from "@/lib/markets";

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userName?: string;
  onSignOut?: () => void;
  onRenameUser?: (name: string) => Promise<void>;
  isAdmin?: boolean;
  lastUpdated?: Date | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  selectedMarkets: MarketId[];
  onToggleMarket: (id: MarketId) => void;
}

interface TabDef {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const ICON_DASHBOARD = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);
const ICON_PORTFOLIO = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
const ICON_WATCHLIST = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const ICON_TRENDING = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);
const ICON_NEWS = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
  </svg>
);
const ICON_GOLD = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

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

function MarketStatusBadges({ marketIds, compact }: { marketIds: MarketId[]; compact?: boolean }) {
  const [statuses, setStatuses] = useState(marketIds.map((id) => getMarketStatus(id)));

  useEffect(() => {
    setStatuses(marketIds.map((id) => getMarketStatus(id)));
    const timer = setInterval(() => {
      setStatuses(marketIds.map((id) => getMarketStatus(id)));
    }, 30000);
    return () => clearInterval(timer);
  }, [marketIds]);

  if (compact) {
    const anyOpen = statuses.some((s) => s.isOpen);
    return (
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
          anyOpen ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
        }`}
        title={statuses.map((s) => `${s.flag} ${s.marketLabel}: ${s.label}`).join(" | ")}
      >
        <span className="relative flex h-2 w-2">
          {anyOpen ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-400" />
          )}
        </span>
        <span>{statuses.map((s) => s.flag).join("")}</span>
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center gap-1.5">
      {statuses.map((status) => (
        <div
          key={status.marketLabel}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
            status.isOpen ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
          title={`${status.marketLabel}: ${status.nextEvent}`}
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
          <span>{status.flag}</span>
          <span className="hidden lg:inline">{status.isOpen ? "Open" : "Closed"}</span>
        </div>
      ))}
    </div>
  );
}

function MarketSelector({
  selectedMarkets,
  onToggle,
}: {
  selectedMarkets: MarketId[];
  onToggle: (id: MarketId) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700"
        title="Select markets"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="hidden sm:inline">Markets</span>
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2 w-48 z-50">
          <p className="text-xs text-gray-500 px-2 pb-1.5 font-medium">Select Markets</p>
          {ALL_MARKET_IDS.map((id) => {
            const m = MARKETS[id];
            const checked = selectedMarkets.includes(id);
            return (
              <button
                key={id}
                onClick={() => onToggle(id)}
                className={`flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-sm transition-colors ${
                  checked ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  checked ? "bg-blue-600 border-blue-600" : "border-gray-300"
                }`}>
                  {checked && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-lg leading-none">{m.flag}</span>
                <span className="font-medium">{m.label}</span>
                <span className="text-xs text-gray-400 ml-auto">{m.currency}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getTabColor(tabId: string): string {
  switch (tabId) {
    case "trending": return "orange";
    case "news": return "indigo";
    case "gold": return "amber";
    default: return "blue";
  }
}

export default function Navbar({
  activeTab,
  onTabChange,
  userName,
  onSignOut,
  onRenameUser,
  isAdmin,
  lastUpdated,
  onRefresh,
  isRefreshing,
  selectedMarkets,
  onToggleMarket,
}: NavbarProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setNameInput(userName || "");
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.select(), 0);
  }

  async function commitEdit() {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === userName) { setEditingName(false); return; }
    await onRenameUser?.(trimmed);
    setEditingName(false);
  }
  const tabs: TabDef[] = useMemo(() => [
    { id: "dashboard", label: "Dashboard", icon: ICON_DASHBOARD },
    { id: "portfolio", label: "Stocks", icon: ICON_PORTFOLIO },
    { id: "watchlist", label: "Watch", icon: ICON_WATCHLIST },
    { id: "trending", label: "Trending", icon: ICON_TRENDING },
    { id: "news", label: "News", icon: ICON_NEWS },
    { id: "gold", label: "Gold", icon: ICON_GOLD },
  ], []);

  const activeColor = getTabColor(activeTab);

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
              <h1 className="text-lg md:text-xl font-bold text-gray-900 hidden sm:block">BorsaFibo</h1>
            </div>

            {/* Desktop Tabs */}
            <nav className="hidden md:flex gap-0.5">
              {tabs.map((tab) => {
                const color = getTabColor(tab.id);
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? `bg-${color}-50 text-${color}-700`
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                    style={isActive ? {
                      backgroundColor: color === "blue" ? "#eff6ff" : color === "orange" ? "#fff7ed" : color === "indigo" ? "#eef2ff" : color === "amber" ? "#fffbeb" : "#eff6ff",
                      color: color === "blue" ? "#1d4ed8" : color === "orange" ? "#c2410c" : color === "indigo" ? "#4338ca" : color === "amber" ? "#b45309" : "#1d4ed8",
                    } : undefined}
                  >
                    {tab.icon}
                    <span className="hidden lg:inline">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <MarketSelector selectedMarkets={selectedMarkets} onToggle={onToggleMarket} />

              <div className="md:hidden">
                <MarketStatusBadges marketIds={selectedMarkets} compact />
              </div>
              <MarketStatusBadges marketIds={selectedMarkets} />

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
                  {editingName ? (
                    <input
                      ref={nameInputRef}
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingName(false); }}
                      className="hidden lg:inline w-32 px-2 py-1 text-sm border-2 border-blue-400 rounded-lg focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={onRenameUser ? startEdit : undefined}
                      title={onRenameUser ? "Click to rename" : undefined}
                      className={`text-sm font-medium text-gray-700 hidden lg:inline ${onRenameUser ? "hover:text-blue-600 cursor-pointer" : "cursor-default"}`}
                    >
                      {userName}
                    </button>
                  )}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="px-2.5 md:px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors hidden lg:inline-flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Admin
                    </Link>
                  )}
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
          {tabs.map((tab) => {
            const color = getTabColor(tab.id);
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex-1 flex flex-col items-center justify-center py-2 pb-3 text-[10px] font-medium transition-colors"
                style={{
                  color: isActive
                    ? color === "blue" ? "#2563eb" : color === "orange" ? "#ea580c" : color === "indigo" ? "#4f46e5" : color === "amber" ? "#d97706" : "#2563eb"
                    : "#9ca3af",
                }}
              >
                <div
                  className="p-1 rounded-lg"
                  style={isActive ? {
                    backgroundColor: color === "blue" ? "#eff6ff" : color === "orange" ? "#fff7ed" : color === "indigo" ? "#eef2ff" : color === "amber" ? "#fffbeb" : "#eff6ff",
                  } : undefined}
                >
                  {tab.icon}
                </div>
                <span className="mt-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
