"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useWatchlist } from "@/hooks/useWatchlist";
import AuthForm from "@/components/AuthForm";
import Navbar from "@/components/Navbar";
import Dashboard from "@/components/Dashboard";
import Portfolio from "@/components/Portfolio";
import Watchlist from "@/components/Watchlist";

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  const {
    stocks: portfolioStocks,
    quotes: portfolioQuotes,
    loading: portfolioLoading,
    quotesLoading,
    lastUpdated: portfolioLastUpdated,
    addStock: addPortfolioStock,
    removeStock: removePortfolioStock,
    refreshQuotes: refreshPortfolioQuotes,
  } = usePortfolio(user?.id);

  const {
    stocks: watchlistStocks,
    quotes: watchlistQuotes,
    loading: watchlistLoading,
    lastUpdated: watchlistLastUpdated,
    addStock: addWatchlistStock,
    removeStock: removeWatchlistStock,
    refreshQuotes: refreshWatchlistQuotes,
  } = useWatchlist(user?.id);

  // Use the most recent update time from either hook
  const lastUpdated = portfolioLastUpdated && watchlistLastUpdated
    ? new Date(Math.max(portfolioLastUpdated.getTime(), watchlistLastUpdated.getTime()))
    : portfolioLastUpdated || watchlistLastUpdated;

  function handleRefresh() {
    refreshPortfolioQuotes();
    refreshWatchlistQuotes();
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userEmail={user.email}
        onSignOut={signOut}
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        isRefreshing={quotesLoading}
      />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === "dashboard" && (
          <Dashboard
            stocks={portfolioStocks}
            quotes={portfolioQuotes}
            loading={portfolioLoading}
            quotesLoading={quotesLoading}
          />
        )}
        {activeTab === "portfolio" && (
          <Portfolio
            stocks={portfolioStocks}
            quotes={portfolioQuotes}
            loading={portfolioLoading}
            quotesLoading={quotesLoading}
            onAdd={addPortfolioStock}
            onRemove={removePortfolioStock}
          />
        )}
        {activeTab === "watchlist" && (
          <Watchlist
            stocks={watchlistStocks}
            quotes={watchlistQuotes}
            loading={watchlistLoading}
            onAdd={addWatchlistStock}
            onRemove={removeWatchlistStock}
          />
        )}
      </main>

      <footer className="text-center py-6 text-sm text-gray-400 border-t border-gray-200 mt-8">
        <p>Stock data from Yahoo Finance. Prices refresh every 30 seconds.</p>
        <p className="mt-1">
          This is not financial advice. Always do your own research before investing.
        </p>
      </footer>
    </div>
  );
}
