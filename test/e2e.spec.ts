import chalk from "chalk";
import { expect, suite, test } from "vitest";
import { getExchangeRatesOfYear, getMostRecentExchangeRates } from "@/rates";

suite("Prod Exchange rates", () => {
  test("Retrieve most recent exchange rates from BNR", async () => {
    if (!process.env.CI) {
      console.log(chalk.yellow("⚠️ This E2E test run only when CI is defined"));
      return;
    }
    const rates = await getMostRecentExchangeRates();

    expect(rates).toHaveLength(1);
    expect(rates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          date: expect.stringMatching(/\d{4}-\d{2}-\d{2}/),
          currency: expect.any(String),
          value: expect.any(Number),
        }),
      ])
    );
  });

  test("Retrieve exchange rates for a specific year from BNR", async () => {
    if (!process.env.CI) {
      console.log(chalk.yellow("⚠️ This E2E test run only when CI is defined"));
      return;
    }
    const rates = await getExchangeRatesOfYear(2023);

    expect(rates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          date: expect.stringMatching(/\d{4}-\d{2}-\d{2}/),
          currency: expect.any(String),
          value: expect.any(Number),
        }),
      ])
    );
    expect(rates[0]).toEqual({ date: "2023-01-03", currency: "EUR", value: 4.9273 });
  });
});
