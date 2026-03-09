"use client";

import { useState, useEffect } from "react";

interface NewsArticle {
  title: string;
  publisher: string;
  link: string;
  publishedAt: string | null;
  sentiment: "positive" | "negative" | "neutral";
  source: string;
  sourceLabel: string;
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

function sourceBadgeColor(source: string): string {
  switch (source) {
    case "finnhub":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "marketwatch":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "cnbc":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "reuters":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "yahoo":
      return "bg-purple-100 text-purple-700 border-purple-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function sentimentColor(sentiment: string): string {
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

  useEffect(() => {
    async function fetchNews() {
      setLoading(true);
      setError(false);
      try {
        const params = activeSource !== "all" ? `?source=${activeSource}&t=${Date.now()}` : `?t=${Date.now()}`;
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
  }, [activeSource]);

  // Client-side sentiment filter
  const filteredArticles =
    data?.articles.filter((a) => {
      if (sentimentFilter === "all") return true;
      return a.sentiment === sentimentFilter;
    }) || [];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-16">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            Loading market news from multiple sources...
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Fetching from Finnhub, MarketWatch, CNBC &amp; more
          </p>
        </div>
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
          Could not load news from our sources. Please try again later.
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span>📰</span> Market News
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Latest financial news from multiple trusted sources, with sentiment
          analysis.
        </p>
      </div>

      {/* Sentiment Summary Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-green-700">
              {data.summary.positive} Positive
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm font-medium text-red-700">
              {data.summary.negative} Negative
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="text-sm font-medium text-gray-500">
              {data.summary.neutral} Neutral
            </span>
          </div>
          <div
            className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${
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

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3">
        {/* Source filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSource("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activeSource === "all"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            All Sources ({data.summary.total})
          </button>
          {data.availableSources.map((src) => (
            <button
              key={src.id}
              onClick={() => setActiveSource(src.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeSource === src.id
                  ? "bg-gray-900 text-white border-gray-900"
                  : `${sourceBadgeColor(src.id)} hover:opacity-80`
              }`}
            >
              {src.label}
            </button>
          ))}
        </div>

        {/* Sentiment filter */}
        <div className="flex gap-2 ml-auto">
          {[
            { id: "all", label: "All" },
            { id: "positive", label: "Bullish" },
            { id: "negative", label: "Bearish" },
            { id: "neutral", label: "Neutral" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSentimentFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
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
          <p className="text-lg">No articles match your filters.</p>
          <p className="text-sm mt-1">Try changing the source or sentiment filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredArticles.map((article, i) => (
            <a
              key={`${article.source}-${i}`}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded-xl border border-gray-200 p-4 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Sentiment indicator */}
                <div className="mt-1.5 flex-shrink-0">
                  <span
                    className={`block w-2.5 h-2.5 rounded-full ${sentimentColor(
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
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {/* Source badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${sourceBadgeColor(
                        article.source
                      )}`}
                    >
                      {article.sourceLabel}
                    </span>

                    <span className="text-xs text-gray-400">
                      {article.publisher}
                    </span>

                    {article.publishedAt && (
                      <>
                        <span className="text-xs text-gray-300">&middot;</span>
                        <span className="text-xs text-gray-400">
                          {timeAgo(article.publishedAt)}
                        </span>
                      </>
                    )}

                    {/* Sentiment label */}
                    <span
                      className={`text-xs font-medium ml-auto ${
                        article.sentiment === "positive"
                          ? "text-green-600"
                          : article.sentiment === "negative"
                            ? "text-red-600"
                            : "text-gray-400"
                      }`}
                    >
                      {article.sentiment === "positive"
                        ? "↑ Bullish"
                        : article.sentiment === "negative"
                          ? "↓ Bearish"
                          : ""}
                    </span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Footer */}
      <p className="text-xs text-gray-400 text-center">
        Showing {filteredArticles.length} articles
        {activeSource !== "all" ? ` from ${data.availableSources.find((s) => s.id === activeSource)?.label || activeSource}` : " from all sources"}
        . News is analyzed for sentiment using keyword matching — not financial advice.
      </p>
    </div>
  );
}
