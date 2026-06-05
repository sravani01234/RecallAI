import React, { useState, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  HelpCircle,
  Bot,
  History,
  LogOut,
  Menu,
  X,
  Home,
} from 'lucide-react';

const AppLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Dashboard', tooltip: 'Dashboard' },
    { to: '/quiz', icon: HelpCircle, label: 'Test My Knowledge', tooltip: 'Quiz' },
    { to: '/ai', icon: Bot, label: 'AI Assistant', tooltip: 'AI Assistant' },
    { to: '/history', icon: History, label: 'History', tooltip: 'History' },
  ];

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="app-container">
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
        <div className="sidebar-header">
          {!collapsed && (
            <span className="sidebar-logo text-gradient">
              RecallAI
            </span>
          )}
          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <Menu size={16} /> : <X size={16} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label, tooltip }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              data-tooltip={tooltip}
              className={({ isActive }) =>
                `nav-link${isActive ? ' active' : ''}`
              }
            >
              <span className="nav-icon">
                <Icon size={18} />
              </span>
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <p>{user?.name}</p>
              <span>{user?.email}</span>
            </div>
          </div>

          <button
            className="nav-link btn-ghost"
            onClick={handleLogout}
            data-tooltip="Logout"
            style={{ color: '#f87171' }}
          >
            <span className="nav-icon">
              <LogOut size={18} />
            </span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;