const express = require('express');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/search?q=... — search puzzles by name
router.get('/', authMiddleware, (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);

  const results = db.prepare(`
    SELECT pz.id, pz.name, a.id AS album_id, a.name AS album_name
    FROM puzzles pz
    JOIN albums a ON a.id = pz.album_id
    WHERE pz.name LIKE ?
    ORDER BY a.position, pz.position
    LIMIT 20
  `).all(`%${q}%`);

  res.json(results);
});

module.exports = router;
