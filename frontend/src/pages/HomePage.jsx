import React from 'react';
import { useApiHealth } from '../hooks/useApiHealth';
import HealthStatusCard from '../components/HealthStatusCard';
import ArchitectureOverview from '../components/ArchitectureOverview';
import { Sparkles, Terminal, Rocket, CheckCircle } from 'lucide-react';

export default function HomePage() {
  const { healthData, dbData, loading, error, latencyMs, refresh } = useApiHealth();

  return (
    <div>
      {/* Hero Section */}
      <section style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.85rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid var(--border-color)',
          fontSize: '0.85rem',
          color: 'var(--primary-light)',
          marginBottom: '1rem'
        }}>
          <Sparkles size={16} />
          <span>Core Foundation Scaffolding &bull; Ready for Integration</span>
        </div>

        <h1 style={{
          fontSize: '2.75rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
          marginBottom: '1rem'
        }}>
          AI Teacher <span className="brand-text-gradient">Platform Engine</span>
        </h1>

        <p style={{
          fontSize: '1.1rem',
          color: 'var(--text-secondary)',
          maxWidth: '720px',
          margin: '0 auto 1.5rem auto'
        }}>
          Modular, scalable architecture prepared for RAG document processing, Socratic tutoring,
          dynamic assessments, ElevenLabs TTS, and AI avatar video generation.
        </p>
      </section>

      {/* Health Status & Connection Verification Card */}
      <HealthStatusCard
        healthData={healthData}
        dbData={dbData}
        loading={loading}
        error={error}
        latencyMs={latencyMs}
        onRefresh={refresh}
      />

      {/* Modular Architecture Grid */}
      <ArchitectureOverview />

      {/* Quick Start & Workflow Guide */}
      <div style={{ marginTop: '2.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Rocket size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Development Setup & Next Steps</h3>
          </div>

          <div className="grid-2" style={{ gap: '1.25rem' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--accent-cyan)' }}>
                1. Local Environment Execution
              </div>
              <ul style={{ listStyle: 'none', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li><CheckCircle size={14} color="var(--accent-emerald)" style={{ display: 'inline', marginRight: '6px' }} /><strong>Backend:</strong> <span className="code-pill">npm run dev:backend</span></li>
                <li><CheckCircle size={14} color="var(--accent-emerald)" style={{ display: 'inline', marginRight: '6px' }} /><strong>Frontend:</strong> <span className="code-pill">npm run dev:frontend</span></li>
                <li><CheckCircle size={14} color="var(--accent-emerald)" style={{ display: 'inline', marginRight: '6px' }} /><strong>Both:</strong> <span className="code-pill">npm run dev</span></li>
              </ul>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--accent-emerald)' }}>
                2. Upcoming Implementation Order
              </div>
              <ol style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <li>JWT Authentication & User Session Management</li>
                <li>Document Ingestion & pgvector RAG Pipeline</li>
                <li>AI Teaching Engine & Socratic Dialogue</li>
                <li>Dynamic Question Generation & Evaluator</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
