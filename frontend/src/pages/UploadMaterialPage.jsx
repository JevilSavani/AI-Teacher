import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, File, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { documentService } from '../services/documentService';

export default function UploadMaterialPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setError('');
    
    // Check file type
    const validTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ];
    
    const validExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt'];
    const fileExt = '.' + selectedFile.name.split('.').pop().toLowerCase();

    if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(fileExt)) {
      setError('Invalid file type. Please upload a PDF, DOCX, PPTX, or TXT file.');
      return;
    }

    // Check file size (50MB max)
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File size exceeds the 50MB limit.');
      return;
    }

    setFile(selectedFile);
    if (!title) {
      // Auto-fill title from filename (remove extension)
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      setError('');
      
      await documentService.uploadDocument(file, title, (progressEvent) => {
        if (progressEvent && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      // Redirect to materials page on success
      navigate('/materials');
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload document. Please try again.');
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setUploadProgress(0);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
          Upload <span className="brand-text-gradient">Learning Material</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Upload a PDF, Word document, PowerPoint, or text file. We'll process it so you can chat with it or generate lessons.
        </p>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        {error && (
          <div className="auth-alert" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {!file ? (
          <div 
            className={`upload-zone ${isDragging ? 'upload-zone-dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? 'var(--primary-light)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '3rem 2rem',
              textAlign: 'center',
              backgroundColor: isDragging ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255, 255, 255, 0.02)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '1.5rem'
            }}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
            />
            <div style={{ 
              width: '64px', height: '64px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
              color: 'var(--primary-light)'
            }}>
              <Upload size={32} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              Drag & drop your file here
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              or click to browse files
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span className="lang-chip">PDF</span>
              <span className="lang-chip">DOCX</span>
              <span className="lang-chip">PPTX</span>
              <span className="lang-chip">TXT</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>
              Maximum file size: 50MB
            </p>
          </div>
        ) : (
          <div className="file-preview" style={{ 
            border: '1px solid var(--border-color)', 
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            marginBottom: '2rem',
            backgroundColor: 'rgba(255, 255, 255, 0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ 
                width: '48px', height: '48px', 
                borderRadius: 'var(--radius-sm)', 
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--primary-light)',
                flexShrink: 0
              }}>
                <FileText size={24} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontWeight: '600', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {file.name}
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              {!isUploading && (
                <button 
                  onClick={clearFile}
                  style={{ 
                    background: 'none', border: 'none', 
                    color: 'var(--text-muted)', cursor: 'pointer',
                    padding: '0.5rem'
                  }}
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Document Title</label>
              <input 
                type="text" 
                className="form-input" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., Intro to Machine Learning Notes"
                disabled={isUploading}
              />
            </div>

            {isUploading && (
              <div className="upload-progress" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Uploading...</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{uploadProgress}%</span>
                </div>
                <div className="progress-bar-track" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${uploadProgress}%`, transition: 'width 0.2s' }} 
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              {!isUploading && (
                <button className="btn-secondary" onClick={clearFile}>
                  Cancel
                </button>
              )}
              <button 
                className="btn-primary" 
                onClick={handleUpload}
                disabled={isUploading || !title.trim()}
                style={{ minWidth: '140px', justifyContent: 'center' }}
              >
                {isUploading ? (
                  <span className="btn-spinner" />
                ) : (
                  <>
                    <Upload size={16} />
                    Upload & Process
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
