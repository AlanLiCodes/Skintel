import { NextRequest, NextResponse } from "next/server";
import { getDb, parseProduct, type DbProduct } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query    = (searchParams.get("q") || "").trim().toLowerCase();
  const category = searchParams.get("category") || "all";
  const limit    = Math.min(parseInt(searchParams.get("limit") || "24"), 100);
  const offset   = parseInt(searchParams.get("offset") || "0");

  try {
    const db = getDb();
    const params: (string | number)[] = [];
    let sql = `SELECT * FROM products WHERE 1=1`;

    if (query) {
      sql += ` AND (name LIKE ? OR brand LIKE ? OR ingredient_list LIKE ?)`;
      const like = `%${query}%`;
      params.push(like, like, like);
    }
    if (category && category !== "all") {
      sql += ` AND category = ?`;
      params.push(category);
    }

    // Count
    const countSql = sql.replace("SELECT *", "SELECT COUNT(*) as total");
    const { total } = db.prepare(countSql).get(...params) as { total: number };

    sql += ` ORDER BY brand ASC, name ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = db.prepare(sql).all(...params) as DbProduct[];
    return NextResponse.json({ products: rows.map(parseProduct), total, offset, limit });
  } catch (err) {
    console.error("Products DB error:", err);
    return NextResponse.json({ error: "Database not ready." }, { status: 503 });
  }
}
