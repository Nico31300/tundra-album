const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const albumsRoutes = require('./routes/albums');
const inventoryRoutes = require('./routes/inventory');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/albums', albumsRoutes);
app.use('/api/inventory', inventoryRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
