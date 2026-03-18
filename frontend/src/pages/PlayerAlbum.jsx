import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatRelative } from '../utils/formatRelative';

const STATUS_COLORS = {
  need: '#f59e0b',
  have_duplicate: '#22c55e',
  have: '#3b82f6',
};

const STATUS_LABELS = {
  need: 'Looking for',
  have_duplicate: 'Have duplicate',
  have: 'Have',
};

export default function PlayerAlbum() {
  const { userId, albumId } = useParams();
  const { auth } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}/albums/${albumId}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    }).then(r => r.json()).then(setData);
  }, [userId, albumId]);

  if (!data) return <div style={{ padding: 32 }}>Loading...</div>;

  const { user, album } = data;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link to={`/players/${userId}`} style={{ color: '#64748b', fontSize: 14 }}>← {user.username}</Link>
        <h2 style={{ flex: 1 }}>{album.name}</h2>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, fontSize: 13, flexWrap: 'wrap' }}>
        <span style={{ color: STATUS_COLORS.need }}>● {user.username} is looking for</span>
        <span style={{ color: STATUS_COLORS.have_duplicate }}>● {user.username} has duplicate</span>
        <span style={{ color: STATUS_COLORS.have }}>● {user.username} has</span>
        <span style={{ color: '#a855f7' }}>● I can offer (my duplicate)</span>
      </div>

      {album.puzzles.map(puzzle => {
        const isCompleted = puzzle.pieces.length > 0 && puzzle.pieces.every(p => p.status === 'have' || p.status === 'have_duplicate');
        return (
          <div key={puzzle.id} className="card" style={{ marginBottom: 16, background: isCompleted ? '#0f2744' : '', borderColor: isCompleted ? '#1d4ed8' : '' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ flex: 1, fontSize: 15, color: '#94a3b8' }}>{puzzle.name}</h3>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {puzzle.pieces.map(piece => {
                const color = piece.status ? STATUS_COLORS[piece.status] : '#334155';
                const iCanOffer = piece.my_status === 'have_duplicate';
                return (
                  <div
                    key={piece.id}
                    title={[
                      piece.status ? `${user.username}: ${STATUS_LABELS[piece.status]}` : null,
                      iCanOffer ? 'I can offer this' : null,
                    ].filter(Boolean).join(' · ') || 'No status'}
                    style={{
                      background: color,
                      color: piece.status ? '#000' : '#94a3b8',
                      borderRadius: 6,
                      padding: '6px 10px',
                      fontSize: 12,
                      fontWeight: 600,
                      minWidth: 60,
                      position: 'relative',
                      textAlign: 'center',
                      outline: iCanOffer ? '2px solid #a855f7' : 'none',
                      outlineOffset: 2,
                    }}
                  >
                    {piece.name}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              {puzzle.last_updated
                ? <span style={{ fontSize: 12, color: '#64748b' }}>Last updated: {formatRelative(puzzle.last_updated)}</span>
                : <span />
              }
              {isCompleted && (
                <span style={{ fontSize: 16, color: '#3b82f6', fontWeight: 700, cursor: 'default', userSelect: 'none' }}>✓</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
