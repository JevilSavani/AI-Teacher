import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <strong>AI Teacher Platform</strong> &bull; Scalable Hackathon Architecture
        </div>
        <div>
          React + Vite &bull; Node.js + Express &bull; PostgreSQL + pgvector
        </div>
      </div>
    </footer>
  );
}
