_# CURS-BNR

Retrieve the BNR exchange rates for a specific date or the most recent BNR exchange rates.

## Installation

```sh
npm install curs-bnr
```

## How to use

**Retrieve the most recent BNR exchange rates**

```js
const { getMostRecentExchangeRates } = require("curs-bnr");
const rates = await getMostRecentExchangeRates();
console.log(rates);
// [
//   { date: '2023-06-02', value: 4.9633, currency: 'EUR' },
//   { date: '2023-06-02', value: 5.7790, currency: 'GBP' }
//   ...
// ]
```

**Retrieve the BNR exchange rates for a specific year**

```js
const { getExchangeRatesOfYear } = require("curs-bnr");
const rates = await getExchangeRatesOfYear(2023);
console.log(rates);
// [
//    { date: '2023-01-03', value: 4.9273, currency: 'EUR' },
//    { date: '2023-01-04', value: 4.9264, currency: 'EUR' },
//    ...
// ]
```

## Configuration

By default, the API is configured to use the well-known BNR endpoints. If you want to use different endpoints, you
can configure them via environment variables. Note that `BNR_FX_RATES_OF_YEAR_URL` must have the same structure as the
default value, with the `{year}` placeholder.

```env
BNR_FX_RATES_MOST_RECENT_URL="https://www.bnr.ro/nbrfxrates.xml"
BNR_FX_RATES_OF_YEAR_URL="https://bnr.ro/files/xml/years/nbrfxrates{year}.xml"
```

## License

MIT © [Cristian Trifan](https://cristian-trifan.dev)
