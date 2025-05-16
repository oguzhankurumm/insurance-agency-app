import sqlite3 from "sqlite3";
import { open } from "sqlite";

export interface Accounting {
  id: number;
  policyId: number;
  transactionDate: string;
  amount: number;
  type: string;
  description: string;
}

const dbPromise = open({
  filename: "./insurance.db",
  driver: sqlite3.Database,
});

export async function dbGet<T>(
  query: string,
  params: unknown[] = []
): Promise<T | undefined> {
  const db = await dbPromise;
  return db.get(query, params);
}

export async function dbRun(
  query: string,
  params: unknown[] = []
): Promise<{ changes: number; lastID?: number }> {
  const db = await dbPromise;
  const result = await db.run(query, params);
  return { changes: result.changes || 0, lastID: result.lastID };
}

export async function dbAll<T>(
  query: string,
  params: unknown[] = []
): Promise<T[]> {
  const db = await dbPromise;
  return db.all(query, params);
}
