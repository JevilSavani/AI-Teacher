import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, ArrowLeft, FileText, User, Bot, AlertCircle } from 'lucide-react';
import { documentService } from '../services/documentService';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function RagChatPage() {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm ready to answer questions based on this document. What would you like to know?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const fetchDocument = async () => {
    try {
      setIsPageLoading(true);
      const data = await documentService.getDocumentById(id);
      setDocument(data);
      if (data.processing_status !== 'ready') {
        setError('This document is not ready for chat. Please check back later.');
      }
    } catch (err) {
      setError('Failed to load document details.');
    } finally {
      setIsPageLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await documentService.askDocument(id, userMessage);
      
      // Extract answer and sources
      let assistantMsg = response.answer;
      if (response.sources && response.sources.length > 0) {
        assistantMsg += '\n\n**Sources:**\n' + response.sources.map(s => `- Chunk ${s.index + 1} (Similarity: ${(s.similarity * 100).toFixed(1)}%)`).join('\n');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: assistantMsg }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I encountered an error while processing your question.",
        isError: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isPageLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div style={{ 
        padding: '1rem 2rem', 
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <Link to="/materials" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ 
          width: '32px', height: '32px', 
          borderRadius: 'var(--radius-sm)', 
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--primary-light)'
        }}>
          <FileText size={16} />
        </div>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: '700' }}>{document?.title || 'Unknown Document'}</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Document Q&A</p>
        </div>
      </div>

      {error ? (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
          <div className="auth-alert">
            <AlertCircle size={18} />
            {error}
          </div>
          <Link to="/materials" className="btn-secondary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
            Back to Materials
          </Link>
        </div>
      ) : (
        <>
          {/* Chat Area */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            maxWidth: '900px',
            margin: '0 auto',
            width: '100%'
          }}>
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  gap: '1rem',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}
              >
                {msg.role === 'assistant' && (
                  <div style={{ 
                    width: '36px', height: '36px', 
                    borderRadius: '50%', 
                    background: 'var(--primary-gradient)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', flexShrink: 0, marginTop: '0.25rem'
                  }}>
                    <Bot size={20} />
                  </div>
                )}
                
                <div style={{ 
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: msg.role === 'user' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-card)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-color)'}`,
                  color: msg.isError ? 'var(--accent-rose)' : 'var(--text-primary)',
                  borderTopRightRadius: msg.role === 'user' ? 0 : 'var(--radius-md)',
                  borderTopLeftRadius: msg.role === 'assistant' ? 0 : 'var(--radius-md)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6'
                }}>
                  {msg.content}
                </div>

                {msg.role === 'user' && (
                  <div style={{ 
                    width: '36px', height: '36px', 
                    borderRadius: '50%', 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-primary)', flexShrink: 0, marginTop: '0.25rem'
                  }}>
                    <User size={18} />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div style={{ display: 'flex', gap: '1rem', alignSelf: 'flex-start' }}>
                <div style={{ 
                  width: '36px', height: '36px', 
                  borderRadius: '50%', 
                  background: 'var(--primary-gradient)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', flexShrink: 0
                }}>
                  <Bot size={20} />
                </div>
                <div style={{ padding: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div className="typing-dot" style={{ animationDelay: '0s' }}></div>
                  <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
                  <div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ 
            padding: '1.5rem 2rem', 
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)'
          }}>
            <form 
              onSubmit={handleSendMessage}
              style={{ 
                maxWidth: '900px', 
                margin: '0 auto',
                display: 'flex',
                gap: '1rem',
                position: 'relative'
              }}
            >
              <input
                type="text"
                className="form-input"
                placeholder="Ask a question about this document..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                style={{ 
                  paddingRight: '3.5rem',
                  paddingLeft: '1.5rem',
                  height: '56px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '1rem'
                }}
              />
              <button 
                type="submit" 
                disabled={!inputValue.trim() || isLoading}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '8px',
                  bottom: '8px',
                  width: '40px',
                  border: 'none',
                  borderRadius: '50%',
                  background: inputValue.trim() ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.1)',
                  color: inputValue.trim() ? 'white' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s'
                }}
              >
                <Send size={18} style={{ marginLeft: '2px' }} />
              </button>
            </form>
          </div>
        </>
      )}
      
      <style>{`
        .typing-dot {
          width: 8px;
          height: 8px;
          background-color: var(--text-muted);
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out both;
        }
        @keyframes typing {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
