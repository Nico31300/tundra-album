const express = require('express');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/albums — list all albums
router.get('/', authMiddleware, (_req, res) => {
  const albums = db.prepare('SELECT * FROM albums ORDER BY position').all();
  res.json(albums);
});

// GET /api/albums/:albumId — puzzles + pieces for an album, with user inventory
router.get('/:albumId', authMiddleware, (req, res) => {
  const { albumId } = req.params;
  const userId = req.user.id;

  const album = db.prepare('SELECT * FROM albums WHERE id = ?').get(albumId);
  if (!album) return res.status(404).json({ error: 'Album introuvable' });

  const puzzles = db.prepare('SELECT * FROM puzzles WHERE album_id = ? ORDER BY position').all(albumId);

  const puzzlesWithPieces = puzzles.map(puzzle => {
    const pieces = db.prepare(`
      SELECT p.*, i.status
      FROM pieces p
      LEFT JOIN inventory i ON i.piece_id = p.id AND i.user_id = ?
      WHERE p.puzzle_id = ?
      ORDER BY p.position
    `).all(userId, puzzle.id);
    return { ...puzzle, pieces };
  });

  res.json({ ...album, puzzles: puzzlesWithPieces });
});

// GET /api/albums/:albumId/users — inventory of all other users for this album
router.get('/:albumId/users', authMiddleware, (req, res) => {
  const { albumId } = req.params;
  const userId = req.user.id;

  const currentUser = db.prepare('SELECT alliance FROM users WHERE id = ?').get(userId);

  const rows = db.prepare(`
    SELECT u.id, u.username, u.alliance,
           i.piece_id, i.status
    FROM users u
    JOIN inventory i ON i.user_id = u.id
    JOIN pieces p ON p.id = i.piece_id
    JOIN puzzles pz ON pz.id = p.puzzle_id
    WHERE u.id != ? AND pz.album_id = ?
  `).all(userId, albumId);

  // Group by user
  const byUser = {};
  for (const row of rows) {
    if (!byUser[row.id]) {
      byUser[row.id] = {
        id: row.id,
        username: row.username,
        alliance: row.alliance,
        sameAlliance: !!(currentUser?.alliance && row.alliance === currentUser.alliance),
        inventory: {},
      };
    }
    byUser[row.id].inventory[row.piece_id] = row.status;
  }

  res.json(Object.values(byUser));
});

module.exports = router;
