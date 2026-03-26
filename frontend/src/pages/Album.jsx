import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const highlightedPuzzleId = Number(searchParams.get('puzzleId'));
  const highlightedPieceId = Number(searchParams.get('id'));
  const { auth } = useAuth();
  const [album, setAlbum] = useState(null);
  const [albums, setAlbums] = useState([]);
  const puzzleRefs = useRef({});
  const [pendingPiece, setPendingPiece] = useState(null);
  const [pendingReset, setPendingReset] = useState(null);
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetDuplicateConfirm, setShowResetDuplicateConfirm] = useState(false);
  const [showResetMenu, setShowResetMenu] = useState(false);
const [mode, setMode] = useState('need');
  const [starsMenu, setStarsMenu] = useState(null); // { pieceId, x, y, currentStars }

  const headers = { Authorization: `Bearer ${auth.token}` };

  useEffect(() => {
    fetch(`/api/albums/${albumId}`, { headers }).then(r => r.json()).then(setAlbum);
    fetch('/api/albums', { headers }).then(r => r.json()).then(setAlbums);
  }, [albumId]);

useEffect(() => {
    if (!highlightedPuzzleId || !album) return;
    const el = puzzleRefs.current[highlightedPuzzleId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightedPuzzleId, album]);

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
          pieces: pz.pieces.map(p => p.status === 'have_duplicate' ? { ...p, status: 'have' } : p),
        })),
      }));
    }
  }

  async function resetPuzzle(puzzleId) {
    setOpenActionMenu(null);
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

  async function completePuzzle(puzzleId) {
    setOpenActionMenu(null);
    setPendingReset(puzzleId);
    const res = await fetch(`/api/inventory/puzzle/${puzzleId}/complete`, { method: 'PUT', headers });
    if (res.ok) {
      setAlbum(prev => ({
        ...prev,
        puzzles: prev.puzzles.map(pz =>
          pz.id === puzzleId
            ? { ...pz, pieces: pz.pieces.map(p => ({ ...p, status: p.status === 'have_duplicate' ? 'have_duplicate' : 'have' })) }
            : pz
        ),
      }));
    }
    setPendingReset(null);
  }

  async function updatePieceStars(pieceId, stars) {
    setStarsMenu(null);
    const res = await fetch(`/api/pieces/${pieceId}/stars`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ stars }),
    });
    if (res.ok) {
      setAlbum(prev => ({
        ...prev,
        puzzles: prev.puzzles.map(pz => ({
          ...pz,
          pieces: pz.pieces.map(p => p.id === pieceId ? { ...p, stars } : p),
        })),
      }));
    }
  }

  function handlePieceContextMenu(e, piece) {
    if (auth.role !== 'admin' && auth.role !== 'stars_editor') return;
    e.preventDefault();
    setStarsMenu({ pieceId: piece.id, x: e.clientX, y: e.clientY, currentStars: piece.stars ?? 1 });
  }

  function handlePieceClick(piece) {
    if ((piece.stars ?? 1) === 5 && (mode === 'need' || mode === 'have_duplicate')) return;
    let next;
    if (piece.status === mode) {
      next = mode === 'have_duplicate' ? 'have' : null;
    } else {
      next = mode;
    }
    setPieceStatus(piece.id, next);
  }

  if (!album) return <div style={{ padding: 32 }}>Loading...</div>;

