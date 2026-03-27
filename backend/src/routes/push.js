const express = require('express');
const webpush = require('web-push');
const db = require('../database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Generate VAPID keys once and persist in app_config
function getOrCreateVapidKeys() {
  let publicKey = db.prepare("SELECT value FROM app_config WHERE key = 'vapid_public_key'").get()?.value;
  let privateKey = db.prepare("SELECT value FROM app_config WHERE key = 'vapid_private_key'").get()?.value;

  if (!publicKey || !privateKey) {
    const keys = webpush.generateVAPIDKeys();
    publicKey = keys.publicKey;
    privateKey = keys.privateKey;
    db.prepare("INSERT INTO app_config (key, value) VALUES ('vapid_public_key', ?)").run(publicKey);
    db.prepare("INSERT INTO app_config (key, value) VALUES ('vapid_private_key', ?)").run(privateKey);
  }

  return { publicKey, privateKey };
}

const { publicKey, privateKey } = getOrCreateVapidKeys();
webpush.setVapidDetails('mailto:admin@tundra.app', publicKey, privateKey);

// GET /api/push/vapid-public-key
router.get('/vapid-public-key', authMiddleware, (_req, res) => {
  res.json({ publicKey });
});

// POST /api/push/subscribe — save or update subscription for current user
router.post('/subscribe', authMiddleware, (req, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }
  db.prepare(`
    INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth
  `).run(req.user.id, endpoint, keys.p256dh, keys.auth);
  res.json({ ok: true });
});

// DELETE /api/push/subscribe — remove subscription for current device
router.delete('/subscribe', authMiddleware, (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: 'Missing endpoint' });
  db.prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?')
    .run(req.user.id, endpoint);
  res.json({ ok: true });
});

// POST /api/push/notify/:userId — send push notification to a user
router.post('/notify/:userId', authMiddleware, (req, res) => {
  const targetUserId = Number(req.params.userId);
  const { pieceName, puzzleName, albumName, section, pieceId, puzzleId, albumId } = req.body;

  const match = db.prepare(`
    SELECT 1 FROM inventory i1
    JOIN inventory i2 ON i1.piece_id = i2.piece_id AND i1.piece_id = ?
    WHERE (i1.user_id = ? AND i1.status = 'have_duplicate' AND i2.user_id = ? AND i2.status = 'need')
       OR (i1.user_id = ? AND i1.status = 'need' AND i2.user_id = ? AND i2.status = 'have_duplicate')
  `).get(pieceId, req.user.id, targetUserId, req.user.id, targetUserId);
  if (!match) return res.status(403).json({ error: 'No match found for this piece' });

  const subscriptions = db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?').all(targetUserId);
  if (subscriptions.length === 0) return res.json({ ok: true, sent: 0 });

  const body = section === 'iCanGive'
    ? `${req.user.username} would like to give you ${puzzleName} - ${pieceName}`
    : `${req.user.username} is interested by ${puzzleName} - ${pieceName}`;

  const url = section === 'iCanGive'
    ? `/players/${req.user.id}?puzzleId=${puzzleId}&id=${pieceId}`
    : `/albums/${albumId}?puzzleId=${puzzleId}&id=${pieceId}`;

  const payload = JSON.stringify({
    title: albumName ?? 'Tundra Albums',
    body,
    url,
  });

  const sends = subscriptions.map(sub =>
    webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload
    ).catch(err => {
      if (err.statusCode === 410 || err.statusCode === 404) {
        db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(sub.endpoint);
      }
    })
  );

  Promise.all(sends).then(() => res.json({ ok: true, sent: subscriptions.length }));
});

module.exports = router;
