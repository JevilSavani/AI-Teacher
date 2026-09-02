import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, MessageSquare, Trash2, Plus, Clock, CheckCircle, AlertCircle, RefreshCw, Folder, ChevronRight, ChevronDown, GraduationCap, Sparkles } from 'lucide-react';
import { documentService } from '../services/documentService';
import { lessonService } from '../services/lessonService';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function MyMaterialsPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPolling, setIsPolling] = useState(false);

  // Teaching setup state
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedScope, setSelectedScope] = useState({ type: 'all', chapterTitle: null, sectionTitle: null, title: 'Entire Document' });
  const [selectedLevel, setSelectedLevel] = useState(profile?.knowledge_level || 'beginner');
  const [selectedLanguage, setSelectedLanguage] = useState(profile?.preferred_language || 'English');
  const [selectedTime, setSelectedTime] = useState(profile?.available_time_minutes ? String(profile.available_time_minutes) : '20');
  const [isTeachingLoading, setIsTeachingLoading] = useState(false);
  const [expandedDocIds, setExpandedDocIds] = useState({});

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (profile?.knowledge_level) setSelectedLevel(profile.knowledge_level);
    if (profile?.preferred_language) setSelectedLanguage(profile.preferred_language);
    if (profile?.available_time_minutes) setSelectedTime(String(profile.available_time_minutes));
  }, [profile]);

  useEffect(() => {
    const hasProcessingDocs = documents.some(
      doc => doc.processing_status === 'processing' || doc.processing_status === 'pending'
    );
    
    let intervalId;
    if (hasProcessingDocs && !isPolling) {
      setIsPolling(true);
      intervalId = setInterval(() => {
        fetchDocuments(false);
      }, 5000);
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
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await documentService.deleteDocument(id);
      setDocuments(documents.filter(doc => doc.id !== id));
      if (selectedDoc?.id === id) setSelectedDoc(null);
    } catch (err) {
      alert('Failed to delete document.');
    }
  };

  const toggleExpand = (docId) => {
    setExpandedDocIds(prev => ({ ...prev, [docId]: !prev[docId] }));
  };

  const handleStartTeaching = async (doc) => {
    try {
      setIsTeachingLoading(true);
      const topicName = selectedScope.sectionTitle || selectedScope.chapterTitle || doc.title;
      
      const lessonResult = await lessonService.createTopicLesson(
        topicName,
        selectedLevel,
        selectedLanguage,
        selectedTime,
        doc.id,
        selectedScope.chapterTitle,
        selectedScope.sectionTitle
      );

      navigate(`/teach/${lessonResult.id}`);
    } catch (err) {
      alert(err.message || 'Failed to initialize teaching studio.');
    } finally {
      setIsTeachingLoading(false);
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
    <div className="page-container" style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
            My <span className="brand-text-gradient">Materials & Structure</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Select specific chapters or sections to generate targeted lessons with your AI Teacher.
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
            Upload your textbook or presentation to analyze chapters, sections, and slide ranges.
          </p>
          <Link to="/materials/upload" className="btn-primary" style={{ textDecoration: 'none' }}>
            <Plus size={16} />
            Upload Material
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedDoc ? '1fr 380px' : '1fr', gap: '1.5rem' }}>
          
          {/* Document List with Structure Accordion */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {documents.map((doc) => {
              const isExpanded = !!expandedDocIds[doc.id];
              const isSelected = selectedDoc?.id === doc.id;
              const chapters = doc.structure?.chapters || [];

              return (
                <div 
                  key={doc.id} 
                  className="card"
                  style={{ 
                    padding: '1.5rem', 
                    borderColor: isSelected ? 'var(--primary)' : 'var(--border-color)',
                    boxShadow: isSelected ? '0 0 15px rgba(99, 102, 241, 0.2)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '42px', height: '42px', 
                        borderRadius: 'var(--radius-md)', 
                        backgroundColor: 'rgba(99, 102, 241, 0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--primary-light)'
                      }}>
                        <FileText size={22} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{doc.title}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Uploaded {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(doc.processing_status)}
                  </div>

                  {/* Chapter/Section Hierarchy Tree */}
                  {doc.processing_status === 'ready' && (
                    <div style={{ marginTop: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-color)' }}>
                      <div 
                        onClick={() => toggleExpand(doc.id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', color: 'var(--primary-light)' }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Folder size={16} />
                          Analyze Document Structure ({chapters.length} Chapters/Sections)
                        </span>
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </div>

                      {isExpanded && (
                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '0.5rem' }}>
                          
                          {/* Entire Document Selection option */}
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', fontWeight: '700', padding: '0.35rem 0.5rem', borderRadius: '4px', background: isSelected && selectedScope.type === 'all' ? 'rgba(99, 102, 241, 0.15)' : 'transparent' }}>
                            <input 
                              type="radio" 
                              name={`doc_scope_${doc.id}`}
                              checked={isSelected && selectedScope.type === 'all'}
                              onChange={() => {
                                setSelectedDoc(doc);
                                setSelectedScope({ type: 'all', chapterTitle: null, sectionTitle: null, title: 'Entire Document' });
                              }}
                            />
                            📘 Entire Document Scope
                          </label>

                          {/* Chapter & Section Tree */}
                          {chapters.map((chap, cIdx) => (
                            <div key={chap.id || cIdx} style={{ marginLeft: '1rem' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer', padding: '0.25rem 0.4rem', color: 'var(--text-primary)' }}>
                                <input 
                                  type="radio" 
                                  name={`doc_scope_${doc.id}`}
                                  checked={isSelected && selectedScope.chapterTitle === chap.title && !selectedScope.sectionTitle}
                                  onChange={() => {
                                    setSelectedDoc(doc);
                                    setSelectedScope({ type: 'chapter', chapterTitle: chap.title, sectionTitle: null, title: chap.title });
                                  }}
                                />
                                📂 {chap.title}
                              </label>

                              {chap.sections && chap.sections.map((sec, sIdx) => (
                                <label key={sec.id || sIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)', marginLeft: '1.5rem', cursor: 'pointer', padding: '0.2rem 0.4rem' }}>
                                  <input 
                                    type="radio" 
                                    name={`doc_scope_${doc.id}`}
                                    checked={isSelected && selectedScope.sectionTitle === sec.title}
                                    onChange={() => {
                                      setSelectedDoc(doc);
                                      setSelectedScope({ type: 'section', chapterTitle: chap.title, sectionTitle: sec.title, title: sec.title });
                                    }}
                                  />
                                  ├─ 📄 {sec.title}
                                </label>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                    <button 
                      className="btn-primary" 
                      style={{ flex: 1, justifyContent: 'center', padding: '0.6rem', fontSize: '0.85rem', background: 'linear-gradient(135deg, #6366f1, #ec4899)', border: 'none' }}
                      disabled={doc.processing_status !== 'ready'}
                      onClick={() => {
                        setSelectedDoc(doc);
                        if (!selectedScope.title || selectedScope.type === 'all') {
                          setSelectedScope({ type: 'all', chapterTitle: null, sectionTitle: null, title: 'Entire Document' });
                        }
                      }}
                    >
                      <GraduationCap size={16} />
                      Select Scope & Teach
                    </button>
                    
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '0.6rem', fontSize: '0.85rem' }}
                      disabled={doc.processing_status !== 'ready'}
                      onClick={() => navigate(`/materials/${doc.id}/chat`)}
                    >
                      <MessageSquare size={14} />
                      Q&A Chat
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
              );
            })}
          </div>

          {/* Right Panel - Teaching Studio Configuration */}
          {selectedDoc && (
            <div className="card" style={{ padding: '1.5rem', height: 'fit-content', sticky: 'top', top: '2rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} style={{ color: 'var(--primary-light)' }} />
                AI Teaching Config
              </h3>

              <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>DOCUMENT</p>
                <p style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{selectedDoc.title}</p>
                
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SELECTED SCOPE</p>
                <p style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--primary-light)' }}>
                  🎯 {selectedScope.title}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
                    Learner Level
                  </label>
                  <select 
                    className="form-select" 
                    value={selectedLevel} 
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
                    Teaching Language
                  </label>
                  <select 
                    className="form-select" 
                    value={selectedLanguage} 
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Spanish">Spanish</option>
                    <option value="German">German</option>
                    <option value="French">French</option>
                    <option value="Chinese">Chinese</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
                    Available Learning Time
                  </label>
                  <select 
                    className="form-select" 
                    value={selectedTime} 
                    onChange={(e) => setSelectedTime(e.target.value)}
                    style={{ width: '100%', fontWeight: '600', color: 'var(--primary-light)' }}
                  >
                    <option value="5">⚡ 5 Minutes (Express)</option>
                    <option value="20">⏱️ 20 Minutes (Standard)</option>
                    <option value="60">⏳ 60 Minutes (Deep Dive)</option>
                    <option value="7_days">📅 7 Days (Personalized Plan)</option>
                  </select>
                </div>
              </div>

              <button 
                className="btn-primary" 
                onClick={() => handleStartTeaching(selectedDoc)}
                disabled={isTeachingLoading}
                style={{ width: '100%', justifyContent: 'center', height: '48px', background: 'linear-gradient(135deg, #6366f1, #ec4899)', border: 'none', fontSize: '0.95rem' }}
              >
                {isTeachingLoading ? (
                  <span className="btn-spinner" />
                ) : (
                  <>
                    <GraduationCap size={18} />
                    Start AI Teacher Session
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
