import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  GraduationCap, LayoutDashboard, BookOpen, TrendingUp, 
  FileText, Settings, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeRoute }) {
  const location = useLocation();
  const { user, profile } = useAuth();

  const currentPath = activeRoute || location.pathname;

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Lessons', path: '/learn/topic', icon: <BookOpen size={18} /> },
    { label: 'Progress', path: '/progress', icon: <TrendingUp size={18} /> },
    { label: 'My Materials', path: '/materials', icon: <FileText size={18} /> },
  ];

  return (
    <aside className="dashboard-sidebar" style={{ width: '260px', borderRight: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', display: 'flex', flexDirection: 'column', padding: '1.5rem 1rem' }}>
      {/* Brand Logo */}
      <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', padding: '0 0.5rem' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <GraduationCap size={22} />
        </div>
        <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>AI Teacher</span>
      </Link>

      {/* Nav Menu */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        {navItems.map((item) => {
          const isActive = currentPath === item.path || (item.path !== '/dashboard' && currentPath.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                textDecoration: 'none', fontSize: '0.9rem', fontWeight: isActive ? '700' : '500',
                color: isActive ? 'var(--primary-light)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                transition: 'all 0.2s ease'
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <Link to="/profile/setup" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'var(--text-primary)' }}>
            {user?.name?.charAt(0).toUpperCase() || 'S'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'Student'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {profile?.knowledge_level || 'Beginner'}
            </div>
          </div>
          <Settings size={16} color="var(--text-muted)" />
        </Link>
      </div>
    </aside>
  );
}
