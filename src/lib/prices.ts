const YAHOO_HEADERS = { "User-Agent": "Mozilla/5.0" };

export type FundSearchResult = { code: string; name: string };
export type StockSearchResult = { code: string; name: string; exchange: string };

export async function searchMutualFunds(query: string): Promise<FundSearchResult[]> {
  const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const data: { schemeCode: number; schemeName: string }[] = await res.json();
  return data.slice(0, 20).map((d) => ({ code: String(d.schemeCode), name: d.schemeName }));
}

type YahooQuote = {
  quoteType?: string;
  symbol?: string;
  longname?: string;
  shortname?: string;
  exchDisp?: string;
  exchange?: string;
};

export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  const res = await fetch(
    `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=15`,
    { headers: YAHOO_HEADERS }
  );
  if (!res.ok) return [];
  const data: { quotes?: YahooQuote[] } = await res.json();
  const quotes = data.quotes ?? [];
  return quotes
    .filter((q): q is YahooQuote & { symbol: string } => q.quoteType === "EQUITY" && !!q.symbol)
    .map((q) => ({
      code: q.symbol,
      name: q.longname ?? q.shortname ?? q.symbol,
      exchange: q.exchDisp ?? q.exchange ?? "",
    }));
}

export async function getMfCurrentPrice(schemeCode: string): Promise<{ price: number; date: string } | null> {
  const res = await fetch(`https://api.mfapi.in/mf/${encodeURIComponent(schemeCode)}`);
  if (!res.ok) return null;
  const data = await res.json();
  const latest = data?.data?.[0];
  if (!latest) return null;
  return { price: parseFloat(latest.nav), date: latest.date };
}

export async function getStockCurrentPrice(symbol: string): Promise<{ price: number; date: string } | null> {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
    { headers: YAHOO_HEADERS }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  const price = result?.meta?.regularMarketPrice;
  if (typeof price !== "number") return null;
  return { price, date: new Date().toISOString().slice(0, 10) };
}

export async function getCurrentPrice(
  type: "MF" | "STOCK",
  code: string
): Promise<{ price: number; date: string } | null> {
  return type === "MF" ? getMfCurrentPrice(code) : getStockCurrentPrice(code);
}
