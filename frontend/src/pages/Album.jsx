import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = {
  need: 'Looking for',
  have_duplicate: 'Have duplicate',
};

const STATUS_COLORS = {
  need: '#f59e0b',
  have_duplicate: '#22c55e',
};

export default function Album() {
  const { albumId } = useParams();
  const { auth } = useAuth();
  const [album, setAlbum] = useState(null);
  const [usersData, setUsersData] = useState([]);
  const [showUsers, setShowUsers] = useState(false);
  const [pendingPiece, setPendingPiece] = useState(null);

  const headers = { Authorization: `Bearer ${auth.token}` };

  useEffect(() => {
    fetch(`/api/albums/${albumId}`, { headers }).then(r => r.json()).then(setAlbum);
  }, [albumId]);

  useEffect(() => {
    if (!showUsers) return;
    fetch(`/api/albums/${albumId}/users`, { headers }).then(r => r.json()).then(setUsersData);
  }, [albumId, showUsers]);

  async function setPieceStatus(pieceId, status) {
    setPendingPiece(pieceId);
    const res = await fetch(`/api/inventory/${pieceId}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (res.ok) {
      setAlbum(prev => ({
        ...prev,
        puzzles: prev.puzzles.map(pz => ({
          ...pz,
          pieces: pz.pieces.map(p =>
            p.id === pieceId ? { ...p, status: data.status } : p
          ),
        })),
      }));
    }
    setPendingPiece(null);
  }

  function cycleStatus(piece) {
    // null → need → have_duplicate → null
    const next = piece.status === null ? 'need'
      : piece.status === 'need' ? 'have_duplicate'
      : null;
    setPieceStatus(piece.id, next);
  }

  if (!album) return <div style={{ padding: 32 }}>Loading...</div>;

  const myAlliance = auth.alliance;
  const allianceMembers = usersData.filter(u => u.sameAlliance);
  const otherMembers = usersData.filter(u => !u.sameAlliance);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link to="/" style={{ color: '#64748b', fontSize: 14 }}>← Albums</Link>
        <h2 style={{ flex: 1 }}>{album.name}</h2>
        <button
          className={showUsers ? 'btn-primary' : 'btn-ghost'}
          onClick={() => setShowUsers(v => !v)}
        >
          {showUsers ? 'Hide players' : 'View players'}
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, fontSize: 13 }}>
        <span style={{ color: '#64748b' }}>Click a piece to change its status:</span>
        <span style={{ color: STATUS_COLORS.need }}>● Looking for</span>
        <span style={{ color: STATUS_COLORS.have_duplicate }}>● Have duplicate</span>
        <span style={{ color: '#334155' }}>● None</span>
      </div>

      {album.puzzles.map(puzzle => (
        <div key={puzzle.id} className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginBottom: 14, fontSize: 15, color: '#94a3b8' }}>{puzzle.name}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {puzzle.pieces.map(piece => {
              const color = piece.status ? STATUS_COLORS[piece.status] : '#334155';
              const isLoading = pendingPiece === piece.id;
              return (
                <button
                  key={piece.id}
                  onClick={() => cycleStatus(piece)}
                  disabled={isLoading}
                  title={piece.status ? STATUS_LABELS[piece.status] : 'No status'}
                  style={{
                    background: color,
                    color: piece.status ? '#000' : '#94a3b8',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    minWidth: 60,
                    position: 'relative',
                    opacity: isLoading ? 0.5 : 1,
                  }}
                >
                  {piece.name}
                  {showUsers && usersData.length > 0 && (
                    <UsersBadge pieceId={piece.id} usersData={usersData} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {showUsers && usersData.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Players</h3>

          {allianceMembers.length > 0 && (
            <>
              <h4 style={{ marginBottom: 10, fontSize: 13, color: '#3b82f6' }}>
                My alliance {myAlliance ? `[${myAlliance}]` : ''}
              </h4>
              <MemberList members={allianceMembers} />
            </>
          )}

          {otherMembers.length > 0 && (
            <div style={{ marginTop: allianceMembers.length > 0 ? 20 : 0 }}>
              <h4 style={{ marginBottom: 10, fontSize: 13, color: '#64748b' }}>Other alliances</h4>
              <MemberList members={otherMembers} showAlliance />
            </div>
          )}
        </div>
      )}

      {showUsers && usersData.length === 0 && (
        <div className="card" style={{ marginTop: 24, color: '#64748b', fontSize: 14 }}>
          No other player has listed pieces for this album.
        </div>
      )}
    </div>
  );
}

function MemberList({ members, showAlliance = false }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 13 }}>
      {members.map(member => {
        const needs = Object.values(member.inventory).filter(s => s === 'need').length;
        const offers = Object.values(member.inventory).filter(s => s === 'have_duplicate').length;
        return (
          <div key={member.id} style={{ background: '#0f172a', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>
              {member.username}
              {showAlliance && member.alliance && (
                <span style={{ color: '#64748b', fontWeight: 400, marginLeft: 6 }}>[{member.alliance}]</span>
              )}
            </div>
            <div style={{ color: STATUS_COLORS.have_duplicate }}>Offering: {offers} piece(s)</div>
            <div style={{ color: STATUS_COLORS.need }}>Looking for: {needs} piece(s)</div>
          </div>
        );
      })}
    </div>
  );
}

function UsersBadge({ pieceId, usersData }) {
  const offers = usersData.filter(u => u.inventory[pieceId] === 'have_duplicate');
  const needs = usersData.filter(u => u.inventory[pieceId] === 'need');
  if (!offers.length && !needs.length) return null;
  return (
    <span style={{
      position: 'absolute',
      top: -6,
      right: -6,
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: 10,
      fontSize: 9,
      padding: '1px 4px',
      color: '#e2e8f0',
      whiteSpace: 'nowrap',
    }}>
      {offers.length > 0 && <span style={{ color: STATUS_COLORS.have_duplicate }}>+{offers.length}</span>}
      {offers.length > 0 && needs.length > 0 && '/'}
      {needs.length > 0 && <span style={{ color: STATUS_COLORS.need }}>-{needs.length}</span>}
    </span>
  );
}