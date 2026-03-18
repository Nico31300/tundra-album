const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { username, password, alliance } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username et password requis' });
  }
  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare(
      'INSERT INTO users (username, password_hash, alliance) VALUES (?, ?, ?)'
    ).run(username, hash, alliance || null);
    const token = jwt.sign({ id: result.lastInsertRowid, username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username, alliance: alliance || null });
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Nom d\'utilisateur déjà pris' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Identifiants invalides' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username: user.username, alliance: user.alliance });
});

router.patch('/profile', require('../middleware/auth').authMiddleware, (req, res) => {
  const { username, alliance } = req.body;
  const userId = req.user.id;

  if (!username || !username.trim()) {
    return res.status(400).json({ error: 'Username requis' });
  }

  try {
    db.prepare('UPDATE users SET username = ?, alliance = ? WHERE id = ?')
      .run(username.trim(), alliance?.trim() || null, userId);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const token = jwt.sign({ id: updated.id, username: updated.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: updated.username, alliance: updated.alliance });
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Nom d\'utilisateur déjà pris' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
