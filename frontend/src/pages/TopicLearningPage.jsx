import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Sparkles, ChevronDown, ChevronRight, Loader } from 'lucide-react';
import { lessonService } from '../services/lessonService';
import { useAuth } from '../context/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';
import VisualExplanation from '../components/VisualExplanation';
import VoicePlayer from '../components/VoicePlayer';
import speechService from '../utils/speechService';

export default function TopicLearningPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState(profile?.knowledge_level || 'beginner');
  const [language, setLanguage] = useState(profile?.preferred_language || 'English');

  useEffect(() => {
    return () => {
      speechService.stop();
    };
  }, []);

  useEffect(() => {
    if (profile?.knowledge_level) {
      setLevel(profile.knowledge_level);
    }
    if (profile?.preferred_language) {
      setLanguage(profile.preferred_language);
    }
  }, [profile]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [outline, setOutline] = useState(null);
  const [error, setError] = useState('');
  
  const [activeModule, setActiveModule] = useState(0);
  const [activeTopic, setActiveTopic] = useState(null);
  
  const [explanation, setExplanation] = useState('');
  const [explanationVisual, setExplanationVisual] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [lessonId, setLessonId] = useState(null);

  const handleGenerateOutline = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    try {
      setIsLoading(true);
      setError('');
      setOutline(null);
      setExplanation('');
      setExplanationVisual(null);
      setActiveTopic(null);
      
      const result = await lessonService.createTopicLesson(topic, level, language);
      setOutline(result.metadata);
      setLessonId(result.id);
      
      if (result.metadata?.modules?.length > 0) {
        setActiveModule(0);
        const firstModule = result.metadata.modules[0];
        const firstTopic = firstModule.topics?.[0] || firstModule.title;
        if (firstTopic) {
          handleTopicClickWithId(result.id, 0, firstTopic);
        }
      } else {
        setError('No concepts found for this topic. Please try generating with another topic or level.');
      }
    } catch (err) {
      console.error('Error generating topic outline:', err);
      setError('Failed to generate topic outline. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicClickWithId = async (targetLessonId, moduleIndex, topicName) => {
    setActiveModule(moduleIndex);
    setActiveTopic(topicName);
    
    try {
      setIsExplaining(true);
      setExplanation('');
      setExplanationVisual(null);
      
      const currentLessonId = targetLessonId || lessonId;
      const result = await lessonService.askTopicLesson(currentLessonId, topicName, level, language);
      
      const explanationData = result.explanation || result.data?.explanation || result;
      const expText = typeof explanationData === 'string' ? explanationData : (explanationData?.explanation || 'No explanation generated.');
      const expVisual = explanationData?.visual || result.visual || result.data?.visual || null;

      setExplanation(expText);
      setExplanationVisual(expVisual);
    } catch (err) {
      console.error('Error getting explanation:', err);
      setExplanation('Failed to load explanation for this topic.');
    } finally {
      setIsExplaining(false);
    }
  };

  const handleTopicClick = (moduleIndex, topicName) => {
    handleTopicClickWithId(lessonId, moduleIndex, topicName);
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      {/* Search Header */}
      <div style={{ 
        padding: '2rem', 
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1.5rem', textAlign: 'center' }}>
          What do you want to <span className="brand-text-gradient">learn today?</span>
        </h1>
        
        <form 
          onSubmit={handleGenerateOutline}
          style={{ width: '100%', maxWidth: '800px', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
        >
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="E.g., Quantum Computing, French Revolution, React Hooks"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isLoading}
              style={{ paddingLeft: '3rem', height: '48px', borderRadius: 'var(--radius-md)' }}
            />
          </div>
          
          <select 
            className="form-select" 
            value={level} 
            onChange={(e) => setLevel(e.target.value)}
            disabled={isLoading}
            style={{ width: '160px', height: '48px' }}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
          
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={!topic.trim() || isLoading}
            style={{ height: '48px', padding: '0 1.5rem' }}
          >
            {isLoading ? (
              <span className="btn-spinner" />
            ) : (
              <>
                <Sparkles size={16} />
                Generate Course
              </>
            )}
          </button>
        </form>
        {error && <p style={{ color: 'var(--accent-rose)', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</p>}
      </div>

      {/* Main Content Area */}
      {outline ? (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Sidebar - Outline */}
          <div style={{ 
            width: '320px', 
            borderRight: '1px solid var(--border-color)', 
            backgroundColor: 'var(--bg-primary)',
            overflowY: 'auto',
            padding: '1.5rem'
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--primary-light)' }}>
              {outline.title || 'Course Outline'}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {outline.modules?.map((mod, mIdx) => (
                <div key={mIdx} className="module-group">
                  <div 
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.5rem', 
                      fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.5rem',
                      color: activeTopic === mod.title ? 'var(--primary-light)' : 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setActiveModule(mIdx);
                      handleTopicClick(mIdx, mod.title);
                    }}
                  >
                    {activeModule === mIdx ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    {mod.title}
                  </div>
                  
                  {activeModule === mIdx && mod.topics && mod.topics.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '1.5rem' }}>
                      {mod.topics.map((t, tIdx) => (
                        <button
                          key={tIdx}
                          onClick={() => handleTopicClick(mIdx, t)}
                          style={{
                            textAlign: 'left',
                            padding: '0.5rem 0.75rem',
                            background: 'none',
                            border: 'none',
                            borderLeft: `2px solid ${activeTopic === t ? 'var(--primary)' : 'var(--border-color)'}`,
                            color: activeTopic === t ? 'var(--primary-light)' : 'var(--text-secondary)',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            backgroundColor: activeTopic === t ? 'rgba(99, 102, 241, 0.05)' : 'transparent'
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Explanation */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '3rem', backgroundColor: 'var(--bg-card)' }}>
            {activeTopic ? (
              <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                  {activeTopic}
                </h2>
                
                {isExplaining ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <Loader size={32} className="spin-animation" style={{ marginBottom: '1rem', color: 'var(--primary)' }} />
                    <p>Generating explanation in {language}...</p>
                  </div>
                ) : (
                  <div>
                    {explanation && (
                      <VoicePlayer 
                        text={`${activeTopic || ''}. ${explanation}`} 
                        language={language} 
                      />
                    )}
                    <MarkdownRenderer content={explanation} />
                    {explanationVisual && (
                      <div style={{ marginTop: '1.5rem' }}>
                        <VisualExplanation visual={explanationVisual} title={activeTopic} />
                      </div>
                    )}

                    {explanation && lessonId && (
                      <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1rem' }}>
                        <button
                          onClick={() => navigate(`/classroom/${lessonId}`)}
                          className="btn-primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          <Sparkles size={16} />
                          Practice & Get Questions
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p style={{ fontSize: '1.1rem' }}>Select a topic from the outline to start learning</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Sparkles size={40} color="var(--primary-light)" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Topic-Based Learning</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px' }}>
            Enter any topic you want to learn. The AI will generate a structured curriculum and teach you step-by-step.
          </p>
        </div>
      )}
    </div>
  );
}
