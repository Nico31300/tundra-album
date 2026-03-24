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

// GET /api/activity/users — all distinct users who have activity logs (admin only)
router.get('/users', authMiddleware, requireRole('admin'), (req, res) => {
  const users = db.prepare(`
    SELECT DISTINCT u.username
    FROM activity_logs al
    JOIN users u ON u.id = al.user_id
    ORDER BY u.username
  `).all();
  res.json(users.map(u => u.username));
});

const CATEGORY_ACTIONS = {
  inventory: ['piece_added', 'piece_removed', 'puzzle_completed', 'puzzle_reset', 'album_reset', 'duplicates_cleared'],
  users:     ['user_created', 'user_updated'],
  admin:     ['album_created', 'album_deleted', 'puzzle_created', 'puzzle_deleted', 'user_deleted', 'admin_user_updated'],
};

// GET /api/activity — paginated + filtered activity logs (admin only)
router.get('/', authMiddleware, requireRole('admin'), (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;
  const username = req.query.username || '';
  const category = req.query.category || 'all';
  const actions = CATEGORY_ACTIONS[category] ?? null;

  const conditions = [];
  const params = [];

  if (username) {
    conditions.push('u.username = ?');
    params.push(username);
  }
  if (actions) {
    conditions.push(`al.action IN (${actions.map(() => '?').join(',')})`);
    params.push(...actions);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = db.prepare(`
    SELECT COUNT(*) AS count FROM activity_logs al
    JOIN users u ON u.id = al.user_id ${where}
  `).get(...params).count;

  const logs = db.prepare(`
    SELECT al.id, al.action, al.label, al.created_at, u.username
    FROM activity_logs al
    JOIN users u ON u.id = al.user_id
    ${where}
    ORDER BY al.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({ logs, total, pages: Math.ceil(total / limit) || 1, page });
});

module.exports = router;
