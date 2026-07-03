import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getCurrentPrice } from "@/lib/prices";
import { xirr } from "@/lib/xirr";

type HoldingRow = { id: number; type: "MF" | "STOCK"; name: string; code: string; created_at: string };
type InvestmentRow = { id: number; holding_id: number; date: string; units: number; price: number };

export async function GET() {
  const pool = await getPool();
  const { rows: holdings } = await pool.query<HoldingRow>("SELECT * FROM holdings ORDER BY created_at DESC");

  const results = await Promise.all(
    holdings.map(async (h) => {
      const { rows: investments } = await pool.query<InvestmentRow>(
        "SELECT * FROM investments WHERE holding_id = $1 ORDER BY date ASC",
        [h.id]
      );
      const totalUnits = investments.reduce((s, i) => s + i.units, 0);
      const totalInvested = investments.reduce((s, i) => s + i.units * i.price, 0);

      const current = await getCurrentPrice(h.type, h.code).catch(() => null);
      const currentValue = current ? current.price * totalUnits : null;
      const gainLoss = currentValue !== null ? currentValue - totalInvested : null;
      const gainLossPct = currentValue !== null && totalInvested > 0 ? (gainLoss! / totalInvested) * 100 : null;

      let fundXirr: number | null = null;
      if (currentValue !== null && investments.length > 0) {
        const cashflows = investments.map((i) => ({ date: new Date(i.date), amount: -i.units * i.price }));
        cashflows.push({ date: new Date(), amount: currentValue });
        fundXirr = xirr(cashflows);
      }

      return {
        id: h.id,
        type: h.type,
        name: h.name,
        code: h.code,
        investments: investments.map((i) => ({
          id: i.id,
          date: i.date,
          units: i.units,
          price: i.price,
          amount: i.units * i.price,
        })),
        totalUnits,
        totalInvested,
        currentPrice: current?.price ?? null,
        currentPriceDate: current?.date ?? null,
        currentValue,
        gainLoss,
        gainLossPct,
        xirr: fundXirr,
      };
    })
  );

  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, name, code } = body;
  if (!type || !name || !code || !["MF", "STOCK"].includes(type)) {
    return NextResponse.json({ error: "Invalid holding data" }, { status: 400 });
  }

  const pool = await getPool();

  const { rows: existing } = await pool.query("SELECT id FROM holdings WHERE type = $1 AND code = $2", [
    type,
    code,
  ]);
  if (existing.length > 0) {
    return NextResponse.json({ error: "This fund/stock is already added" }, { status: 409 });
  }

  const { rows } = await pool.query(
    "INSERT INTO holdings (type, name, code) VALUES ($1, $2, $3) RETURNING id",
    [type, name, code]
  );
  return NextResponse.json({ id: rows[0].id, type, name, code }, { status: 201 });
}
