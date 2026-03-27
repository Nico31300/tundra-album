import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ChangePassword() {
  const { auth, updateAuth } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify({ password: form.password }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    updateAuth(data);
    navigate('/');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: 360 }}>
        <h1 style={{ marginBottom: 8, fontSize: 22 }}>Change Password</h1>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>
          You must set a new password before continuing.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="password"
            placeholder="New password (min. 8 characters)"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
            minLength={8}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={form.confirm}
            onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
            required
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn-primary">Set Password</button>
        </form>
      </div>
    </div>
  );
}
