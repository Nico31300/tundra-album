import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

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
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
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

function PlayerCard({ player, showAlliance }) {
  const hasCanGive = Object.keys(player.canGiveMe).length > 0;
  const hasICanGive = Object.keys(player.iCanGive).length > 0;

  return (
    <div className="card" style={{ fontSize: 13 }}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>
        {player.username}
        {showAlliance && player.alliance && (
          <span style={{ color: '#64748b', fontWeight: 400, marginLeft: 6 }}>[{player.alliance}]</span>
        )}
      </div>

      {hasCanGive && (
        <div style={{ marginBottom: hasICanGive ? 10 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ color: STATUS_COLORS.have_duplicate }}>Can give you:</span>
            <CopyButton text={buildCanGiveText(player.username, player.canGiveMe)} />
          </div>
          <div style={{ paddingLeft: 8, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {Object.entries(player.canGiveMe).map(([puzzle, pieces]) => (
              <div key={puzzle}>
                <span style={{ color: '#e2e8f0' }}>{puzzle}:</span> {[...pieces].sort((a, b) => { const na = Number(a), nb = Number(b); return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b); }).join(', ')}
              </div>
            ))}
          </div>
        </div>
      )}

      {hasICanGive && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ color: STATUS_COLORS.need }}>Needs from you:</span>
            <CopyButton text={buildNeedsText(player.username, player.iCanGive)} />
          </div>
          <div style={{ paddingLeft: 8, color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {Object.entries(player.iCanGive).map(([puzzle, pieces]) => (
              <div key={puzzle}>
                <span style={{ color: '#e2e8f0' }}>{puzzle}:</span> {[...pieces].sort((a, b) => { const na = Number(a), nb = Number(b); return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b); }).join(', ')}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Matches() {
  const { auth } = useAuth();
  const [data, setData] = useState(null);
  const [showOtherAlliances, setShowOtherAlliances] = useState(false);

  useEffect(() => {
    fetch('/api/users/matches', {
      headers: { Authorization: `Bearer ${auth.token}` },
    }).then(r => r.json()).then(setData);
  }, [auth.token]);

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

  const alliancePlayers = data.players.filter(p => p.sameAlliance);
  const otherPlayers = data.players.filter(p => !p.sameAlliance);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
        <h2>My Matches</h2>
        <div style={{ fontSize: 13, color: '#64748b', display: 'flex', gap: 16 }}>
          {data.canReceive > 0 && (
            <span style={{ color: STATUS_COLORS.have_duplicate }}>
              Can receive: {data.canReceive}
            </span>
          )}
          {data.canGive > 0 && (
            <span style={{ color: STATUS_COLORS.need }}>
              Can give: {data.canGive}
            </span>
          )}
        </div>
      </div>

      {data.players.length === 0 && (
        <div style={{ color: '#64748b', fontSize: 14 }}>No matches found.</div>
      )}

      {alliancePlayers.length > 0 && (
        <>
          <h4 style={{ marginBottom: 12, fontSize: 13, color: '#3b82f6' }}>
            My alliance {auth.alliance ? `[${auth.alliance}]` : ''}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: otherPlayers.length > 0 ? 24 : 0 }}>
            {alliancePlayers.map(p => <PlayerCard key={p.id} player={p} />)}
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
              {otherPlayers.map(p => <PlayerCard key={p.id} player={p} showAlliance />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
