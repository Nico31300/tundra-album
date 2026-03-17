import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', alliance: '' });
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    login(data);
    navigate('/');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: 360 }}>
        <h1 style={{ marginBottom: 24, fontSize: 22 }}>Créer un compte</h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            placeholder="Nom d'utilisateur"
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
          />
          <input
            placeholder="Alliance (optionnel)"
            value={form.alliance}
            onChange={e => setForm(f => ({ ...f, alliance: e.target.value }))}
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn-primary">S'inscrire</button>
        </form>
        <p style={{ marginTop: 16, fontSize: 14, color: '#94a3b8', textAlign: 'center' }}>
          Déjà un compte ?{' '}
          <Link to="/login" style={{ color: '#3b82f6' }}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
