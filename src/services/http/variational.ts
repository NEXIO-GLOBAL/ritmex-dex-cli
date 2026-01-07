import type { VariationalListing, VariationalStatsResponse, VariationalFundingEntry } from "../../types/variational";

const VARIATIONAL_STATS_URL = "https://omni-client-api.prod.ap-northeast-1.variational.io/metadata/stats";
const JSON_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
};

export async function fetchVariationalStats(): Promise<VariationalStatsResponse> {
  const response = await fetch(VARIATIONAL_STATS_URL, { headers: JSON_HEADERS });
  if (!response.ok) {
    throw new Error(`Variational stats request failed: ${response.status}`);
  }
  return response.json() as Promise<VariationalStatsResponse>;
}

export async function fetchVariationalFundingRates(): Promise<VariationalFundingEntry[]> {
  const stats = await fetchVariationalStats();

  return stats.listings
    .map((listing: VariationalListing) => {
      // funding_rate is in percentage form (e.g., "0.1095" means 0.1095%)
      // Convert to decimal rate (e.g., 0.001095)
      const rawRate = listing.funding_rate;
      const percentValue = Number(rawRate);
      if (!Number.isFinite(percentValue)) return null;

      const decimalRate = percentValue / 100;
      const symbol = listing.ticker.toUpperCase();

      // Standardize to 8-hour rate using funding_interval_s
      // funding_interval_s is in seconds, standard interval is 28800s (8 hours)
      const intervalSeconds = listing.funding_interval_s || 28800;
      const eightHourRate = decimalRate * (28800 / intervalSeconds);

      return { symbol, rate: eightHourRate } as VariationalFundingEntry;
    })
    .filter((v): v is VariationalFundingEntry => v !== null);
}
