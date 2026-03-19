import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatRelative } from '../utils/formatRelative';

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
        {albums.length > 0 && (() => {
          const total = albums.reduce((sum, a) => sum + (a.stats?.total ?? 0), 0);
          const owned = albums.reduce((sum, a) => sum + (a.stats?.have ?? 0) + (a.stats?.have_duplicate ?? 0), 0);
          return (
            <span style={{ fontSize: 14, fontWeight: 400, color: '#64748b', marginLeft: 12 }}>
              {owned}/{total} pieces
            </span>
          );
        })()}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '1fr', gap: 12 }}>
        {albums.map(album => {
          const allDone = album.stats?.total_puzzles > 0 && album.stats.completed_puzzles === album.stats.total_puzzles;
          const owned = (album.stats?.have ?? 0) + (album.stats?.have_duplicate ?? 0);
          return (
          <Link key={album.id} to={`/albums/${album.id}`} style={{ display: 'flex', height: '100%' }}>
            <div className="card" style={{ cursor: 'pointer', transition: 'background 0.15s', display: 'flex', flexDirection: 'column', flex: 1, background: allDone ? '#0f2744' : '', borderColor: allDone ? '#1d4ed8' : '' }}
              onMouseEnter={e => e.currentTarget.style.background = '#263347'}
              onMouseLeave={e => e.currentTarget.style.background = allDone ? '#0f2744' : ''}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontWeight: 600 }}>{album.name}</div>
                {album.stats && (
                  <span style={{ fontSize: 11, fontWeight: 400, color: '#64748b', marginLeft: 8, flexShrink: 0 }}>{owned}/{album.stats.total}</span>
                )}
              </div>
              {album.stats && (
                <>
                  <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
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
                </>
              )}
            </div>
          </Link>
        );})}
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
        <Link key={user.id} to={`/players/${user.id}`}>
        <div style={{ background: '#0f172a', borderRadius: 8, padding: '10px 14px', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
          onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}>
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
        </Link>
      ))}
    </div>
  );
}
