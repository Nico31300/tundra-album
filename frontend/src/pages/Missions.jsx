import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const RARITY_BG = {
  Rare: 'rgba(59,130,246,0.15)',
  Epic: 'rgba(168,85,247,0.15)',
  Mythic: 'rgba(245,158,11,0.15)',
};

const RARITY_BORDER = {
  Rare: 'rgba(59,130,246,0.4)',
  Epic: 'rgba(168,85,247,0.4)',
  Mythic: 'rgba(245,158,11,0.4)',
};

function resolveTask(task, value) {
  if (!value) return task;
  return task.replace('X', value);
}

export default function Missions() {
  const { auth } = useAuth();
  const [data, setData] = useState(null);
  const [albumFilter, setAlbumFilter] = useState('All');
  const [completing, setCompleting] = useState(null);
  const [resetting, setResetting] = useState(null);

  const headers = { Authorization: `Bearer ${auth.token}` };

  const load = () =>
    fetch('/api/missions', { headers }).then(r => r.json()).then(setData);

  useEffect(() => { load(); }, [auth.token]);

  const handleComplete = async (milestoneId) => {
    setCompleting(milestoneId);
    await fetch(`/api/missions/${milestoneId}/complete`, { method: 'POST', headers });
    await load();
    setCompleting(null);
  };

  const handleUncomplete = async (milestoneId) => {
    setCompleting(milestoneId);
    await fetch(`/api/missions/${milestoneId}/complete`, { method: 'DELETE', headers });
    await load();
    setCompleting(null);
  };

  const handleReset = async (albumId) => {
    setResetting(albumId);
    await fetch(`/api/missions/albums/${albumId}/progress`, { method: 'DELETE', headers });
    await load();
    setResetting(null);
  };

  const albums = data ? data.albums : [];

  const visibleTasks = data
    ? data.tasks.filter(t => albumFilter === 'All' || t.album_name === albumFilter)
    : [];

  // Group by album for display
  const grouped = {};
  for (const t of visibleTasks) {
    if (!grouped[t.album_name]) grouped[t.album_name] = { album_id: t.album_id, tasks: [] };
    grouped[t.album_name].tasks.push(t);
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>Album Missions</h1>

        <select
          value={albumFilter}
          onChange={e => setAlbumFilter(e.target.value)}
          style={{
            marginLeft: 'auto',
            background: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #334155',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <option value="All">All</option>
          {albums.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
        </select>


      </div>

      {!data && <div style={{ color: '#475569', fontSize: 13 }}>Loading…</div>}

      {data && visibleTasks.length === 0 && (
        <div style={{ color: '#475569', fontSize: 13 }}>No missions to show.</div>
      )}

      {Object.entries(grouped).map(([album_name, { album_id, tasks }]) => (
        <div key={album_name} style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            {albumFilter === 'All' && (
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {album_name}
              </div>
            )}
            <button
              onClick={() => handleReset(album_id)}
              disabled={resetting === album_id}
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                color: '#475569',
                border: '1px solid #334155',
                borderRadius: 6,
                padding: '3px 10px',
                fontSize: 11,
                cursor: resetting === album_id ? 'not-allowed' : 'pointer',
                opacity: resetting === album_id ? 0.5 : 1,
              }}
            >
              Reset
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tasks.map(t => {
              const m = t.current;
              const isBusy = completing === m.id;

              const bg = t.allCompleted ? '#1e3a2e' : (RARITY_BG[m.rarity] ?? '#1e293b');
              const border = t.allCompleted ? '#2d5a3d' : (RARITY_BORDER[m.rarity] ?? '#334155');

              return (
                <div
                  key={`${t.album_id}|||${t.task}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: bg,
                    border: `1px solid ${border}`,
                    borderRadius: 8,
                    padding: '10px 14px',
                    opacity: t.allCompleted ? 0.65 : 1,
                  }}
                >
                  {/* Task name */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.allCompleted ? '#64748b' : '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.is_unknown ? t.task : resolveTask(t.task, m.milestone_value)}
                      {!m.is_unknown && t.max_value && t.max_value !== m.milestone_value && (
                        <span style={{ fontWeight: 400, color: '#64748b', marginLeft: 6 }}>
                          (Max: {t.max_value})
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                      {t.completedCount}/{t.total} done
                    </div>
                  </div>

                  {/* All done label */}
                  {t.allCompleted && (
                    <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      All done
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {t.previous && !t.allCompleted && (
                      <button
                        onClick={() => handleUncomplete(t.previous.id)}
                        disabled={isBusy}
                        style={{
                          background: 'transparent',
                          color: '#475569',
                          border: '1px solid #334155',
                          borderRadius: 6,
                          padding: '4px 8px',
                          fontSize: 13,
                          cursor: isBusy ? 'not-allowed' : 'pointer',
                          opacity: isBusy ? 0.5 : 1,
                        }}
                        title="Go back one step"
                      >
                        ‹
                      </button>
                    )}
                    {t.allCompleted ? (
                      <button
                        onClick={() => handleUncomplete(m.id)}
                        disabled={isBusy}
                        style={{
                          background: 'transparent',
                          color: '#475569',
                          border: '1px solid #334155',
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: 12,
                          cursor: isBusy ? 'not-allowed' : 'pointer',
                          opacity: isBusy ? 0.5 : 1,
                        }}
                      >
                        Undo
                      </button>
                    ) : (
                      <button
                        onClick={() => handleComplete(m.id)}
                        disabled={isBusy}
                        style={{
                          background: '#22c55e',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '5px 12px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: isBusy ? 'not-allowed' : 'pointer',
                          opacity: isBusy ? 0.5 : 1,
                          transition: 'opacity 0.15s',
                        }}
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
