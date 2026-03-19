import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatRelative } from '../utils/formatRelative';

const STATUS_COLORS = {
  need: '#f59e0b',
  have_duplicate: '#22c55e',
};

export default function Players() {
  const { auth } = useAuth();
  const [users, setUsers] = useState([]);
  const [showOtherAlliances, setShowOtherAlliances] = useState(false);

  const headers = { Authorization: `Bearer ${auth.token}` };

  useEffect(() => {
    fetch('/api/users', { headers }).then(r => r.json()).then(setUsers);
  }, [auth.token]);

  const byRecent = (a, b) => (b.last_updated ?? '').localeCompare(a.last_updated ?? '');
  const allianceMembers = users.filter(u => u.sameAlliance).sort(byRecent);
  const otherMembers = users.filter(u => !u.sameAlliance).sort(byRecent);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link to="/" style={{ color: '#64748b', fontSize: 14 }}>← Home</Link>
        <h2>Players</h2>
      </div>

      {users.length === 0 && (
        <div style={{ color: '#64748b', fontSize: 14 }}>No players yet.</div>
      )}

      {allianceMembers.length > 0 && (
        <>
          <h4 style={{ marginBottom: 10, fontSize: 13, color: '#3b82f6' }}>My alliance [{auth.alliance}]</h4>
          <UserList users={allianceMembers} />
        </>
      )}

      {otherMembers.length > 0 && (
        <div style={{ marginTop: allianceMembers.length > 0 ? 24 : 0 }}>
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
  );
}

function UserList({ users, showAlliance = false }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 13 }}>
      {users.map(user => (
        <Link key={user.id} to={`/players/${user.id}`}>
          <div
            style={{ background: '#1e293b', borderRadius: 8, padding: '10px 14px', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#263347'}
            onMouseLeave={e => e.currentTarget.style.background = '#1e293b'}
          >
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
