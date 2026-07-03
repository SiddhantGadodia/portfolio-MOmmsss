import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const body = await req.json();
  const { date, units, price } = body;

  if (!date || typeof units !== "number" || typeof price !== "number" || units <= 0 || price <= 0) {
    return NextResponse.json({ error: "Invalid investment data" }, { status: 400 });
  }

  const pool = await getPool();
  await pool.query("UPDATE investments SET date = $1, units = $2, price = $3 WHERE id = $4", [
    date,
    units,
    price,
    id,
  ]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const pool = await getPool();
  await pool.query("DELETE FROM investments WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
