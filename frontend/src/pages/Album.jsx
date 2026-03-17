import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = {
  need: 'Je cherche',
  have_duplicate: 'J\'ai en double',
};

const STATUS_COLORS = {
  need: '#f59e0b',
  have_duplicate: '#22c55e',
};

export default function Album() {
  const { albumId } = useParams();
  const { auth } = useAuth();
  const [album, setAlbum] = useState(null);
  const [allianceData, setAllianceData] = useState([]);
  const [showAlliance, setShowAlliance] = useState(false);
  const [pendingPiece, setPendingPiece] = useState(null); // pieceId being updated

  const headers = { Authorization: `Bearer ${auth.token}` };

  useEffect(() => {
    fetch(`/api/albums/${albumId}`, { headers }).then(r => r.json()).then(setAlbum);
  }, [albumId]);

  useEffect(() => {
    if (!showAlliance) return;
    fetch(`/api/albums/${albumId}/alliance`, { headers }).then(r => r.json()).then(setAllianceData);
  }, [albumId, showAlliance]);

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

  if (!album) return <div style={{ padding: 32 }}>Chargement...</div>;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link to="/" style={{ color: '#64748b', fontSize: 14 }}>← Albums</Link>
        <h2 style={{ flex: 1 }}>{album.name}</h2>
        <button
          className={showAlliance ? 'btn-primary' : 'btn-ghost'}
          onClick={() => setShowAlliance(v => !v)}
        >
          {showAlliance ? 'Masquer alliance' : 'Voir alliance'}
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, fontSize: 13 }}>
        <span style={{ color: '#64748b' }}>Cliquez sur une pièce pour changer son état :</span>
        <span style={{ color: STATUS_COLORS.need }}>● Je cherche</span>
        <span style={{ color: STATUS_COLORS.have_duplicate }}>● J'ai en double</span>
        <span style={{ color: '#334155' }}>● Normal</span>
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
                  title={piece.status ? STATUS_LABELS[piece.status] : 'Aucun statut'}
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
                  {showAlliance && allianceData.length > 0 && (
                    <AllianceBadge
                      pieceId={piece.id}
                      allianceData={allianceData}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {showAlliance && allianceData.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 12 }}>Membres de l'alliance</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
            {allianceData.map(member => {
              const needs = Object.entries(member.inventory).filter(([, s]) => s === 'need').length;
              const offers = Object.entries(member.inventory).filter(([, s]) => s === 'have_duplicate').length;
              return (
                <div key={member.id} style={{ background: '#0f172a', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{member.username}</div>
                  <div style={{ color: STATUS_COLORS.have_duplicate }}>Offre : {offers} pièce(s)</div>
                  <div style={{ color: STATUS_COLORS.need }}>Cherche : {needs} pièce(s)</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AllianceBadge({ pieceId, allianceData }) {
  const offers = allianceData.filter(m => m.inventory[pieceId] === 'have_duplicate');
  const needs = allianceData.filter(m => m.inventory[pieceId] === 'need');
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
