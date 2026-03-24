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

// GET /api/users/matches — all pieces I can give or receive from other players, across all albums
router.get('/matches', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const currentUser = db.prepare('SELECT alliance FROM users WHERE id = ?').get(userId);

  // Rows where other users have_duplicate pieces I need
  const canGiveMeRows = db.prepare(`
    SELECT u.id, u.username, u.alliance,
           p.id AS piece_id, p.name AS piece_name, pz.name AS puzzle_name, a.name AS album_name
    FROM users u
    JOIN inventory i_other ON i_other.user_id = u.id AND i_other.status = 'have_duplicate'
    JOIN pieces p ON p.id = i_other.piece_id
    JOIN puzzles pz ON pz.id = p.puzzle_id
    JOIN albums a ON a.id = pz.album_id
    JOIN inventory i_me ON i_me.piece_id = p.id AND i_me.user_id = ? AND i_me.status = 'need'
    WHERE u.id != ?
  `).all(userId, userId);

  // Rows where other users need pieces I have_duplicate
  const iCanGiveRows = db.prepare(`
    SELECT u.id, u.username, u.alliance,
           p.id AS piece_id, p.name AS piece_name, pz.name AS puzzle_name, a.name AS album_name
    FROM users u
    JOIN inventory i_other ON i_other.user_id = u.id AND i_other.status = 'need'
    JOIN pieces p ON p.id = i_other.piece_id
    JOIN puzzles pz ON pz.id = p.puzzle_id
    JOIN albums a ON a.id = pz.album_id
    JOIN inventory i_me ON i_me.piece_id = p.id AND i_me.user_id = ? AND i_me.status = 'have_duplicate'
    WHERE u.id != ?
  `).all(userId, userId);

  // Build player map
  const playerMap = {};
  const ensurePlayer = (row) => {
    if (!playerMap[row.id]) {
      playerMap[row.id] = {
        id: row.id,
        username: row.username,
        alliance: row.alliance,
        sameAlliance: !!(currentUser?.alliance && row.alliance === currentUser.alliance),
        canGiveMe: {},
        iCanGive: {},
      };
    }
    return playerMap[row.id];
  };

  for (const row of canGiveMeRows) {
    const player = ensurePlayer(row);
    const key = `${row.album_name} – ${row.puzzle_name}`;
    (player.canGiveMe[key] = player.canGiveMe[key] || []).push(row.piece_name);
  }
  for (const row of iCanGiveRows) {
    const player = ensurePlayer(row);
    const key = `${row.album_name} – ${row.puzzle_name}`;
    (player.iCanGive[key] = player.iCanGive[key] || []).push(row.piece_name);
  }

  const players = Object.values(playerMap).filter(p =>
    Object.keys(p.canGiveMe).length > 0 || Object.keys(p.iCanGive).length > 0
  );

  const canReceive = new Set(canGiveMeRows.map(r => r.piece_id)).size;
  const canGive = new Set(iCanGiveRows.map(r => r.piece_id)).size;

  res.json({ canReceive, canGive, players });
});

// GET /api/users/:userId/matches — pieces I can give/receive with a specific player
router.get('/:userId/matches', authMiddleware, (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  const user = db.prepare('SELECT id, username, alliance FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

  // Pieces I can give them: I have_duplicate, they need
  const iCanGive = db.prepare(`
    SELECT a.id AS album_id, a.name AS album_name, a.position AS album_position,
           pz.id AS puzzle_id, pz.name AS puzzle_name, pz.position AS puzzle_position,
           p.id AS piece_id, p.name AS piece_name, p.position AS piece_position, p.stars
    FROM inventory i_me
    JOIN inventory i_them ON i_them.piece_id = i_me.piece_id AND i_them.user_id = ? AND i_them.status = 'need'
    JOIN pieces p ON p.id = i_me.piece_id
    JOIN puzzles pz ON pz.id = p.puzzle_id
    JOIN albums a ON a.id = pz.album_id
    WHERE i_me.user_id = ? AND i_me.status = 'have_duplicate'
    ORDER BY a.position, pz.position, p.position
  `).all(userId, currentUserId);

  // Pieces they can give me: they have_duplicate, I need
  const theyCanGive = db.prepare(`
    SELECT a.id AS album_id, a.name AS album_name, a.position AS album_position,
           pz.id AS puzzle_id, pz.name AS puzzle_name, pz.position AS puzzle_position,
           p.id AS piece_id, p.name AS piece_name, p.position AS piece_position, p.stars
    FROM inventory i_them
    JOIN inventory i_me ON i_me.piece_id = i_them.piece_id AND i_me.user_id = ? AND i_me.status = 'need'
    JOIN pieces p ON p.id = i_them.piece_id
    JOIN puzzles pz ON pz.id = p.puzzle_id
    JOIN albums a ON a.id = pz.album_id
    WHERE i_them.user_id = ? AND i_them.status = 'have_duplicate'
    ORDER BY a.position, pz.position, p.position
  `).all(currentUserId, userId);

  res.json({ user, iCanGive, theyCanGive });
});

// GET /api/users/:userId/albums — albums with target user's inventory stats
router.get('/:userId/albums', authMiddleware, (req, res) => {
  const { userId } = req.params;

  const user = db.prepare('SELECT id, username, alliance FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

  const albums = db.prepare('SELECT * FROM albums ORDER BY position').all();

  const stats = db.prepare(`
    SELECT pz.album_id,
           COUNT(DISTINCT pz.id) AS total_puzzles,
           COUNT(p.id) AS total,
           SUM(CASE WHEN i.status = 'need' THEN 1 ELSE 0 END) AS need,
           SUM(CASE WHEN i.status = 'have' THEN 1 ELSE 0 END) AS have,
           SUM(CASE WHEN i.status = 'have_duplicate' THEN 1 ELSE 0 END) AS have_duplicate,
           MAX(i.updated_at) AS last_updated
    FROM puzzles pz
    JOIN pieces p ON p.puzzle_id = pz.id
    LEFT JOIN inventory i ON i.piece_id = p.id AND i.user_id = ?
    GROUP BY pz.album_id
  `).all(userId);

  const completed = db.prepare(`
    SELECT album_id, COUNT(*) AS completed_puzzles
    FROM (
      SELECT pz.id, pz.album_id
      FROM puzzles pz
      JOIN pieces p ON p.puzzle_id = pz.id
      LEFT JOIN inventory i ON i.piece_id = p.id AND i.user_id = ?
      GROUP BY pz.id, pz.album_id
      HAVING COUNT(p.id) > 0 AND COUNT(p.id) = SUM(CASE WHEN i.status IN ('have', 'have_duplicate') THEN 1 ELSE 0 END)
    ) GROUP BY album_id
  `).all(userId);

  const completedByAlbum = Object.fromEntries(completed.map(c => [c.album_id, c.completed_puzzles]));
  const statsByAlbum = Object.fromEntries(stats.map(s => [s.album_id, { ...s, completed_puzzles: completedByAlbum[s.album_id] ?? 0 }]));

  res.json({
    user,
    albums: albums.map(album => ({ ...album, stats: statsByAlbum[album.id] ?? { total: 0, total_puzzles: 0, need: 0, have_duplicate: 0, completed_puzzles: 0 } })),
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
