const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware, requireRole('admin'));

// GET /api/admin/users
router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.username, u.alliance, u.created_at, r.name as role
    FROM users u JOIN roles r ON r.id = u.role_id
    ORDER BY u.id
  `).all();
  res.json(users);
});

// PUT /api/admin/users/:id
router.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const { username, alliance, password, role } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

  try {
    if (password) {
      const hash = bcrypt.hashSync(password, 10);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, id);
    }
    const roleRow = role ? db.prepare('SELECT id FROM roles WHERE name = ?').get(role) : null;
    db.prepare(`
      UPDATE users SET
        username = COALESCE(?, username),
        alliance = ?,
        role_id = COALESCE(?, role_id)
      WHERE id = ?
    `).run(username || null, alliance !== undefined ? (alliance || null) : user.alliance, roleRow?.id ?? null, id);

    const updated = db.prepare(`
      SELECT u.id, u.username, u.alliance, u.created_at, r.name as role
      FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?
    `).get(id);
    res.json(updated);
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Nom d\'utilisateur déjà pris' });
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  if (Number(id) === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

  db.prepare('DELETE FROM inventory WHERE user_id = ?').run(id);
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ id: Number(id) });
});

// GET /api/admin/albums
router.get('/albums', (req, res) => {
  const albums = db.prepare('SELECT * FROM albums ORDER BY position').all();
  const result = albums.map(album => {
    const puzzles = db.prepare('SELECT id, name, position FROM puzzles WHERE album_id = ? ORDER BY position').all(album.id);
    return { ...album, puzzles };
  });
  res.json(result);
});

// POST /api/admin/albums
router.post('/albums', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name requis' });
  const maxPos = db.prepare('SELECT MAX(position) as max FROM albums').get();
  const position = (maxPos.max ?? 0) + 1;
  const result = db.prepare('INSERT INTO albums (name, position) VALUES (?, ?)').run(name.trim(), position);
  res.json({ id: result.lastInsertRowid, name: name.trim(), position, puzzles: [] });
});

// PUT /api/admin/albums/:id
router.put('/albums/:id', (req, res) => {
  const { id } = req.params;
  const { name, position } = req.body;

  const album = db.prepare('SELECT * FROM albums WHERE id = ?').get(id);
  if (!album) return res.status(404).json({ error: 'Album introuvable' });

  try {
    db.prepare('UPDATE albums SET name = COALESCE(?, name), position = COALESCE(?, position) WHERE id = ?')
      .run(name ?? null, position ?? null, id);
    res.json(db.prepare('SELECT * FROM albums WHERE id = ?').get(id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/admin/albums/:id
router.delete('/albums/:id', (req, res) => {
  const { id } = req.params;
  const album = db.prepare('SELECT * FROM albums WHERE id = ?').get(id);
  if (!album) return res.status(404).json({ error: 'Album introuvable' });

  db.prepare(`DELETE FROM inventory WHERE piece_id IN (
    SELECT p.id FROM pieces p JOIN puzzles pz ON pz.id = p.puzzle_id WHERE pz.album_id = ?
  )`).run(id);
  db.prepare(`DELETE FROM pieces WHERE puzzle_id IN (SELECT id FROM puzzles WHERE album_id = ?)`).run(id);
  db.prepare('DELETE FROM puzzles WHERE album_id = ?').run(id);
  db.prepare('DELETE FROM albums WHERE id = ?').run(id);
  res.json({ id: Number(id) });
});

// POST /api/admin/albums/:albumId/puzzles
router.post('/albums/:albumId/puzzles', (req, res) => {
  const { albumId } = req.params;
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name requis' });

  const album = db.prepare('SELECT id FROM albums WHERE id = ?').get(albumId);
  if (!album) return res.status(404).json({ error: 'Album introuvable' });

  const maxPos = db.prepare('SELECT MAX(position) as max FROM puzzles WHERE album_id = ?').get(albumId);
  const position = (maxPos.max ?? 0) + 1;
  const result = db.prepare('INSERT INTO puzzles (album_id, name, position) VALUES (?, ?, ?)').run(albumId, name.trim(), position);
  res.json({ id: result.lastInsertRowid, album_id: Number(albumId), name: name.trim(), position });
});

// PUT /api/admin/puzzles/:id
router.put('/puzzles/:id', (req, res) => {
  const { id } = req.params;
  const { name, position } = req.body;

  const puzzle = db.prepare('SELECT * FROM puzzles WHERE id = ?').get(id);
  if (!puzzle) return res.status(404).json({ error: 'Puzzle introuvable' });

  try {
    db.prepare('UPDATE puzzles SET name = COALESCE(?, name), position = COALESCE(?, position) WHERE id = ?')
      .run(name ?? null, position ?? null, id);
    res.json(db.prepare('SELECT * FROM puzzles WHERE id = ?').get(id));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/puzzles/:id/piece-count
router.get('/puzzles/:id/piece-count', (req, res) => {
  const { id } = req.params;
  const row = db.prepare('SELECT COUNT(*) as count FROM pieces WHERE puzzle_id = ?').get(id);
  res.json({ puzzleId: Number(id), count: row.count });
});

// PUT /api/admin/puzzles/:id/piece-count — set the number of pieces (add or remove from the end)
router.put('/puzzles/:id/piece-count', (req, res) => {
  const { id } = req.params;
  const { count } = req.body;

  if (!Number.isInteger(count) || count < 0) {
    return res.status(400).json({ error: 'count must be a non-negative integer' });
  }

  const puzzle = db.prepare('SELECT * FROM puzzles WHERE id = ?').get(id);
  if (!puzzle) return res.status(404).json({ error: 'Puzzle introuvable' });

  const pieces = db.prepare('SELECT * FROM pieces WHERE puzzle_id = ? ORDER BY position').all(id);
  const current = pieces.length;

  if (count > current) {
    const insert = db.prepare('INSERT INTO pieces (puzzle_id, name, position, stars) VALUES (?, ?, ?, 1)');
    db.transaction(() => {
      for (let i = current + 1; i <= count; i++) {
        insert.run(id, String(i), i);
      }
    })();
  } else if (count < current) {
    const toRemove = pieces.slice(count);
    const removeIds = toRemove.map(p => p.id);
    db.transaction(() => {
      for (const pieceId of removeIds) {
        db.prepare('DELETE FROM inventory WHERE piece_id = ?').run(pieceId);
        db.prepare('DELETE FROM pieces WHERE id = ?').run(pieceId);
      }
    })();
  }

  res.json({ puzzleId: Number(id), count });
});

// DELETE /api/admin/puzzles/:id
router.delete('/puzzles/:id', (req, res) => {
  const { id } = req.params;
  const puzzle = db.prepare('SELECT * FROM puzzles WHERE id = ?').get(id);
  if (!puzzle) return res.status(404).json({ error: 'Puzzle introuvable' });

  db.prepare('DELETE FROM inventory WHERE piece_id IN (SELECT id FROM pieces WHERE puzzle_id = ?)').run(id);
  db.prepare('DELETE FROM pieces WHERE puzzle_id = ?').run(id);
  db.prepare('DELETE FROM puzzles WHERE id = ?').run(id);
  res.json({ id: Number(id) });
});

// GET /api/admin/roles
router.get('/roles', (req, res) => {
  res.json(db.prepare('SELECT * FROM roles ORDER BY id').all());
});

module.exports = router;
