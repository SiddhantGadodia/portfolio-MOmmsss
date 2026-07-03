import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const pool = await getPool();
  await pool.query("DELETE FROM holdings WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
