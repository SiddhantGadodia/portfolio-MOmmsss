const YAHOO_HEADERS = { "User-Agent": "Mozilla/5.0" };
const FETCH_TIMEOUT_MS = 20000;

function fetchWithTimeout(url: string, init?: RequestInit) {
  return fetch(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
}

export type FundSearchResult = { code: string; name: string };
export type StockSearchResult = { code: string; name: string; exchange: string };

export async function searchMutualFunds(query: string): Promise<FundSearchResult[]> {
  const trimmed = query.trim();

  if (/^\d+$/.test(trimmed)) {
    const byCode = await getMfSchemeByCode(trimmed);
    return byCode ? [byCode] : [];
  }

  const res = await fetchWithTimeout(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(trimmed)}`);
  if (!res.ok) return [];
  const data: { schemeCode: number; schemeName: string }[] = await res.json();
  return data.slice(0, 20).map((d) => ({ code: String(d.schemeCode), name: d.schemeName }));
}

export async function getMfSchemeByCode(schemeCode: string): Promise<FundSearchResult | null> {
  const res = await fetchWithTimeout(`https://api.mfapi.in/mf/${encodeURIComponent(schemeCode)}`);
  if (!res.ok) return null;
  const data = await res.json();
  const name = data?.meta?.scheme_name;
  const code = data?.meta?.scheme_code;
  if (!name || !code) return null;
  return { code: String(code), name };
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
  const res = await fetchWithTimeout(
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
  const res = await fetchWithTimeout(`https://api.mfapi.in/mf/${encodeURIComponent(schemeCode)}`);
  if (!res.ok) return null;
  const data = await res.json();
  const latest = data?.data?.[0];
  if (!latest) return null;
  return { price: parseFloat(latest.nav), date: latest.date };
}

export async function getStockCurrentPrice(symbol: string): Promise<{ price: number; date: string } | null> {
  const res = await fetchWithTimeout(
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
