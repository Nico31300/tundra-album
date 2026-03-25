import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPushSubscription, subscribeToPush, unsubscribeFromPush } from '../utils/pushNotifications';

export default function Settings() {
  const { auth, updateAuth } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(auth.username);
  const [alliance, setAlliance] = useState(auth.alliance || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(null);
  const [pushLoading, setPushLoading] = useState(false);
  const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  useEffect(() => {
    if (!pushSupported) return;
    getPushSubscription().then(sub => setPushEnabled(!!sub));
  }, []);

  async function togglePush() {
    setPushLoading(true);
    if (pushEnabled) {
      await unsubscribeFromPush(auth.token);
      setPushEnabled(false);
    } else {
      await subscribeToPush(auth.token);
      const sub = await getPushSubscription();
      setPushEnabled(!!sub);
    }
    setPushLoading(false);
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
      body: JSON.stringify({ username, alliance }),
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

  return (
    <div style={{ maxWidth: 420, margin: '48px auto', padding: '0 16px' }}>
      <h2 style={{ marginBottom: 24 }}>Settings</h2>
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
            <button
              onClick={togglePush}
              disabled={pushLoading || pushEnabled === null || Notification.permission === 'denied'}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none',
                background: pushEnabled ? '#3b82f6' : '#334155',
                cursor: pushLoading || Notification.permission === 'denied' ? 'default' : 'pointer',
                position: 'relative', flexShrink: 0, transition: 'background 0.2s',
              }}
            >
              <span style={{
                position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
                left: pushEnabled ? 23 : 3,
              }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
