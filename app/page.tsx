"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useProfile } from "@/hooks/useProfile";
import { useMarketSelection } from "@/hooks/useMarketSelection";
import AuthForm from "@/components/AuthForm";
import ProfileSetup from "@/components/ProfileSetup";
import Navbar from "@/components/Navbar";
import Dashboard from "@/components/Dashboard";
import Portfolio from "@/components/Portfolio";
import Watchlist from "@/components/Watchlist";
import Trending from "@/components/Trending";
import NewsFeed from "@/components/NewsFeed";
import GoldPrices from "@/components/GoldPrices";
import { useToast } from "@/lib/toast";

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { selectedMarket, selectedMarkets, selectMarket, toggleMarket, isEgyptSelected } = useMarketSelection();

  const {
    displayName,
    hasProfile,
    isAdmin,
    loading: profileLoading,
    createProfile,
    updateProfile,
  } = useProfile(user?.id);

  const {
    stocks: portfolioStocks,
    quotes: portfolioQuotes,
    loading: portfolioLoading,
    quotesLoading,
    lastUpdated: portfolioLastUpdated,
    addStock: addPortfolioStock,
    updateStock: updatePortfolioStock,
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

  const myPortfolioStocks = useMemo(
    () => portfolioStocks.filter((s) => s.userId === user?.id),
    [portfolioStocks, user?.id]
  );

  function handleTabChange(tab: string) {
    // Auto-switch to EGX when opening Gold tab (gold prices are EGP-based)
    if (tab === "gold" && selectedMarket !== "EGX") {
      selectMarket("EGX");
    }
    setActiveTab(tab);
  }

  const [autoCreating, setAutoCreating] = useState(false);
  useEffect(() => {
    if (user && !profileLoading && !hasProfile && !autoCreating) {
      const metaName = user.user_metadata?.display_name;
      if (metaName) {
        setAutoCreating(true);
        createProfile(metaName).finally(() => setAutoCreating(false));
      }
    }
  }, [user, profileLoading, hasProfile, autoCreating, createProfile]);

  const lastUpdated =
    portfolioLastUpdated && watchlistLastUpdated
      ? new Date(
          Math.max(
            portfolioLastUpdated.getTime(),
            watchlistLastUpdated.getTime()
          )
        )
      : portfolioLastUpdated || watchlistLastUpdated;

  async function handleRenameUser(name: string) {
    try {
      await updateProfile(name);
      showToast("Name updated", "success");
    } catch {
      showToast("Couldn't update name — please try again", "error");
    }
  }

  function handleRefresh() {
    refreshPortfolioQuotes();
    refreshWatchlistQuotes();
  }

  async function handleAddTrendingToWatchlist(stock: {
    symbol: string;
    name: string;
  }) {
    try {
      await addWatchlistStock({ symbol: stock.symbol, name: stock.name });
      showToast(`${stock.symbol} added to watchlist`, "success");
    } catch {
      showToast(`Couldn't add ${stock.symbol} — please try again`, "error");
    }
  }

  async function handleAddPortfolioStock(stock: Parameters<typeof addPortfolioStock>[0]) {
    try {
      await addPortfolioStock(stock);
      showToast(`${stock.symbol} added to portfolio`, "success");
    } catch {
      showToast(`Couldn't add ${stock.symbol} — please try again`, "error");
    }
  }

  async function handleUpdatePortfolioStock(...args: Parameters<typeof updatePortfolioStock>) {
    try {
      await updatePortfolioStock(...args);
      showToast("Stock updated", "success");
    } catch {
      showToast("Update failed — please try again", "error");
    }
  }

  async function handleRemovePortfolioStock(id: string) {
    try {
      await removePortfolioStock(id);
      showToast("Removed from portfolio", "success");
    } catch {
      showToast("Couldn't remove — please try again", "error");
    }
  }

  async function handleAddWatchlistStock(stock: Parameters<typeof addWatchlistStock>[0]) {
    try {
      await addWatchlistStock(stock);
      showToast(`${stock.symbol} added to watchlist`, "success");
    } catch {
      showToast(`Couldn't add ${stock.symbol} — please try again`, "error");
    }
  }

  async function handleRemoveWatchlistStock(id: string) {
    try {
      await removeWatchlistStock(id);
      showToast("Removed from watchlist", "success");
    } catch {
      showToast("Couldn't remove — please try again", "error");
    }
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

  if (profileLoading || autoCreating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!hasProfile) {
    return <ProfileSetup onComplete={createProfile} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        userName={displayName || user.email}
        onRenameUser={handleRenameUser}
        onSignOut={signOut}
        isAdmin={isAdmin}
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        isRefreshing={quotesLoading}
        selectedMarkets={selectedMarkets}
        selectedMarket={selectedMarket}
        onToggleMarket={toggleMarket}
        onSelectMarket={selectMarket}
      />

      <main className="max-w-6xl mx-auto px-3 md:px-4 py-4 md:py-6 pb-24 md:pb-6">
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
            stocks={myPortfolioStocks}
            allStocks={portfolioStocks}
            quotes={portfolioQuotes}
            loading={portfolioLoading}
            quotesLoading={quotesLoading}
            onAdd={handleAddPortfolioStock}
            onUpdate={handleUpdatePortfolioStock}
            onRemove={handleRemovePortfolioStock}
          />
        )}
        {activeTab === "watchlist" && (
          <Watchlist
            stocks={watchlistStocks}
            quotes={watchlistQuotes}
            loading={watchlistLoading}
            selectedMarket={selectedMarket}
            onAdd={handleAddWatchlistStock}
            onRemove={handleRemoveWatchlistStock}
          />
        )}
        {activeTab === "news" && <NewsFeed selectedMarkets={selectedMarkets} />}
        {activeTab === "trending" && (
          <Trending
            onAddToWatchlist={handleAddTrendingToWatchlist}
            selectedMarkets={selectedMarkets}
            watchlistSymbols={watchlistStocks.map((s) => s.symbol)}
          />
        )}
        {activeTab === "gold" && <GoldPrices />}
      </main>

      <footer className="text-center py-6 text-sm text-gray-400 border-t border-gray-200 mt-8 mb-20 md:mb-0">
        <p>
          Stock data from Yahoo Finance &amp; Finnhub. Prices refresh every 30
          seconds during market hours.
        </p>
        <p className="mt-1">
          This is not financial advice. Always do your own research before
          investing.
        </p>
      </footer>
    </div>
  );
}
