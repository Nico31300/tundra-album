import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  need: '#f59e0b',
  have_duplicate: '#22c55e',
};

export default function Home() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [albums, setAlbums] = useState([]);
  const [users, setUsers] = useState([]);
  const [matches, setMatches] = useState(null);

  const headers = { Authorization: `Bearer ${auth.token}` };

  useEffect(() => {
    fetch('/api/albums', { headers }).then(r => r.json()).then(setAlbums);
    fetch('/api/users', { headers }).then(r => r.json()).then(setUsers);
    fetch('/api/users/matches', { headers }).then(r => r.json()).then(setMatches);
  }, [auth.token]);

  const totalPieces = albums.reduce((sum, a) => sum + (a.stats?.total ?? 0), 0);
  const totalOwned = albums.reduce((sum, a) => sum + (a.stats?.have ?? 0) + (a.stats?.have_duplicate ?? 0), 0);
  const totalNeed = albums.reduce((sum, a) => sum + (a.stats?.need ?? 0), 0);
  const totalDuplicates = albums.reduce((sum, a) => sum + (a.stats?.have_duplicate ?? 0), 0);
  const progressPct = totalPieces > 0 ? Math.round((totalOwned / totalPieces) * 100) : 0;

  const totalPlayers = users.length;
  const playersNeed = users.reduce((sum, u) => sum + (u.need ?? 0), 0);
  const playersOffering = users.reduce((sum, u) => sum + (u.have_duplicate ?? 0), 0);

  const cardStyle = {
    cursor: 'pointer',
    aspectRatio: '1',
    display: 'flex',
    flexDirection: 'column',
    transition: 'border-color 0.15s, background 0.15s',
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div className="home-cards">
        {/* My Albums card */}
        <div
          className="card"
          onClick={() => navigate('/albums')}
          style={cardStyle}
          onMouseEnter={e => e.currentTarget.style.background = '#263347'}
          onMouseLeave={e => e.currentTarget.style.background = ''}
        >
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>My Albums</div>
          <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            {totalNeed > 0 && (
              <div style={{ color: STATUS_COLORS.need }}>Looking for: {totalNeed}</div>
            )}
            {totalDuplicates > 0 && (
              <div style={{ color: STATUS_COLORS.have_duplicate }}>Have duplicates: {totalDuplicates}</div>
            )}
            {totalNeed === 0 && totalDuplicates === 0 && (
              <div style={{ color: '#475569' }}>No active pieces</div>
            )}
          </div>
          {totalPieces > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ position: 'relative', background: '#0f172a', borderRadius: 99, height: 18, overflow: 'hidden' }}>
                <div style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  background: progressPct === 100 ? '#22c55e' : '#3b82f6',
                  borderRadius: 99,
                  transition: 'width 0.3s',
                }} />
                <span style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#fff',
                }}>
                  {progressPct}%
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, textAlign: 'right' }}>
                {totalOwned}/{totalPieces} pieces
              </div>
            </div>
          )}
        </div>

        {/* Players card */}
        <div
          className="card"
          onClick={() => navigate('/players')}
          style={cardStyle}
          onMouseEnter={e => e.currentTarget.style.background = '#263347'}
          onMouseLeave={e => e.currentTarget.style.background = ''}
        >
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Players</div>
          <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ color: '#e2e8f0' }}>Players: {totalPlayers}</div>
            {playersNeed > 0 && (
              <div style={{ color: STATUS_COLORS.need }}>Looking for: {playersNeed}</div>
            )}
            {playersOffering > 0 && (
              <div style={{ color: STATUS_COLORS.have_duplicate }}>Offering: {playersOffering}</div>
            )}
            {playersNeed === 0 && playersOffering === 0 && (
              <div style={{ color: '#475569' }}>No active trades</div>
            )}
          </div>
        </div>

        {/* My Matches card */}
        <div
          className="card"
          onClick={() => navigate('/matches')}
          style={cardStyle}
          onMouseEnter={e => e.currentTarget.style.background = '#263347'}
          onMouseLeave={e => e.currentTarget.style.background = ''}
        >
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>My Matches</div>
          <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            {!matches && <div style={{ color: '#475569' }}>Loading…</div>}
            {matches && matches.players.length === 0 && (
              <div style={{ color: '#475569' }}>No matches yet</div>
            )}
            {matches && matches.players.length > 0 && (
              <>
                <div style={{ color: '#e2e8f0' }}>
                  {matches.players.length} player{matches.players.length !== 1 ? 's' : ''}
                </div>
                {matches.canReceive > 0 && (
                  <div style={{ color: STATUS_COLORS.have_duplicate }}>
                    Can receive: {matches.canReceive} piece{matches.canReceive !== 1 ? 's' : ''}
                  </div>
                )}
                {matches.canGive > 0 && (
                  <div style={{ color: STATUS_COLORS.need }}>
                    Can give: {matches.canGive} piece{matches.canGive !== 1 ? 's' : ''}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
