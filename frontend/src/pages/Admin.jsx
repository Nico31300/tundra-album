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
        {['users', 'albums', 'missions'].map(t => (
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
      {tab === 'missions' && <MissionsTab />}
    </div>
  );
}

function UsersTab() {
  const { auth } = useAuth();
  const headers = { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' };
  const [users, setUsers] = useState(null);
  const [editUser, setEditUser] = useState(null); // user being edited
  const [form, setForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/users', { headers }).then(r => r.json()).then(setUsers);
  }, []);

  useEffect(() => {
    if (!editUser) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') setEditUser(null);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editUser]);

  function openEdit(user) {
    setEditUser(user);
    setForm({ username: user.username, in_game_name: user.in_game_name || '', alliance: user.alliance || '', role: user.role, password: '' });
    setError('');
  }

  async function saveUser() {
    setError('');
    const body = { username: form.username, in_game_name: form.in_game_name, alliance: form.alliance, role: form.role };
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
                Username <span style={{ color: '#475569' }}>(login)</span>
                <input
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  style={{ display: 'block', width: '100%', marginTop: 4 }}
                />
              </label>
              <label style={{ fontSize: 13, color: '#94a3b8' }}>
                In game name
                <input
                  value={form.in_game_name}
                  onChange={e => setForm(f => ({ ...f, in_game_name: e.target.value }))}
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
              Delete <strong>{deleteConfirm.in_game_name}</strong> and all their inventory? This cannot be undone.
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
              <th style={{ padding: '8px 12px' }}>In game name</th>
              <th style={{ padding: '8px 12px' }}>Alliance</th>
              <th style={{ padding: '8px 12px' }}>Role</th>
              <th style={{ padding: '8px 12px' }}>Email</th>
              <th style={{ padding: '8px 12px' }}>Joined</th>
              <th style={{ padding: '8px 12px' }} />
            </tr>
          </thead>
          <tbody>
            {users === null && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                {[60, 50, 50, 40, 120, 50, 80].map((w, j) => (
                  <td key={j} style={{ padding: '10px 12px' }}>
                    <div className="skeleton" style={{ height: 12, width: `${w}%` }} />
                  </td>
                ))}
              </tr>
            ))}
            {users?.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{user.username}</td>
                <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 12 }}>{user.in_game_name}</td>
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
                <td style={{ padding: '10px 12px', fontSize: 12 }}>
                  {user.email ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#94a3b8' }}>{user.email}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 99,
                        background: user.email_verified ? '#14532d' : '#431407',
                        color: user.email_verified ? '#86efac' : '#fdba74',
                      }}>
                        {user.email_verified ? 'verified' : 'unverified'}
                      </span>
                    </div>
                  ) : <span style={{ color: '#334155' }}>—</span>}
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
  const [albums, setAlbums] = useState(null);
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
        {albums === null && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="skeleton" style={{ height: 12, width: 24 }} />
            <div className="skeleton" style={{ height: 13, width: '40%' }} />
          </div>
        ))}
        {albums?.map(album => (
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

const RARITIES = ['', 'Rare', 'Epic', 'Mythic'];
const REWARDS = ['', 'Rare Puzzle Fragment', 'Epic Puzzle Fragment', 'Mythic Puzzle Fragment'];

function MissionsTab() {
  const { auth } = useAuth();
  const headers = { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' };
  const [milestones, setMilestones] = useState([]);
  const [albums, setAlbums] = useState(null);
  const [expandedAlbum, setExpandedAlbum] = useState(null);
  const [modal, setModal] = useState(null); // { mode: 'add'|'edit', albumId?, task?, milestone? }
  const [form, setForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState('');
  const [newTask, setNewTask] = useState({});

  useEffect(() => {
    fetch('/api/admin/missions', { headers }).then(r => r.json()).then(setMilestones);
    fetch('/api/admin/albums', { headers }).then(r => r.json()).then(setAlbums);
  }, []);

  // Group by album > task
  const grouped = {};
  for (const m of milestones) {
    if (!grouped[m.album_id]) grouped[m.album_id] = { album_name: m.album_name, tasks: {} };
    if (!grouped[m.album_id].tasks[m.task]) grouped[m.album_id].tasks[m.task] = [];
    grouped[m.album_id].tasks[m.task].push(m);
  }
  for (const albumData of Object.values(grouped)) {
    for (const ms of Object.values(albumData.tasks)) {
      ms.sort((a, b) => a.milestone_number - b.milestone_number);
    }
  }

  function openAdd(albumId, task, nextNum) {
    setModal({ mode: 'add', albumId, task });
    setForm({ task: task || '', milestone_number: nextNum || 1, milestone_value: '', is_unknown: false, is_final_milestone: false, rarity: 'Rare', fragment_reward: 'Rare Puzzle Fragment' });
    setError('');
  }

  function openEdit(m) {
    setModal({ mode: 'edit', milestone: m });
    setForm({ task: m.task, milestone_number: m.milestone_number, milestone_value: m.milestone_value || '', is_unknown: !!m.is_unknown, is_final_milestone: !!m.is_final_milestone, rarity: m.rarity || '', fragment_reward: m.fragment_reward || '' });
    setError('');
  }

  async function save() {
    setError('');
    const body = {
      task: form.task,
      milestone_number: Number(form.milestone_number),
      milestone_value: form.milestone_value || null,
      is_unknown: form.is_unknown ? 1 : 0,
      is_final_milestone: form.is_final_milestone ? 1 : 0,
      rarity: form.rarity || null,
      fragment_reward: form.fragment_reward || null,
    };
    const isAdd = modal.mode === 'add';
    const url = isAdd ? '/api/admin/missions' : `/api/admin/missions/${modal.milestone.id}`;
    const res = await fetch(url, { method: isAdd ? 'POST' : 'PUT', headers, body: JSON.stringify(isAdd ? { ...body, album_id: modal.albumId } : body) });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    setMilestones(prev => isAdd ? [...prev, data] : prev.map(m => m.id === data.id ? data : m));
    setModal(null);
  }

  async function deleteMilestone(id) {
    const res = await fetch(`/api/admin/missions/${id}`, { method: 'DELETE', headers });
    if (res.ok) { setMilestones(prev => prev.filter(m => m.id !== id)); setDeleteConfirm(null); }
  }

  const RARITY_COLOR = { Rare: '#3b82f6', Epic: '#a855f7', Mythic: '#f59e0b' };
  const RARITY_BG = { Rare: 'rgba(59,130,246,0.15)', Epic: 'rgba(168,85,247,0.15)', Mythic: 'rgba(245,158,11,0.15)' };

  return (
    <>
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="card" style={{ width: '100%', maxWidth: 460 }}>
            <h3 style={{ marginBottom: 16, fontSize: 16 }}>{modal.mode === 'add' ? 'Add Milestone' : 'Edit Milestone'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 13, color: '#94a3b8' }}>
                Task
                <input value={form.task} onChange={e => setForm(f => ({ ...f, task: e.target.value }))} style={{ display: 'block', width: '100%', marginTop: 4 }} />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <label style={{ fontSize: 13, color: '#94a3b8', flex: 1 }}>
                  Milestone #
                  <input type="number" value={form.milestone_number} onChange={e => setForm(f => ({ ...f, milestone_number: e.target.value }))} style={{ display: 'block', width: '100%', marginTop: 4 }} />
                </label>
                <label style={{ fontSize: 13, color: '#94a3b8', flex: 2 }}>
                  Value
                  <input value={form.milestone_value} onChange={e => setForm(f => ({ ...f, milestone_value: e.target.value }))} placeholder="e.g. 1,000,000" style={{ display: 'block', width: '100%', marginTop: 4 }} />
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <label style={{ fontSize: 13, color: '#94a3b8', flex: 1 }}>
                  Rarity
                  <select value={form.rarity} onChange={e => setForm(f => ({ ...f, rarity: e.target.value }))} style={{ display: 'block', width: '100%', marginTop: 4, padding: '6px 10px', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6 }}>
                    {RARITIES.map(r => <option key={r} value={r}>{r || '—'}</option>)}
                  </select>
                </label>
                <label style={{ fontSize: 13, color: '#94a3b8', flex: 2 }}>
                  Fragment Reward
                  <select value={form.fragment_reward} onChange={e => setForm(f => ({ ...f, fragment_reward: e.target.value }))} style={{ display: 'block', width: '100%', marginTop: 4, padding: '6px 10px', background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6 }}>
                    {REWARDS.map(r => <option key={r} value={r}>{r || '—'}</option>)}
                  </select>
                </label>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_unknown} onChange={e => setForm(f => ({ ...f, is_unknown: e.target.checked }))} />
                  Unknown
                </label>
                <label style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_final_milestone} onChange={e => setForm(f => ({ ...f, is_final_milestone: e.target.checked }))} />
                  Final milestone
                </label>
              </div>
              {error && <div style={{ color: '#f87171', fontSize: 13 }}>{error}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="card" style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Delete milestone</div>
            <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>
              Delete milestone #{deleteConfirm.milestone_number} of <strong>{deleteConfirm.task}</strong>? This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button onClick={() => deleteMilestone(deleteConfirm.id)} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {albums === null && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="skeleton" style={{ height: 13, width: '35%' }} />
          </div>
        ))}
        {albums?.map(album => {
          const albumData = grouped[album.id];
          const taskCount = albumData ? Object.keys(albumData.tasks).length : 0;
          const msCount = albumData ? Object.values(albumData.tasks).reduce((s, ms) => s + ms.length, 0) : 0;
          const isExpanded = expandedAlbum === album.id;

          return (
            <div key={album.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                <span style={{ flex: 1, fontWeight: 600 }}>{album.name}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{taskCount} tasks · {msCount} milestones</span>
                <button
                  className="btn-ghost"
                  style={{ fontSize: 12, padding: '4px 10px', color: isExpanded ? '#3b82f6' : '#94a3b8' }}
                  onClick={() => setExpandedAlbum(v => v === album.id ? null : album.id)}
                >
                  {isExpanded ? '▲' : '▼'}
                </button>
              </div>

              {isExpanded && (
                <div style={{ borderTop: '1px solid #334155', background: '#0f172a', padding: '12px 16px' }}>
                  {albumData && Object.entries(albumData.tasks).map(([taskName, ms]) => (
                    <div key={taskName} style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                        {taskName}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {ms.map(m => (
                          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', background: '#1e293b', borderRadius: 6, fontSize: 12 }}>
                            <span style={{ color: '#475569', minWidth: 20 }}>#{m.milestone_number}</span>
                            <span style={{ flex: 1, color: m.is_unknown ? '#475569' : '#e2e8f0' }}>
                              {m.is_unknown ? '?' : (m.milestone_value || '—')}
                            </span>
                            {m.rarity && (
                              <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 99, background: RARITY_BG[m.rarity], color: RARITY_COLOR[m.rarity] }}>
                                {m.rarity}
                              </span>
                            )}
                            {!!m.is_final_milestone && <span style={{ fontSize: 10, color: '#22c55e' }}>Final</span>}
                            <button className="btn-ghost" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => openEdit(m)}>Edit</button>
                            <button onClick={() => setDeleteConfirm(m)} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, border: 'none', background: '#ef444420', color: '#f87171', cursor: 'pointer', fontWeight: 600 }}>Del</button>
                          </div>
                        ))}
                      </div>
                      <button className="btn-ghost" style={{ marginTop: 4, fontSize: 11, padding: '2px 10px' }} onClick={() => openAdd(album.id, taskName, ms.length + 1)}>
                        + Add milestone
                      </button>
                    </div>
                  ))}

                  <div style={{ marginTop: albumData ? 8 : 0, display: 'flex', gap: 8 }}>
                    <input
                      value={newTask[album.id] || ''}
                      onChange={e => setNewTask(nt => ({ ...nt, [album.id]: e.target.value }))}
                      placeholder="New task name..."
                      style={{ flex: 1, fontSize: 12 }}
                    />
                    <button
                      className="btn-primary"
                      style={{ fontSize: 12 }}
                      onClick={() => {
                        if (!newTask[album.id]?.trim()) return;
                        openAdd(album.id, newTask[album.id].trim(), 1);
                        setNewTask(nt => ({ ...nt, [album.id]: '' }));
                      }}
                    >
                      Add task
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
