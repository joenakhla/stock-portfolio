export interface PortfolioStock {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  shares: number;
  purchasePrice: number;
  purchaseDate: string;
}

export interface WatchlistStock {
  id: string;
  symbol: string;
  name: string;
  addedDate: string;
}

export interface StockQuote {
  symbol: string;
  name: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  high52Week: number;
  low52Week: number;
  currency: string;
  dividendRate: number;
  dividendYield: number;
  dividendFrequency: string;
  nextExDividendDate: string | null;
  nextDividendDate: string | null;
}

export interface HistoricalDataPoint {
  date: string;
  close: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export interface SimulationResult {
  months: number;
  label: string;
  pastPrice: number | null;
  currentPrice: number;
  returnPercent: number | null;
  returnDollars: number | null;
}

export interface FibonacciLevel {
  percent: number;
  price: number;
  label: string;
}

export interface FibonacciResult {
  symbol: string;
  swingHigh: number;
  swingLow: number;
  currentPrice: number;
  levels: FibonacciLevel[];
  recommendation: "Buy" | "Sell" | "Hold";
  reasoning: string;
}

export interface GoldPriceEntry {
  buy: number;
  sell: number;
}

export interface GoldPricesData {
  spotUsd: number;
  usdToEgp: number;
  updatedAt: string;
  prices: {
    karat24: GoldPriceEntry;
    karat21: GoldPriceEntry;
    karat18: GoldPriceEntry;
    goldPound: GoldPriceEntry;
    goldBar: GoldPriceEntry;
  };
}
