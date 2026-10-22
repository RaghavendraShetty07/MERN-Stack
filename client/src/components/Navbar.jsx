import React from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Layers,
  Ticket,
  Clock,
  UserCheck,
  ShieldCheck,
  Monitor,
  Volume2,
  VolumeX,
  LogOut,
  Sparkles,
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isStudent, isStaff, isAdmin } = useAuth();
  const { isConnected, soundEnabled, toggleSound } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide the standard campus navigation completely on the dedicated Admin Login portal
  if (location.pathname === '/admin-login') {
    return null;
  }

  const handleLogout = () => {
    const wasAdmin = isAdmin;
    logout();
    navigate(wasAdmin ? '/admin-login' : '/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <span>SmartQ</span>
            <span style={{ color: '#818cf8', marginLeft: '4px', fontSize: '1rem', fontWeight: 500 }}>
              Campus
            </span>
          </div>
        </Link>

        {user && (
          <nav className="navbar-links">
            {/* Student Navigation Only */}
            {isStudent && (
              <>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <Layers size={16} />
                  <span>College Services</span>
                </NavLink>
                <NavLink
                  to="/my-tokens"
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <Ticket size={16} />
                  <span>My Tokens</span>
                </NavLink>
              </>
            )}

            {/* Staff Navigation Only */}
            {isStaff && (
              <NavLink
                to="/staff"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <UserCheck size={16} />
                <span>Counter Desk</span>
              </NavLink>
            )}

            {/* Admin Dedicated Navigation */}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <ShieldCheck size={16} color="#f472b6" />
                <span>Admin Console</span>
              </NavLink>
            )}

            <NavLink
              to="/display"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              title="Open Public Display Board (Lobby Screen)"
            >
              <Monitor size={16} />
              <span>Kiosk Display</span>
            </NavLink>
          </nav>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Socket status & Sound toggle */}
          {user && (
            <button
              onClick={toggleSound}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.4rem', borderRadius: '50%', width: '34px', height: '34px' }}
              title={soundEnabled ? 'Chime sound is ON' : 'Chime sound is MUTED'}
            >
              {soundEnabled ? <Volume2 size={16} color="#10b981" /> : <VolumeX size={16} color="#9ca3af" />}
            </button>
          )}

          {/* Connection Pulse Indicator */}
          <div
            title={isConnected ? 'Live WebSocket Connected' : 'Connecting to Live Socket...'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              color: isConnected ? '#10b981' : '#f59e0b',
              padding: '0.25rem 0.5rem',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '9999px',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: isConnected ? '#10b981' : '#f59e0b',
                boxShadow: isConnected ? '0 0 8px #10b981' : 'none',
              }}
            />
            <span style={{ display: 'none' }}>Live</span>
          </div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div className="user-badge">
                <span style={{ fontWeight: 600 }}>{user.name.split(' ')[0]}</span>
                <span className={`role-pill ${user.role}`}>{user.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                title="Sign Out"
                style={{ color: '#f87171' }}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
