import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const alliance = localStorage.getItem('alliance');
    const role = localStorage.getItem('role') || 'user';
    return token ? { token, username, alliance, role } : null;
  });

  function login(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    localStorage.setItem('alliance', data.alliance || '');
    localStorage.setItem('role', data.role || 'user');
    setAuth(data);
  }

  function updateAuth(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    localStorage.setItem('alliance', data.alliance || '');
    localStorage.setItem('role', data.role || 'user');
    setAuth(data);
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
