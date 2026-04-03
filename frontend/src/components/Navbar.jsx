import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { version } from '../../package.json';
import { Home, X, User, ChevronDown, Shield, ArrowLeftRight, Settings, Download, Info, LogOut } from 'lucide-react';

export default function Navbar() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const location = useLocation();

  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);

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
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setAboutOpen(false);
        setInstallOpen(false);
        setAvatarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function handleSelect(albumId, puzzleId) {
    setQuery('');
    setResults([]);
    setSearchOpen(false);
    navigate(`/albums/${albumId}?puzzleId=${puzzleId}`);
  }

  return (
    <>
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: '#1e293b',
      borderBottom: '1px solid #334155',
      padding: '0 16px',
      height: 54,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      {/* Left */}
      <div className="navbar-left" style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/" onClick={() => location.pathname === '/' && window.dispatchEvent(new Event('home-refresh'))} className="navbar-desktop" style={{ fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap', color: '#e2e8f0' }}>
          Tundra Albums
        </Link>
        <Link to="/" onClick={() => location.pathname === '/' && window.dispatchEvent(new Event('home-refresh'))} className="navbar-mobile" style={{ color: '#e2e8f0', display: 'flex', alignItems: 'center', padding: 4 }}>
          <Home size={22} />
        </Link>
      </div>

      {/* Mid: search */}
      {auth && (
        <div ref={searchRef} style={{ flex: 1, position: 'relative', maxWidth: 400 }}>
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

      {/* Right: user menu */}
      {auth && (
        <div ref={avatarRef} className="navbar-right" style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setAvatarOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 10px 5px 8px', borderRadius: 20,
              background: avatarOpen ? '#334155' : 'transparent',
              border: '1px solid #334155',
              color: '#e2e8f0', cursor: 'pointer', flexShrink: 0,
              fontSize: 13, fontWeight: 500,
            }}
          >
            <User size={15} style={{ flexShrink: 0 }} />
            <span className="navbar-desktop" style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{auth.in_game_name || auth.username}</span>
            <ChevronDown size={13} style={{ color: '#64748b', transform: avatarOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
          </button>

          {avatarOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              background: '#1e293b', border: '1px solid #334155', borderRadius: 10,
              minWidth: 200, zIndex: 200, overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #334155' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{auth.in_game_name || auth.username}</div>
                {auth.alliance && (
                  <div style={{ color: '#3b82f6', fontSize: 12, marginTop: 2 }}>[{auth.alliance}]</div>
                )}
              </div>

              {/* Admin — admin only */}
              {auth.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setAvatarOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 13, color: '#e2e8f0', borderBottom: '1px solid #334155' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <Shield size={14} style={{ color: '#64748b', flexShrink: 0 }} />
                  Admin
                </Link>
              )}

              {/* Navigation */}
              <Link
                to="/available"
                onClick={() => setAvatarOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 13, color: '#e2e8f0' }}
                onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <ArrowLeftRight size={14} style={{ color: '#64748b', flexShrink: 0 }} />
                Available for trade
              </Link>
              <Link
                to="/settings"
                onClick={() => setAvatarOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 13, color: '#e2e8f0', borderBottom: '1px solid #334155' }}
                onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <Settings size={14} style={{ color: '#64748b', flexShrink: 0 }} />
                Settings
              </Link>

              {/* App actions */}
              <button
                onClick={() => { setAvatarOpen(false); setInstallOpen(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: 13, background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <Download size={14} style={{ color: '#64748b', flexShrink: 0 }} />
                Install app
              </button>
              <button
                onClick={() => { setAvatarOpen(false); setAboutOpen(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: 13, background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', borderBottom: '1px solid #334155' }}
                onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <Info size={14} style={{ color: '#64748b', flexShrink: 0 }} />
                About
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: 13, background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <LogOut size={14} style={{ flexShrink: 0 }} />
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>

    {/* About modal */}
    {aboutOpen && (
      <div
        onClick={() => setAboutOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: '#1e293b', border: '1px solid #334155', borderRadius: 12,
            width: '100%', maxWidth: 520, padding: 24, position: 'relative',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          }}
        >
          <button
            onClick={() => setAboutOpen(false)}
            style={{
              position: 'absolute', top: 12, right: 12,
              background: 'none', border: 'none', color: '#64748b',
              cursor: 'pointer', padding: 4, display: 'flex',
            }}
          >
            <X size={18} />
          </button>

          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Tundra Albums v{version}</div>

          <div style={{ borderTop: '1px solid #334155', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 16, fontSize: 13, color: '#94a3b8', overflowY: 'auto' }}>
            <div style={{ color: '#e2e8f0', fontWeight: 600 }}>What's new</div>

            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>v1.6.2</div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16, margin: 0 }}>
                <li>In-game name — set a display name separate from your login username in Settings</li>
                <li>Admin panel now shows both username and in-game name, with edit support for both</li>
              </ul>
            </div>

            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>v1.6.1</div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16, margin: 0 }}>
                <li>Bug fix - push notifications automatically re-enabled</li>
                <li>User Menu redesign</li>
                <li>Home dashboard — choose which cards to display in settings</li>
              </ul>
            </div>

            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>v1.6.0</div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16, margin: 0 }}>
                <li>Available for trade page - see all pieces currently offered as duplicates, grouped by album and puzzle, with links to each provider</li>
                <li>Batch push notifications - get notified every 2 hours about pieces you need that have become available</li>
                <li>Auth page polish - navbar and footer are now hidden on login, register, and change-password pages</li>
              </ul>
            </div>

            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>v1.5.2</div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16, margin: 0 }}>
                <li>Security hardening - rate limiting, CORS</li>
                <li>Error states on all pages - failed requests now show a message</li>
                <li>Skeleton loaders on all pages</li>
                <li>Backend performance</li>
              </ul>
            </div>

            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>v1.5.1</div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16, margin: 0 }}>
                <li>Bug fix - Albums tab on player page no longer crashes</li>
              </ul>
            </div>

            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>v1.5.0</div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16, margin: 0 }}>
                <li>Matches page overhaul - filter by "Can give you" or "Needs from you", sort by last activity, search by puzzle name, collapsible cards, mutual match highlight, refresh button, and navigate to player pages directly from a match card</li>
                <li>Skeleton loaders on all main pages while data loads</li>
                <li>Clicking the home button while on the home page refreshes the cards without a full page reload</li>
              </ul>
            </div>

            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>v1.4.0</div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16, margin: 0 }}>
                <li>Push notifications - get notified when someone clicks a piece on your player page</li>
              </ul>
            </div>

            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>v1.3.1</div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16, margin: 0 }}>
                <li>Security & bug fix</li>
                <li>Activity log pruning re-enabled - logs older than 7 days are correctly auto-purged daily</li>
                <li>Progressive Web App - Install Tundra Albums on your phone or desktop via <strong style={{ color: '#e2e8f0' }}>avatar menu → Install app</strong></li>
              </ul>
            </div>

            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>v1.3.0</div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16, margin: 0 }}>
                <li>Player page now defaults to a Matches tab - see pieces you can exchange, click to copy message</li>
                <li>Activity log is now paginated with server-side filters; logs older than 7 days are auto-pruned</li>
                <li>Activity user filter now lists all users, not just those in the last page</li>
                <li>Bug fix - removing a duplicate piece is now correctly logged as Removed</li>
              </ul>
            </div>

            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>v1.2.0</div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 16, margin: 0 }}>
                <li>Activity log - all inventory and admin actions are now tracked</li>
                <li>Recent Activity card on the home dashboard with a 24-hour summary</li>
                <li>Mobile navbar - title replaced by a Home icon, avatar by a Menu icon</li>
              </ul>
            </div>

            <div style={{ borderTop: '1px solid #334155', paddingTop: 10, color: '#475569', fontSize: 12 }}>
              © {new Date().getFullYear()} Tundra Albums. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    )}
    {/* Install modal */}
    {installOpen && (
      <div
        onClick={() => setInstallOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: '#1e293b', border: '1px solid #334155', borderRadius: 12,
            width: '100%', maxWidth: 520, padding: 24, position: 'relative',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          }}
        >
          <button
            onClick={() => setInstallOpen(false)}
            style={{
              position: 'absolute', top: 12, right: 12,
              background: 'none', border: 'none', color: '#64748b',
              cursor: 'pointer', padding: 4, display: 'flex',
            }}
          >
            <X size={18} />
          </button>

          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Install the app</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontSize: 13, color: '#94a3b8', overflowY: 'auto' }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8, color: '#e2e8f0' }}>Android (Chrome)</div>
              <ol style={{ paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>Tap the <strong style={{ color: '#e2e8f0' }}>⋮</strong> menu in the top-right corner</li>
                <li>Select <strong style={{ color: '#e2e8f0' }}>Add to Home screen</strong></li>
                <li>Confirm by tapping <strong style={{ color: '#e2e8f0' }}>Add</strong></li>
              </ol>
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8, color: '#e2e8f0' }}>iPhone / iPad (Safari)</div>
              <ol style={{ paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>Tap the <strong style={{ color: '#e2e8f0' }}>Share</strong> button <strong style={{ color: '#e2e8f0' }}>⎙</strong> at the bottom of the screen</li>
                <li>Scroll down and tap <strong style={{ color: '#e2e8f0' }}>Add to Home Screen</strong></li>
                <li>Tap <strong style={{ color: '#e2e8f0' }}>Add</strong> in the top-right corner</li>
              </ol>
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8, color: '#e2e8f0' }}>Desktop (Chrome / Edge)</div>
              <ol style={{ paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>Click the <strong style={{ color: '#e2e8f0' }}>install</strong> icon <strong style={{ color: '#e2e8f0' }}>⊕</strong> in the address bar</li>
                <li>Click <strong style={{ color: '#e2e8f0' }}>Install</strong> in the prompt</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
