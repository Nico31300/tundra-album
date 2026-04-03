import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatRelative } from '../utils/formatRelative';

const STATUS_COLORS = {
  need: '#f59e0b',
  have_duplicate: '#22c55e',
};

function groupByAlbum(grouped) {
  const byAlbum = {};
  for (const [key, pieces] of Object.entries(grouped)) {
    const sep = key.indexOf(' – ');
    const album = sep !== -1 ? key.slice(0, sep) : key;
    const puzzle = sep !== -1 ? key.slice(sep + 3) : key;
    const existing = (byAlbum[album] = byAlbum[album] || {});
    existing[puzzle] = (existing[puzzle] || []).concat(pieces);
  }
  for (const puzzles of Object.values(byAlbum)) {
    for (const puzzle of Object.keys(puzzles)) {
      puzzles[puzzle].sort((a, b) => {
        const na = Number(a), nb = Number(b);
        return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b);
      });
    }
  }
  return byAlbum;
}

function buildCanGiveText(username, canGiveMe) {
  const byAlbum = groupByAlbum(canGiveMe);
  const lines = [`Hey ${username}`, `I'm looking for some puzzle pieces:`];
  for (const [album, puzzles] of Object.entries(byAlbum)) {
    lines.push(album);
    for (const [puzzle, pieces] of Object.entries(puzzles)) {
      lines.push(`- ${puzzle}: ${pieces.join(', ')}`);
    }
  }
  return lines.join('\n');
}

