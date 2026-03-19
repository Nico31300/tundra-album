import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Navbar() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef(null);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); setSearchOpen(false); return; }

    const timeout = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      })
        .then(r => r.json())
        .then(data => { setResults(data); setSearchOpen(data.length > 0); });
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(albumId, puzzleId) {
    setQuery('');
    setResults([]);
    setSearchOpen(false);
    navigate(`/albums/${albumId}?puzzleId=${puzzleId}`);
  }

  const initial = auth?.username?.[0]?.toUpperCase() ?? '?';

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: '#1e293b',
      borderBottom: '1px solid #334155',
      padding: '0 24px',
      height: 54,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}>
      {/* Left: title */}
      <Link to="/" style={{ fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap', color: '#e2e8f0' }}>
        Tundra Albums
      </Link>

      {/* Mid: search */}
      {auth && (
        <div ref={searchRef} style={{ flex: 1, position: 'relative', maxWidth: 400, margin: '0 auto' }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search a puzzle..."
            style={{ width: '100%', padding: '6px 12px', fontSize: 16 }}
          />
          {searchOpen && (
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

      {/* Right: avatar */}
      {auth && (
        <div ref={avatarRef} style={{ position: 'relative', marginLeft: 'auto' }}>
          <button
            onClick={() => setAvatarOpen(v => !v)}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: '#3b82f6', color: '#fff',
              fontWeight: 700, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer', padding: 0,
              flexShrink: 0,
            }}
          >
            {initial}
          </button>

          {avatarOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              background: '#1e293b', border: '1px solid #334155', borderRadius: 10,
              minWidth: 180, zIndex: 200, overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #334155' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{auth.username}</div>
                {auth.alliance && (
                  <div style={{ color: '#3b82f6', fontSize: 13, marginTop: 2 }}>[{auth.alliance}]</div>
                )}
              </div>
              <Link
                to="/settings"
                onClick={() => setAvatarOpen(false)}
                style={{
                  display: 'block', padding: '10px 16px', fontSize: 13,
                  color: '#e2e8f0',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                Settings
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 16px', fontSize: 13,
                  background: 'none', border: 'none', color: '#f87171', cursor: 'pointer',
                  borderTop: '1px solid #334155',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
