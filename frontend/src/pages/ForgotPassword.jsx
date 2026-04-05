import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [login, setLogin] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
    } else {
      setSubmitted(true);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: 360 }}>
        <h1 style={{ marginBottom: 8, fontSize: 20 }}>Reset password</h1>

        {submitted ? (
          <>
            <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>
              If an account with that username or email exists and has an email address set, a reset link has been sent.
            </p>
            <Link to="/login" style={{ fontSize: 14, color: '#3b82f6' }}>Back to login</Link>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>
              Enter your username or email address and we'll send you a reset link.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                placeholder="Username or email"
                value={login}
                onChange={e => setLogin(e.target.value)}
                required
              />
              {error && <p className="error">{error}</p>}
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
            <p style={{ marginTop: 16, fontSize: 14, color: '#94a3b8', textAlign: 'center' }}>
              <Link to="/login" style={{ color: '#64748b' }}>Back to login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
