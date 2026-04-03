import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPushSubscription, subscribeToPush, unsubscribeFromPush } from '../utils/pushNotifications';

const PUSH_PREF_KEY = 'pushNotificationsEnabled';

const HOME_CARDS = [
  { key: 'albums',   label: 'My Albums' },
  { key: 'players',  label: 'Players' },
  { key: 'matches',  label: 'My Matches' },
  { key: 'missions', label: 'My Missions' },
  { key: 'activity', label: 'Recent Activity' },
];

function getHomeCardsPrefs() {
  try {
    const stored = localStorage.getItem('homeCards');
    if (stored) return JSON.parse(stored);
  } catch {}
  return Object.fromEntries(HOME_CARDS.map(c => [c.key, true]));
}

export default function Settings() {
  const { auth, updateAuth } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(auth.username);
  const [alliance, setAlliance] = useState(auth.alliance || '');
  const [inGameName, setInGameName] = useState(auth.in_game_name || auth.username);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [pushEnabled, setPushEnabled] = useState(null);
  const [pushLoading, setPushLoading] = useState(false);
  const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  const [homeCards, setHomeCards] = useState(getHomeCardsPrefs);

  useEffect(() => {
    if (!pushSupported) return;
    const pref = localStorage.getItem(PUSH_PREF_KEY);
    if (pref === 'false') {
      setPushEnabled(false);
      return;
    }
    getPushSubscription().then(sub => {
      const enabled = !!sub;
      setPushEnabled(enabled);
      if (enabled) localStorage.setItem(PUSH_PREF_KEY, 'true');
    });
  }, []);

  async function togglePush() {
    setPushLoading(true);
    if (pushEnabled) {
      await unsubscribeFromPush(auth.token);
      localStorage.setItem(PUSH_PREF_KEY, 'false');
      setPushEnabled(false);
    } else {
      await subscribeToPush(auth.token);
      const sub = await getPushSubscription();
      const enabled = !!sub;
      setPushEnabled(enabled);
      localStorage.setItem(PUSH_PREF_KEY, enabled ? 'true' : 'false');
    }
    setPushLoading(false);
  }

  function toggleCard(key) {
    setHomeCards(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('homeCards', JSON.stringify(next));
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({ username, alliance, in_game_name: inGameName }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
    } else {
      updateAuth(data);
      navigate('/');
    }
  }

  function Toggle({ enabled, onToggle, disabled }) {
    return (
      <button
        onClick={onToggle}
        disabled={disabled}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none',
          background: enabled ? '#3b82f6' : '#334155',
          cursor: disabled ? 'default' : 'pointer',
          position: 'relative', flexShrink: 0, transition: 'background 0.2s',
        }}
      >
        <span style={{
          position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
          left: enabled ? 23 : 3,
        }} />
      </button>
    );
  }

  return (
    <div style={{ maxWidth: 420, margin: '48px auto', padding: '0 16px' }}>
      <h2 style={{ marginBottom: 24 }}>Settings</h2>

      {/* Profile */}
      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>
              Username
            </label>
            <input value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>
              In game name
            </label>
            <input value={inGameName} onChange={e => setInGameName(e.target.value)} placeholder={username} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>
              Alliance <span style={{ color: '#475569' }}>(optional)</span>
            </label>
            <input value={alliance} onChange={e => setAlliance(e.target.value)} placeholder="e.g. UNS" />
          </div>
          {error && <p className="error">{error}</p>}
          {success && <p style={{ color: '#22c55e', fontSize: 14 }}>Saved successfully.</p>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>

      {/* Push notifications */}
      {pushSupported && (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Push notifications</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                {Notification.permission === 'denied'
                  ? 'Blocked by browser — enable in your browser settings'
                  : pushEnabled === null
                  ? 'Checking…'
                  : pushEnabled
                  ? 'Enabled on this device'
                  : 'Disabled on this device'}
              </div>
            </div>
            <Toggle
              enabled={!!pushEnabled}
              onToggle={togglePush}
              disabled={pushLoading || pushEnabled === null || Notification.permission === 'denied'}
            />
          </div>
        </div>
      )}

      {/* Home dashboard cards */}
      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Home dashboard</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {HOME_CARDS.map(({ key, label }, i) => (
            <div
              key={key}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0',
                borderTop: i > 0 ? '1px solid #334155' : 'none',
              }}
            >
              <span style={{ fontSize: 13 }}>{label}</span>
              <Toggle enabled={homeCards[key]} onToggle={() => toggleCard(key)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
