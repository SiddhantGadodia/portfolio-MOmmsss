import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const holdingId = Number(params.id);
  const body = await req.json();
  const { date, units, price } = body;

  if (!date || typeof units !== "number" || typeof price !== "number" || units <= 0 || price <= 0) {
    return NextResponse.json({ error: "Invalid investment data" }, { status: 400 });
  }

  const pool = await getPool();

  const { rows: holding } = await pool.query("SELECT id FROM holdings WHERE id = $1", [holdingId]);
  if (holding.length === 0) {
    return NextResponse.json({ error: "Holding not found" }, { status: 404 });
  }

  const { rows } = await pool.query(
    "INSERT INTO investments (holding_id, date, units, price) VALUES ($1, $2, $3, $4) RETURNING id",
    [holdingId, date, units, price]
  );

  return NextResponse.json({ id: rows[0].id, holdingId, date, units, price }, { status: 201 });
}
