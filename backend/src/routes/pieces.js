const express = require('express');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// PUT /api/pieces/:pieceId/stars — update star rating of a piece (admin action)
router.put('/:pieceId/stars', authMiddleware, (req, res) => {
  const { pieceId } = req.params;
  const { stars } = req.body;

  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return res.status(400).json({ error: 'Stars must be an integer between 1 and 5' });
  }

  const piece = db.prepare('SELECT id FROM pieces WHERE id = ?').get(pieceId);
  if (!piece) return res.status(404).json({ error: 'Pièce introuvable' });

  db.prepare('UPDATE pieces SET stars = ? WHERE id = ?').run(stars, pieceId);
  res.json({ pieceId: Number(pieceId), stars });
});

module.exports = router;
