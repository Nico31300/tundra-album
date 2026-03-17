import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav style={{
      background: '#1e293b',
      borderBottom: '1px solid #334155',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}>
      <span style={{ fontWeight: 700, fontSize: 16 }}>Tundra Albums</span>
      <span style={{ flex: 1 }} />
      {auth && (
        <>
          <span style={{ fontSize: 14, color: '#94a3b8' }}>
            {auth.username}
            {auth.alliance && <span style={{ color: '#3b82f6', marginLeft: 8 }}>[{auth.alliance}]</span>}
          </span>
          <button className="btn-ghost" onClick={handleLogout} style={{ padding: '6px 12px' }}>
            Logout
          </button>
        </>
      )}
    </nav>
  );
}
