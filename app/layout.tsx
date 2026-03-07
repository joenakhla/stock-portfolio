import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Stock Tracker - Simple Portfolio Tracker",
  description:
    "Track your stock portfolio, watch stocks, and see how your investments are doing. Built for beginners.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
