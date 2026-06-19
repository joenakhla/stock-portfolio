import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: {
    default: "StockTracker - US & Egypt Stock Portfolio, Gold Prices & Fibonacci Analysis",
    template: "%s | StockTracker",
  },
  description:
    "Track US and Egyptian (EGX) stock portfolios, live gold prices in EGP, Fibonacci retracement recommendations, trending stocks, and market news. Free multi-market portfolio tracker.",
  keywords: [
    "stock tracker", "portfolio tracker", "EGX", "Egyptian stock market",
    "gold price Egypt", "gold price EGP", "Fibonacci retracement",
    "stock analysis", "NYSE", "NASDAQ", "Cairo stock exchange",
    "عيار 21", "سعر الذهب", "بورصة مصر", "أسعار الذهب اليوم",
    "stock portfolio", "investment tracker", "trending stocks",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "StockTracker - US & Egypt Stock Portfolio Tracker",
    description: "Track US & Egyptian stocks, live gold prices in EGP, Fibonacci analysis, and market news.",
    siteName: "StockTracker",
  },
  twitter: {
    card: "summary_large_image",
    title: "StockTracker - Multi-Market Portfolio Tracker",
    description: "Track US & Egyptian stocks, gold prices, Fibonacci levels, and market trends.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const adsensePubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {adsensePubId && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePubId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "StockTracker",
              applicationCategory: "FinanceApplication",
              description:
                "Multi-market stock portfolio tracker with US and Egyptian stock markets, live gold prices, Fibonacci analysis, and market news.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "US & Egypt stock portfolio tracking",
                "Live gold prices in EGP",
                "Fibonacci retracement analysis",
                "Trending stocks with momentum scoring",
                "Market news with sentiment analysis",
                "What-If investment simulation",
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
