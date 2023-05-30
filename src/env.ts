import "dotenv/config";
import z from "zod";

const schema = z.object({
  BNR_FX_RATES_MOST_RECENT_URL: z.string().url(),
  BNR_FX_RATES_OF_YEAR_URL: z.string().url(),
});

const parseResult = schema.safeParse(process.env);

if (!parseResult.success) {
  throw new Error("Environment variables are not defined.");
}

const env = parseResult.data;

export default env;
