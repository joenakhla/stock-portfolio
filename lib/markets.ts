export type MarketId = "US" | "EGX";

export interface MarketConfig {
  id: MarketId;
  label: string;
  flag: string;
  timezone: string;
  tradingDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  openMinutes: number;   // minutes from midnight
  closeMinutes: number;
  holidays: string[];
  currency: string;
  currencySymbol: string;
  yahooRegion: string;
  yahooPriceSuffix: string;
}

export const MARKETS: Record<MarketId, MarketConfig> = {
  US: {
    id: "US",
    label: "USA",
    flag: "\u{1F1FA}\u{1F1F8}",
    timezone: "America/New_York",
    tradingDays: [1, 2, 3, 4, 5],
    openMinutes: 9 * 60 + 30, // 9:30 AM
    closeMinutes: 16 * 60,    // 4:00 PM
    holidays: [
      "2025-01-01", "2025-01-20", "2025-02-17", "2025-04-18",
      "2025-05-26", "2025-06-19", "2025-07-04", "2025-09-01",
      "2025-11-27", "2025-12-25",
      "2026-01-01", "2026-01-19", "2026-02-16", "2026-04-03",
      "2026-05-25", "2026-06-19", "2026-07-03", "2026-09-07",
      "2026-11-26", "2026-12-25",
    ],
    currency: "USD",
    currencySymbol: "$",
    yahooRegion: "US",
    yahooPriceSuffix: "",
  },
  EGX: {
    id: "EGX",
    label: "Egypt",
    flag: "\u{1F1EA}\u{1F1EC}",
    timezone: "Africa/Cairo",
    tradingDays: [0, 1, 2, 3, 4], // Sun-Thu
    openMinutes: 10 * 60,   // 10:00 AM
    closeMinutes: 14 * 60 + 30, // 2:30 PM
    holidays: [
      // 2025 approximate EGX holidays
      "2025-01-07", "2025-01-25", "2025-03-30", "2025-03-31",
      "2025-04-01", "2025-04-20", "2025-04-21", "2025-06-06",
      "2025-06-07", "2025-06-08", "2025-06-09", "2025-06-30",
      "2025-07-23", "2025-09-27", "2025-10-06",
      // 2026 approximate EGX holidays
      "2026-01-07", "2026-01-25", "2026-03-20", "2026-03-21",
      "2026-03-22", "2026-04-06", "2026-05-27", "2026-05-28",
      "2026-05-29", "2026-06-30", "2026-07-23", "2026-09-17",
      "2026-10-06",
    ],
    currency: "EGP",
    currencySymbol: "EGP",
    yahooRegion: "EG",
    yahooPriceSuffix: ".CA",
  },
};

export const ALL_MARKET_IDS: MarketId[] = ["EGX", "US"];

export function formatPrice(amount: number, currency: string): string {
  if (currency === "EGP") {
    return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP`;
  }
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
