import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Navbar() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const searchRef = useRef(null);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); setOpen(false); return; }

    const timeout = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
        .then(r => r.json())
        .then(data => { setResults(data); setOpen(data.length > 0); });
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(albumId, puzzleId) {
    setQuery('');
    setResults([]);
    setOpen(false);
    navigate(`/albums/${albumId}?puzzleId=${puzzleId}`);
  }

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: '#1e293b',
      borderBottom: '1px solid #334155',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}>
      <span style={{ fontWeight: 700, fontSize: 16 }}>Tundra Albums</span>

      {auth && (
        <div ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search a puzzle..."
            style={{ width: '100%', padding: '6px 12px', fontSize: 13 }}
          />
          {open && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
              background: '#1e293b', border: '1px solid #334155', borderRadius: 8,
              zIndex: 200, overflow: 'hidden',
            }}>
              {results.map(r => (
                <div
                  key={r.id}
                  onClick={() => handleSelect(r.album_id, r.id)}
                  style={{ padding: '8px 14px', cursor: 'pointer', fontSize: 13 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <span style={{ fontWeight: 600 }}>{r.name}</span>
                  <span style={{ color: '#64748b', marginLeft: 8 }}>{r.album_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <span style={{ flex: 1 }} />
      {auth && (
        <>
          <span style={{ fontSize: 14, color: '#94a3b8' }}>
            {auth.username}
            {auth.alliance && <span style={{ color: '#3b82f6', marginLeft: 8 }}>[{auth.alliance}]</span>}
          </span>
          <Link to="/settings" title="Settings" style={{ color: '#64748b', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06
                a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09
                A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06
                A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09
                A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06
                A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09
                a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06
                A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09
                a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </Link>
          <button className="btn-ghost" onClick={handleLogout} style={{ padding: '6px 12px' }}>
            Logout
          </button>
        </>
      )}
    </nav>
  );
}
