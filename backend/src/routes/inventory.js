const express = require('express');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// PUT /api/inventory/:pieceId — set status for a piece (or delete if status is null)
router.put('/:pieceId', authMiddleware, (req, res) => {
  const { pieceId } = req.params;
  const { status } = req.body; // 'need', 'have_duplicate', or null to remove
  const userId = req.user.id;

  try {
    const piece = db.prepare(`
      SELECT p.id, p.name as piece_name, pz.name as puzzle_name
      FROM pieces p JOIN puzzles pz ON pz.id = p.puzzle_id
      WHERE p.id = ?
    `).get(pieceId);
    if (!piece) return res.status(404).json({ error: 'Pièce introuvable' });

    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId);
    const existing = db.prepare('SELECT status FROM inventory WHERE user_id = ? AND piece_id = ?').get(userId, pieceId);
    const prevStatus = existing?.status ?? null;

    if (status === null || status === undefined) {
      db.prepare('DELETE FROM inventory WHERE user_id = ? AND piece_id = ?').run(userId, pieceId);
      db.prepare(`INSERT INTO activity_logs (user_id, action, label) VALUES (?, 'piece_removed', ?)`)
        .run(userId, `${user.username} removed ${piece.piece_name} (${piece.puzzle_name})`);
    } else if (status === 'need' || status === 'have_duplicate' || status === 'have') {
      db.prepare(`
        INSERT INTO inventory (user_id, piece_id, status, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, piece_id) DO UPDATE SET status = excluded.status, updated_at = CURRENT_TIMESTAMP
      `).run(userId, pieceId, status);
      // Determine if this is an add or remove based on the transition
      const isRemove = status === 'need' || (status === 'have' && prevStatus === 'have_duplicate');
      if (isRemove) {
        db.prepare(`INSERT INTO activity_logs (user_id, action, label) VALUES (?, 'piece_removed', ?)`)
          .run(userId, `${user.username} removed ${piece.piece_name} (${piece.puzzle_name})`);
      } else {
        db.prepare(`INSERT INTO activity_logs (user_id, action, label) VALUES (?, 'piece_added', ?)`)
          .run(userId, `${user.username} added ${piece.piece_name} (${piece.puzzle_name})`);
      }
    } else {
      return res.status(400).json({ error: 'Status invalide' });
    }

    res.json({ pieceId: Number(pieceId), status: status || null });
  } catch (e) {
    console.error('Inventory error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/inventory/album/:albumId — reset all pieces of an album for current user
router.delete('/album/:albumId', authMiddleware, (req, res) => {
  const { albumId } = req.params;
  const userId = req.user.id;

  try {
    const album = db.prepare('SELECT id, name FROM albums WHERE id = ?').get(albumId);
    if (!album) return res.status(404).json({ error: 'Album introuvable' });

    db.prepare(`
      DELETE FROM inventory
      WHERE user_id = ? AND piece_id IN (
        SELECT p.id FROM pieces p
        JOIN puzzles pz ON pz.id = p.puzzle_id
        WHERE pz.album_id = ?
      )
    `).run(userId, albumId);

    db.prepare(`INSERT INTO activity_logs (user_id, action, label) VALUES (?, 'album_reset', ?)`)
      .run(userId, `${req.user.username} reset album ${album.name}`);

    res.json({ albumId: Number(albumId) });
  } catch (e) {
    console.error('Inventory reset error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/inventory/album/:albumId/duplicates — reset only have_duplicate pieces of an album for current user
router.delete('/album/:albumId/duplicates', authMiddleware, (req, res) => {
  const { albumId } = req.params;
  const userId = req.user.id;

  try {
    const album = db.prepare('SELECT id, name FROM albums WHERE id = ?').get(albumId);
    if (!album) return res.status(404).json({ error: 'Album introuvable' });

    db.prepare(`
      UPDATE inventory
      SET status = 'have', updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND status = 'have_duplicate' AND piece_id IN (
        SELECT p.id FROM pieces p
        JOIN puzzles pz ON pz.id = p.puzzle_id
        WHERE pz.album_id = ?
      )
    `).run(userId, albumId);

    db.prepare(`INSERT INTO activity_logs (user_id, action, label) VALUES (?, 'duplicates_cleared', ?)`)
      .run(userId, `${req.user.username} cleared duplicates for ${album.name}`);

    res.json({ albumId: Number(albumId) });
  } catch (e) {
    console.error('Inventory reset duplicates error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/inventory/puzzle/:puzzleId/complete — mark all pieces of a puzzle as 'have'
router.put('/puzzle/:puzzleId/complete', authMiddleware, (req, res) => {
  const { puzzleId } = req.params;
  const userId = req.user.id;

  try {
    const puzzle = db.prepare('SELECT id, name FROM puzzles WHERE id = ?').get(puzzleId);
    if (!puzzle) return res.status(404).json({ error: 'Puzzle introuvable' });

    const pieces = db.prepare('SELECT id FROM pieces WHERE puzzle_id = ?').all(puzzleId);
    const upsert = db.prepare(`
      INSERT INTO inventory (user_id, piece_id, status, updated_at)
      VALUES (?, ?, 'have', CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, piece_id) DO UPDATE SET
        status = CASE WHEN inventory.status = 'have_duplicate' THEN 'have_duplicate' ELSE 'have' END,
        updated_at = CURRENT_TIMESTAMP
    `);
    db.transaction((ps) => { for (const p of ps) upsert.run(userId, p.id); })(pieces);

    db.prepare(`INSERT INTO activity_logs (user_id, action, label) VALUES (?, 'puzzle_completed', ?)`)
      .run(userId, `${req.user.username} completed puzzle ${puzzle.name}`);

    res.json({ puzzleId: Number(puzzleId) });
  } catch (e) {
    console.error('Inventory complete error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/inventory/puzzle/:puzzleId — reset all pieces of a puzzle for current user
router.delete('/puzzle/:puzzleId', authMiddleware, (req, res) => {
  const { puzzleId } = req.params;
  const userId = req.user.id;

  try {
    const puzzle = db.prepare('SELECT id, name FROM puzzles WHERE id = ?').get(puzzleId);
    if (!puzzle) return res.status(404).json({ error: 'Puzzle introuvable' });

    db.prepare(`
      DELETE FROM inventory
      WHERE user_id = ? AND piece_id IN (SELECT id FROM pieces WHERE puzzle_id = ?)
    `).run(userId, puzzleId);

    db.prepare(`INSERT INTO activity_logs (user_id, action, label) VALUES (?, 'puzzle_reset', ?)`)
      .run(userId, `${req.user.username} reset puzzle ${puzzle.name}`);

    res.json({ puzzleId: Number(puzzleId) });
  } catch (e) {
    console.error('Inventory reset error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
