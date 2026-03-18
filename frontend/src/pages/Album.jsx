import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = {
  need: 'Looking for',
  have_duplicate: 'Have duplicate',
  have: 'Have',
};

const STATUS_COLORS = {
  need: '#f59e0b',
  have_duplicate: '#22c55e',
  have: '#3b82f6',
};

export default function Album() {
  const { albumId } = useParams();
  const { auth } = useAuth();
  const [album, setAlbum] = useState(null);
  const [usersData, setUsersData] = useState([]);
  const [showUsers, setShowUsers] = useState(false);
  const [pendingPiece, setPendingPiece] = useState(null);
  const [pendingReset, setPendingReset] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetDuplicateConfirm, setShowResetDuplicateConfirm] = useState(false);
  const [showResetMenu, setShowResetMenu] = useState(false);
  const [showOtherAlliances, setShowOtherAlliances] = useState(false);
  const [mode, setMode] = useState('need');

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

  async function resetAlbum() {
    setShowResetConfirm(false);
    const res = await fetch(`/api/inventory/album/${albumId}`, { method: 'DELETE', headers });
    if (res.ok) {
      setAlbum(prev => ({
        ...prev,
        puzzles: prev.puzzles.map(pz => ({
          ...pz,
          pieces: pz.pieces.map(p => ({ ...p, status: null })),
        })),
      }));
    }
  }

  async function resetAlbumDuplicates() {
    setShowResetDuplicateConfirm(false);
    const res = await fetch(`/api/inventory/album/${albumId}/duplicates`, { method: 'DELETE', headers });
    if (res.ok) {
      setAlbum(prev => ({
        ...prev,
        puzzles: prev.puzzles.map(pz => ({
          ...pz,
          pieces: pz.pieces.map(p => p.status === 'have_duplicate' ? { ...p, status: null } : p),
        })),
      }));
    }
  }

  async function resetPuzzle(puzzleId) {
    setPendingReset(puzzleId);
    const res = await fetch(`/api/inventory/puzzle/${puzzleId}`, { method: 'DELETE', headers });
    if (res.ok) {
      setAlbum(prev => ({
        ...prev,
        puzzles: prev.puzzles.map(pz =>
          pz.id === puzzleId
            ? { ...pz, pieces: pz.pieces.map(p => ({ ...p, status: null })) }
            : pz
        ),
      }));
    }
    setPendingReset(null);
  }

  function handlePieceClick(piece) {
    const next = piece.status === mode ? null : mode;
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
        <div style={{ position: 'relative' }}>
          <button className="btn-ghost" onClick={() => setShowResetMenu(v => !v)}>
            Reset ▾
          </button>
          {showResetMenu && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                onClick={() => setShowResetMenu(false)}
              />
              <div style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 4,
                background: '#1e293b', border: '1px solid #334155', borderRadius: 8,
                minWidth: 200, zIndex: 100, overflow: 'hidden',
              }}>
                <button
                  onClick={() => { setShowResetMenu(false); setShowResetDuplicateConfirm(true); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '10px 14px', background: 'none', border: 'none',
                    color: '#e2e8f0', fontSize: 14, cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  Reset album duplicate
                </button>
                <button
                  onClick={() => { setShowResetMenu(false); setShowResetConfirm(true); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '10px 14px', background: 'none', border: 'none',
                    color: '#e2e8f0', fontSize: 14, cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  Reset album
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showResetDuplicateConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }}>
          <div className="card" style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Reset album duplicate</div>
            <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>
              This will clear all your <strong>have duplicate</strong> statuses for <strong>{album.name}</strong>. Continue?
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={() => setShowResetDuplicateConfirm(false)}>Cancel</button>
              <button className="btn-primary" onClick={resetAlbumDuplicates}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }}>
          <div className="card" style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Reset album</div>
            <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>
              This will clear all your piece statuses for <strong>{album.name}</strong>. Continue?
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={() => setShowResetConfirm(false)}>Cancel</button>
              <button className="btn-primary" onClick={resetAlbum}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setMode('need')}
          style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none',
            background: mode === 'need' ? STATUS_COLORS.need : '#1e293b',
            color: mode === 'need' ? '#000' : '#64748b',
          }}
        >
          Looking for
        </button>
        <button
          onClick={() => setMode('have_duplicate')}
          style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none',
            background: mode === 'have_duplicate' ? STATUS_COLORS.have_duplicate : '#1e293b',
            color: mode === 'have_duplicate' ? '#000' : '#64748b',
          }}
        >
          Have duplicate
        </button>
        <button
          onClick={() => setMode('have')}
          style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none',
            background: mode === 'have' ? STATUS_COLORS.have : '#1e293b',
            color: mode === 'have' ? '#fff' : '#64748b',
          }}
        >
          Have
        </button>
      </div>

      {album.puzzles.map(puzzle => {
        const isCompleted = puzzle.pieces.length > 0 && puzzle.pieces.every(p => p.status === 'have' || p.status === 'have_duplicate');
        return (
        <div key={puzzle.id} className="card" style={{ marginBottom: 16, background: isCompleted ? '#0f2744' : '', borderColor: isCompleted ? '#1d4ed8' : '' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ flex: 1, fontSize: 15, color: '#94a3b8' }}>{puzzle.name}</h3>
            <button
              className="btn-ghost"
              onClick={() => resetPuzzle(puzzle.id)}
              disabled={pendingReset === puzzle.id}
              style={{ fontSize: 12, opacity: pendingReset === puzzle.id ? 0.5 : 1 }}
            >
              Reset
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {puzzle.pieces.map(piece => {
              const color = piece.status ? STATUS_COLORS[piece.status] : '#334155';
              const isLoading = pendingPiece === piece.id;
              return (
                <button
                  key={piece.id}
                  onClick={() => handlePieceClick(piece)}
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
          {isCompleted && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <span style={{ fontSize: 16, color: '#3b82f6', fontWeight: 700, cursor: 'default', userSelect: 'none' }}>✓</span>
            </div>
          )}
        </div>
      ); })}

      {showUsers && usersData.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Players</h3>

          {allianceMembers.length > 0 && (
            <>
              <h4 style={{ marginBottom: 10, fontSize: 13, color: '#3b82f6' }}>
                My alliance {myAlliance ? `[${myAlliance}]` : ''}
              </h4>
              <MemberList members={allianceMembers} album={album} />
            </>
          )}

          {otherMembers.length > 0 && (
            <div style={{ marginTop: allianceMembers.length > 0 ? 20 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <h4 style={{ fontSize: 13, color: '#64748b' }}>Other alliances</h4>
                <button
                  className="btn-ghost"
                  style={{ fontSize: 12 }}
                  onClick={() => setShowOtherAlliances(v => !v)}
                >
                  {showOtherAlliances ? 'Hide' : 'Show'}
                </button>
              </div>
              {showOtherAlliances && <MemberList members={otherMembers} showAlliance album={album} />}
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

function MemberList({ members, showAlliance = false, album }) {
  // Build a map of piece_id -> piece name from the current user's album
  const pieceMap = {};
  for (const puzzle of album.puzzles) {
    for (const piece of puzzle.pieces) {
      pieceMap[piece.id] = { ...piece, puzzleName: puzzle.name };
    }
  }

  // Current user's needs and offers
  const myNeeds = new Set(
    Object.entries(pieceMap)
      .filter(([id]) => pieceMap[id].status === 'need')
      .map(([id]) => Number(id))
  );
  const myOffers = new Set(
    Object.entries(pieceMap)
      .filter(([id]) => pieceMap[id].status === 'have_duplicate')
      .map(([id]) => Number(id))
  );

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 13 }}>
      {members.map(member => {
        // Pieces this member can give me (they have duplicate, I need)
        const canGiveMe = Object.entries(member.inventory)
          .filter(([id, s]) => s === 'have_duplicate' && myNeeds.has(Number(id)))
          .map(([id]) => { const p = pieceMap[id]; return p ? `${p.puzzleName} - ${p.name}` : null; })
          .filter(Boolean);

        // Pieces I can give them (I have duplicate, they need)
        const iCanGive = Object.entries(member.inventory)
          .filter(([id, s]) => s === 'need' && myOffers.has(Number(id)))
          .map(([id]) => { const p = pieceMap[id]; return p ? `${p.puzzleName} - ${p.name}` : null; })
          .filter(Boolean);

        const hasMatch = canGiveMe.length > 0 || iCanGive.length > 0;

        return (
          <div key={member.id} style={{
            background: '#0f172a',
            borderRadius: 8,
            padding: '10px 14px',
            border: hasMatch ? '1px solid #334155' : '1px solid transparent',
          }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              {member.username}
              {showAlliance && member.alliance && (
                <span style={{ color: '#64748b', fontWeight: 400, marginLeft: 6 }}>[{member.alliance}]</span>
              )}
            </div>
            {canGiveMe.length > 0 && (
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: STATUS_COLORS.have_duplicate }}>Can give you:</span>
                <div style={{ paddingLeft: 8, color: '#cbd5e1' }}>{canGiveMe.join(', ')}</div>
              </div>
            )}
            {iCanGive.length > 0 && (
              <div>
                <span style={{ color: STATUS_COLORS.need }}>Needs from you:</span>
                <div style={{ paddingLeft: 8, color: '#cbd5e1' }}>{iCanGive.join(', ')}</div>
              </div>
            )}
            {!hasMatch && (
              <div style={{ color: '#475569' }}>No match</div>
            )}
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