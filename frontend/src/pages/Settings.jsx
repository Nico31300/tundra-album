import { useState, useEffect, useRef } from 'react';
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

function FieldLabel({ children }) {
  return (
    <label style={{
      display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8',
      marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
      {children}
    </label>
  );
}

function Divider() {
  return <div style={{ height: 1, background: '#1e293b' }} />;
}

export default function Settings() {
  const { auth, updateAuth } = useAuth();
  const navigate = useNavigate();
  const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  const SECTIONS = [
    { key: 'profile', label: 'Profile' },
    { key: 'security', label: 'Security' },
    ...(pushSupported ? [{ key: 'notifications', label: 'Notifications' }] : []),
    { key: 'app', label: 'App' },
  ];

  const [activeSection, setActiveSection] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth < 640); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Profile
  const [username, setUsername] = useState(auth.username);
  const [alliance, setAlliance] = useState(auth.alliance || '');
  const [inGameName, setInGameName] = useState(auth.in_game_name || auth.username);
  const [email, setEmail] = useState(auth.email || '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const savedEmailRef = useRef(auth.email || '');

  // Push
  const [pushEnabled, setPushEnabled] = useState(null);
  const [pushLoading, setPushLoading] = useState(false);

  // App
  const [homeCards, setHomeCards] = useState(getHomeCardsPrefs);

  useEffect(() => {
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${auth.token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          updateAuth(data);
          setEmail(data.email || '');
          savedEmailRef.current = data.email || '';
        }
      });
  }, []);

  useEffect(() => {
    if (!pushSupported) return;
    const pref = localStorage.getItem(PUSH_PREF_KEY);
    if (pref === 'false') { setPushEnabled(false); return; }
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

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);
    setProfileLoading(true);

    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ username, alliance, in_game_name: inGameName, email }),
    });

    const data = await res.json();
    setProfileLoading(false);

    if (!res.ok) {
      setProfileError(data.error);
    } else {
      updateAuth(data);
      savedEmailRef.current = data.email || '';
      setProfileSuccess(true);
    }
  }

  async function handleResendVerification() {
    setResendLoading(true);
    setResendMsg('');
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    setResendLoading(false);
    const data = await res.json();
    setResendMsg(res.ok ? 'Verification email sent.' : data.error);
  }

  const showNav = !isMobile || activeSection === null;
  const showContent = !isMobile || activeSection !== null;
  const currentSection = activeSection ?? (isMobile ? null : 'profile');

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: isMobile ? '16px 0 48px' : '40px 16px 48px', display: 'flex', gap: 0 }}>

      {/* Left nav */}
      {showNav && (
        <div style={{
          width: isMobile ? '100%' : 180,
          flexShrink: 0,
          borderRight: isMobile ? 'none' : '1px solid #334155',
          paddingTop: 4,
        }}>
          {!isMobile && (
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#475569', padding: '0 16px 12px' }}>
              Settings
            </div>
          )}
          {isMobile && (
            <div style={{ fontSize: 18, fontWeight: 700, padding: '4px 16px 16px', color: '#e2e8f0' }}>Settings</div>
          )}
          <div className="card" style={isMobile ? { margin: '0 16px', padding: 0, overflow: 'hidden' } : {}}>
            {SECTIONS.map((s, i) => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', textAlign: 'left',
                  padding: isMobile ? '14px 16px' : '8px 16px',
                  fontSize: 14,
                  fontWeight: !isMobile && currentSection === s.key ? 600 : 400,
                  color: !isMobile && currentSection === s.key ? '#e2e8f0' : isMobile ? '#e2e8f0' : '#94a3b8',
                  background: !isMobile && currentSection === s.key ? '#334155' : 'none',
                  border: 'none',
                  borderTop: isMobile && i > 0 ? '1px solid #334155' : 'none',
                  borderRadius: isMobile ? 0 : '6px 0 0 6px',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { if (!isMobile && currentSection !== s.key) e.currentTarget.style.color = '#e2e8f0'; }}
                onMouseLeave={e => { if (!isMobile && currentSection !== s.key) e.currentTarget.style.color = '#94a3b8'; }}
              >
                {s.label}
                {isMobile && <span style={{ color: '#475569', fontSize: 18 }}>›</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Right content */}
      {showContent && currentSection && (
      <div style={{ flex: 1, paddingLeft: isMobile ? 0 : 32, paddingTop: 4, width: isMobile ? '100%' : undefined }}>

        {isMobile && (
          <button
            onClick={() => setActiveSection(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#3b82f6', fontSize: 14, cursor: 'pointer', padding: '0 16px 16px' }}
          >
            ‹ Back
          </button>
        )}

        {currentSection === 'profile' && (
          <div style={isMobile ? { padding: '0 16px' } : {}}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Profile</h3>
            <p style={{ fontSize: 13, color: '#475569', margin: '0 0 20px' }}>Your public identity and account info.</p>
            <div className="card">
              <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <FieldLabel>In-game name</FieldLabel>
                  <input value={inGameName} onChange={e => setInGameName(e.target.value)} placeholder={username} />
                  <p style={{ fontSize: 12, color: '#475569', marginTop: 4, marginBottom: 0 }}>Displayed to other players instead of your username.</p>
                </div>
                <Divider />
                <div>
                  <FieldLabel>Username</FieldLabel>
                  <input value={username} onChange={e => setUsername(e.target.value)} required />
                  <p style={{ fontSize: 12, color: '#475569', marginTop: 4, marginBottom: 0 }}>Used to log in.</p>
                </div>
                <Divider />
                <div>
                  <FieldLabel>Alliance <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#475569' }}>— optional</span></FieldLabel>
                  <input value={alliance} onChange={e => setAlliance(e.target.value)} placeholder="e.g. UNS" />
                </div>
                <Divider />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Email <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#475569' }}>— optional</span>
                    </span>
                    {auth.email && email === savedEmailRef.current && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 10,
                        background: auth.email_verified ? '#14532d' : '#431407',
                        color: auth.email_verified ? '#86efac' : '#fdba74',
                      }}>
                        {auth.email_verified ? 'Verified' : 'Not verified'}
                      </span>
                    )}
                  </div>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                  {auth.email && !auth.email_verified && email === savedEmailRef.current && (
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resendLoading}
                        style={{ fontSize: 12, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        {resendLoading ? 'Sending…' : 'Resend verification email'}
                      </button>
                      {resendMsg && <span style={{ fontSize: 12, color: '#94a3b8' }}>{resendMsg}</span>}
                    </div>
                  )}
                  <p style={{ fontSize: 12, color: '#475569', marginTop: 4, marginBottom: 0 }}>Used to reset your password if you get locked out.</p>
                </div>
                {profileError && <p className="error">{profileError}</p>}
                {profileSuccess && <p style={{ color: '#22c55e', fontSize: 13, margin: 0 }}>Saved successfully.</p>}
                <button className="btn-primary" type="submit" disabled={profileLoading} style={{ alignSelf: 'flex-start', minWidth: 80 }}>
                  {profileLoading ? 'Saving…' : 'Save'}
                </button>
              </form>
            </div>
          </div>
        )}

        {currentSection === 'security' && (
          <div style={isMobile ? { padding: '0 16px' } : {}}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Security</h3>
            <p style={{ fontSize: 13, color: '#475569', margin: '0 0 20px' }}>Manage your password and account access.</p>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Password</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Change your login password.</div>
                </div>
                <button
                  onClick={() => navigate('/change-password')}
                  style={{
                    fontSize: 13, fontWeight: 500, padding: '6px 14px',
                    background: '#334155', border: '1px solid #475569',
                    color: '#e2e8f0', borderRadius: 6, cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        )}

        {currentSection === 'notifications' && (
          <div style={isMobile ? { padding: '0 16px' } : {}}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>Notifications</h3>
            <p style={{ fontSize: 13, color: '#475569', margin: '0 0 20px' }}>Control how you get notified.</p>
            <div className="card">
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
          </div>
        )}

        {currentSection === 'app' && (
          <div style={isMobile ? { padding: '0 16px' } : {}}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>App</h3>
            <p style={{ fontSize: 13, color: '#475569', margin: '0 0 20px' }}>Customize your experience.</p>
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Home dashboard</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
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
        )}

      </div>
      )}
    </div>
  );
}
