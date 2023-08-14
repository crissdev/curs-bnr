import { object, safeParse, string, url } from "valibot";

const schema = object({
  BNR_FX_RATES_MOST_RECENT_URL: string([url()]),
  BNR_FX_RATES_OF_YEAR_URL: string([url()]),
});

const parseResult = safeParse(schema, {
  BNR_FX_RATES_MOST_RECENT_URL: "https://www.bnr.ro/nbrfxrates.xml",
  BNR_FX_RATES_OF_YEAR_URL: "https://bnr.ro/files/xml/years/nbrfxrates{year}.xml",
  ...process.env,
});

if (!parseResult.success) {
  throw new Error("Environment variables are not defined.");
}

const env = parseResult.data;

export default env;
