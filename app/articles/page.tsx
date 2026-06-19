import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Articles - Stock Market Analysis & Insights",
  description:
    "Read expert analysis, market insights, and investment guides covering US and Egyptian stock markets, gold prices, and trading strategies.",
};

export default function ArticlesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Market Articles &amp; Analysis
        </h1>
        <p className="text-gray-500 mb-12">
          Expert insights on US and Egyptian stock markets, gold prices, and
          investment strategies.
        </p>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 text-center">
          <div className="text-5xl mb-4">&#x1F4DD;</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            We&apos;re working on AI-powered market analysis articles covering
            stock trends, Fibonacci strategies, gold market updates, and
            investment guides for both US and Egyptian markets.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {[
              "Market Analysis",
              "Gold Price Insights",
              "Fibonacci Trading",
              "EGX Stock Picks",
              "US Market Trends",
            ].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
