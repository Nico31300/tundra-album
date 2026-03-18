import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function formatRelative(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr + 'Z')) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr + 'Z').toLocaleDateString();
}

const STATUS_COLORS = {
  need: '#f59e0b',
  have_duplicate: '#22c55e',
};

export default function Albums() {
  const { auth } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [users, setUsers] = useState([]);
  const [showOtherAlliances, setShowOtherAlliances] = useState(false);

  const headers = { Authorization: `Bearer ${auth.token}` };

  useEffect(() => {
    fetch('/api/albums', { headers }).then(r => r.json()).then(setAlbums);
    fetch('/api/users', { headers }).then(r => r.json()).then(setUsers);
  }, [auth.token]);

  const byRecent = (a, b) => (b.last_updated ?? '').localeCompare(a.last_updated ?? '');
  const allianceMembers = users.filter(u => u.sameAlliance).sort(byRecent);
  const otherMembers = users.filter(u => !u.sameAlliance).sort(byRecent);

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
                    <div style={{ color: STATUS_COLORS.need }}>Looking for: {album.stats.need}</div>
                  )}
                  {album.stats.have_duplicate > 0 && (
                    <div style={{ color: STATUS_COLORS.have_duplicate }}>Have duplicate: {album.stats.have_duplicate}</div>
                  )}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {users.length > 0 && (
        <div className="card" style={{ marginTop: 32 }}>
          <h3 style={{ marginBottom: 16 }}>Players</h3>

          {allianceMembers.length > 0 && (
            <>
              <h4 style={{ marginBottom: 10, fontSize: 13, color: '#3b82f6' }}>My alliance [{auth.alliance}]</h4>
              <UserList users={allianceMembers} />
            </>
          )}

          {otherMembers.length > 0 && (
            <div style={{ marginTop: allianceMembers.length > 0 ? 20 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <h4 style={{ fontSize: 13, color: '#64748b' }}>Other alliances</h4>
                <button
                  className="btn-ghost"
                  style={{ fontSize: 12 }}
                  onClick={() => setShowOtherAlliances(v => !v)}
                >
                  {showOtherAlliances ? 'Hide' : 'Show'}
                </button>
              </div>
              {showOtherAlliances && <UserList users={otherMembers} showAlliance />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UserList({ users, showAlliance = false }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 13 }}>
      {users.map(user => (
        <div key={user.id} style={{ background: '#0f172a', borderRadius: 8, padding: '10px 14px' }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {user.username}
            {showAlliance && user.alliance && (
              <span style={{ color: '#64748b', fontWeight: 400, marginLeft: 6 }}>[{user.alliance}]</span>
            )}
          </div>
          {user.have_duplicate > 0 && (
            <div style={{ color: STATUS_COLORS.have_duplicate }}>Offering: {user.have_duplicate} piece(s)</div>
          )}
          {user.need > 0 && (
            <div style={{ color: STATUS_COLORS.need }}>Looking for: {user.need} piece(s)</div>
          )}
          {!user.have_duplicate && !user.need && (
            <div style={{ color: '#475569' }}>No activity</div>
          )}
          {user.last_updated && (
            <div style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>
              Updated {formatRelative(user.last_updated)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
