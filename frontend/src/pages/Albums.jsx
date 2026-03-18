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
      <h2 style={{ marginBottom: 24 }}>
        Albums
        {albums.length > 0 && (
          <span style={{ fontSize: 14, fontWeight: 400, color: '#64748b', marginLeft: 12 }}>
            {albums.reduce((sum, a) => sum + (a.stats?.total ?? 0), 0)} pieces
          </span>
        )}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {albums.map(album => (
          <Link key={album.id} to={`/albums/${album.id}`}>
            <div className="card" style={{ cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#263347'}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>{album.name}</div>
              {album.stats && (
                <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ color: '#64748b' }}>{album.stats.total} pieces</div>
                  {album.stats.need > 0 && (
                    <div style={{ color: '#f59e0b' }}>Looking for: {album.stats.need}</div>
                  )}
                  {album.stats.have_duplicate > 0 && (
                    <div style={{ color: '#22c55e' }}>Have duplicate: {album.stats.have_duplicate}</div>
                  )}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
