import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';

/**
 * AuthenticatedLayout — Unified production sidebar layout for all student dashboard pages.
 */
export default function AuthenticatedLayout({ children, activeRoute }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleCloseMobile = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className="app-authenticated-layout" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)', position: 'relative' }}>
      
      {/* Sidebar container (Desktop: static fixed sidebar, Mobile: slide-out drawer) */}
      <div className={`sidebar-wrapper ${mobileSidebarOpen ? 'mobile-sidebar-open' : ''}`}>
        <Sidebar activeRoute={activeRoute} onCloseMobile={handleCloseMobile} />
      </div>

      {/* Mobile Header Bar */}
      <div className="mobile-navbar-header">
        <button 
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} 
          className="mobile-hamburger-toggle"
          aria-label="Toggle navigation menu"
        >
          {mobileSidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
          AI <span className="brand-text-gradient">Teacher</span>
        </span>
      </div>

      {/* Main View Area */}
      <div className="authenticated-content-area" style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {children}
      </div>

      {/* Mobile Drawer Overlay Backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="mobile-sidebar-overlay"
          onClick={handleCloseMobile}
        />
      )}
    </div>
  );
}
