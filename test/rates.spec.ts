import { afterAll, beforeAll, expect, suite, test } from "vitest";
import { rest } from "msw";
import { type SetupServer, setupServer } from "msw/node";
import env from "@/env";
import { CurrencyCode, getExchangeRatesForDate, getExchangeRatesOfYear, getMostRecentExchangeRates } from "@/rates";
import { getYearlyExchangeRatesUrl } from "@/util";

suite("Exchange rates", () => {
  let server: SetupServer;

  beforeAll(() => {
    server = setupServer();
    server.use(
      rest.get(/.*/, (_req, res, ctx) => {
        return res(ctx.status(404, "Request is not mocked"));
      })
    );
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  test("Supported currencies are defined", () => {
    const currencies = Object.entries(CurrencyCode).sort((a, b) => a[0].localeCompare(b[0]));
    expect(currencies).toEqual([
      ["AED", CurrencyCode.AED],
      ["AUD", CurrencyCode.AUD],
      ["BGN", CurrencyCode.BGN],
      ["BRL", CurrencyCode.BRL],
      ["CAD", CurrencyCode.CAD],
      ["CHF", CurrencyCode.CHF],
      ["CNY", CurrencyCode.CNY],
      ["CZK", CurrencyCode.CZK],
      ["DKK", CurrencyCode.DKK],
      ["EGP", CurrencyCode.EGP],
      ["EUR", CurrencyCode.EUR],
      ["GBP", CurrencyCode.GBP],
      ["HRK", CurrencyCode.HRK],
      ["HUF", CurrencyCode.HUF],
      ["INR", CurrencyCode.INR],
      ["JPY", CurrencyCode.JPY],
      ["KRW", CurrencyCode.KRW],
      ["MDL", CurrencyCode.MDL],
      ["MXN", CurrencyCode.MXN],
      ["NOK", CurrencyCode.NOK],
      ["NZD", CurrencyCode.NZD],
      ["PLN", CurrencyCode.PLN],
      ["RSD", CurrencyCode.RSD],
      ["RUB", CurrencyCode.RUB],
      ["SEK", CurrencyCode.SEK],
      ["THB", CurrencyCode.THB],
      ["TRY", CurrencyCode.TRY],
      ["UAH", CurrencyCode.UAH],
      ["USD", CurrencyCode.USD],
      ["XAU", CurrencyCode.XAU],
      ["XDR", CurrencyCode.XDR],
      ["ZAR", CurrencyCode.ZAR],
    ]);
  });

  test("Retrieve most recent exchange rates", async () => {
    server.use(
      rest.get(env.BNR_FX_RATES_MOST_RECENT_URL, (_req, res, ctx) => {
        return res(
          ctx.xml(`
             <DataSet>
               <Body>
                 <Cube date="2023-05-29">
                   <Rate currency="EUR">2.3456</Rate>
                   <Rate currency="USD">1.4533</Rate>
                 </Cube>
               </Body>
             </DataSet>
           `)
        );
      })
    );
    const rates = await getMostRecentExchangeRates();
    expect(rates).toEqual([
      { date: "2023-05-29", currency: "EUR", value: 2.3456 },
      { date: "2023-05-29", currency: "USD", value: 1.4533 },
    ]);
  });

  test("Retrieve exchange rates for a specific year", async () => {
    server.use(
      rest.get(getYearlyExchangeRatesUrl(2021), (_req, res, ctx) => {
        return res(
          ctx.xml(`
              <DataSet>
                <Body>
                  <Cube date="2023-01-03">
                    <Rate currency="EUR">4.9464</Rate>
                    <Rate currency="GBP">5.9153</Rate>
                    <Rate currency="USD">4.3779</Rate>
                  </Cube>
                </Body>
              </DataSet>
            `)
        );
      })
    );
    const rates = await getExchangeRatesOfYear(2021);
    expect(rates).toEqual([
      { date: "2023-01-03", currency: "EUR", value: 4.9464 },
      { date: "2023-01-03", currency: "GBP", value: 5.9153 },
      { date: "2023-01-03", currency: "USD", value: 4.3779 },
    ]);
  });

  test("Retrieve exchange rates for a specific date", async () => {
    server.use(
      rest.get(getYearlyExchangeRatesUrl(2022), (_req, res, ctx) => {
        return res(
          ctx.xml(`
              <DataSet>
                <Body>
                  <Cube date="2022-01-21">
                    <Rate currency="EUR">4.9449</Rate>
                    <Rate currency="GBP">5.9178</Rate>
                    <Rate currency="USD">4.3614</Rate>
                  </Cube>
                </Body>
              </DataSet>
            `)
        );
      })
    );
    const rates = await getExchangeRatesForDate("2022-01-21");
    expect(rates).toEqual([
      { date: "2022-01-21", currency: "EUR", value: 4.9449 },
      { date: "2022-01-21", currency: "GBP", value: 5.9178 },
      { date: "2022-01-21", currency: "USD", value: 4.3614 },
    ]);
  });

  test("Retrieve exchange rates for currencies with multiplier", async () => {
    server.use(
      rest.get(env.BNR_FX_RATES_MOST_RECENT_URL, (_req, res, ctx) => {
        return res(
          ctx.xml(`
             <DataSet>
               <Body>
                 <Cube date="2023-05-28">
                   <Rate currency="HUF" multiplier="100">1.3455</Rate>
                   <Rate currency="JPY" multiplier="100">3.7840</Rate>
                   <Rate currency="KRW" multiplier="100">0.3650</Rate>
                 </Cube>
               </Body>
             </DataSet>
           `)
        );
      })
    );
    const rates = await getMostRecentExchangeRates();
    expect(rates).toEqual([
      { date: "2023-05-28", currency: "HUF", value: 1.3455, multiplier: 100 },
      { date: "2023-05-28", currency: "JPY", value: 3.784, multiplier: 100 },
      { date: "2023-05-28", currency: "KRW", value: 0.365, multiplier: 100 },
    ]);
  });

  // Unhappy paths
  test.each([
    "not a valid XML response", // Invalid XML response
    "<?", // invalid XML response
    "", // empty response
    "<DataSet/>", // empty body
    "<DataSet><Body/></DataSet>", // empty body
    "<DataSet><Body><Cube/></DataSet>", // invalid Cube element
    "<DataSet><Body><Cube date='2023-01-02'></Cube></DataSet>", // invalid Cube element
    "<DataSet><Body><Cube date='2023-01-02'><Rate/></Cube></DataSet>", // invalid Rate element
    "<DataSet><Body><Cube date='2023-01-02'><Rate multiplier='100' currency='JPY' /></Cube></DataSet>", // invalid Rate element
    "<DataSet><Body><Cube date='2023-01-02'><Rate />1</Cube></DataSet>", // invalid Rate element
  ])("Throws error when getMostRecentExchangeRates returns invalid XML", async (content) => {
    server.use(
      rest.get(env.BNR_FX_RATES_MOST_RECENT_URL, (_req, res, ctx) => {
        return res(ctx.xml(content));
      })
    );
    await expect(getMostRecentExchangeRates()).rejects.toThrow("Server did not return a valid response");
  });

  test.each([
    "2023-01-02T00:00:00.000Z", // ISO 8601
    "02-03-2023",
    "02/03/2023",
    "2 March 2023",
    "2022.01.02",
  ])("Throws error when getExchangeRatesForDate is passed an invalid date format", async (date) => {
    await expect(getExchangeRatesForDate(date)).rejects.toThrow("Invalid date format");
  });
});
