import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    const controller = new AbortController();
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, { signal: controller.signal })
      .then(r => r.ok ? setStatus('success') : setStatus('invalid'))
      .catch(e => { if (e.name !== 'AbortError') setStatus('invalid'); });
    return () => controller.abort();
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: 360, textAlign: 'center' }}>
        {status === 'loading' && (
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Verifying…</p>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Email verified</div>
            <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>Your email address has been confirmed.</p>
            <Link to="/" style={{ fontSize: 14, color: '#3b82f6' }}>Go to the app</Link>
          </>
        )}
        {status === 'invalid' && (
          <>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, color: '#f87171' }}>Invalid link</div>
            <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>This verification link is invalid or has already been used.</p>
            <Link to="/settings" style={{ fontSize: 14, color: '#3b82f6' }}>Back to settings</Link>
          </>
        )}
      </div>
    </div>
  );
}
