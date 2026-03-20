import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const ROLES = ['admin', 'stars_editor', 'user'];

export default function Admin() {
  const { auth } = useAuth();
  const [tab, setTab] = useState('users');

  if (auth?.role !== 'admin') return <Navigate to="/" replace />;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
      <h2 style={{ marginBottom: 20 }}>Admin</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #334155', paddingBottom: 0 }}>
        {['users', 'albums'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px', fontSize: 14, fontWeight: 600, border: 'none',
              borderBottom: tab === t ? '2px solid #3b82f6' : '2px solid transparent',
              background: 'none', color: tab === t ? '#3b82f6' : '#94a3b8',
              cursor: 'pointer', marginBottom: -1,
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === 'users' && <UsersTab />}
      {tab === 'albums' && <AlbumsTab />}
    </div>
  );
}

function UsersTab() {
  const { auth } = useAuth();
  const headers = { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' };
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null); // user being edited
  const [form, setForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/users', { headers }).then(r => r.json()).then(setUsers);
  }, []);

  function openEdit(user) {
    setEditUser(user);
    setForm({ username: user.username, alliance: user.alliance || '', role: user.role, password: '' });
    setError('');
  }

  async function saveUser() {
    setError('');
    const body = { username: form.username, alliance: form.alliance, role: form.role };
    if (form.password) body.password = form.password;
    const res = await fetch(`/api/admin/users/${editUser.id}`, {
      method: 'PUT', headers, body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    setUsers(prev => prev.map(u => u.id === data.id ? data : u));
    setEditUser(null);
  }

  async function deleteUser(id) {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers });
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== id));
      setDeleteConfirm(null);
    }
  }

  return (
    <>
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="card" style={{ width: '100%', maxWidth: 400 }}>
            <h3 style={{ marginBottom: 16, fontSize: 16 }}>Edit user</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontSize: 13, color: '#94a3b8' }}>
                Username
                <input
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  style={{ display: 'block', width: '100%', marginTop: 4 }}
                />
              </label>
              <label style={{ fontSize: 13, color: '#94a3b8' }}>
                Alliance
                <input
                  value={form.alliance}
                  onChange={e => setForm(f => ({ ...f, alliance: e.target.value }))}
                  style={{ display: 'block', width: '100%', marginTop: 4 }}
                />
              </label>
              <label style={{ fontSize: 13, color: '#94a3b8' }}>
                Role
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  style={{ display: 'block', width: '100%', marginTop: 4, padding: '6px 10px', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6 }}
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 13, color: '#94a3b8' }}>
                New password <span style={{ color: '#475569' }}>(leave blank to keep)</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ display: 'block', width: '100%', marginTop: 4 }}
                />
              </label>
              {error && <div style={{ color: '#f87171', fontSize: 13 }}>{error}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setEditUser(null)}>Cancel</button>
              <button className="btn-primary" onClick={saveUser}>Save</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="card" style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Delete user</div>
            <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>
              Delete <strong>{deleteConfirm.username}</strong> and all their inventory? This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                onClick={() => deleteUser(deleteConfirm.id)}
                style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', color: '#64748b', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px' }}>Username</th>
              <th style={{ padding: '8px 12px' }}>Alliance</th>
              <th style={{ padding: '8px 12px' }}>Role</th>
              <th style={{ padding: '8px 12px' }}>Joined</th>
              <th style={{ padding: '8px 12px' }} />
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{user.username}</td>
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{user.alliance || '—'}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                    background: user.role === 'admin' ? '#1d4ed820' : user.role === 'stars_editor' ? '#a855f720' : '#33415520',
                    color: user.role === 'admin' ? '#3b82f6' : user.role === 'stars_editor' ? '#a855f7' : '#64748b',
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', color: '#475569', fontSize: 12 }}>
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => openEdit(user)}>Edit</button>
                    {user.id !== auth.id && (
                      <button
                        onClick={() => setDeleteConfirm(user)}
                        style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#ef444420', color: '#f87171', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function AlbumsTab() {
  const { auth } = useAuth();
  const headers = { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' };
  const [albums, setAlbums] = useState([]);
  const [editAlbum, setEditAlbum] = useState(null);
  const [form, setForm] = useState({});
  const [newName, setNewName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [expandedAlbum, setExpandedAlbum] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/albums', { headers }).then(r => r.json()).then(setAlbums);
  }, []);

  function openEdit(album) {
    setEditAlbum(album);
    setForm({ name: album.name, position: album.position });
    setError('');
  }

  async function saveAlbum() {
    setError('');
    const res = await fetch(`/api/admin/albums/${editAlbum.id}`, {
      method: 'PUT', headers, body: JSON.stringify({ name: form.name, position: Number(form.position) }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    setAlbums(prev => prev.map(a => a.id === data.id ? { ...data, puzzles: editAlbum.puzzles } : a));
    setEditAlbum(null);
  }

  async function createAlbum() {
    if (!newName.trim()) return;
    const res = await fetch('/api/admin/albums', {
      method: 'POST', headers, body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    if (res.ok) { setAlbums(prev => [...prev, data]); setNewName(''); }
  }

  async function deleteAlbum(id) {
    const res = await fetch(`/api/admin/albums/${id}`, { method: 'DELETE', headers });
    if (res.ok) {
      setAlbums(prev => prev.filter(a => a.id !== id));
      setDeleteConfirm(null);
      if (expandedAlbum === id) setExpandedAlbum(null);
    }
  }

  function updateAlbumPuzzles(albumId, puzzles) {
    setAlbums(prev => prev.map(a => a.id === albumId ? { ...a, puzzles } : a));
  }

  return (
    <>
      {editAlbum && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="card" style={{ width: '100%', maxWidth: 360 }}>
            <h3 style={{ marginBottom: 16, fontSize: 16 }}>Edit album</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontSize: 13, color: '#94a3b8' }}>
                Name
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ display: 'block', width: '100%', marginTop: 4 }} />
              </label>
              <label style={{ fontSize: 13, color: '#94a3b8' }}>
                Position
                <input type="number" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} style={{ display: 'block', width: '100%', marginTop: 4 }} />
              </label>
              {error && <div style={{ color: '#f87171', fontSize: 13 }}>{error}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setEditAlbum(null)}>Cancel</button>
              <button className="btn-primary" onClick={saveAlbum}>Save</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="card" style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Delete album</div>
            <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>
              Delete <strong>{deleteConfirm.name}</strong> and all its puzzles, pieces and inventory? This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                onClick={() => deleteAlbum(deleteConfirm.id)}
                style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create new album */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New album name..."
          style={{ flex: 1 }}
          onKeyDown={e => e.key === 'Enter' && createAlbum()}
        />
        <button className="btn-primary" onClick={createAlbum}>Add album</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {albums.map(album => (
          <div key={album.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
              <span style={{ color: '#475569', fontSize: 12, minWidth: 28 }}>#{album.position}</span>
              <span style={{ flex: 1, fontWeight: 600 }}>{album.name}</span>
              <button
                className="btn-ghost"
                style={{ fontSize: 12, padding: '4px 10px', color: expandedAlbum === album.id ? '#3b82f6' : '#94a3b8' }}
                onClick={() => setExpandedAlbum(v => v === album.id ? null : album.id)}
              >
                {album.puzzles?.length ?? 0} puzzles {expandedAlbum === album.id ? '▲' : '▼'}
              </button>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => openEdit(album)}>Edit</button>
                <button
                  onClick={() => setDeleteConfirm(album)}
                  style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#ef444420', color: '#f87171', cursor: 'pointer', fontWeight: 600 }}
                >
                  Delete
                </button>
              </div>
            </div>
            {expandedAlbum === album.id && (
              <PuzzleManager
                album={album}
                headers={headers}
                onPuzzlesChange={puzzles => updateAlbumPuzzles(album.id, puzzles)}
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function PuzzleManager({ album, headers, onPuzzlesChange }) {
  const [puzzles, setPuzzles] = useState(album.puzzles ?? []);
  const [newName, setNewName] = useState('');
  const [editPuzzle, setEditPuzzle] = useState(null); // { id, name, position }
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [pieceCounts, setPieceCounts] = useState({}); // puzzleId -> current piece count from server
  const [editingCount, setEditingCount] = useState(null); // puzzleId being edited

  useEffect(() => {
    puzzles.forEach(puzzle => {
      fetch(`/api/admin/puzzles/${puzzle.id}/piece-count`, { headers })
        .then(r => r.json())
        .then(d => setPieceCounts(prev => ({ ...prev, [puzzle.id]: d.count })));
    });
  }, [puzzles.length]);

  function syncPuzzles(updated) {
    setPuzzles(updated);
    onPuzzlesChange(updated);
  }

  async function savePieceCount(puzzleId, count) {
    const num = parseInt(count, 10);
    if (isNaN(num) || num < 0) return;
    const res = await fetch(`/api/admin/puzzles/${puzzleId}/piece-count`, {
      method: 'PUT', headers, body: JSON.stringify({ count: num }),
    });
    if (res.ok) setPieceCounts(prev => ({ ...prev, [puzzleId]: num }));
    setEditingCount(null);
  }

  async function createPuzzle() {
    if (!newName.trim()) return;
    const res = await fetch(`/api/admin/albums/${album.id}/puzzles`, {
      method: 'POST', headers, body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    if (res.ok) { syncPuzzles([...puzzles, data]); setNewName(''); }
  }

  async function savePuzzle() {
    const res = await fetch(`/api/admin/puzzles/${editPuzzle.id}`, {
      method: 'PUT', headers, body: JSON.stringify({ name: editPuzzle.name, position: Number(editPuzzle.position) }),
    });
    const data = await res.json();
    if (res.ok) { syncPuzzles(puzzles.map(p => p.id === data.id ? data : p).sort((a, b) => a.position - b.position)); setEditPuzzle(null); }
  }

  async function deletePuzzle(id) {
    const res = await fetch(`/api/admin/puzzles/${id}`, { method: 'DELETE', headers });
    if (res.ok) { syncPuzzles(puzzles.filter(p => p.id !== id)); setDeleteConfirm(null); }
  }

  return (
    <div style={{ borderTop: '1px solid #334155', background: '#0f172a', padding: '12px 16px' }}>
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="card" style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Delete puzzle</div>
            <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>
              Delete <strong>{deleteConfirm.name}</strong> and all its pieces and inventory? This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                onClick={() => deletePuzzle(deleteConfirm.id)}
                style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New puzzle name..."
          style={{ flex: 1, fontSize: 13 }}
          onKeyDown={e => e.key === 'Enter' && createPuzzle()}
        />
        <button className="btn-primary" style={{ fontSize: 13 }} onClick={createPuzzle}>Add puzzle</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {puzzles.map(puzzle => (
          <div key={puzzle.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: '#1e293b', borderRadius: 6 }}>
            {editPuzzle?.id === puzzle.id ? (
              <>
                <input
                  value={editPuzzle.name}
                  onChange={e => setEditPuzzle(p => ({ ...p, name: e.target.value }))}
                  style={{ flex: 1, fontSize: 13 }}
                  onKeyDown={e => e.key === 'Enter' && savePuzzle()}
                  autoFocus
                />
                <input
                  type="number"
                  value={editPuzzle.position}
                  onChange={e => setEditPuzzle(p => ({ ...p, position: e.target.value }))}
                  style={{ width: 60, fontSize: 13 }}
                />
                <button className="btn-primary" style={{ fontSize: 12, padding: '3px 10px' }} onClick={savePuzzle}>Save</button>
                <button className="btn-ghost" style={{ fontSize: 12, padding: '3px 10px' }} onClick={() => setEditPuzzle(null)}>Cancel</button>
              </>
            ) : (
              <>
                <span style={{ color: '#475569', fontSize: 11, minWidth: 24 }}>#{puzzle.position}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{puzzle.name}</span>
                <span style={{ fontSize: 11, color: '#64748b', marginRight: 4 }}>Pieces:</span>
                {editingCount === puzzle.id ? (
                  <input
                    type="number"
                    min="0"
                    defaultValue={pieceCounts[puzzle.id] ?? 0}
                    style={{ width: 56, fontSize: 12 }}
                    autoFocus
                    onBlur={e => savePieceCount(puzzle.id, e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') savePieceCount(puzzle.id, e.target.value);
                      if (e.key === 'Escape') setEditingCount(null);
                    }}
                  />
                ) : (
                  <button
                    className="btn-ghost"
                    style={{ fontSize: 12, padding: '2px 8px', color: '#e2e8f0', minWidth: 32 }}
                    onClick={() => setEditingCount(puzzle.id)}
                  >
                    {pieceCounts[puzzle.id] ?? '…'}
                  </button>
                )}
                <button className="btn-ghost" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => setEditPuzzle({ ...puzzle })}>Edit</button>
                <button
                  onClick={() => setDeleteConfirm(puzzle)}
                  style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, border: 'none', background: '#ef444420', color: '#f87171', cursor: 'pointer', fontWeight: 600 }}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
        {puzzles.length === 0 && (
          <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: '8px 0' }}>No puzzles yet.</div>
        )}
      </div>
    </div>
  );
}
