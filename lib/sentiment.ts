export const POSITIVE_WORDS = [
  "surge", "soar", "rally", "gain", "rise", "jump", "climb", "beat",
  "exceed", "upgrade", "bullish", "growth", "profit", "record", "high",
  "boost", "strong", "positive", "outperform", "buy", "upbeat", "recover",
  "breakout", "momentum", "opportunity", "win", "success", "expand",
  "optimistic", "raises", "raised", "upside", "top", "best", "love",
  "innovation", "revolutionary", "impressive", "accelerate", "approval",
];

export const NEGATIVE_WORDS = [
  "fall", "drop", "decline", "crash", "plunge", "sink", "loss", "miss",
  "downgrade", "bearish", "weak", "negative", "underperform", "sell",
  "cut", "warning", "risk", "concern", "fear", "slump", "downturn",
  "tumble", "plummet", "layoff", "lawsuit", "investigation", "recall",
  "debt", "bankruptcy", "fraud", "scandal", "worst", "trouble", "struggle",
  "disappointing", "fails", "failed", "crisis", "threat", "volatile",
];

export function analyzeSentiment(
  title: string
): "positive" | "negative" | "neutral" {
  const lower = title.toLowerCase();
  let posScore = 0;
  let negScore = 0;

  for (const word of POSITIVE_WORDS) {
    if (lower.includes(word)) posScore++;
  }
  for (const word of NEGATIVE_WORDS) {
    if (lower.includes(word)) negScore++;
  }

  if (posScore > negScore) return "positive";
  if (negScore > posScore) return "negative";
  return "neutral";
}
