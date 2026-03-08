// US Stock Market (NYSE/NASDAQ): Mon–Fri, 9:30 AM – 4:00 PM Eastern Time
// Closed on weekends and US public holidays

// NYSE holidays — includes 2024, 2025, 2026
const MARKET_HOLIDAYS: string[] = [
  // 2024
  "2024-01-01", "2024-01-15", "2024-02-19", "2024-03-29",
  "2024-05-27", "2024-06-19", "2024-07-04", "2024-09-02",
  "2024-11-28", "2024-12-25",
  // 2025
  "2025-01-01", "2025-01-20", "2025-02-17", "2025-04-18",
  "2025-05-26", "2025-06-19", "2025-07-04", "2025-09-01",
  "2025-11-27", "2025-12-25",
  // 2026
  "2026-01-01", "2026-01-19", "2026-02-16", "2026-04-03",
  "2026-05-25", "2026-06-19", "2026-07-03", "2026-09-07",
  "2026-11-26", "2026-12-25",
];

function getEasternTime(): Date {
  const now = new Date();
  const eastern = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  return eastern;
}

export function isMarketOpen(): boolean {
  const et = getEasternTime();
  const day = et.getDay(); // 0 = Sunday, 6 = Saturday

  // Weekend
  if (day === 0 || day === 6) return false;

  // Holiday check
  const dateStr = [
    et.getFullYear(),
    String(et.getMonth() + 1).padStart(2, "0"),
    String(et.getDate()).padStart(2, "0"),
  ].join("-");

  if (MARKET_HOLIDAYS.includes(dateStr)) return false;

  // Market hours: 9:30 AM – 4:00 PM ET
  const hours = et.getHours();
  const minutes = et.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  const openTime = 9 * 60 + 30; // 9:30 AM
  const closeTime = 16 * 60; // 4:00 PM

  return timeInMinutes >= openTime && timeInMinutes < closeTime;
}

export function getMarketStatus(): {
  isOpen: boolean;
  label: string;
  nextEvent: string;
} {
  const et = getEasternTime();
  const day = et.getDay();
  const hours = et.getHours();
  const minutes = et.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const dateStr = [
    et.getFullYear(),
    String(et.getMonth() + 1).padStart(2, "0"),
    String(et.getDate()).padStart(2, "0"),
  ].join("-");

  const isHoliday = MARKET_HOLIDAYS.includes(dateStr);
  const isWeekend = day === 0 || day === 6;
  const openTime = 9 * 60 + 30;
  const closeTime = 16 * 60;
  const isWithinHours =
    timeInMinutes >= openTime && timeInMinutes < closeTime;

  if (isHoliday) {
    return {
      isOpen: false,
      label: "Market Closed (Holiday)",
      nextEvent: "Opens next trading day at 9:30 AM ET",
    };
  }

  if (isWeekend) {
    return {
      isOpen: false,
      label: "Market Closed (Weekend)",
      nextEvent: "Opens Monday at 9:30 AM ET",
    };
  }

  if (!isWithinHours) {
    if (timeInMinutes < openTime) {
      const minsUntilOpen = openTime - timeInMinutes;
      const h = Math.floor(minsUntilOpen / 60);
      const m = minsUntilOpen % 60;
      return {
        isOpen: false,
        label: "Market Closed (Pre-Market)",
        nextEvent: `Opens in ${h}h ${m}m`,
      };
    } else {
      return {
        isOpen: false,
        label: "Market Closed (After Hours)",
        nextEvent: "Opens tomorrow at 9:30 AM ET",
      };
    }
  }

  const minsUntilClose = closeTime - timeInMinutes;
  const h = Math.floor(minsUntilClose / 60);
  const m = minsUntilClose % 60;
  return {
    isOpen: true,
    label: "Market Open",
    nextEvent: `Closes in ${h}h ${m}m`,
  };
}
