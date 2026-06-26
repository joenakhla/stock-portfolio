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

export default function Home() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { selectedMarkets, toggleMarket, isEgyptSelected } = useMarketSelection();

  const {
    displayName,
    hasProfile,
    loading: profileLoading,
    createProfile,
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
    // Auto-enable Egypt market when navigating to Gold tab
    if (tab === "gold" && !isEgyptSelected) {
      toggleMarket("EGX");
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

  function handleRefresh() {
    refreshPortfolioQuotes();
    refreshWatchlistQuotes();
  }

  function handleAddTrendingToWatchlist(stock: {
    symbol: string;
    name: string;
  }) {
    addWatchlistStock({ symbol: stock.symbol, name: stock.name });
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
        onSignOut={signOut}
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        isRefreshing={quotesLoading}
        selectedMarkets={selectedMarkets}
        onToggleMarket={toggleMarket}
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
            quotes={portfolioQuotes}
            loading={portfolioLoading}
            quotesLoading={quotesLoading}
            onAdd={addPortfolioStock}
            onUpdate={updatePortfolioStock}
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
