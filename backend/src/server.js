const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const albumsRoutes = require('./routes/albums');
const inventoryRoutes = require('./routes/inventory');
const usersRoutes = require('./routes/users');
const searchRoutes = require('./routes/search');
const piecesRoutes = require('./routes/pieces');
const adminRoutes = require('./routes/admin');
const missionsRoutes = require('./routes/missions');
const activityRoutes = require('./routes/activity');
const pushRoutes = require('./routes/push');

const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

function purgeOldActivityLogs() {
  db.prepare("DELETE FROM activity_logs WHERE created_at < datetime('now', '-7 days')").run();
}
purgeOldActivityLogs();
setInterval(purgeOldActivityLogs, 24 * 60 * 60 * 1000);

if (!isProd) {
  app.use(cors({ origin: 'http://localhost:5173' }));
}

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/albums', albumsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/pieces', piecesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/missions', missionsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/push', pushRoutes);

if (isProd) {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
