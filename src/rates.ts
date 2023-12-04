import { XMLParser } from "fast-xml-parser";
import env from "@/env";
import { getYearlyExchangeRatesUrl, ISO_DATE_RE } from "@/util";
import {
  array,
  coerce,
  minLength,
  number,
  object,
  optional,
  regex,
  safeParse,
  string,
  transform,
  parse,
} from "valibot";

export enum CurrencyCode {
  AED = "AED",
  AUD = "AUD",
  BGN = "BGN",
  BRL = "BRL",
  CAD = "CAD",
  CHF = "CHF",
  CNY = "CNY",
  CZK = "CZK",
  DKK = "DKK",
  EGP = "EGP",
  EUR = "EUR",
  GBP = "GBP",
  HRK = "HRK",
  HUF = "HUF",
  INR = "INR",
  JPY = "JPY",
  KRW = "KRW",
  MDL = "MDL",
  MXN = "MXN",
  NOK = "NOK",
  NZD = "NZD",
  PLN = "PLN",
  RSD = "RSD",
  RUB = "RUB",
  SEK = "SEK",
  THB = "THB",
  TRY = "TRY",
  UAH = "UAH",
  USD = "USD",
  XAU = "XAU",
  XDR = "XDR",
  ZAR = "ZAR",
}

export interface Rate {
  date: string;
  currency: CurrencyCode;
  value: number;
  multiplier?: number;
}

async function fetchRates(url: string) {
  let xml = "";
  try {
    const xmlParser = new XMLParser({
      attributeNamePrefix: "",
      ignoreAttributes: false,
      isArray: (name) => name === "Rate" || name === "Cube",
      parseAttributeValue: false,
      processEntities: false,
      textNodeName: "value",
      trimValues: true,
    });
    xml = await fetch(url).then((r) => r.text());
    const schema = transform(
      object({
        DataSet: object({
          Body: object({
            Cube: array(
              object({
                date: string([regex(ISO_DATE_RE)]),
                Rate: array(
                  object({
                    currency: string(),
                    value: number(),
                    multiplier: optional(coerce(number(), (v) => Number(v))),
                  }),
                  [minLength(1)]
                ),
              })
            ),
          }),
        }),
      }),
      (data) =>
        data.DataSet.Body.Cube.flatMap(({ date, Rate }) =>
          Rate.map<Rate>((rate) =>
            Object.assign(
              {
                date,
                value: rate.value,
                currency: rate.currency as CurrencyCode,
              },
              rate.multiplier ? { multiplier: rate.multiplier } : null
            )
          )
        ).filter(
          // Allow only rates from known currencies
          (rate) => rate.currency in CurrencyCode
        )
    );
    return parse(schema, xmlParser.parse(xml));
  } catch (err) {
    console.log("Failed for xml", xml);
    throw new Error("Server did not return a valid response", { cause: err });
  }
}

export function getMostRecentExchangeRates() {
  return fetchRates(env.BNR_FX_RATES_MOST_RECENT_URL);
}

export function getExchangeRatesOfYear(year: number) {
  return fetchRates(getYearlyExchangeRatesUrl(year));
}

export async function getExchangeRatesForDate(date: string) {
  const parseResult = safeParse(
    transform(string([regex(ISO_DATE_RE)]), (date) => new Date(date)),
    date
  );
  if (!parseResult.success) {
    throw new Error("Invalid date format");
  }
  const rates = await getExchangeRatesOfYear(parseResult.data.getFullYear());
  return rates.filter((rate) => rate.date === date);
}
