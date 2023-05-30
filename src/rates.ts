import * as z from "zod";
import invariant from "tiny-invariant";
import { XMLParser } from "fast-xml-parser";
import env from "@/env";

export enum CurrencyCode {
  EUR = "EUR",
}

export interface Rate {
  date: string;
  currency: CurrencyCode;
  value: number;
}

async function fetchRates(url: string) {
  const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    textNodeName: "value",
    trimValues: true,
    isArray: (name) => name === "Rate" || name === "Cube",
  });
  const xml = await fetch(url).then((r) => r.text());
  const parsed: unknown = xmlParser.parse(xml);

  const apiResponseSchema = z
    .object({
      DataSet: z.object({
        Body: z.object({
          Cube: z.array(
            z.object({
              date: z.string(),
              Rate: z.array(
                z.object({
                  currency: z.string(),
                  value: z.number(),
                })
              ),
            })
          ),
        }),
      }),
    })
    .transform((data) => {
      let cube = data.DataSet.Body.Cube;

      const onlyKnownCurrencies = (rate: (typeof cube)[number]["Rate"][number]) => rate.currency in CurrencyCode;

      return cube
        .flatMap(({ date, Rate }) =>
          Rate.map<Rate>((rate) => ({
            date,
            value: rate.value,
            currency: rate.currency as CurrencyCode,
          }))
        )
        .filter(onlyKnownCurrencies);
    });

  const rates = apiResponseSchema.parse(parsed);
  invariant(rates, "Server did not return a valid response");
  return rates;
}

export async function getMostRecentExchangeRates() {
  const rates = await fetchRates(env.BNR_FX_RATES_MOST_RECENT_URL);
  invariant(rates.length === 1, "Server did not return a valid response");
  return rates;
}

export async function getExchangeRatesOfYear(year: number) {
  return fetchRates(env.BNR_FX_RATES_OF_YEAR_URL.replace("{year}", year.toString()));
}
