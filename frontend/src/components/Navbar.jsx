import React from 'react';
import { Sparkles, GraduationCap, Cpu, Layers } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand">
          <div className="brand-icon">
            <GraduationCap size={22} />
          </div>
          <div>
            <span>AI </span>
            <span className="brand-text-gradient">Teacher</span>
          </div>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Cpu size={14} />
            <span>Architecture Scaffold</span>
          </div>
          <a
            href="https://github.com/JevilSavani/AI-Teacher.git"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          >
            GitHub Repo
          </a>
        </nav>
      </div>
    </header>
  );
}
