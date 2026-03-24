const express = require('express');
const db = require('../database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/activity/summary — 24h activity counts (all authenticated users)
router.get('/summary', authMiddleware, (req, res) => {
  const pieceRow = db.prepare(`
    SELECT COUNT(DISTINCT user_id) as users, COUNT(*) as events FROM activity_logs
    WHERE action IN ('piece_added', 'piece_removed', 'duplicates_cleared', 'puzzle_completed', 'puzzle_reset', 'album_reset')
    AND created_at >= datetime('now', '-24 hours')
  `).get();
  const pieces = pieceRow.users;
  const pieceEvents = pieceRow.events;

  const newUsers = db.prepare(`
    SELECT COUNT(*) as count FROM activity_logs
    WHERE action = 'user_created'
    AND created_at >= datetime('now', '-24 hours')
  `).get().count;

  res.json({ pieces, pieceEvents, newUsers });
});

// GET /api/activity — last 20 activity logs (admin only)
router.get('/', authMiddleware, requireRole('admin'), (req, res) => {
  const logs = db.prepare(`
    SELECT al.id, al.action, al.label, al.created_at, u.username
    FROM activity_logs al
    JOIN users u ON u.id = al.user_id
    ORDER BY al.created_at DESC
    LIMIT 20
  `).all();
  res.json(logs);
});

module.exports = router;
