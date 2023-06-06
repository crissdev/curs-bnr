import z from "zod";
import { XMLParser } from "fast-xml-parser";
import env from "@/env";
import { getExchangeRatesUrlForYear } from "@/util";

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
  try {
    const xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      textNodeName: "value",
      trimValues: true,
      transformTagName: (name) => (name === "Rate" ? "rates" : name),
      isArray: (name) => name === "rates" || name === "Cube",
    });
    const xml = await fetch(url).then((r) => r.text());
    const parsed: unknown = xmlParser.parse(xml);

    const apiResponseSchema = z
      .object({
        DataSet: z.object({
          Body: z.object({
            Cube: z.array(
              z.object({
                date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                rates: z
                  .array(
                    z.object({
                      currency: z.string(),
                      value: z.number(),
                      multiplier: z.coerce.number().optional(),
                    })
                  )
                  .min(1),
              })
            ),
          }),
        }),
      })
      .transform((data) => {
        let cube = data.DataSet.Body.Cube;

        const onlyKnownCurrencies = (rate: (typeof cube)[number]["rates"][number]) => rate.currency in CurrencyCode;

        return cube
          .flatMap(({ date, rates }) =>
            rates.map<Rate>((rate) =>
              Object.assign(
                {
                  date,
                  value: rate.value,
                  currency: rate.currency as CurrencyCode,
                },
                rate.multiplier ? { multiplier: rate.multiplier } : null
              )
            )
          )
          .filter(onlyKnownCurrencies);
      });

    return apiResponseSchema.parse(parsed);
  } catch (err) {
    throw new Error("Server did not return a valid response", { cause: err });
  }
}

export function getMostRecentExchangeRates() {
  return fetchRates(env.BNR_FX_RATES_MOST_RECENT_URL);
}

export function getExchangeRatesOfYear(year: number) {
  return fetchRates(getExchangeRatesUrlForYear(year));
}
