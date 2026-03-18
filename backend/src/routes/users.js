const express = require('express');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/users — all users with inventory summary
router.get('/', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const currentUser = db.prepare('SELECT alliance FROM users WHERE id = ?').get(userId);

  const rows = db.prepare(`
    SELECT u.id, u.username, u.alliance,
           SUM(CASE WHEN i.status = 'need' THEN 1 ELSE 0 END) AS need,
           SUM(CASE WHEN i.status = 'have_duplicate' THEN 1 ELSE 0 END) AS have_duplicate,
           MAX(i.updated_at) AS last_updated
    FROM users u
    LEFT JOIN inventory i ON i.user_id = u.id
    WHERE u.id != ?
    GROUP BY u.id
  `).all(userId);

  res.json(rows.map(u => ({
    ...u,
    sameAlliance: !!(currentUser?.alliance && u.alliance === currentUser.alliance),
  })));
});

module.exports = router;
