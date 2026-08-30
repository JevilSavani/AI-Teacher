import React from 'react';
import { Activity, RefreshCw, Database, Server, Clock, HardDrive, CheckCircle2, AlertCircle } from 'lucide-react';

export default function HealthStatusCard({ healthData, dbData, loading, error, latencyMs, onRefresh }) {
  const isServerOnline = !error && !!healthData;
  const isDbConnected = dbData?.data?.connected || dbData?.connected;

  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <Activity size={20} color="var(--primary-light)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>System Health & Connectivity</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-time verification between Frontend and Express Backend
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="btn-secondary"
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
          title="Refresh Health Status"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Checking...' : 'Refresh'}</span>
        </button>
      </div>

      <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
        {/* Backend API Status */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '1rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Server size={16} color="var(--accent-cyan)" />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Backend Server</span>
            </div>
            {isServerOnline ? (
              <span className="badge badge-success">
                <span className="status-dot online"></span> Operational
              </span>
            ) : (
              <span className="badge badge-danger">
                <span className="status-dot offline"></span> Offline
              </span>
            )}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <div>Endpoint: <span className="code-pill">/api/health</span></div>
            {latencyMs !== null && (
              <div>Latency: <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{latencyMs} ms</span></div>
            )}
            {healthData?.uptime && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={12} /> Uptime: {healthData.uptime}
              </div>
            )}
          </div>
        </div>

        {/* Database Status */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '1rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={16} color="var(--accent-amber)" />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>PostgreSQL + pgvector</span>
            </div>
            {isDbConnected ? (
              <span className="badge badge-success">
                <CheckCircle2 size={12} /> Ready
              </span>
            ) : (
              <span className="badge badge-warning">
                <AlertCircle size={12} /> Config Required
              </span>
            )}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <div>Schema: <span className="code-pill">database/schema.sql</span></div>
            <div>Vector Support: {dbData?.data?.pgvectorAvailable ? <span style={{ color: 'var(--accent-emerald)' }}>Installed</span> : 'Configured in schema'}</div>
            {dbData?.data?.databaseName && <div>DB Name: <span className="code-pill">{dbData.data.databaseName}</span></div>}
          </div>
        </div>
      </div>

      {/* Memory & Diagnostics */}
      {healthData?.memory && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.75rem 1rem',
          background: 'rgba(99, 102, 241, 0.06)',
          borderRadius: 'var(--radius-sm)',
          border: '1px dashed var(--border-color)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <HardDrive size={14} color="var(--primary-light)" />
          <span>Server Memory Heap: <strong>{healthData.memory.heapUsedMb} MB</strong> / {healthData.memory.heapTotalMb} MB (RSS: {healthData.memory.rssMb} MB)</span>
        </div>
      )}
    </div>
  );
}
