import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Albums() {
  const { auth } = useAuth();
  const [albums, setAlbums] = useState([]);

  useEffect(() => {
    fetch('/api/albums', {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then(r => r.json())
      .then(setAlbums);
  }, [auth.token]);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <h2 style={{ marginBottom: 24 }}>Albums</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {albums.map(album => (
          <Link key={album.id} to={`/albums/${album.id}`}>
            <div className="card" style={{ cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#263347'}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Album {album.position}</div>
              <div style={{ fontWeight: 600 }}>{album.name}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
