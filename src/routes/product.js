import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

// GET /api/products?category=Books&limit=20&cursor=<base64>
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const category = req.query.category || null;

    let cursorCreatedAt = null;
    let cursorId = null;

    if (req.query.cursor) {
      const decoded = JSON.parse(
        Buffer.from(req.query.cursor, 'base64').toString('utf-8')
      );
      cursorCreatedAt = decoded.created_at;
      cursorId = decoded.id;
    }

    const conditions = [];
    const params = [];

    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }

    if (cursorCreatedAt && cursorId) {
      params.push(cursorCreatedAt, cursorId);
      // tuple comparison -> seedha index se aage ki rows utha leta hai
      conditions.push(
        `(created_at, id) < ($${params.length - 1}, $${params.length})`
      );
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    params.push(limit);

    const query = `
      SELECT id, name, category, price, created_at, updated_at
      FROM products
      ${whereClause}
      ORDER BY created_at DESC, id DESC
      LIMIT $${params.length}
    `;

    const { rows } = await pool.query(query, params);

    let nextCursor = null;
    if (rows.length === limit) {
      const last = rows[rows.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({ created_at: last.created_at, id: last.id })
      ).toString('base64');
    }

    res.json({ data: rows, nextCursor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

export default router;