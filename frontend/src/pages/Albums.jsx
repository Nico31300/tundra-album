import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';

const STATUS_COLORS = {
  need: '#f59e0b',
  have_duplicate: '#22c55e',
};

function SkeletonCard() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="skeleton" style={{ height: 14, width: '60%' }} />
      <div className="skeleton" style={{ height: 12, width: '40%' }} />
    </div>
  );
}

export default function Albums() {
  const { auth } = useAuth();
  const { data: albums, error } = useFetch('/api/albums', auth.token);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <h2 style={{ marginBottom: 20 }}>My Albums</h2>
      {error && <div style={{ color: '#f87171', marginBottom: 16, fontSize: 14 }}>{error}</div>}
      <div className="grid-3" style={{ gridAutoRows: '1fr' }}>
        {albums === null && !error && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        {albums?.map(album => {
          const allDone = album.stats?.total_puzzles > 0 && album.stats.completed_puzzles === album.stats.total_puzzles;
          const owned = (album.stats?.have ?? 0) + (album.stats?.have_duplicate ?? 0);
          return (
            <Link key={album.id} to={`/albums/${album.id}`} style={{ display: 'flex', height: '100%' }}>
              <div
                className="card"
                style={{
                  cursor: 'pointer', transition: 'background 0.15s', display: 'flex',
                  flexDirection: 'column', flex: 1,
                  background: allDone ? '#0f2744' : '',
                  borderColor: allDone ? '#1d4ed8' : '',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#263347'}
                onMouseLeave={e => e.currentTarget.style.background = allDone ? '#0f2744' : ''}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontWeight: 600 }}>{album.name}</div>
                  {album.stats && (
                    <span style={{ fontSize: 11, fontWeight: 400, color: '#64748b', marginLeft: 8, flexShrink: 0 }}>
                      {owned}/{album.stats.total}
                    </span>
                  )}
                </div>
                {album.stats && (
                  <>
                    <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                      {album.stats.need > 0 && (
                        <div style={{ color: STATUS_COLORS.need }}>Looking for: {album.stats.need}</div>
                      )}
                      {album.stats.have_duplicate > 0 && (
                        <div style={{ color: STATUS_COLORS.have_duplicate }}>Have duplicate: {album.stats.have_duplicate}</div>
                      )}
                    </div>
                    {album.stats.total_puzzles > 0 && (
                      <div style={{ marginTop: 8, position: 'relative', background: '#0f172a', borderRadius: 99, height: 18, overflow: 'hidden' }}>
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
                    {!allDone && album.stats.five_star_total > 0 && (
                      <div style={{ marginTop: 4, position: 'relative', background: '#0f172a', borderRadius: 99, height: 18, overflow: 'hidden' }}>
                        <div style={{
                          width: `${(album.stats.five_star_owned / album.stats.five_star_total) * 100}%`,
                          height: '100%', background: '#f59e0b', borderRadius: 99,
                        }} />
                        <span style={{
                          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: '#fff',
                        }}>
                          {album.stats.five_star_owned}/{album.stats.five_star_total} (5★)
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

