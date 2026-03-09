"use client";

import { useState, useEffect } from "react";
import { StockQuote } from "@/lib/types";

interface NewsArticle {
  title: string;
  description: string | null;
  publisher: string;
  link: string;
  publishedAt: string | null;
  sentiment: "positive" | "negative" | "neutral";
  source: string;
  sourceLabel: string;
  relatedSymbols: string[];
}

interface NewsResponse {
  articles: NewsArticle[];
  summary: {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    overallSentiment: string;
  };
  availableSources: { id: string; label: string }[];
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function sentimentDotColor(sentiment: string): string {
  switch (sentiment) {
    case "positive":
      return "bg-green-500";
    case "negative":
      return "bg-red-500";
    default:
      return "bg-gray-400";
  }
}

export default function NewsFeed() {
  const [data, setData] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeSource, setActiveSource] = useState("all");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");

  // Expand/collapse
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  // Cached stock quotes across articles
  const [symbolQuotes, setSymbolQuotes] = useState<
    Record<string, StockQuote | null>
  >({});
  const [quotesLoading, setQuotesLoading] = useState<
    Record<number, boolean>
  >({});

  useEffect(() => {
    async function fetchNews() {
      setLoading(true);
      setError(false);
      try {
        const params =
          activeSource !== "all"
            ? `?source=${activeSource}&t=${Date.now()}`
            : `?t=${Date.now()}`;
        const res = await fetch(`/api/news/market${params}`);
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        setData(json);
      } catch {
        setError(true);
      }
      setLoading(false);
    }
    fetchNews();
    // Reset expand when source changes
    setExpandedIndex(null);
  }, [activeSource]);

  // Client-side sentiment filter
  const filteredArticles =
    data?.articles.filter((a) => {
      if (sentimentFilter === "all") return true;
      return a.sentiment === sentimentFilter;
    }) || [];

  // Fetch quotes for related symbols when expanding an article
  async function handleArticleClick(index: number, symbols: string[]) {
    if (expandedIndex === index) {
      setExpandedIndex(null);
      return;
    }
    setExpandedIndex(index);

    // Find which symbols need fetching
    const toFetch = symbols.filter((s) => !(s in symbolQuotes));
    if (toFetch.length > 0) {
      setQuotesLoading((prev) => ({ ...prev, [index]: true }));
      try {
        const res = await fetch(
          `/api/quote?symbol=${toFetch.join(",")}&t=${Date.now()}`
        );
        const quoteData = await res.json();
        setSymbolQuotes((prev) => {
          const updated = { ...prev };
          for (const sym of toFetch) {
            updated[sym] =
              quoteData[sym] && !quoteData[sym].error
                ? quoteData[sym]
                : null;
          }
          return updated;
        });
      } catch {
        // Quotes unavailable
      }
      setQuotesLoading((prev) => ({ ...prev, [index]: false }));
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Loading stock news...</p>
        <p className="text-sm text-gray-400 mt-1">
          Scanning multiple sources for stock-related articles
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📰</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          News temporarily unavailable
        </h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Could not load news. Please try again later.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>📰</span> Stock News
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          News mentioning specific stocks. Tap to see related tickers &amp;
          prices.
        </p>
      </div>

      {/* Sentiment Summary Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-3 md:p-4">
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500" />
            <span className="text-xs md:text-sm font-medium text-green-700">
              {data.summary.positive} Positive
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500" />
            <span className="text-xs md:text-sm font-medium text-red-700">
              {data.summary.negative} Negative
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-gray-400" />
            <span className="text-xs md:text-sm font-medium text-gray-500">
              {data.summary.neutral} Neutral
            </span>
          </div>
          <div
            className={`ml-0 mt-1 w-full text-center md:ml-auto md:mt-0 md:w-auto md:text-left px-3 py-1 rounded-full text-xs font-bold ${
              data.summary.overallSentiment === "positive"
                ? "bg-green-100 text-green-700"
                : data.summary.overallSentiment === "negative"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-600"
            }`}
          >
            Market Mood:{" "}
            {data.summary.overallSentiment === "positive"
              ? "Bullish"
              : data.summary.overallSentiment === "negative"
                ? "Bearish"
                : "Mixed"}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2 md:space-y-0 md:flex md:flex-wrap md:gap-3">
        {/* Source filter */}
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          <button
            onClick={() => setActiveSource("all")}
            className={`px-2.5 md:px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activeSource === "all"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            All ({data.summary.total})
          </button>
          {data.availableSources.map((src) => (
            <button
              key={src.id}
              onClick={() => setActiveSource(src.id)}
              className={`px-2.5 md:px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeSource === src.id
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {src.label}
            </button>
          ))}
        </div>