function buildNeedsText(username, iCanGive) {
  const byAlbum = groupByAlbum(iCanGive);
  const lines = [`Hey ${username}`, `Got some puzzle pieces you might need:`];
  for (const [album, puzzles] of Object.entries(byAlbum)) {
    lines.push(album);
    for (const [puzzle, pieces] of Object.entries(puzzles)) {
      lines.push(`- ${puzzle}: ${pieces.join(', ')}`);
    }
  }
  return lines.join('\n');
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      style={{
        background: 'none',
        border: '1px solid #334155',
        borderRadius: 6,
        color: copied ? '#22c55e' : '#94a3b8',
        cursor: 'pointer',
        padding: '3px 8px',
        fontSize: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        transition: 'color 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => { if (!copied) e.currentTarget.style.color = '#e2e8f0'; }}
      onMouseLeave={e => { if (!copied) e.currentTarget.style.color = '#94a3b8'; }}
    >
      {copied ? (
        <>&#10003; Copied</>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function filterPuzzles(map, q) {
  if (!q) return map;
  const lower = q.toLowerCase();
  return Object.fromEntries(
    Object.entries(map).filter(([key]) => key.toLowerCase().includes(lower))
  );
}

function countPieces(map) {
  return Object.values(map).flat().length;
}

function PlayerCard({ player, showAlliance, searchQuery, sortBy }) {
  const [collapsed, setCollapsed] = useState(false);

  const filteredCanGiveMe = filterPuzzles(player.canGiveMe, searchQuery);
  const filteredICanGive  = filterPuzzles(player.iCanGive,  searchQuery);
  const hasCanGive = Object.keys(filteredCanGiveMe).length > 0;
  const hasICanGive = Object.keys(filteredICanGive).length > 0;
  const isMutual = Object.keys(player.canGiveMe).length > 0 && Object.keys(player.iCanGive).length > 0;
  const totalPieces = countPieces(player.canGiveMe) + countPieces(player.iCanGive);

  return (
    <div
      className="card"
      style={{
        fontSize: 13,
        borderColor: isMutual ? 'rgba(59,130,246,0.5)' : 'transparent',
      }}
    >
      {/* Card header — always visible, click to collapse */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: collapsed ? 0 : 10 }}
        onClick={() => setCollapsed(v => !v)}
      >
        <div style={{ flex: 1, fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Link
            to={`/players/${player.id}`}
            style={{ color: '#e2e8f0' }}
            onClick={e => e.stopPropagation()}
            onMouseEnter={e => e.currentTarget.style.color = '#60a5fa'}
            onMouseLeave={e => e.currentTarget.style.color = '#e2e8f0'}
          >
            {player.in_game_name}
          </Link>
          {showAlliance && player.alliance && (
            <span style={{ color: '#64748b', fontWeight: 400 }}>[{player.alliance}]</span>
          )}
          {isMutual && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
              background: 'rgba(59,130,246,0.15)', color: '#60a5fa',
            }}>
              mutual
            </span>
          )}
        </div>
        <span style={{ color: '#475569', fontSize: 12, flexShrink: 0 }}>{totalPieces} piece{totalPieces !== 1 ? 's' : ''}</span>
        {player.last_updated && (
          <span style={{ color: '#334155', fontSize: 11, flexShrink: 0 }}>· {formatRelative(player.last_updated)}</span>
        )}
        <span style={{ color: '#475569', fontSize: 12 }}>{collapsed ? '▼' : '▲'}</span>
      </div>

      {!collapsed && (
        <>
          {hasCanGive && sortBy !== 'needs' && (
            <div style={{ marginBottom: hasICanGive && sortBy !== 'can_give' ? 10 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ color: STATUS_COLORS.have_duplicate }}>Can give you:</span>
                <CopyButton text={buildCanGiveText(player.in_game_name, filteredCanGiveMe)} />
              </div>
              <div style={{ paddingLeft: 8, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Object.entries(filteredCanGiveMe).map(([puzzle, pieces]) => (
                  <div key={puzzle}>
                    <span style={{ color: '#e2e8f0' }}>{puzzle}:</span>{' '}
                    {[...pieces].sort((a, b) => { const na = Number(a), nb = Number(b); return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b); }).join(', ')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasICanGive && sortBy !== 'can_give' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ color: STATUS_COLORS.need }}>Needs from you:</span>
                <CopyButton text={buildNeedsText(player.in_game_name, filteredICanGive)} />
              </div>
              <div style={{ paddingLeft: 8, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Object.entries(filteredICanGive).map(([puzzle, pieces]) => (
                  <div key={puzzle}>
                    <span style={{ color: '#e2e8f0' }}>{puzzle}:</span>{' '}
                    {[...pieces].sort((a, b) => { const na = Number(a), nb = Number(b); return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b); }).join(', ')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasCanGive && !hasICanGive && searchQuery && (
            <div style={{ color: '#475569' }}>No matching puzzles.</div>
          )}
        </>
      )}
    </div>
  );
}

function sortPlayers(players, sortBy) {
  const byRecent = (a, b) => (b.last_updated ?? '').localeCompare(a.last_updated ?? '');
  const copy = [...players];
  if (sortBy === 'can_give') {
    return copy.filter(p => Object.keys(p.canGiveMe).length > 0).sort(byRecent);
  } else if (sortBy === 'needs') {
    return copy.filter(p => Object.keys(p.iCanGive).length > 0).sort(byRecent);
  } else {
    // alliance-first: sort by most recently updated within each group
    return copy.sort(byRecent);
  }
}

function playerMatchesSearch(player, q) {
  if (!q) return true;
  const lower = q.toLowerCase();
  return (
    Object.keys(player.canGiveMe).some(k => k.toLowerCase().includes(lower)) ||
    Object.keys(player.iCanGive).some(k => k.toLowerCase().includes(lower))
  );
}

export default function Matches() {
  const { auth } = useAuth();
  const { data, error, refetch } = useFetch('/api/users/matches', auth.token);
  const [showOtherAlliances, setShowOtherAlliances] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('alliance');

  if (error) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <h2 style={{ marginBottom: 24 }}>My Matches</h2>
        <div style={{ color: '#f87171', fontSize: 14 }}>{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <h2 style={{ marginBottom: 24 }}>My Matches</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="skeleton" style={{ height: 14, width: '30%' }} />
              <div className="skeleton" style={{ height: 12, width: '60%' }} />
              <div className="skeleton" style={{ height: 12, width: '50%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const allPlayers = data.players;
  const filtered = allPlayers.filter(p => playerMatchesSearch(p, searchQuery));

  const alliancePlayers = sortPlayers(filtered.filter(p => p.sameAlliance), sortBy);
  const otherPlayers    = sortPlayers(filtered.filter(p => !p.sameAlliance), sortBy);
  const flatPlayers     = sortPlayers(filtered, sortBy);

  const useFlat = sortBy === 'can_give' || sortBy === 'needs';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>My Matches</h2>
        <button
          onClick={refetch}
          title="Refresh"
          style={{
            marginLeft: 'auto', background: 'none', border: '1px solid #334155',
            borderRadius: 6, color: '#64748b', cursor: 'pointer',
            padding: '5px 8px', display: 'flex', alignItems: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Controls */}
      {allPlayers.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter by puzzle name…"
            style={{ flex: 1, minWidth: 180, padding: '6px 12px', fontSize: 13 }}
          />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              background: '#1e293b', border: '1px solid #334155', borderRadius: 6,
              color: '#e2e8f0', padding: '6px 10px', fontSize: 13, cursor: 'pointer',
            }}
          >
            <option value="alliance">Alliance first</option>
            <option value="can_give">Can give you</option>
            <option value="needs">Needs from you</option>
          </select>
        </div>
      )}

      {/* Empty state */}
      {allPlayers.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          color: '#475569', fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <div style={{ fontSize: 32 }}>🧩</div>
          <div style={{ fontWeight: 600, color: '#64748b', fontSize: 15 }}>No matches yet</div>
          <div style={{ maxWidth: 340 }}>
            Matches appear when another player is looking for a piece you have as duplicate, or vice versa.
            Make sure your inventory is up to date!
          </div>
        </div>
      )}

      {/* Search empty */}
      {allPlayers.length > 0 && filtered.length === 0 && (
        <div style={{ color: '#475569', fontSize: 14 }}>No matches for "{searchQuery}".</div>
      )}

      {/* Flat list (most pieces / alpha) */}
      {useFlat && flatPlayers.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {flatPlayers.map(p => (
            <PlayerCard key={p.id} player={p} showAlliance searchQuery={searchQuery} sortBy={sortBy} />
          ))}
        </div>
      )}

      {/* Alliance-first layout */}
      {!useFlat && (
        <>
          {alliancePlayers.length > 0 && (
            <>
              <h4 style={{ marginBottom: 12, fontSize: 13, color: '#3b82f6' }}>
                My alliance {auth.alliance ? `[${auth.alliance}]` : ''}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: otherPlayers.length > 0 ? 24 : 0 }}>
                {alliancePlayers.map(p => <PlayerCard key={p.id} player={p} searchQuery={searchQuery} sortBy={sortBy} />)}
              </div>
            </>
          )}

          {otherPlayers.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <h4 style={{ fontSize: 13, color: '#64748b' }}>Other alliances</h4>
                <button
                  className="btn-ghost"
                  style={{ fontSize: 12 }}
                  onClick={() => setShowOtherAlliances(v => !v)}
                >
                  {showOtherAlliances ? 'Hide' : `Show (${otherPlayers.length})`}
                </button>
              </div>
              {showOtherAlliances && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {otherPlayers.map(p => <PlayerCard key={p.id} player={p} showAlliance searchQuery={searchQuery} sortBy={sortBy} />)}
                </div>
              )}
            </>
          )}
        </>
      )}

    </div>
  );
}
