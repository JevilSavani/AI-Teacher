import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Sparkles, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer" style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '3.5rem 1.5rem 2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem', marginBottom: '3rem' }}>
          {/* Brand Col */}
          <div>
            <Link to="/" className="brand" style={{ textDecoration: 'none', marginBottom: '1rem', display: 'inline-flex' }}>
              <div className="brand-icon">
                <GraduationCap size={22} />
              </div>
              <div>
                <span style={{ color: 'var(--text-primary)' }}>AI </span>
                <span className="brand-text-gradient">Teacher</span>
              </div>
            </Link>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.6', marginTop: '0.75rem' }}>
              Intelligent Multimodal Adaptive Learning Platform. Turn your study material into personalized lessons, interactive explanations, and adaptive feedback.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' }}>Product</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
              <li><a href="#features" style={{ color: 'var(--text-secondary)' }}>Adaptive Features</a></li>
              <li><a href="#how-it-works" style={{ color: 'var(--text-secondary)' }}>How It Works</a></li>
              <li><a href="#ai-avatar" style={{ color: 'var(--text-secondary)' }}>AI Teacher Studio</a></li>
              <li><a href="#personalization" style={{ color: 'var(--text-secondary)' }}>Personalized Learning</a></li>
            </ul>
          </div>

          {/* Platform Links */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' }}>Platform</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
              <li><Link to="/register" style={{ color: 'var(--text-secondary)' }}>Get Started Free</Link></li>
              <li><Link to="/login" style={{ color: 'var(--text-secondary)' }}>Student Portal Login</Link></li>
              <li><Link to="/materials" style={{ color: 'var(--text-secondary)' }}>Materials Ingestion</Link></li>
              <li><Link to="/dashboard" style={{ color: 'var(--text-secondary)' }}>Learning Dashboard</Link></li>
            </ul>
          </div>

          {/* Contact & Status */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' }}>Company</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
              Empowering students worldwide with accessible, personalized AI education.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.65rem', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.78rem', color: '#34d399' }}>
              <span className="status-dot online"></span> All Systems Operational
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div style={{ paddingTop: '1.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <div>
            &copy; {new Date().getFullYear()} AI Teacher. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
