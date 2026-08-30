import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, MessageSquare, Trash2, Plus, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { documentService } from '../services/documentService';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function MyMaterialsPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Poll for status updates if any document is processing
  useEffect(() => {
    const hasProcessingDocs = documents.some(
      doc => doc.processing_status === 'processing' || doc.processing_status === 'pending'
    );
    
    let intervalId;
    
    if (hasProcessingDocs && !isPolling) {
      setIsPolling(true);
      intervalId = setInterval(() => {
        fetchDocuments(false); // Silent fetch without loading spinner
      }, 5000); // Poll every 5 seconds
    } else if (!hasProcessingDocs && isPolling) {
      setIsPolling(false);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [documents, isPolling]);

  const fetchDocuments = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const data = await documentService.getDocuments();
      setDocuments(data);
      setError('');
    } catch (err) {
      setError('Failed to load documents.');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document? All chat history will be lost.')) return;
    
    try {
      await documentService.deleteDocument(id);
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (err) {
      alert('Failed to delete document.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ready':
        return (
          <span className="status-badge" style={{ color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.1)' }}>
            <CheckCircle size={14} /> Ready
          </span>
        );
      case 'processing':
      case 'pending':
        return (
          <span className="status-badge" style={{ color: 'var(--accent-amber)', background: 'rgba(245, 158, 11, 0.1)' }}>
            <RefreshCw size={14} className="spin-animation" /> Processing
          </span>
        );
      case 'failed':
        return (
          <span className="status-badge" style={{ color: 'var(--accent-rose)', background: 'rgba(244, 63, 94, 0.1)' }}>
            <AlertCircle size={14} /> Failed
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
            My <span className="brand-text-gradient">Materials</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage your uploaded documents and start learning from them.
          </p>
        </div>
        <Link to="/materials/upload" className="btn-primary" style={{ textDecoration: 'none' }}>
          <Plus size={18} />
          Upload New
        </Link>
      </div>

      {error && (
        <div className="auth-alert" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {documents.length === 0 ? (
        <div className="card empty-state" style={{ padding: '4rem 2rem' }}>
          <div className="empty-icon">
            <FileText size={32} />
          </div>
          <p className="empty-title">No materials found</p>
          <p className="empty-desc" style={{ marginBottom: '1.5rem' }}>
            Upload your first document to start generating personalized lessons and chatting with your materials.
          </p>
          <Link to="/materials/upload" className="btn-primary" style={{ textDecoration: 'none' }}>
            <Plus size={16} />
            Upload Material
          </Link>
        </div>
      ) : (
        <div className="document-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {documents.map((doc) => (
            <div key={doc.id} className="card document-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ 
                  width: '40px', height: '40px', 
                  borderRadius: 'var(--radius-sm)', 
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--primary-light)',
                  flexShrink: 0
                }}>
                  <FileText size={20} />
                </div>
                {getStatusBadge(doc.processing_status)}
              </div>
              
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem', flex: 1 }}>
                {doc.title}
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                <Clock size={14} />
                {new Date(doc.created_at).toLocaleDateString()}
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button 
                  className="btn-primary" 
                  style={{ flex: 1, justifyContent: 'center', padding: '0.6rem', fontSize: '0.85rem' }}
                  disabled={doc.processing_status !== 'ready'}
                  onClick={() => navigate(`/materials/${doc.id}/chat`)}
                >
                  <MessageSquare size={14} />
                  Chat
                </button>
                <button 
                  className="btn-secondary" 
                  style={{ padding: '0.6rem', color: 'var(--accent-rose)', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                  onClick={() => handleDelete(doc.id)}
                  title="Delete Document"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
