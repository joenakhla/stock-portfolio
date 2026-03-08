"use client";

import { useState, useEffect } from "react";

interface NewsArticle {
  title: string;
  publisher: string;
  link: string;
  publishedAt: string | null;
  sentiment: "positive" | "negative" | "neutral";
}

interface NewsData {
  positive: NewsArticle[];
  negative: NewsArticle[];
  neutral: NewsArticle[];
  summary: {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    overallSentiment: string;
  };
}

export default function StockNews({ symbol }: { symbol: string }) {
  const [news, setNews] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/news?symbol=${encodeURIComponent(symbol)}`
        );
        const data = await res.json();
        setNews(data);
      } catch {
        // News unavailable
      }
      setLoading(false);
    }
    fetchNews();
  }, [symbol]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 py-4">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        Loading news...
      </div>
    );
  }

  if (!news || news.summary.total === 0) {
    return (
      <p className="text-sm text-gray-400 py-2">
        No recent news found for {symbol}.
      </p>
    );
  }

  function timeAgo(dateStr: string | null): string {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <div className="space-y-4">
      {/* Sentiment summary bar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm font-medium text-green-700">
            {news.summary.positive} Positive
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm font-medium text-red-700">
            {news.summary.negative} Negative
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-400" />
          <span className="text-sm font-medium text-gray-500">
            {news.summary.neutral} Neutral
          </span>
        </div>
        <div
          className={`ml-auto px-2.5 py-1 rounded-full text-xs font-bold ${
            news.summary.overallSentiment === "positive"
              ? "bg-green-100 text-green-700"
              : news.summary.overallSentiment === "negative"
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-600"
          }`}
        >
          Overall:{" "}
          {news.summary.overallSentiment === "positive"
            ? "Bullish"
            : news.summary.overallSentiment === "negative"
              ? "Bearish"
              : "Mixed"}
        </div>
      </div>

      {/* Positive news */}
      {news.positive.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            Good News (may push price up)
          </h5>
          <div className="space-y-2">
            {news.positive.slice(0, 5).map((article, i) => (
              <a
                key={i}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-green-50 border border-green-100 rounded-lg hover:bg-green-100 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900">
                  {article.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {article.publisher}
                  {article.publishedAt && ` · ${timeAgo(article.publishedAt)}`}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Negative news */}
      {news.negative.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            Concerning News (may push price down)
          </h5>
          <div className="space-y-2">
            {news.negative.slice(0, 5).map((article, i) => (
              <a
                key={i}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900">
                  {article.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {article.publisher}
                  {article.publishedAt && ` · ${timeAgo(article.publishedAt)}`}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Neutral news (collapsed) */}
      {news.neutral.length > 0 && (
        <details className="group">
          <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
            Show {news.neutral.length} neutral article{news.neutral.length > 1 ? "s" : ""}
          </summary>
          <div className="space-y-2 mt-2">
            {news.neutral.slice(0, 5).map((article, i) => (
              <a
                key={i}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900">
                  {article.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {article.publisher}
                  {article.publishedAt && ` · ${timeAgo(article.publishedAt)}`}
                </p>
              </a>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
