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

  const scrollToSection = (id) => {
    if (window.location.pathname !== '/') {
      navigate('/#' + id);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-inner" style={{ gap: '1.5rem' }}>
        {/* Brand */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="brand" style={{ textDecoration: 'none' }}>
          <div className="brand-icon">
            <GraduationCap size={22} />
          </div>
          <div>
            <span style={{ color: 'var(--text-primary)' }}>AI </span>
            <span className="brand-text-gradient">Teacher</span>
          </div>
        </Link>

        {/* Public SaaS Navigation Links */}
        {!isAuthenticated && (
          <nav className="desktop-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', marginLeft: 'auto', marginRight: '1rem' }}>
            <button 
              onClick={() => scrollToSection('features')} 
              style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500, hover: { color: 'var(--text-primary)' } }}
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')} 
              style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection('ai-avatar')} 
              style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}
            >
              AI Teacher
            </button>
            <button 
              onClick={() => scrollToSection('personalization')} 
              style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}
            >
              Personalization
            </button>
          </nav>
        )}

        {/* User Auth / Action Controls */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: isAuthenticated ? 'auto' : '0' }}>
          {!loading && (
            <>
              {isAuthenticated ? (
                <>
                  {/* Dashboard Link */}
                  <Link
                    to="/dashboard"
                    className="btn-secondary"
                    style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <LayoutDashboard size={15} />
                    Dashboard
                  </Link>

                  {/* Materials Link */}
                  <Link
                    to="/materials"
                    className="btn-secondary"
                    style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <BookOpen size={15} />
                    Materials
                  </Link>

                  {/* Profile Setup */}
                  <Link
                    to="/profile/setup"
                    className="btn-secondary"
                    style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
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
                    style={{ padding: '0.45rem 0.95rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-rose)', borderColor: 'rgba(244, 63, 94, 0.2)' }}
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
                    style={{ padding: '0.5rem 1.1rem', fontSize: '0.875rem' }}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    id="nav-register-link"
                    className="btn-primary"
                    style={{ padding: '0.5rem 1.1rem', fontSize: '0.875rem' }}
                  >
                    Get Started Free
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
