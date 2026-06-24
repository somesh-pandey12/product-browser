import { pool } from '../src/db.js';

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Toys', 'Sports', 'Beauty', 'Grocery'];
const TOTAL = 200000;
const BATCH_SIZE = 2000;

function randomProduct(i) {
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const price = (Math.random() * 5000 + 10).toFixed(2);
  const name = `${category} Item ${i}`;
  return { name, category, price };
}

async function createTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // Indexes jo pagination + filtering ko fast banayenge
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_created_id
    ON products (created_at DESC, id DESC);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_category_created_id
    ON products (category, created_at DESC, id DESC);
  `);
}

async function seed() {
  await createTable();

  console.log(`Seeding ${TOTAL} products...`);
  const start = Date.now();

  for (let i = 0; i < TOTAL; i += BATCH_SIZE) {
    const batchCount = Math.min(BATCH_SIZE, TOTAL - i);
    const values = [];
    const params = [];

    for (let j = 0; j < batchCount; j++) {
      const { name, category, price } = randomProduct(i + j);
      params.push(name, category, price);
      const base = j * 3;
      values.push(`($${base + 1}, $${base + 2}, $${base + 3})`);
    }

    const query = `
      INSERT INTO products (name, category, price)
      VALUES ${values.join(',')}
    `;
    await pool.query(query, params);

    if (i % 20000 === 0) console.log(`Inserted ${i} rows...`);
  }

  console.log(`Done in ${(Date.now() - start) / 1000}s`);
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});