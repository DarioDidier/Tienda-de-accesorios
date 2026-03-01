import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("mirylou.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category_id INTEGER,
    image_url TEXT,
    description TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    date TEXT NOT NULL,
    total REAL NOT NULL,
    items_json TEXT NOT NULL
  );
`);

// Seed initial categories if empty
const categoryCount = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
if (categoryCount.count === 0) {
  const insertCategory = db.prepare("INSERT INTO categories (name) VALUES (?)");
  ["Relojes", "Anillos", "Bijouterie", "Cartucheras", "Pulseras", "Aritos"].forEach(cat => insertCategory.run(cat));
}

// Seed initial products if empty
const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
if (productCount.count === 0) {
  const categories = db.prepare("SELECT * FROM categories").all() as any[];
  const insertProduct = db.prepare("INSERT INTO products (name, price, category_id, image_url, description) VALUES (?, ?, ?, ?, ?)");
  
  const findCat = (name: string) => categories.find(c => c.name === name)?.id;

  insertProduct.run("Reloj Rose Gold", 15500, findCat("Relojes"), "https://images.unsplash.com/photo-1524333892444-2103734a1092?auto=format&fit=crop&q=80&w=400", "Reloj elegante con malla de acero inoxidable.");
  insertProduct.run("Anillo Diamante", 8900, findCat("Anillos"), "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400", "Anillo de plata con piedra brillante.");
  insertProduct.run("Pulsera Perlas", 4500, findCat("Pulseras"), "https://images.unsplash.com/photo-1573408302185-9127fe5a9200?auto=format&fit=crop&q=80&w=400", "Pulsera delicada con perlas cultivadas.");
  insertProduct.run("Aritos Colgantes", 3200, findCat("Aritos"), "https://images.unsplash.com/photo-1535633302713-1026115e9209?auto=format&fit=crop&q=80&w=400", "Aritos modernos para cualquier ocasión.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/categories", (req, res) => {
    const categories = db.prepare("SELECT * FROM categories").all();
    res.json(categories);
  });

  app.post("/api/categories", (req, res) => {
    const { name } = req.body;
    try {
      const result = db.prepare("INSERT INTO categories (name) VALUES (?)").run(name);
      res.json({ id: result.lastInsertRowid, name });
    } catch (e) {
      res.status(400).json({ error: "Category already exists" });
    }
  });

  app.get("/api/products", (req, res) => {
    const products = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
    `).all();
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    const { name, price, category_id, image_url, description } = req.body;
    const result = db.prepare(`
      INSERT INTO products (name, price, category_id, image_url, description) 
      VALUES (?, ?, ?, ?, ?)
    `).run(name, price, category_id, image_url, description);
    res.json({ id: result.lastInsertRowid, ...req.body });
  });

  app.put("/api/products/:id", (req, res) => {
    const { id } = req.params;
    const { name, price, category_id, image_url, description } = req.body;
    db.prepare(`
      UPDATE products 
      SET name = ?, price = ?, category_id = ?, image_url = ?, description = ?
      WHERE id = ?
    `).run(name, price, category_id, image_url, description, id);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM products WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/sales", (req, res) => {
    const sales = db.prepare("SELECT * FROM sales ORDER BY date DESC").all();
    res.json(sales.map((s: any) => ({ ...s, items: JSON.parse(s.items_json) })));
  });

  app.post("/api/sales", (req, res) => {
    const { invoice_number, date, total, items } = req.body;
    const result = db.prepare(`
      INSERT INTO sales (invoice_number, date, total, items_json) 
      VALUES (?, ?, ?, ?)
    `).run(invoice_number, date, total, JSON.stringify(items));
    res.json({ id: result.lastInsertRowid });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