const currentIndex = albums.findIndex(a => a.id === album.id);
  const prevAlbum = currentIndex > 0 ? albums[currentIndex - 1] : null;
  const nextAlbum = currentIndex >= 0 && currentIndex < albums.length - 1 ? albums[currentIndex + 1] : null;


  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
      {starsMenu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => setStarsMenu(null)} />
          <div style={{
            position: 'fixed', left: starsMenu.x, top: starsMenu.y, zIndex: 300,
            background: '#1e293b', border: '1px solid #334155', borderRadius: 8,
            padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Stars</div>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => updatePieceStars(starsMenu.pieceId, n)}
                style={{
                  background: n === starsMenu.currentStars ? '#334155' : 'none',
                  border: 'none', borderRadius: 6, padding: '4px 8px',
                  cursor: 'pointer', textAlign: 'left', fontSize: 13,
                  color: '#facc15',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                onMouseLeave={e => e.currentTarget.style.background = n === starsMenu.currentStars ? '#334155' : 'none'}
              >
                {'★'.repeat(n)}
              </button>
            ))}
          </div>
        </>
      )}
      <div style={{
        position: 'sticky', top: 54, zIndex: 50,
        background: '#0f172a', paddingTop: 24, marginTop: -24, paddingBottom: 10, marginBottom: 4,
      }}>
      {/* Row 1: back | ‹ title › | actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Link to="/albums" className="btn-ghost" title="Albums" style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center', minWidth: 0 }}>
          {prevAlbum
            ? <Link to={`/albums/${prevAlbum.id}`} className="btn-ghost" style={{ fontSize: 13, padding: '2px 8px', flexShrink: 0 }} title={prevAlbum.name}>‹</Link>
            : <span style={{ width: 34 }} />
          }
          <h2 style={{ fontSize: 18, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{album.name}</h2>
          {nextAlbum
            ? <Link to={`/albums/${nextAlbum.id}`} className="btn-ghost" style={{ fontSize: 13, padding: '2px 8px', flexShrink: 0 }} title={nextAlbum.name}>›</Link>
            : <span style={{ width: 34 }} />
          }
        </div>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            className="btn-ghost"
            style={{ padding: '4px 8px', display: 'flex', alignItems: 'center' }}
            onClick={() => setShowResetMenu(v => !v)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
            </svg>
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

      {/* Row 2: mode toggle */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setMode('need')}
          style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none',
            background: mode === 'need' ? STATUS_COLORS.need : STATUS_COLORS.need + '20',
            color: mode === 'need' ? '#000' : STATUS_COLORS.need,
          }}
        >
          Looking for
        </button>
        <button
          onClick={() => setMode('have_duplicate')}
          style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none',
            background: mode === 'have_duplicate' ? STATUS_COLORS.have_duplicate : STATUS_COLORS.have_duplicate + '20',
            color: mode === 'have_duplicate' ? '#000' : STATUS_COLORS.have_duplicate,
          }}
        >
          Have duplicate
        </button>
        <button
          onClick={() => setMode('have')}
          style={{
            padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none',
            background: mode === 'have' ? STATUS_COLORS.have : STATUS_COLORS.have + '20',
            color: mode === 'have' ? '#fff' : STATUS_COLORS.have,
          }}
        >
          Have
        </button>
      </div>
      </div>{/* end sticky wrapper */}

      {album.puzzles.map(puzzle => {
        const isCompleted = puzzle.pieces.length > 0 && puzzle.pieces.every(p => p.status === 'have' || p.status === 'have_duplicate');
        const isHighlighted = puzzle.id === highlightedPuzzleId;
        return (
        <div key={puzzle.id} ref={el => puzzleRefs.current[puzzle.id] = el} className="card" style={{ marginBottom: 16, background: isCompleted ? '#0f2744' : '', borderColor: isHighlighted ? '#facc15' : isCompleted ? '#1d4ed8' : '' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ flex: 1, fontSize: 15, color: '#94a3b8' }}>{puzzle.name}</h3>
            <div style={{ position: 'relative' }}>
              <button
                className="btn-ghost"
                onClick={() => setOpenActionMenu(v => v === puzzle.id ? null : puzzle.id)}
                disabled={pendingReset === puzzle.id}
                style={{ fontSize: 12, opacity: pendingReset === puzzle.id ? 0.5 : 1 }}
              >
                Actions ▾
              </button>
              {openActionMenu === puzzle.id && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                    onClick={() => setOpenActionMenu(null)}
                  />
                  <div style={{
                    position: 'absolute', right: 0, top: '100%', marginTop: 4,
                    background: '#1e293b', border: '1px solid #334155', borderRadius: 8,
                    minWidth: 160, zIndex: 100, overflow: 'hidden',
                  }}>
                    <button
                      onClick={() => completePuzzle(puzzle.id)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '10px 14px', background: 'none', border: 'none',
                        color: '#e2e8f0', fontSize: 13, cursor: 'pointer',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => resetPuzzle(puzzle.id)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '10px 14px', background: 'none', border: 'none',
                        color: '#e2e8f0', fontSize: 13, cursor: 'pointer',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#334155'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      Reset
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 100px))', gap: 8, justifyContent: 'center' }}>
            {puzzle.pieces.map((piece) => {
              const isFiveStar = (piece.stars ?? 1) === 5;
              const isDisabledMode = isFiveStar && (mode === 'need' || mode === 'have_duplicate');
              const isDuplicate = piece.status === 'have_duplicate';
              const color = isDuplicate ? STATUS_COLORS.have : (piece.status ? STATUS_COLORS[piece.status] : '#334155');
              const isLoading = pendingPiece === piece.id;
              return (
                <button
                  key={piece.id}
                  onClick={() => handlePieceClick(piece)}
                  onContextMenu={(e) => handlePieceContextMenu(e, piece)}
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
                    opacity: isLoading ? 0.5 : isDisabledMode ? 0.35 : 1,
                    cursor: isDisabledMode ? 'default' : 'pointer',
                    outline: piece.id === highlightedPieceId ? '2px solid #facc15' : 'none',
                    outlineOffset: 2,
                  }}
                >
                  {piece.name}
                  <div style={{ fontSize: 10, fontWeight: 400, marginTop: 1, color: '#facc15' }}>{'★'.repeat(piece.stars ?? 1)}</div>
                  {isDuplicate && (
                    <span style={{
                      position: 'absolute', bottom: 2, right: 2,
                      background: '#22c55e', borderRadius: 6,
                      fontSize: 9, fontWeight: 700,
                      padding: '1px 4px', color: '#000',
                      lineHeight: '14px', whiteSpace: 'nowrap',
                    }}>+1</span>
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

    </div>
  );
}

