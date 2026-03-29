import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';

function StarRating({ stars }) {
  return (
    <span style={{ color: '#f59e0b', fontSize: 11, letterSpacing: 1 }}>
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
    </span>
  );
}

function SkeletonAvailable() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ width: 220, height: 28, background: '#1e293b', borderRadius: 6, marginBottom: 24 }} />
      {[1, 2].map(i => (
        <div key={i} style={{ marginBottom: 24 }}>
          <div style={{ width: 160, height: 20, background: '#1e293b', borderRadius: 4, marginBottom: 12 }} />
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, overflow: 'hidden' }}>
            {[1, 2, 3].map(j => (
              <div key={j} style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ flex: 1, height: 14, background: '#1e293b', borderRadius: 4 }} />
                <div style={{ width: 80, height: 14, background: '#1e293b', borderRadius: 4 }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Available() {
  const { auth } = useAuth();
  const [searchParams] = useSearchParams();
  const since = searchParams.get('since');
  const apiUrl = since ? `/api/pieces/available?since=${encodeURIComponent(since)}` : '/api/pieces/available';
  const { data: albums, loading, error } = useFetch(apiUrl, auth.token);

  const totalPieces = albums?.reduce((sum, a) => sum + a.puzzles.reduce((s, p) => s + p.pieces.length, 0), 0) ?? 0;

  if (loading) return <SkeletonAvailable />;

  if (error) return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ color: '#f87171', background: '#1e293b', borderRadius: 10, padding: 20 }}>
        Failed to load available pieces: {error}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
          {since ? 'Nouvelles pièces disponibles' : 'Available for trade'}
        </h1>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
          {since && (
            <span style={{ fontSize: 12, color: '#64748b' }}>Depuis votre dernière notification</span>
          )}
          {totalPieces > 0 && (
            <span style={{ fontSize: 13, color: '#64748b' }}>
              {totalPieces} pièce{totalPieces > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {albums.length === 0 ? (
        <div style={{
          background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10,
          padding: 32, textAlign: 'center', color: '#64748b', fontSize: 14,
        }}>
          {since
            ? 'Aucune nouvelle pièce depuis votre dernière notification.'
            : "No pieces you're looking for are currently available as duplicates."}
        </div>
      ) : (
        albums.map(album => (
          <div key={album.album_id} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
              {album.album_name}
            </div>

            {album.puzzles.map(puzzle => (
              <div key={puzzle.puzzle_id} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, marginBottom: 6, paddingLeft: 2 }}>
                  {puzzle.puzzle_name}
                </div>
                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, overflow: 'hidden' }}>
                  {puzzle.pieces.map((piece, idx) => (
                    <div
                      key={piece.piece_id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 16px',
                        borderBottom: idx < puzzle.pieces.length - 1 ? '1px solid #1e293b' : 'none',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
                          {piece.piece_name}
                        </span>
                        <span style={{ marginLeft: 8 }}>
                          <StarRating stars={piece.stars} />
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {piece.providers.map(p => (
                          <Link
                            key={p.user_id}
                            to={`/players/${p.user_id}`}
                            style={{
                              fontSize: 12, padding: '3px 10px',
                              background: '#1e293b', border: '1px solid #334155',
                              borderRadius: 20, color: '#e2e8f0',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {p.username}
                            {p.alliance && (
                              <span style={{ color: '#3b82f6', marginLeft: 4 }}>[{p.alliance}]</span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
