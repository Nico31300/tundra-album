const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../data/tundra.db');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS roles (
    id   INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT    NOT NULL,
    alliance      TEXT,
    role_id       INTEGER NOT NULL DEFAULT 3,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS albums (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT    NOT NULL,
    position INTEGER NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS puzzles (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    album_id INTEGER NOT NULL REFERENCES albums(id),
    name     TEXT    NOT NULL,
    position INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pieces (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    puzzle_id INTEGER NOT NULL REFERENCES puzzles(id),
    name      TEXT    NOT NULL,
    position  INTEGER NOT NULL,
    stars     INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS inventory (
    user_id    INTEGER NOT NULL REFERENCES users(id),
    piece_id   INTEGER NOT NULL REFERENCES pieces(id),
    status     TEXT    NOT NULL CHECK(status IN ('need', 'have_duplicate', 'have')),
    updated_at DATETIME,
    PRIMARY KEY (user_id, piece_id)
  );

  CREATE TABLE IF NOT EXISTS mission_milestones (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    album_id         INTEGER NOT NULL REFERENCES albums(id),
    task             TEXT    NOT NULL,
    milestone_number INTEGER NOT NULL,
    milestone_value  TEXT,
    is_unknown       INTEGER NOT NULL DEFAULT 0,
    is_final_milestone INTEGER NOT NULL DEFAULT 0,
    rarity           TEXT,
    fragment_reward  TEXT,
    UNIQUE(album_id, task, milestone_number)
  );

  CREATE TABLE IF NOT EXISTS user_mission_progress (
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    milestone_id INTEGER NOT NULL REFERENCES mission_milestones(id) ON DELETE CASCADE,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, milestone_id)
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    action     TEXT    NOT NULL,
    label      TEXT    NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS app_config (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint   TEXT    NOT NULL,
    p256dh     TEXT    NOT NULL,
    auth       TEXT    NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, endpoint)
  );
`);

try {
  db.exec('ALTER TABLE users ADD COLUMN force_password_change INTEGER NOT NULL DEFAULT 0');
} catch {}
try {
  db.exec('ALTER TABLE users ADD COLUMN last_notified_at DATETIME');
} catch {}
try {
  db.exec('ALTER TABLE users ADD COLUMN in_game_name TEXT');
} catch {}
try {
  db.exec('ALTER TABLE users ADD COLUMN email TEXT');
} catch (e) {
  if (!e.message.includes('duplicate column')) console.error('[db] email migration error:', e.message);
}
try {
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL');
} catch (e) {
  console.error('[db] email index error:', e.message);
}
try {
  db.exec('ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0');
} catch {}
try {
  db.exec('ALTER TABLE users ADD COLUMN email_verification_token TEXT');
} catch {}

db.exec(`
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT    UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.prepare(`INSERT OR IGNORE INTO roles (id, name) VALUES (1, 'admin')`).run();
db.prepare(`INSERT OR IGNORE INTO roles (id, name) VALUES (2, 'stars_editor')`).run();
db.prepare(`INSERT OR IGNORE INTO roles (id, name) VALUES (3, 'user')`).run();

const milestoneCount = db.prepare('SELECT COUNT(*) as c FROM mission_milestones').get();
if (milestoneCount.c === 0) {
  const MILESTONES = require('./missions-seed');
  const albumIdByName = Object.fromEntries(
    db.prepare('SELECT id, name FROM albums').all().map(a => [a.name, a.id])
  );
  const insertMilestone = db.prepare(`
    INSERT OR IGNORE INTO mission_milestones
      (album_id, task, milestone_number, milestone_value, is_unknown, is_final_milestone, rarity, fragment_reward)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  db.transaction((rows) => {
    for (const [albumName, task, num, value, isUnknown, isFinal, rarity, reward] of rows) {
      const albumId = albumIdByName[albumName];
      if (albumId != null) insertMilestone.run(albumId, task, num, value, isUnknown, isFinal, rarity, reward);
    }
  })(MILESTONES);
}

module.exports = db;
