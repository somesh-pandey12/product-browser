import { connectDB } from '../src/db.js';

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Toys', 'Sports', 'Beauty', 'Grocery'];
const TOTAL = 200000;
const BATCH_SIZE = 2000;

function randomProduct() {
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const price = parseFloat((Math.random() * 5000 + 10).toFixed(2));
  const now = new Date();
  return {
    name: `${category} Item ${Math.floor(Math.random() * 1000000)}`,
    category,
    price,
    created_at: now,
    updated_at: now
  };
}

async function seed() {
  const db = await connectDB();
  const collection = db.collection('products');

  await collection.deleteMany({});

  await collection.createIndex({ created_at: -1, _id: -1 });
  await collection.createIndex({ category: 1, created_at: -1, _id: -1 });

  console.log(`Seeding ${TOTAL} products...`);
  const start = Date.now();

  for (let i = 0; i < TOTAL; i += BATCH_SIZE) {
    const batchCount = Math.min(BATCH_SIZE, TOTAL - i);
    const batch = Array.from({ length: batchCount }, randomProduct);
    await collection.insertMany(batch);

    if (i % 20000 === 0) console.log(`Inserted ${i} rows...`);
  }

  console.log(`Done in ${(Date.now() - start) / 1000}s`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});