import fs from "fs";
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "skincare.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  if (!fs.existsSync(DB_PATH)) {
    throw new Error(
      `Missing ${DB_PATH}. Run: python3 scripts/build_skincare_db.py`
    );
  }

  // Read-only: avoid WAL pragma (can cause flaky opens on some serverless / shared FS).
  _db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  return _db;
}

export interface DbProduct {
  id: number;
  brand: string;
  name: string;
  category: string;
  ingredient_list: string; // JSON array string
}

export interface ParsedProduct {
  id: string;
  brand: string;
  name: string;
  category: string;
  ingredientList: string[];
}

export function parseProduct(row: DbProduct): ParsedProduct {
  return {
    id: String(row.id),
    brand: row.brand || "",
    name: row.name || "",
    category: row.category || "serum",
    ingredientList: safeJson(row.ingredient_list, []) as string[],
  };
}

function safeJson(str: string, fallback: unknown) {
  try { return JSON.parse(str); } catch { return fallback; }
}
