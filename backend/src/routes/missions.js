const express = require('express');
const router = express.Router();
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

// GET /api/missions — returns all albums and tasks with the user's current milestone per task
router.get('/', authMiddleware, (req, res) => {
  const userId = req.user.id;

  const milestones = db.prepare(`
    SELECT m.*, a.name AS album_name,
           CASE WHEN p.milestone_id IS NOT NULL THEN 1 ELSE 0 END AS completed
    FROM mission_milestones m
    JOIN albums a ON a.id = m.album_id
    LEFT JOIN user_mission_progress p ON p.milestone_id = m.id AND p.user_id = ?
    ORDER BY a.name, m.task, m.milestone_number
  `).all(userId);

  // Group by album > task
  const albumMap = {};
  const taskMap = {};

  for (const row of milestones) {
    const key = `${row.album_id}|||${row.task}`;
    if (!taskMap[key]) {
      taskMap[key] = { album_name: row.album_name, album_id: row.album_id, task: row.task, milestones: [] };
      if (!albumMap[row.album_id]) albumMap[row.album_id] = row.album_name;
    }
    taskMap[key].milestones.push(row);
  }

  const tasks = Object.values(taskMap).map(({ album_name, album_id, task, milestones }) => {
    const total = milestones.length;
    const completedCount = milestones.filter(m => m.completed).length;
    const allCompleted = completedCount === total;

    // Next milestone = first incomplete; if all done, show last milestone
    const current = milestones.find(m => !m.completed) || milestones[milestones.length - 1];

    // Last completed milestone (for undo/back)
    const completed = milestones.filter(m => m.completed);
    const previous = completed.length > 0 ? completed[completed.length - 1] : null;

    const finalMilestone = milestones.find(m => m.is_final_milestone) || milestones[milestones.length - 1];
    const max_value = finalMilestone?.milestone_value ?? null;

    return { album_name, album_id, task, total, completedCount, allCompleted, current, previous, max_value };
  });

  const albums = Object.entries(albumMap).map(([id, name]) => ({ id: Number(id), name }));

  res.json({ albums, tasks });
});

// POST /api/missions/:milestoneId/complete
router.post('/:milestoneId/complete', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const milestoneId = parseInt(req.params.milestoneId);

  const milestone = db.prepare('SELECT * FROM mission_milestones WHERE id = ?').get(milestoneId);
  if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

  db.prepare(`
    INSERT OR IGNORE INTO user_mission_progress (user_id, milestone_id) VALUES (?, ?)
  `).run(userId, milestoneId);

  res.json({ ok: true });
});

// DELETE /api/missions/albums/:albumId/progress — reset all progress for an album
router.delete('/albums/:albumId/progress', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const albumId = parseInt(req.params.albumId);

  db.prepare(`
    DELETE FROM user_mission_progress
    WHERE user_id = ? AND milestone_id IN (
      SELECT id FROM mission_milestones WHERE album_id = ?
    )
  `).run(userId, albumId);

  res.json({ ok: true });
});

// DELETE /api/missions/:milestoneId/complete
router.delete('/:milestoneId/complete', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const milestoneId = parseInt(req.params.milestoneId);

  db.prepare(`
    DELETE FROM user_mission_progress WHERE user_id = ? AND milestone_id = ?
  `).run(userId, milestoneId);

  res.json({ ok: true });
});

module.exports = router;
