import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const alliance = localStorage.getItem('alliance');
    const role = localStorage.getItem('role') || 'user';
    const force_password_change = localStorage.getItem('force_password_change') === 'true';
    const in_game_name = localStorage.getItem('in_game_name') || username;
    const email = localStorage.getItem('email') || null;
    const email_verified = localStorage.getItem('email_verified') === 'true';
    return token ? { token, username, alliance, role, force_password_change, in_game_name, email, email_verified } : null;
  });

  function login(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    localStorage.setItem('alliance', data.alliance || '');
    localStorage.setItem('role', data.role || 'user');
    localStorage.setItem('force_password_change', data.force_password_change ? 'true' : 'false');
    localStorage.setItem('in_game_name', data.in_game_name || data.username);
    localStorage.setItem('email', data.email || '');
    localStorage.setItem('email_verified', data.email_verified ? 'true' : 'false');
    setAuth({ ...data, in_game_name: data.in_game_name || data.username });
  }

  function updateAuth(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    localStorage.setItem('alliance', data.alliance || '');
    localStorage.setItem('role', data.role || 'user');
    localStorage.setItem('force_password_change', data.force_password_change ? 'true' : 'false');
    localStorage.setItem('in_game_name', data.in_game_name || data.username);
    localStorage.setItem('email', data.email || '');
    localStorage.setItem('email_verified', data.email_verified ? 'true' : 'false');
    setAuth({ ...data, in_game_name: data.in_game_name || data.username });
  }

  function logout() {
    localStorage.clear();
    setAuth(null);
  }

  return (
    <AuthContext.Provider value={{ auth, login, updateAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
