import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatRelative } from '../utils/formatRelative';

const STATUS_COLORS = {
  need: '#f59e0b',
  have_duplicate: '#22c55e',
};

export default function PlayerAlbums() {
  const { userId } = useParams();
  const { auth } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}/albums`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    }).then(r => r.json()).then(setData);
  }, [userId]);

  if (!data) return <div style={{ padding: 32 }}>Loading...</div>;

  const { user, albums } = data;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link to="/" style={{ color: '#64748b', fontSize: 14 }}>← Players</Link>
        <h2 style={{ flex: 1 }}>
          {user.username}
          {user.alliance && <span style={{ color: '#64748b', fontWeight: 400, fontSize: 16, marginLeft: 8 }}>[{user.alliance}]</span>}
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gridAutoRows: '1fr', gap: 12 }}>
        {albums.map(album => (
          <Link key={album.id} to={`/players/${userId}/albums/${album.id}`} style={{ display: 'flex', height: '100%' }}>
            <div className="card" style={{ cursor: 'pointer', transition: 'background 0.15s', display: 'flex', flexDirection: 'column', flex: 1 }}
              onMouseEnter={e => e.currentTarget.style.background = '#263347'}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>{album.name}</div>
              <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                <div style={{ color: '#64748b' }}>{album.stats.total} pieces</div>
                {album.stats.need > 0 && (
                  <div style={{ color: STATUS_COLORS.need }}>Looking for: {album.stats.need}</div>
                )}
                {album.stats.have_duplicate > 0 && (
                  <div style={{ color: STATUS_COLORS.have_duplicate }}>Have duplicate: {album.stats.have_duplicate}</div>
                )}
              </div>
              {album.stats.total_puzzles > 0 && (
                <div style={{ marginTop: 8, position: 'relative', background: '#0f172a', borderRadius: 99, height: 18, overflow: 'hidden' }}>
                  <div style={{
                    width: `${(album.stats.completed_puzzles / album.stats.total_puzzles) * 100}%`,
                    height: '100%', background: '#22c55e', borderRadius: 99,
                  }} />
                  <span style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: '#fff',
                  }}>
                    {album.stats.completed_puzzles}/{album.stats.total_puzzles}
                  </span>
                </div>
              )}
              {album.stats.last_updated && (
                <div style={{ fontSize: 11, color: '#475569', textAlign: 'right', marginTop: 6 }}>
                  {formatRelative(album.stats.last_updated)}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
