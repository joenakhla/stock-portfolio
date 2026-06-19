import { MarketId, MARKETS } from "./markets";

function getTimeInZone(timezone: string): Date {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: timezone }));
}

export function isMarketOpen(marketId: MarketId = "US"): boolean {
  const config = MARKETS[marketId];
  const t = getTimeInZone(config.timezone);
  const day = t.getDay();

  if (!config.tradingDays.includes(day)) return false;

  const dateStr = [
    t.getFullYear(),
    String(t.getMonth() + 1).padStart(2, "0"),
    String(t.getDate()).padStart(2, "0"),
  ].join("-");

  if (config.holidays.includes(dateStr)) return false;

  const timeInMinutes = t.getHours() * 60 + t.getMinutes();
  return timeInMinutes >= config.openMinutes && timeInMinutes < config.closeMinutes;
}

export function getAnyMarketOpen(marketIds: MarketId[]): boolean {
  return marketIds.some((id) => isMarketOpen(id));
}

export function getMarketStatus(marketId: MarketId = "US"): {
  isOpen: boolean;
  label: string;
  nextEvent: string;
  flag: string;
  marketLabel: string;
} {
  const config = MARKETS[marketId];
  const t = getTimeInZone(config.timezone);
  const day = t.getDay();
  const timeInMinutes = t.getHours() * 60 + t.getMinutes();

  const dateStr = [
    t.getFullYear(),
    String(t.getMonth() + 1).padStart(2, "0"),
    String(t.getDate()).padStart(2, "0"),
  ].join("-");

  const isHoliday = config.holidays.includes(dateStr);
  const isTradingDay = config.tradingDays.includes(day);
  const isWithinHours =
    timeInMinutes >= config.openMinutes && timeInMinutes < config.closeMinutes;

  const openH = Math.floor(config.openMinutes / 60);
  const openM = config.openMinutes % 60;
  const openStr = `${openH}:${String(openM).padStart(2, "0")}`;

  const base = { flag: config.flag, marketLabel: config.label };

  if (isHoliday) {
    return { ...base, isOpen: false, label: "Closed (Holiday)", nextEvent: `Opens next trading day at ${openStr}` };
  }

  if (!isTradingDay) {
    return { ...base, isOpen: false, label: "Closed (Weekend)", nextEvent: `Opens next trading day at ${openStr}` };
  }

  if (!isWithinHours) {
    if (timeInMinutes < config.openMinutes) {
      const minsUntil = config.openMinutes - timeInMinutes;
      const h = Math.floor(minsUntil / 60);
      const m = minsUntil % 60;
      return { ...base, isOpen: false, label: "Closed (Pre-Market)", nextEvent: `Opens in ${h}h ${m}m` };
    }
    return { ...base, isOpen: false, label: "Closed (After Hours)", nextEvent: `Opens next trading day at ${openStr}` };
  }

  const minsUntilClose = config.closeMinutes - timeInMinutes;
  const h = Math.floor(minsUntilClose / 60);
  const m = minsUntilClose % 60;
  return { ...base, isOpen: true, label: "Market Open", nextEvent: `Closes in ${h}h ${m}m` };
}
