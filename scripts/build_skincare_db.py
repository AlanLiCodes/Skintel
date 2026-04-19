"""
Build SQLite database from LauraAddams/skincareAPI CSV seed files.
Output: /Users/alangoodjob/Skintel/data/skincare.db
"""
import csv, sqlite3, os, glob, json, re

CSV_DIR = "/Users/alangoodjob/Skintel/scripts/seed_data"
DB_PATH = "/Users/alangoodjob/Skintel/data/skincare.db"

# Category detection from product name
CATEGORY_RULES = [
    (r"serum|essence|ampoule|booster|concentrate",         "serum"),
    (r"moistur|cream|lotion|emulsion|gel.*cream|balm.*face","moisturizer"),
    (r"cleanser|cleansing|foam.*clean|wash.*face|face.*wash|micellar|cleansing.*oil|makeup remover","cleanser"),
    (r"toner|softener|mist|spray.*face|face.*mist",         "toner"),
    (r"sun.*screen|sunscreen|sun.*block|spf|uv.*protect",  "sunscreen"),
    (r"eye.*cream|eye.*gel|eye.*serum|under.*eye",          "eye-cream"),
    (r"exfoliat|scrub|peel|aha|bha|acid.*toner|toner.*acid","exfoliant"),
    (r"mask|masque|pack|wrap",                              "mask"),
    (r"oil(?!.*(clean|remov))|face.*oil|dry.*oil|facial.*oil","oil"),
    (r"retinol|retin[ao]|vitamin.*a\b",                    "retinol"),
    (r"spot.*treat|acne.*treat|blemish|pimple.*patch",     "spot-treatment"),
    (r"primer|bb.*cream|cc.*cream|foundation|concealer|blush|bronz|highlight","makeup"),
    (r"lip.*balm|lip.*cream|lip.*treat|lip.*mask",         "lip-care"),
    (r"body.*lotion|body.*cream|body.*moistur|body.*wash|hand.*cream|hand.*lotion","body"),
    (r"shampoo|conditioner|hair.*mask|hair.*serum|scalp",  "hair"),
    (r"mist|setting.*spray|face.*spray",                   "mist"),
]

def guess_category(name: str) -> str:
    n = name.lower()
    for pattern, cat in CATEGORY_RULES:
        if re.search(pattern, n):
            return cat
    return "serum"  # sensible default for beauty products

os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

c.executescript("""
    DROP TABLE IF EXISTS products;
    CREATE TABLE products (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        brand         TEXT NOT NULL DEFAULT '',
        name          TEXT NOT NULL,
        category      TEXT NOT NULL DEFAULT 'serum',
        ingredient_list TEXT NOT NULL DEFAULT '[]'
    );
    CREATE INDEX idx_brand    ON products(brand);
    CREATE INDEX idx_name     ON products(name);
    CREATE INDEX idx_category ON products(category);
""")

inserted = 0
seen = set()

for csv_path in sorted(glob.glob(os.path.join(CSV_DIR, "*.csv"))):
    fname = os.path.basename(csv_path)
    with open(csv_path, newline='', encoding='utf-8-sig') as f:
        reader = csv.reader(f)
        headers = next(reader)
        # headers: brand, product_name, then all remaining cols are ingredients
        for row in reader:
            if len(row) < 3:
                continue
            brand = row[0].strip().lower()
            name  = row[1].strip().lower()
            # Ingredients: everything from col 2 onward, comma-separated
            raw_ings = [x.strip().lower() for x in row[2:] if x.strip()]
            # Some files pack all ingredients into col 2 as comma-separated
            if len(raw_ings) == 1 and ',' in raw_ings[0]:
                raw_ings = [i.strip() for i in raw_ings[0].split(',') if i.strip()]

            if not name:
                continue
            key = f"{brand}|{name}"
            if key in seen:
                continue
            seen.add(key)

            category = guess_category(name)
            ing_json = json.dumps(raw_ings[:60])

            c.execute(
                "INSERT INTO products (brand, name, category, ingredient_list) VALUES (?,?,?,?)",
                (brand, name, category, ing_json)
            )
            inserted += 1

conn.commit()

# Report category distribution
print(f"\n✓ Inserted {inserted} products into {DB_PATH}")
print(f"  DB size: {os.path.getsize(DB_PATH)/1000:.0f} KB\n")
print("Category breakdown:")
for row in c.execute("SELECT category, COUNT(*) as n FROM products GROUP BY category ORDER BY n DESC"):
    print(f"  {row[0]:<20} {row[1]}")

# Sample
print("\nSample products:")
for row in c.execute("SELECT id, brand, name, category FROM products LIMIT 6"):
    print(f"  [{row[0]}] {row[1]} — {row[2]} ({row[3]})")

conn.close()