        {/* Sentiment filter */}
        <div className="flex gap-1.5 md:gap-2 ml-0 md:ml-auto">
          {[
            { id: "all", label: "All" },
            { id: "positive", label: "Bullish" },
            { id: "negative", label: "Bearish" },
            { id: "neutral", label: "Neutral" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSentimentFilter(f.id)}
              className={`px-2.5 md:px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                sentimentFilter === f.id
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Articles list */}
      {filteredArticles.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">No stock-related articles match your filters.</p>
          <p className="text-sm mt-1">
            Try changing the source or sentiment filter.
          </p>
        </div>
      ) : (
        <div className="space-y-2 md:space-y-3">
          {filteredArticles.map((article, i) => {
            const isExpanded = expandedIndex === i;
            const isLoadingQuotes = quotesLoading[i];

            return (
              <div
                key={`${article.source}-${i}`}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-colors"
              >
                {/* Collapsed header — always visible */}
                <button
                  onClick={() =>
                    handleArticleClick(i, article.relatedSymbols)
                  }
                  className="w-full p-3 md:p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-start gap-2.5 md:gap-3">
                    {/* Sentiment dot */}
                    <div className="mt-1.5 flex-shrink-0">
                      <span
                        className={`block w-2.5 h-2.5 rounded-full ${sentimentDotColor(
                          article.sentiment
                        )}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <p className="text-sm font-medium text-gray-900 leading-snug">
                        {article.title}
                      </p>

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-2">
                        {/* Source badge — shows actual publisher, not API */}
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                          {article.sourceLabel}
                        </span>

                        {article.publishedAt && (
                          <span className="text-xs text-gray-400">
                            {timeAgo(article.publishedAt)}
                          </span>
                        )}

                        {/* Related tickers pills */}
                        <div className="flex gap-1 ml-0 md:ml-auto">
                          {article.relatedSymbols.slice(0, 3).map((sym) => (
                            <span
                              key={sym}
                              className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold"
                            >
                              {sym}
                            </span>
                          ))}
                          {article.relatedSymbols.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{article.relatedSymbols.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expand chevron */}
                    <svg
                      className={`w-4 h-4 md:w-5 md:h-5 text-gray-400 flex-shrink-0 mt-1 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-3 md:px-4 pb-3 md:pb-4 border-t border-gray-100 bg-gray-50">
                    {/* Description */}
                    {article.description && (
                      <p className="text-sm text-gray-600 mt-3 leading-relaxed line-clamp-3">
                        {article.description}
                      </p>
                    )}

                    {/* Related Stocks with status bars */}
                    <div className="mt-3 space-y-1.5 md:space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Stocks Mentioned
                      </p>

                      {isLoadingQuotes ? (
                        <div className="flex items-center gap-2 py-2 text-gray-400 text-sm">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          Loading stock data...
                        </div>
                      ) : (
                        article.relatedSymbols.map((sym) => {
                          const quote = symbolQuotes[sym];
                          return (
                            <div
                              key={sym}
                              className="flex items-center justify-between bg-white rounded-lg p-2.5 md:p-3 border border-gray-200"
                            >
                              <span className="font-bold text-gray-900 text-sm">
                                {sym}
                              </span>
                              {quote ? (
                                <div className="flex items-center gap-2 md:gap-4">
                                  <span className="font-medium text-gray-900 text-sm">
                                    ${quote.currentPrice.toFixed(2)}
                                  </span>
                                  <span
                                    className={`text-xs md:text-sm font-semibold px-2 py-0.5 rounded ${
                                      quote.changePercent >= 0
                                        ? "bg-green-50 text-green-700"
                                        : "bg-red-50 text-red-700"
                                    }`}
                                  >
                                    {quote.changePercent >= 0 ? "+" : ""}
                                    {quote.changePercent.toFixed(2)}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  unavailable
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Read Full Article button */}
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 md:mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Read Full Article
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <p className="text-xs text-gray-400 text-center">
        Showing {filteredArticles.length} stock-related articles. Sentiment is
        analyzed by keyword matching — not financial advice.
      </p>
    </div>
  );
}
