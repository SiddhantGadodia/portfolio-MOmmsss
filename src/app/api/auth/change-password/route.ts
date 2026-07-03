import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { generateSalt, hashPassword, verifyPassword } from "@/lib/password";
import { SESSION_COOKIE_NAME, verifySessionCookieValue } from "@/lib/session";

type AuthRow = { username: string; password_hash: string; password_salt: string };

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const username = cookie ? await verifySessionCookieValue(cookie) : null;
  if (!username) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword || String(newPassword).length < 6) {
    return NextResponse.json(
      { error: "New password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const pool = await getPool();
  const { rows } = await pool.query<AuthRow>(
    "SELECT username, password_hash, password_salt FROM auth WHERE id = 1"
  );
  const row = rows[0];

  if (!row || !verifyPassword(currentPassword, row.password_salt, row.password_hash)) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  const newSalt = generateSalt();
  const newHash = hashPassword(newPassword, newSalt);
  await pool.query("UPDATE auth SET password_hash = $1, password_salt = $2 WHERE id = 1", [
    newHash,
    newSalt,
  ]);

  return NextResponse.json({ ok: true });
}
