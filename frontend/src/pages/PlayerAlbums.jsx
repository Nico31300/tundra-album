import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CircleChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatRelative } from '../utils/formatRelative';
import { useFetch } from '../hooks/useFetch';

const STATUS_COLORS = {
  need: '#f59e0b',
  have_duplicate: '#22c55e',
};

function SkeletonPlayerAlbums() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
          <div className="skeleton" style={{ height: 20, width: 20, borderRadius: '50%' }} />
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            <div className="skeleton" style={{ height: 30, width: 72, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 30, width: 72, borderRadius: 6 }} />
          </div>
        </div>
        <div className="skeleton" style={{ height: 22, width: 180, marginTop: 8 }} />
      </div>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        {Array.from({ length: 2 }).map((_, col) => (
          <div key={col} style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="skeleton" style={{ height: 14, width: '40%' }} />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card" style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="skeleton" style={{ height: 12, width: '50%' }} />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="skeleton" style={{ height: 46, width: 60, borderRadius: 6 }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PlayerAlbums() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { auth } = useAuth();
  const highlightedPieceId = Number(searchParams.get('id')) || null;
  const [view, setView] = useState('matches');

  const { data, error: dataError } = useFetch(`/api/users/${userId}/albums`, auth.token);
  const { data: matches, error: matchesError } = useFetch(`/api/users/${userId}/matches`, auth.token);

  if (dataError) return <div style={{ padding: 32, color: '#f87171' }}>{dataError}</div>;
  if (!data) return <SkeletonPlayerAlbums />;

  const { user, albums } = data;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 24 }}>
        {/* Line 1: back + tabs */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', marginRight: 'auto', cursor: 'pointer', padding: 0 }}><CircleChevronLeft size={20} /></button>
          <div style={{ display: 'flex', gap: 6 }}>
            {['matches', 'albums'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '5px 14px', fontSize: 13, borderRadius: 6, border: '1px solid',
                  borderColor: view === v ? '#3b82f6' : '#334155',
                  background: view === v ? 'rgba(59,130,246,0.15)' : 'transparent',
                  color: view === v ? '#60a5fa' : '#94a3b8',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        {/* Line 2: username + alliance */}
        <h2 style={{ margin: 0 }}>
          {user.username}
          {user.alliance && <span style={{ color: '#64748b', fontWeight: 400, fontSize: 16, marginLeft: 8 }}>[{user.alliance}]</span>}
        </h2>
      </div>

      {view === 'albums' && (
        <div className="grid-3" style={{ gridAutoRows: '1fr' }}>
          {albums.map(album => {
            const allDone = album.stats.total_puzzles > 0 && album.stats.completed_puzzles === album.stats.total_puzzles;
            const owned = (album.stats.have ?? 0) + (album.stats.have_duplicate ?? 0);
            return (
              <Link key={album.id} to={`/players/${userId}/albums/${album.id}`} style={{ display: 'flex', height: '100%' }}>
                <div className="card" style={{ cursor: 'pointer', transition: 'background 0.15s', display: 'flex', flexDirection: 'column', flex: 1, background: allDone ? '#0f2744' : '', borderColor: allDone ? '#1d4ed8' : '' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#263347'}
                  onMouseLeave={e => e.currentTarget.style.background = allDone ? '#0f2744' : ''}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontWeight: 600 }}>{album.name}</div>
                    <span style={{ fontSize: 11, fontWeight: 400, color: '#64748b', marginLeft: 8, flexShrink: 0 }}>{owned}/{album.stats.total}</span>
                  </div>
                  <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                    {album.stats.need > 0 && (
                      <div style={{ color: STATUS_COLORS.need }}>Looking for: {album.stats.need}</div>
                    )}
                    {album.stats.have_duplicate > 0 && (
                      <div style={{ color: STATUS_COLORS.have_duplicate }}>Have duplicate: {album.stats.have_duplicate}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    {album.stats.total_puzzles > 0 && (
                      <div style={{ flex: 1, position: 'relative', background: '#0f172a', borderRadius: 99, height: 18, overflow: 'hidden' }}>
                        <div style={{
                          width: `${(album.stats.completed_puzzles / album.stats.total_puzzles) * 100}%`,
                          height: '100%', background: '#22c55e', borderRadius: 99,
                        }} />
                        <span style={{
                          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: '#fff',
                        }}>
                          {album.stats.completed_puzzles}/{album.stats.total_puzzles}
                        </span>
                      </div>
                    )}
                    {album.stats.last_updated && (
                      <div style={{ fontSize: 11, color: '#475569', flexShrink: 0 }}>
                        {formatRelative(album.stats.last_updated)}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {view === 'matches' && (
        <MatchesView matches={matches} error={matchesError} username={user.username} targetUserId={userId} token={auth.token} highlightedPieceId={highlightedPieceId} />
      )}
    </div>
  );
}

// Group flat piece list into { albumName: { puzzleName: [pieces] } }
function groupByAlbumPuzzle(pieces) {
  const albums = [];
  const albumMap = {};
  for (const p of pieces) {
    if (!albumMap[p.album_id]) {
      albumMap[p.album_id] = { album_name: p.album_name, puzzles: [], puzzleMap: {} };
      albums.push(albumMap[p.album_id]);
    }
    const album = albumMap[p.album_id];
    if (!album.puzzleMap[p.puzzle_id]) {
      album.puzzleMap[p.puzzle_id] = { puzzle_name: p.puzzle_name, pieces: [] };
      album.puzzles.push(album.puzzleMap[p.puzzle_id]);
    }
    album.puzzleMap[p.puzzle_id].pieces.push(p);
  }
  return albums;
}

// Build the same message format as Matches.jsx
function buildMatchMessage(username, intro, pieces) {
  const lines = [`Hey ${username}`, intro];
  const albumMap = {};
  for (const p of pieces) {
    const albumKey = p.album_name;
    if (!albumMap[albumKey]) albumMap[albumKey] = {};
    const puzzleKey = p.puzzle_name;
    (albumMap[albumKey][puzzleKey] = albumMap[albumKey][puzzleKey] || []).push(p.piece_name);
  }
  for (const [album, puzzles] of Object.entries(albumMap)) {
    lines.push(album);
    for (const [puzzle, piecesArr] of Object.entries(puzzles)) {
      lines.push(`- ${puzzle}: ${piecesArr.join(', ')}`);
    }
  }
  return lines.join('\n');
}

function PieceTile({ piece, onClick, copied }) {
  return (
    <div
      onClick={onClick}
      title="Click to copy message"
      style={{
        background: '#0f172a',
        color: '#e2e8f0',
        border: '1px solid #334155',
        borderRadius: 6,
        padding: '6px 10px',
        fontSize: 12,
        fontWeight: 600,
        minWidth: 60,
        textAlign: 'center',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <span style={{ color: copied ? '#22c55e' : '#e2e8f0' }}>
        {copied ? 'Copied' : piece.piece_name}
      </span>
      <div style={{ fontSize: 10, fontWeight: 400, marginTop: 1, color: copied ? 'transparent' : '#facc15' }}>
        {'★'.repeat(piece.stars ?? 1)}
      </div>
    </div>
  );
}

function MatchSection({ title, color, albums, username, messageIntro, targetUserId, token, section, highlightedPieceId }) {
  const [copiedId, setCopiedId] = useState(null);
  const pieceRefs = useRef({});

  useEffect(() => {
    if (!highlightedPieceId) return;
    const el = pieceRefs.current[highlightedPieceId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightedPieceId, albums]);

  function handlePieceClick(piece, albumName) {
    const text = buildMatchMessage(username, messageIntro, [piece]);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(piece.piece_id);
    setTimeout(() => setCopiedId(null), 300);

    fetch(`/api/push/notify/${targetUserId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        pieceName: piece.piece_name,
        puzzleName: piece.puzzle_name,
        albumName,
        section,
        pieceId: piece.piece_id,
        puzzleId: piece.puzzle_id,
        albumId: piece.album_id,
      }),
    });
  }

  return (
    <div style={{ flex: 1, minWidth: 260 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color, marginBottom: 14 }}>{title}</h3>

      {albums.length === 0 ? (
        <div style={{ color: '#475569', fontSize: 13 }}>Nothing here.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {albums.map(album => (
            <div key={album.album_name}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>
                {album.album_name}
              </div>
              {album.puzzles.map(puzzle => (
                <div key={puzzle.puzzle_name} className="card" style={{ marginBottom: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{puzzle.puzzle_name}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {puzzle.pieces.map(piece => (
                      <div key={piece.piece_id} ref={el => pieceRefs.current[piece.piece_id] = el}
                        style={{ outline: piece.piece_id === highlightedPieceId ? '2px solid #facc15' : 'none', borderRadius: 6 }}>
                        <PieceTile
                          piece={piece}
                          copied={copiedId === piece.piece_id}
                          onClick={() => handlePieceClick(piece, album.album_name)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MatchesView({ matches, error, username, targetUserId, token, highlightedPieceId }) {
  if (error) return <div style={{ color: '#f87171', fontSize: 14 }}>{error}</div>;
  if (!matches) return <div style={{ color: '#475569', fontSize: 14 }}>Loading…</div>;

  const iCanGiveAlbums = groupByAlbumPuzzle(matches.iCanGive);
  const theyCanGiveAlbums = groupByAlbumPuzzle(matches.theyCanGive);

  return (
    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <MatchSection
        title={`${username} can give me`}
        color="#f59e0b"
        albums={theyCanGiveAlbums}
        username={username}
        messageIntro="I'm looking for a puzzle piece:"
        targetUserId={targetUserId}
        token={token}
        section="theyCanGive"
        highlightedPieceId={highlightedPieceId}
      />
      <MatchSection
        title={`I can give ${username}`}
        color="#22c55e"
        albums={iCanGiveAlbums}
        username={username}
        messageIntro="Got a puzzle piece you might need:"
        targetUserId={targetUserId}
        token={token}
        section="iCanGive"
        highlightedPieceId={highlightedPieceId}
      />
    </div>
  );
}
