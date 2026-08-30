import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, User, LayoutDashboard, Settings, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="brand" style={{ textDecoration: 'none' }}>
          <div className="brand-icon">
            <GraduationCap size={22} />
          </div>
          <div>
            <span>AI </span>
            <span className="brand-text-gradient">Teacher</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {!loading && (
            <>
              {isAuthenticated ? (
                <>
                  {/* Dashboard Link */}
                  <Link
                    to="/dashboard"
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <LayoutDashboard size={15} />
                    Dashboard
                  </Link>

                  {/* Materials Link */}
                  <Link
                    to="/materials"
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <BookOpen size={15} />
                    Materials
                  </Link>

                  {/* Profile Setup */}
                  <Link
                    to="/profile/setup"
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Settings size={15} />
                    Profile
                  </Link>

                  {/* User badge */}
                  <div className="nav-user-badge">
                    <div className="nav-avatar">
                      {user?.name?.charAt(0).toUpperCase() || <User size={16} />}
                    </div>
                    <span className="nav-user-name">{user?.name?.split(' ')[0]}</span>
                  </div>

                  {/* Logout */}
                  <button
                    id="btn-logout"
                    onClick={handleLogout}
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-rose)', borderColor: 'rgba(244, 63, 94, 0.2)' }}
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    id="nav-login-link"
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    id="nav-register-link"
                    className="btn-primary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
