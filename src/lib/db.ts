import { Pool } from "pg";
import { generateSalt, hashPassword } from "./password";

// Only used to seed the auth row the very first time this connects to an empty database.
// Set these in the environment; never hardcode real credentials in source.
const DEFAULT_USERNAME = process.env.AUTH_DEFAULT_USERNAME ?? "admin";
const DEFAULT_PASSWORD = process.env.AUTH_DEFAULT_PASSWORD ?? "changeme";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __schemaReady: Promise<void> | undefined;
}

export const pool =
  global.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") {
  global.__pgPool = pool;
}

async function ensureSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS holdings (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL CHECK (type IN ('MF', 'STOCK')),
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS investments (
      id SERIAL PRIMARY KEY,
      holding_id INTEGER NOT NULL REFERENCES holdings(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      units DOUBLE PRECISION NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_investments_holding_id ON investments(holding_id);

    CREATE TABLE IF NOT EXISTS auth (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL
    );
  `);

  const { rows } = await pool.query("SELECT id FROM auth WHERE id = 1");
  if (rows.length === 0) {
    const salt = generateSalt();
    const hash = hashPassword(DEFAULT_PASSWORD, salt);
    await pool.query(
      "INSERT INTO auth (id, username, password_hash, password_salt) VALUES (1, $1, $2, $3)",
      [DEFAULT_USERNAME, hash, salt]
    );
  }
}

export async function getPool(): Promise<Pool> {
  if (!global.__schemaReady) {
    global.__schemaReady = ensureSchema();
  }
  await global.__schemaReady;
  return pool;
}
