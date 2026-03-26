# Tundra Album

A collaborative puzzle piece tracker for the game Tundra. Players can mark pieces they are looking for or have as duplicates, and see what other players are offering or need.
 
<table align="center">
  <tr>
    <td align="center" valign="top"><b>Home page</b><br><br><img src="https://github.com/user-attachments/assets/abb38f72-f2af-4804-a18d-a4a48325cbb2" width="300"></td>
    <td align="center" valign="top"><b>My Albums</b><br><br><img src="https://github.com/user-attachments/assets/1ad3dc37-dd41-42bc-ba46-c9a659c6454b" width="300"></td>
    <td align="center" valign="top"><b>My Matches</b><br><br><img src="https://github.com/user-attachments/assets/df122ef5-221e-4ab2-b903-4dad16634bbc" width="300"></td>
  </tr>
</table>

## Features

- **Album & puzzle browser** — navigate albums, puzzles, and individual pieces
- **Inventory tracking** — mark each piece as *Looking for*, *Have*, or *Have duplicate*
- **Star ratings** — pieces have a 1–5 star rarity; right-click to edit (admin and stars editor only)
- **Player matching** — see which players can give you pieces you need, and which pieces they need from you; filter by "Can give you" or "Needs from you", sort by recency, search by puzzle name, and navigate directly to a player's page from a match card
- **Player profiles** — browse any player's albums and see their inventory read-only, with your own duplicates highlighted
- **Alliance system** — players belong to alliances; the players list groups by alliance
- **Roles** — three roles control access: *Admin*, *Stars editor*, and *User*
- **Album Missions** — track per-album mission milestones (Rare / Epic / Mythic); mark milestones as completed, step back, reset per album, and toggle visibility of completed missions
- **Activity log** — all inventory, user, and admin actions are logged; admins can browse the paginated log (20 per page) with filters by category and user (all users shown, not just recent); logs older than 7 days are automatically pruned; a 24-hour summary card is visible to all users on the home dashboard
- **Admin area** — admins can manage users (name, alliance, password, role), albums (create, rename, reorder, delete, manage puzzles and piece counts), and mission milestones (add tasks, add/edit/delete milestones per album)
- **Progressive Web App** — installable on Android, iOS, and desktop; works offline for cached pages; install via *avatar menu → Install app*
- **Push notifications** — players receive a browser push notification when someone clicks a piece on their player page

## Tech Stack

- **Backend:** Node.js, Express, SQLite (better-sqlite3), JWT auth
- **Frontend:** React 18, React Router v6, Vite
- **Deployment:** Railway (with persistent volume for the database)

## Getting Started

### Prerequisites

- Node.js 22+

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

This creates all albums, puzzles, pieces (with star ratings), and an initial **admin** user (`admin` / `admin`).

## Deployment (Railway)

The app is deployed on Railway with:
- A single service running the Express backend, which also serves the built frontend
- A persistent volume mounted for the SQLite database

### Build

```bash
cd frontend && npm run build
```

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
