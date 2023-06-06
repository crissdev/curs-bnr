import env from "@/env";

export function getExchangeRatesUrlForYear(year: number) {
  return env.BNR_FX_RATES_OF_YEAR_URL.replace("{year}", year.toString());
}
