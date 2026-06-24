import express from 'express';
import { connectDB } from '../db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection('products');

    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const category = req.query.category || null;

    const filter = {};
    if (category) filter.category = category;

    if (req.query.cursor) {
      const decoded = JSON.parse(
        Buffer.from(req.query.cursor, 'base64').toString('utf-8')
      );
      filter.$or = [
        { created_at: { $lt: new Date(decoded.created_at) } },
        {
          created_at: new Date(decoded.created_at),
          _id: { $lt: new ObjectId(decoded.id) }
        }
      ];
    }

    const rows = await collection
      .find(filter)
      .sort({ created_at: -1, _id: -1 })
      .limit(limit)
      .toArray();

    let nextCursor = null;
    if (rows.length === limit) {
      const last = rows[rows.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({ created_at: last.created_at, id: last._id.toString() })
      ).toString('base64');
    }

    res.json({ data: rows, nextCursor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

export default router;