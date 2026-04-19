import { NextRequest, NextResponse } from "next/server";
import { getDb, parseProduct, type DbProduct } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const row = db.prepare("SELECT * FROM products WHERE id = ?").get(params.id) as DbProduct | undefined;
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(parseProduct(row));
  } catch {
    return NextResponse.json({ error: "Database error" }, { status: 503 });
  }
}
