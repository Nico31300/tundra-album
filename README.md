# Tundra Album

A collaborative puzzle piece tracker for the game Tundra. Players can mark pieces they are looking for or have as duplicates, and see what other players are offering or need.

## Features

- **Album & puzzle browser** — navigate albums, puzzles, and individual pieces
- **Inventory tracking** — mark each piece as *Looking for*, *Have*, or *Have duplicate*
- **Star ratings** — pieces have a 1–5 star rarity; right-click to edit (admin and stars editor only)
- **Player matching** — see which players can give you pieces you need, and which pieces they need from you
- **Player profiles** — browse any player's albums and see their inventory read-only, with your own duplicates highlighted
- **Alliance system** — players belong to alliances; the players list groups by alliance
- **Roles** — three roles control access: *Admin*, *Stars editor*, and *User*
- **Album Missions** — track per-album mission milestones (Rare / Epic / Mythic); mark milestones as completed, step back, reset per album, and toggle visibility of completed missions
- **Activity log** — all inventory, user, and admin actions are logged; admins can browse the paginated log (20 per page) with filters by category and user (all users shown, not just recent); logs older than 7 days are automatically pruned; a 24-hour summary card is visible to all users on the home dashboard
- **Admin area** — admins can manage users (name, alliance, password, role), albums (create, rename, reorder, delete, manage puzzles and piece counts), and mission milestones (add tasks, add/edit/delete milestones per album)

## Tech Stack

- **Backend:** Node.js, Express, SQLite (better-sqlite3), JWT auth
- **Frontend:** React 18, React Router v6, Vite
- **Deployment:** Railway (with persistent volume for the database)

## Getting Started

### Prerequisites

- Node.js 20+

### Installation

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Development

```bash
# Start backend (port 3001)
cd backend && npm run dev

# Start frontend (port 5173)
cd frontend && npm run dev
```

The frontend proxies API requests to `http://localhost:3001` via Vite config.

### Seed the database

```bash
cd backend && npm run seed
```

### Run migrations

```bash
cd backend
node src/migrate-piece-names.js
node src/migrate-piece-names-2.js
node src/migrate-epic-new-world.js
node src/migrate-call-of-the-stars.js
node src/migrate-inventory-updated-at.js
node src/migrate-inventory-have-status.js
node src/migrate-piece-stars.js
node src/migrate-roles.js          # adds roles table and promotes user id=1 to admin
```

## Deployment (Railway)

The app is deployed on Railway with:
- A single service running the Express backend, which also serves the built frontend
- A persistent volume mounted for the SQLite database

### Build

```bash
cd frontend && npm run build
```

### Run migrations on Railway

```bash
railway run node backend/src/migrate-<name>.js
```

> After running `migrate-roles.js`, the user with `id = 1` is promoted to **admin**. They must log out and back in for the new role to take effect.

### Database backup

The database is stored on a Railway persistent volume. To download a local copy:

**1. Open an SSH session on Railway**
```bash
railway ssh --project=<PROJECT_ID> --environment=<ENVIRONMENT_ID> --service=<SERVICE_ID>
```

**2. Checkpoint the WAL and create a clean backup**
```bash
node -e "const db = require('/app/node_modules/better-sqlite3')('/data/tundra.db'); db.pragma('wal_checkpoint(FULL)'); db.backup('/data/tundra-clean.db').then(() => console.log('done'))"
exit
```

**3. Export the backup as base64**
```bash
railway ssh --project=<PROJECT_ID> --environment=<ENVIRONMENT_ID> --service=<SERVICE_ID> \
  -- base64 /data/tundra-clean.db > data/tundra-backup.b64
```

**4. Decode locally**
```bash
tr -d '\r' < data/tundra-backup.b64 | base64 -d > data/tundra-backup.db
sqlite3 data/tundra-backup.db "PRAGMA integrity_check;"
```

**5. Use the backup locally**
```bash
cp data/tundra.db data/tundra-local.db   # save current local DB
cp data/tundra-backup.db data/tundra.db
```

### Environment variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `3001` |
| `DATABASE_PATH` | Path to SQLite database file | `./data/tundra.db` |
| `JWT_SECRET` | Secret key for JWT tokens | — |
| `NODE_ENV` | Set to `production` to serve frontend | — |
