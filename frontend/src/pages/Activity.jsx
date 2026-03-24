import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatRelative } from '../utils/formatRelative';

const CATEGORY_FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'users',     label: 'Users' },
  { key: 'admin',     label: 'Admin' },
];

const ACTION_BADGE = {
  piece_added:        { label: 'Added',     color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  piece_removed:      { label: 'Removed',   color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  puzzle_completed:   { label: 'Completed', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  puzzle_reset:       { label: 'Reset',     color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  album_reset:        { label: 'Reset',     color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  duplicates_cleared: { label: 'Cleared',   color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  user_created:       { label: 'Joined',    color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  user_deleted:       { label: 'Deleted',   color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  user_updated:       { label: 'Updated',   color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  admin_user_updated: { label: 'Updated',   color: '#e879f9', bg: 'rgba(232,121,249,0.12)' },
  album_created:      { label: 'Created',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  album_deleted:      { label: 'Deleted',   color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  puzzle_created:     { label: 'Created',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  puzzle_deleted:     { label: 'Deleted',   color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
};

export default function Activity() {
  const { auth } = useAuth();
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${auth.token}` };
    fetch('/api/activity/users', { headers }).then(r => r.json()).then(setUsers);
  }, [auth.token]);

  useEffect(() => {
    setData(null);
    const headers = { Authorization: `Bearer ${auth.token}` };
    const params = new URLSearchParams({ page, category: filter });
    if (userFilter) params.set('username', userFilter);
    fetch(`/api/activity?${params}`, { headers }).then(r => r.json()).then(setData);
  }, [auth.token, page, filter, userFilter]);

  function changeFilter(key) { setFilter(key); setPage(1); }
  function changeUserFilter(u) { setUserFilter(u); setPage(1); }

  const logs = data?.logs ?? null;
  const pages = data?.pages ?? 1;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Recent Activity</h1>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {CATEGORY_FILTERS.map(c => (
          <button
            key={c.key}
            onClick={() => changeFilter(c.key)}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid',
              borderColor: filter === c.key ? '#3b82f6' : '#334155',
              background: filter === c.key ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: filter === c.key ? '#60a5fa' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {c.label}
          </button>
        ))}

        <select
          value={userFilter}
          onChange={e => changeUserFilter(e.target.value)}
          style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 6,
            color: userFilter ? '#e2e8f0' : '#64748b',
            padding: '6px 10px',
            fontSize: 13,
            cursor: 'pointer',
            width: 'auto',
          }}
        >
          <option value=''>All users</option>
          {users.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>

      {/* Log list */}
      {!logs && <div style={{ color: '#475569', fontSize: 14 }}>Loading…</div>}
      {logs && logs.length === 0 && (
        <div style={{ color: '#475569', fontSize: 14 }}>No activity found.</div>
      )}
      {logs && logs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Desktop header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '90px 110px 90px 1fr',
            padding: '6px 12px',
            borderBottom: '1px solid #334155',
            fontSize: 12,
            fontWeight: 600,
            color: '#64748b',
          }}
            className="activity-header"
          >
            <span>Time</span>
            <span>User</span>
            <span>Action</span>
            <span>Description</span>
          </div>

          {logs.map((log, i) => {
            const badge = ACTION_BADGE[log.action] ?? { label: log.action, color: '#94a3b8', bg: 'transparent' };
            return (
              <div
                key={log.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 110px 90px 1fr',
                  padding: '10px 12px',
                  borderBottom: '1px solid #1e293b',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                  fontSize: 13,
                  alignItems: 'start',
                }}
                className="activity-row"
              >
                <span style={{ color: '#64748b', whiteSpace: 'nowrap' }}>{formatRelative(log.created_at)}</span>
                <span className="activity-user" style={{ fontWeight: 500 }}>{log.username}</span>
                <span className="activity-badge">
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 4,
                    fontSize: 12, fontWeight: 600, color: badge.color, background: badge.bg,
                  }}>
                    {badge.label}
                  </span>
                </span>
                <span style={{ color: '#cbd5e1' }}>{log.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '5px 12px', fontSize: 13, borderRadius: 6,
              border: '1px solid #334155', background: 'transparent',
              color: page === 1 ? '#334155' : '#94a3b8', cursor: page === 1 ? 'default' : 'pointer',
            }}
          >
            ‹ Prev
          </button>
          <span style={{ fontSize: 13, color: '#64748b' }}>Page {page} of {pages}</span>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            style={{
              padding: '5px 12px', fontSize: 13, borderRadius: 6,
              border: '1px solid #334155', background: 'transparent',
              color: page === pages ? '#334155' : '#94a3b8', cursor: page === pages ? 'default' : 'pointer',
            }}
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}
