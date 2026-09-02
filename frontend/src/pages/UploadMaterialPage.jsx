import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, File, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { documentService } from '../services/documentService';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';

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

      // Redirect to materials page on success with state trigger
      navigate('/materials', { state: { refreshed: Date.now() }, replace: true });
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
    <AuthenticatedLayout activeRoute="/materials">
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
              onClick={() => fileInputRef.current.click()}
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '3rem 2rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: isDragging ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                borderColor: isDragging ? 'var(--primary)' : 'var(--border-color)'
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
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(99, 102, 241, 0.1)', 
                color: 'var(--primary-light)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <Upload size={32} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                Drag and drop your file here, or click to browse
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                Supports PDF, DOC, DOCX, PPT, PPTX, TXT (Max 50MB)
              </p>
            </div>
          ) : (
            <div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.5rem',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ 
                    padding: '0.5rem', 
                    borderRadius: 'var(--radius-sm)', 
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    color: 'var(--primary-light)'
                  }}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{file.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                </div>

                {!isUploading && (
                  <button 
                    onClick={removeFile}
                    className="btn-secondary"
                    style={{ padding: '0.35rem 0.5rem', color: 'var(--accent-rose)' }}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Material Title (Optional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 3: Operating Systems Concepts"
                  disabled={isUploading}
                />
              </div>

              {isUploading && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    <span>Processing Document & Extracting Chunks...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div style={{ 
                    height: '8px', 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${uploadProgress}%`, 
                      backgroundColor: 'var(--primary)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button 
                  onClick={() => navigate('/materials')} 
                  className="btn-secondary"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpload} 
                  className="btn-primary"
                  disabled={isUploading}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {isUploading ? (
                    <>
                      <span className="btn-spinner" />
                      Uploading & Parsing...
                    </>
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
    </AuthenticatedLayout>
  );
}
