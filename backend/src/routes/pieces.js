const express = require('express');
const db = require('../database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/pieces/available — pieces the current user needs that someone else has as duplicate
router.get('/available', authMiddleware, (req, res) => {
  const { since } = req.query;
  const sinceClause = since ? 'AND i_other.updated_at > ?' : '';
  const params = since ? [req.user.id, since] : [req.user.id];

  const rows = db.prepare(`
    SELECT
      p.id        AS piece_id,
      p.name      AS piece_name,
      p.stars,
      p.position  AS piece_position,
      puz.id      AS puzzle_id,
      puz.name    AS puzzle_name,
      puz.position AS puzzle_position,
      a.id        AS album_id,
      a.name      AS album_name,
      a.position  AS album_position,
      u.id        AS provider_id,
      u.username  AS provider_username,
      u.alliance  AS provider_alliance,
      i_other.updated_at
    FROM inventory i_me
    JOIN inventory i_other
      ON i_other.piece_id = i_me.piece_id AND i_other.user_id != i_me.user_id
    JOIN pieces p   ON p.id = i_me.piece_id
    JOIN puzzles puz ON puz.id = p.puzzle_id
    JOIN albums a   ON a.id = puz.album_id
    JOIN users u    ON u.id = i_other.user_id
    WHERE i_me.user_id = ?
      AND i_me.status = 'need'
      AND i_other.status = 'have_duplicate'
      ${sinceClause}
    ORDER BY a.position, puz.position, p.position
  `).all(...params);

  // Group into albums → puzzles → pieces with provider arrays
  const albumMap = new Map();
  for (const row of rows) {
    if (!albumMap.has(row.album_id)) {
      albumMap.set(row.album_id, { album_id: row.album_id, album_name: row.album_name, puzzles: new Map() });
    }
    const album = albumMap.get(row.album_id);
    if (!album.puzzles.has(row.puzzle_id)) {
      album.puzzles.set(row.puzzle_id, { puzzle_id: row.puzzle_id, puzzle_name: row.puzzle_name, pieces: new Map() });
    }
    const puzzle = album.puzzles.get(row.puzzle_id);
    if (!puzzle.pieces.has(row.piece_id)) {
      puzzle.pieces.set(row.piece_id, { piece_id: row.piece_id, piece_name: row.piece_name, stars: row.stars, providers: [] });
    }
    puzzle.pieces.get(row.piece_id).providers.push({
      user_id: row.provider_id,
      username: row.provider_username,
      alliance: row.provider_alliance,
      updated_at: row.updated_at,
    });
  }

  const result = Array.from(albumMap.values()).map(a => ({
    album_id: a.album_id,
    album_name: a.album_name,
    puzzles: Array.from(a.puzzles.values()).map(puz => ({
      puzzle_id: puz.puzzle_id,
      puzzle_name: puz.puzzle_name,
      pieces: Array.from(puz.pieces.values()),
    })),
  }));

  res.json(result);
});

// PUT /api/pieces/:pieceId/stars — update star rating of a piece (admin/stars_editor only)
router.put('/:pieceId/stars', authMiddleware, requireRole('admin', 'stars_editor'), (req, res) => {
  const { pieceId } = req.params;
  const { stars } = req.body;

  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return res.status(400).json({ error: 'Stars must be an integer between 1 and 5' });
  }

  const piece = db.prepare('SELECT id FROM pieces WHERE id = ?').get(pieceId);
  if (!piece) return res.status(404).json({ error: 'Piece not found' });

  db.prepare('UPDATE pieces SET stars = ? WHERE id = ?').run(stars, pieceId);
  res.json({ pieceId: Number(pieceId), stars });
});

module.exports = router;
