const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('../database');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again in 15 minutes' },
});

router.post('/register', (req, res) => {
  const { username, password, alliance } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare(
      'INSERT INTO users (username, password_hash, alliance) VALUES (?, ?, ?)'
    ).run(username, hash, alliance || null);
    db.prepare(`INSERT INTO activity_logs (user_id, action, label) VALUES (?, 'user_created', ?)`)
      .run(result.lastInsertRowid, `${username} joined`);
    const token = jwt.sign({ id: result.lastInsertRowid, username, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username, alliance: alliance || null, role: 'user' });
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT u.*, r.name as role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username: user.username, alliance: user.alliance, role: user.role, force_password_change: !!user.force_password_change });
});

router.patch('/profile', require('../middleware/auth').authMiddleware, (req, res) => {
  const { username, alliance } = req.body;
  const userId = req.user.id;

  if (!username || !username.trim()) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const before = db.prepare('SELECT username, alliance FROM users WHERE id = ?').get(userId);

    db.prepare('UPDATE users SET username = ?, alliance = ? WHERE id = ?')
      .run(username.trim(), alliance?.trim() || null, userId);

    const updated = db.prepare('SELECT u.*, r.name as role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?').get(userId);

    if (username.trim() !== before.username) {
      db.prepare(`INSERT INTO activity_logs (user_id, action, label) VALUES (?, 'user_updated', ?)`)
        .run(userId, `${before.username} changed their username to ${username.trim()}`);
    }
    if ((alliance?.trim() || null) !== before.alliance) {
      db.prepare(`INSERT INTO activity_logs (user_id, action, label) VALUES (?, 'user_updated', ?)`)
        .run(userId, `${updated.username} changed their alliance to ${alliance?.trim() || 'none'}`);
    }

    const token = jwt.sign({ id: updated.id, username: updated.username, role: updated.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: updated.username, alliance: updated.alliance, role: updated.role });
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/change-password', require('../middleware/auth').authMiddleware, (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password_hash = ?, force_password_change = 0 WHERE id = ?').run(hash, req.user.id);
  const updated = db.prepare('SELECT u.*, r.name as role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?').get(req.user.id);
  const token = jwt.sign({ id: updated.id, username: updated.username, role: updated.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username: updated.username, alliance: updated.alliance, role: updated.role, force_password_change: false });
});

module.exports = router;
