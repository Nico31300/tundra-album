const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const db = require('../database');
const { JWT_SECRET } = require('../middleware/auth');
const { sendPasswordResetEmail, sendVerificationEmail } = require('../email');

const router = express.Router();

async function issueVerificationEmail(userId, email) {
  const token = crypto.randomBytes(32).toString('hex');
  try {
    db.prepare('UPDATE users SET email_verification_token = ? WHERE id = ?').run(token, userId);
  } catch (e) {
    console.error('[verify] Failed to store token:', e.message);
    return;
  }
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  try {
    await sendVerificationEmail(email, `${appUrl}/verify-email?token=${token}`);
  } catch (e) {
    console.error('[email] Failed to send verification email:', e.message);
  }
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again in 15 minutes' },
});

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

router.post('/register', (req, res) => {
  const { username, password, alliance } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (username.length > 30) return res.status(400).json({ error: 'Username must be 30 characters or less' });
  if (alliance && alliance.length > 50) return res.status(400).json({ error: 'Alliance must be 50 characters or less' });
  const hash = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare(
      'INSERT INTO users (username, password_hash, alliance, in_game_name) VALUES (?, ?, ?, ?)'
    ).run(username, hash, alliance || null, username);
    db.prepare(`INSERT INTO activity_logs (user_id, action, label) VALUES (?, 'user_created', ?)`)
      .run(result.lastInsertRowid, `${username} joined`);
    const token = jwt.sign({ id: result.lastInsertRowid, username, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username, alliance: alliance || null, role: 'user', in_game_name: username });
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
  res.json({ token, username: user.username, alliance: user.alliance, role: user.role, force_password_change: !!user.force_password_change, in_game_name: user.in_game_name || user.username, email: user.email || null, email_verified: !!user.email_verified });
});

router.get('/me', require('../middleware/auth').authMiddleware, (req, res) => {
  const user = db.prepare('SELECT u.*, r.name as role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username: user.username, alliance: user.alliance, role: user.role, force_password_change: !!user.force_password_change, in_game_name: user.in_game_name || user.username, email: user.email || null, email_verified: !!user.email_verified });
});

router.patch('/profile', require('../middleware/auth').authMiddleware, async (req, res) => {
  const { username, alliance, in_game_name, email } = req.body;
  const userId = req.user.id;

  if (!username || !username.trim()) {
    return res.status(400).json({ error: 'Username is required' });
  }
  if (username.trim().length > 30) return res.status(400).json({ error: 'Username must be 30 characters or less' });
  if (alliance && alliance.trim().length > 50) return res.status(400).json({ error: 'Alliance must be 50 characters or less' });
  if (in_game_name && in_game_name.trim().length > 30) return res.status(400).json({ error: 'In game name must be 30 characters or less' });
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && email.trim() && !emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    const before = db.prepare('SELECT username, alliance, in_game_name, email, email_verified FROM users WHERE id = ?').get(userId);

    const resolvedInGameName = in_game_name?.trim() || username.trim();
    const resolvedEmail = email?.trim() || null;
    const emailChanged = resolvedEmail !== before.email;
    const newEmailVerified = emailChanged ? 0 : before.email_verified;

    db.prepare('UPDATE users SET username = ?, alliance = ?, in_game_name = ?, email = ?, email_verified = ? WHERE id = ?')
      .run(username.trim(), alliance?.trim() || null, resolvedInGameName, resolvedEmail, newEmailVerified, userId);

    const updated = db.prepare('SELECT u.*, r.name as role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?').get(userId);

    if (username.trim() !== before.username) {
      db.prepare(`INSERT INTO activity_logs (user_id, action, label) VALUES (?, 'user_updated', ?)`)
        .run(userId, `${before.username} changed their username to ${username.trim()}`);
    }
    if ((alliance?.trim() || null) !== before.alliance) {
      db.prepare(`INSERT INTO activity_logs (user_id, action, label) VALUES (?, 'user_updated', ?)`)
        .run(userId, `${updated.username} changed their alliance to ${alliance?.trim() || 'none'}`);
    }

    if (emailChanged && resolvedEmail) {
      await issueVerificationEmail(userId, resolvedEmail);
    }

    const token = jwt.sign({ id: updated.id, username: updated.username, role: updated.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: updated.username, alliance: updated.alliance, role: updated.role, in_game_name: updated.in_game_name, email: updated.email || null, email_verified: !!updated.email_verified });
  } catch (e) {
    console.error('[profile PATCH]', e.message);
    if (e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: e.message.includes('email') ? 'Email already in use' : 'Username already taken' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Invalid link' });

  const user = db.prepare('SELECT * FROM users WHERE email_verification_token = ?').get(token);
  if (!user) return res.status(400).json({ error: 'Invalid or expired verification link' });

  db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(user.id);
  res.json({ message: 'Email verified successfully' });
});

router.post('/resend-verification', require('../middleware/auth').authMiddleware, async (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user.email) return res.status(400).json({ error: 'No email address set' });
  if (user.email_verified) return res.status(400).json({ error: 'Email is already verified' });

  await issueVerificationEmail(user.id, user.email);
  res.json({ message: 'Verification email sent' });
});

router.post('/forgot-password', forgotLimiter, async (req, res) => {
  const { login } = req.body;
  if (!login) return res.status(400).json({ error: 'Username or email is required' });

  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(login.trim(), login.trim());

  if (!user || !user.email) {
    return res.json({ message: 'If an account with that username or email exists and has an email set, a reset link has been sent.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);
  db.prepare('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, token, expiresAt);

  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  try {
    await sendPasswordResetEmail(user.email, `${appUrl}/reset-password?token=${token}`);
  } catch (e) {
    console.error('[email] Failed to send reset email:', e.message);
  }

  res.json({ message: 'If an account with that username or email exists and has an email set, a reset link has been sent.' });
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const record = db.prepare(
    "SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > datetime('now')"
  ).get(token);

  if (!record) return res.status(400).json({ error: 'Invalid or expired reset link' });

  const hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, record.user_id);
  db.prepare('DELETE FROM password_reset_tokens WHERE id = ?').run(record.id);

  res.json({ message: 'Password updated successfully' });
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
  res.json({ token, username: updated.username, alliance: updated.alliance, role: updated.role, force_password_change: false, in_game_name: updated.in_game_name || updated.username });
});

module.exports = router;
