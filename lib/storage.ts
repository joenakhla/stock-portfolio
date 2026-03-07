import { PortfolioStock, WatchlistStock } from "./types";

const PORTFOLIO_KEY = "stock-portfolio-stocks";
const WATCHLIST_KEY = "stock-portfolio-watchlist";

export function getPortfolio(): PortfolioStock[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(PORTFOLIO_KEY);
  return data ? JSON.parse(data) : [];
}

export function savePortfolio(stocks: PortfolioStock[]): void {
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(stocks));
}

export function addToPortfolio(stock: PortfolioStock): PortfolioStock[] {
  const portfolio = getPortfolio();
  portfolio.push(stock);
  savePortfolio(portfolio);
  return portfolio;
}

export function removeFromPortfolio(id: string): PortfolioStock[] {
  const portfolio = getPortfolio().filter((s) => s.id !== id);
  savePortfolio(portfolio);
  return portfolio;
}

export function getWatchlist(): WatchlistStock[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(WATCHLIST_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveWatchlist(stocks: WatchlistStock[]): void {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(stocks));
}

export function addToWatchlist(stock: WatchlistStock): WatchlistStock[] {
  const watchlist = getWatchlist();
  watchlist.push(stock);
  saveWatchlist(watchlist);
  return watchlist;
}

export function removeFromWatchlist(id: string): WatchlistStock[] {
  const watchlist = getWatchlist().filter((s) => s.id !== id);
  saveWatchlist(watchlist);
  return watchlist;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
