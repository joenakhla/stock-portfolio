export interface PortfolioStock {
  id: string;
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
