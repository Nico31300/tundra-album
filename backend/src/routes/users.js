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

// GET /api/users/:userId/albums — albums with target user's inventory stats
router.get('/:userId/albums', authMiddleware, (req, res) => {
  const { userId } = req.params;

  const user = db.prepare('SELECT id, username, alliance FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

  const albums = db.prepare('SELECT * FROM albums ORDER BY position').all();

  const stats = db.prepare(`
    SELECT pz.album_id,
           COUNT(p.id) AS total,
           SUM(CASE WHEN i.status = 'need' THEN 1 ELSE 0 END) AS need,
           SUM(CASE WHEN i.status = 'have_duplicate' THEN 1 ELSE 0 END) AS have_duplicate,
           MAX(i.updated_at) AS last_updated
    FROM puzzles pz
    JOIN pieces p ON p.puzzle_id = pz.id
    LEFT JOIN inventory i ON i.piece_id = p.id AND i.user_id = ?
    GROUP BY pz.album_id
  `).all(userId);

  const statsByAlbum = Object.fromEntries(stats.map(s => [s.album_id, s]));

  res.json({
    user,
    albums: albums.map(album => ({ ...album, stats: statsByAlbum[album.id] ?? { total: 0, need: 0, have_duplicate: 0 } })),
  });
});

// GET /api/users/:userId/albums/:albumId — album detail with target user's status + current user's have_duplicate
router.get('/:userId/albums/:albumId', authMiddleware, (req, res) => {
  const { userId, albumId } = req.params;
  const currentUserId = req.user.id;

  const user = db.prepare('SELECT id, username, alliance FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

  const album = db.prepare('SELECT * FROM albums WHERE id = ?').get(albumId);
  if (!album) return res.status(404).json({ error: 'Album introuvable' });

  const puzzles = db.prepare('SELECT * FROM puzzles WHERE album_id = ? ORDER BY position').all(albumId);

  const puzzlesWithPieces = puzzles.map(puzzle => {
    const pieces = db.prepare(`
      SELECT p.*,
             i_target.status AS status,
             i_me.status AS my_status
      FROM pieces p
      LEFT JOIN inventory i_target ON i_target.piece_id = p.id AND i_target.user_id = ?
      LEFT JOIN inventory i_me ON i_me.piece_id = p.id AND i_me.user_id = ?
      WHERE p.puzzle_id = ?
      ORDER BY p.position
    `).all(userId, currentUserId, puzzle.id);
    const lastUpdated = db.prepare(`
      SELECT MAX(i.updated_at) AS last_updated
      FROM pieces p
      JOIN inventory i ON i.piece_id = p.id AND i.user_id = ?
      WHERE p.puzzle_id = ?
    `).get(userId, puzzle.id);
    return { ...puzzle, pieces, last_updated: lastUpdated?.last_updated ?? null };
  });

  res.json({ user, album: { ...album, puzzles: puzzlesWithPieces } });
});

module.exports = router;
