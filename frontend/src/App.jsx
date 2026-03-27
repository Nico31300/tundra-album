import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { subscribeToPush } from './utils/pushNotifications';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Albums from './pages/Albums';
import Players from './pages/Players';
import Album from './pages/Album';
import PlayerAlbums from './pages/PlayerAlbums';
import PlayerAlbum from './pages/PlayerAlbum';
import Settings from './pages/Settings';
import Matches from './pages/Matches';
import Admin from './pages/Admin';
import Missions from './pages/Missions';
import Activity from './pages/Activity';
import ChangePassword from './pages/ChangePassword';

function PrivateRoute({ children, skipForceCheck = false }) {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (!skipForceCheck && auth.force_password_change) return <Navigate to="/change-password" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { auth } = useAuth();
  return auth ? <Navigate to="/" replace /> : children;
}

function AdminRoute({ children }) {
  const { auth } = useAuth();
  return auth?.role === 'admin' ? children : <Navigate to="/" replace />;
}

export default function App() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

function AppRoutes() {
  const { auth } = useAuth();

  useEffect(() => {
    if (auth) subscribeToPush(auth.token);
  }, [auth?.token]);

  return (
    <>
      {auth && !auth.force_password_change && <Navbar />}
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/change-password" element={<PrivateRoute skipForceCheck><ChangePassword /></PrivateRoute>} />
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/albums" element={<PrivateRoute><Albums /></PrivateRoute>} />
        <Route path="/albums/:albumId" element={<PrivateRoute><Album /></PrivateRoute>} />
        <Route path="/players" element={<PrivateRoute><Players /></PrivateRoute>} />
        <Route path="/players/:userId" element={<PrivateRoute><PlayerAlbums /></PrivateRoute>} />
        <Route path="/players/:userId/albums/:albumId" element={<PrivateRoute><PlayerAlbum /></PrivateRoute>} />
        <Route path="/matches" element={<PrivateRoute><Matches /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
        <Route path="/missions" element={<PrivateRoute><Missions /></PrivateRoute>} />
        <Route path="/activity" element={<PrivateRoute><AdminRoute><Activity /></AdminRoute></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {auth && !auth.force_password_change && <Footer />}
    </>
  );
}
