import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import QuizPage from './pages/QuizPage';
import AiPage from './pages/AiPage';
import HistoryPage from './pages/HistoryPage';
import AppLayout from './components/AppLayout';
import './index.css';

// Protected Route — wraps page with shared layout
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
      Loading…
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected — all inside shared sidebar layout */}
          <Route path="/"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/quiz"   element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
          <Route path="/ai"     element={<ProtectedRoute><div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}><AiPage /></div></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
