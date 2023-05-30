import { afterAll, beforeAll, expect, suite, test } from "vitest";
import { rest } from "msw";
import { type SetupServer, setupServer } from "msw/node";
import env from "@/env";
import { CurrencyCode, getExchangeRatesOfYear, getMostRecentExchangeRates } from "@/rates";

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
    expect(currencies).toEqual([["EUR", CurrencyCode.EUR]]);
  });

  test("Retrieve most recent exchange rates from API", async () => {
    server.use(
      rest.get(env.BNR_FX_RATES_MOST_RECENT_URL, (_req, res, ctx) => {
        return res(
          ctx.xml(`
             <DataSet>
               <Body>
                 <Cube date="2023-05-29">
                   <Rate currency="EUR">2</Rate>
                 </Cube>
               </Body>
             </DataSet>
           `)
        );
      })
    );
    const rates = await getMostRecentExchangeRates();
    expect(rates).toEqual([{ date: "2023-05-29", currency: "EUR", value: 2 }]);
  });

  test("Retrieve exchange rates for a specific year for EUR from the API", async () => {
    server.use(
      rest.get(env.BNR_FX_RATES_OF_YEAR_URL.replace("{year}", "2021"), (_req, res, ctx) => {
        return res(
          ctx.xml(`
              <DataSet>
                <Body>
                  <Cube date="2023-01-03">
                    <Rate currency="EUR">3.4567</Rate>
                  </Cube>
                </Body>
              </DataSet>
            `)
        );
      })
    );
    const rates = await getExchangeRatesOfYear(2021);
    expect(rates).toEqual([{ date: "2023-01-03", currency: "EUR", value: 3.4567 }]);
  });
});
