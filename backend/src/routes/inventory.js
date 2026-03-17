const express = require('express');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// PUT /api/inventory/:pieceId — set status for a piece (or delete if status is null)
router.put('/:pieceId', authMiddleware, (req, res) => {
  const { pieceId } = req.params;
  const { status } = req.body; // 'need', 'have_duplicate', or null to remove
  const userId = req.user.id;

  const piece = db.prepare('SELECT id FROM pieces WHERE id = ?').get(pieceId);
  if (!piece) return res.status(404).json({ error: 'Pièce introuvable' });

  if (status === null || status === undefined) {
    db.prepare('DELETE FROM inventory WHERE user_id = ? AND piece_id = ?').run(userId, pieceId);
  } else if (status === 'need' || status === 'have_duplicate') {
    db.prepare(`
      INSERT INTO inventory (user_id, piece_id, status)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, piece_id) DO UPDATE SET status = excluded.status
    `).run(userId, pieceId, status);
  } else {
    return res.status(400).json({ error: 'Status invalide' });
  }

  res.json({ pieceId: Number(pieceId), status: status || null });
});

module.exports = router;
