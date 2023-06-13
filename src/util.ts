import env from "@/env";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function getYearlyExchangeRatesUrl(year: number) {
  return env.BNR_FX_RATES_OF_YEAR_URL.replace("{year}", year.toString());
}

export function isValidDateString(date: string) {
  return ISO_DATE_RE.test(date);
}
