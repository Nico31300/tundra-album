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

// Batch scheduler: notify users about new available pieces
function sendBatchAvailabilityNotifications() {
  console.log('[push] Batch availability check started');

  const usersToNotify = db.prepare(`
    SELECT u.id, COUNT(DISTINCT i_other.piece_id) AS new_count
    FROM users u
    JOIN push_subscriptions ps ON ps.user_id = u.id
    JOIN inventory i_me ON i_me.user_id = u.id AND i_me.status = 'need'
    JOIN inventory i_other
      ON i_other.piece_id = i_me.piece_id
      AND i_other.user_id != u.id
      AND i_other.status = 'have_duplicate'
      AND i_other.updated_at > COALESCE(u.last_notified_at, datetime('now', '-2 hours'))
    GROUP BY u.id
    HAVING new_count > 0
  `).all();

  if (usersToNotify.length === 0) {
    console.log('[push] No users to notify');
  }

  let totalSent = 0;

  for (const user of usersToNotify) {
    const subs = db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?').all(user.id);
    const count = user.new_count;
    const payload = JSON.stringify({
      title: 'New pieces available',
      body: `${count} piece${count > 1 ? 's' : ''} you're looking for ${count > 1 ? 'are' : 'is'} now available as duplicate`,
      url: '/available',
    });
    for (const sub of subs) {
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      ).catch(err => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(sub.endpoint);
          console.log(`[push] Removed stale subscription for user ${user.id} (${err.statusCode})`);
        } else {
          console.error(`[push] Failed to notify user ${user.id}:`, err.message);
        }
      });
    }
    console.log(`[push] Queued ${subs.length} notification(s) for user ${user.id} (${count} new piece(s))`);
    totalSent += subs.length;
  }

  // Advance watermark for all subscribed users so next run only catches truly new pieces
  db.prepare(`
    UPDATE users SET last_notified_at = datetime('now')
    WHERE id IN (SELECT DISTINCT user_id FROM push_subscriptions)
  `).run();

  console.log(`[push] Batch done — ${usersToNotify.length} user(s) notified, ${totalSent} notification(s) sent`);
}

module.exports = router;
module.exports.sendBatchAvailabilityNotifications = sendBatchAvailabilityNotifications;
