import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Play, Pause, Square, ChevronLeft, ChevronRight, Sparkles, 
  Volume2, AlertCircle, HelpCircle, CheckCircle, RefreshCw, X, Award
} from 'lucide-react';
import { avatarService } from '../services/avatarService';
import speechService from '../utils/speechService';
import AvatarTeacherCanvas from '../components/AvatarTeacherCanvas';
import VisualExplanation from '../components/VisualExplanation';
import MarkdownRenderer from '../components/MarkdownRenderer';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Sidebar from '../components/Sidebar';

export default function TeachingVideoPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);
  const [conceptIndex, setConceptIndex] = useState(0);

  // Speech & Video Control States
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [statusMode, setStatusMode] = useState('speaking'); // 'speaking' | 'paused' | 'question' | 'evaluating'

  // Interactive Question Checkpoint States
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);

  // Subscribe to Speech Service events
  useEffect(() => {
    const unsubscribe = speechService.subscribe(({ isPlaying: playing, isPaused: paused }) => {
      setIsSpeaking(playing);
      setIsPaused(paused);
      if (playing && !paused) {
        setStatusMode('speaking');
      } else if (paused) {
        setStatusMode('paused');
      }
    });

    return () => {
      unsubscribe();
      speechService.stop();
    };
  }, []);

  // Fetch teaching session whenever lessonId or conceptIndex changes
  useEffect(() => {
    loadSession(conceptIndex);
  }, [lessonId, conceptIndex]);

  const loadSession = async (idx) => {
    try {
      setLoading(true);
      setError('');
      setShowQuestionModal(false);
      setEvaluationResult(null);
      setSelectedAnswer('');
      speechService.stop();

      const data = await avatarService.getTeachingSession(lessonId, idx);
      setSession(data);

      // Automatically speak the generated teacher script in student's language
      if (data?.script?.speechScript) {
        speechService.speak(data.script.speechScript, data.language || 'English', {
          onEnd: () => {
            // Once explanation finishes, automatically trigger checkpoint question!
            if (data?.script?.interactiveQuestion) {
              setStatusMode('question');
              setShowQuestionModal(true);
            }
          },
          onError: (err) => {
            console.warn('[TeachingVideoPage] Speech TTS notice:', err.message);
          }
        });
      }
    } catch (err) {
      console.error('Failed to load teaching session:', err);
      setError(err.message || 'Failed to initialize AI Teaching Video.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (isSpeaking && !isPaused) {
      speechService.pause();
    } else if (isPaused) {
      speechService.resume();
    } else if (session?.script?.speechScript) {
      speechService.speak(session.script.speechScript, session.language || 'English', {
        onEnd: () => {
          if (session?.script?.interactiveQuestion) {
            setStatusMode('question');
            setShowQuestionModal(true);
          }
        }
      });
    }
  };

  const handleStop = () => {
    speechService.stop();
    setStatusMode('paused');
  };

  const handleNextConcept = () => {
    if (session && conceptIndex < session.totalConcepts - 1) {
      setConceptIndex(prev => prev + 1);
    } else {
      navigate(`/classroom/${lessonId}`);
    }
  };

  const handlePrevConcept = () => {
    if (conceptIndex > 0) {
      setConceptIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuestion = async () => {
    if (!selectedAnswer || !session?.script?.interactiveQuestion) return;

    try {
      setEvaluating(true);
      setStatusMode('evaluating');

      const q = session.script.interactiveQuestion;
      const resData = await avatarService.evaluateVideoQuestion(lessonId, {
        conceptTitle: session.script.conceptTitle,
        questionText: q.question,
        userAnswer: selectedAnswer,
        correctAnswer: q.correctAnswer
      });

      setEvaluationResult(resData);

      // If answer is incorrect, read adaptive re-teaching text aloud
      if (!resData.isCorrect && resData.reTeachingText) {
        speechService.speak(resData.reTeachingText, session.language || 'English');
      } else if (resData.isCorrect) {
        speechService.speak(`Excellent job! That is correct. Let's move to the next topic.`, session.language || 'English');
      }
    } catch (err) {
      console.error('Evaluation error:', err);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="teaching-video-page" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary, #090d16)', color: 'var(--text-primary, #f8fafc)', display: 'flex', flexDirection: 'column' }}>
      {/* Studio Top Header */}
      <header style={{ padding: '1rem 2rem', background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid var(--border-color, #334155)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate(`/classroom/${lessonId}`)} className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
            <ChevronLeft size={16} /> Exit Studio
          </button>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
              🎥 AI Teaching Studio: <span className="brand-text-gradient">{session?.topic || 'Interactive Lesson'}</span>
            </h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Level: {session?.level || 'Intermediate'} &bull; Language: {session?.language || 'English'}
            </span>
          </div>
        </div>

        {/* Concept Progress Tracker */}
        {session && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(30, 41, 59, 0.8)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <Sparkles size={16} color="var(--primary-light, #818cf8)" />
            <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>
              Concept {session.conceptIndex + 1} of {session.totalConcepts}
            </span>
            <div style={{ width: '100px', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.round(((session.conceptIndex + 1) / session.totalConcepts) * 100)}%`, height: '100%', background: 'var(--primary-gradient)', transition: 'width 0.4s' }} />
            </div>
          </div>
        )}
      </header>

      {/* Main Studio Body Grid */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: 'minmax(340px, 440px) 1fr', gap: '2rem' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', padding: '6rem', textAlign: 'center' }}>
            <LoadingSpinner />
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Initializing AI Teacher Avatar & Spoken Script...</p>
          </div>
        ) : error ? (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '12px', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
            <AlertCircle size={24} color="#f43f5e" />
            <h3 style={{ margin: '0.5rem 0', color: '#f43f5e' }}>Avatar Studio Error</h3>
            <p>{error}</p>
            <button onClick={() => navigate(`/classroom/${lessonId}`)} className="btn-primary" style={{ marginTop: '1rem' }}>
              Return to Standard Classroom Lesson
            </button>
          </div>
        ) : (
          <>
            {/* Left Stage: AI Avatar + Spoken Script + Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Avatar Canvas */}
              <AvatarTeacherCanvas
                isSpeaking={isSpeaking}
                isPaused={isPaused}
                statusMode={statusMode}
                avatarName="Prof. Elena"
              />

              {/* Spoken Script Box */}
              <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-secondary, #1e293b)', border: '1px solid var(--border-color, #334155)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary-light, #818cf8)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Volume2 size={16} /> Teacher Spoken Script ({session?.language || 'English'})
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {isSpeaking ? (isPaused ? 'Paused' : 'Speaking...') : 'Idle'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: '1.55', color: 'var(--text-primary)', fontStyle: 'italic' }}>
                  "{session?.script?.speechScript}"
                </p>
                {session?.script?.visualEmphasis && (
                  <div style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.1)', borderLeft: '3px solid var(--primary, #6366f1)', fontSize: '0.8rem', color: 'var(--primary-light)' }}>
                    💡 <strong>Teacher Cue:</strong> {session.script.visualEmphasis}
                  </div>
                )}
              </div>

              {/* Play / Concept Controls Bar */}
              <div style={{ padding: '0.85rem 1.25rem', borderRadius: '12px', background: 'var(--bg-secondary, #1e293b)', border: '1px solid var(--border-color, #334155)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  onClick={handlePrevConcept}
                  disabled={conceptIndex === 0}
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                >
                  <ChevronLeft size={16} /> Prev
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <button
                    onClick={handlePlayPause}
                    className="btn-primary"
                    style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    {isSpeaking && !isPaused ? <Pause size={16} /> : <Play size={16} />}
                    <span>{isSpeaking && !isPaused ? 'Pause' : (isPaused ? 'Resume' : 'Play Script')}</span>
                  </button>
                  <button
                    onClick={handleStop}
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    <Square size={14} />
                  </button>
                </div>

                <button
                  onClick={handleNextConcept}
                  className="btn-primary"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                >
                  <span>{conceptIndex === session.totalConcepts - 1 ? 'Finish' : 'Next'}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Right Stage: Visual Diagram + On-Screen Lesson Text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--bg-card, #0f172a)', border: '1px solid var(--border-color, #334155)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  📚 {session?.script?.conceptTitle || session?.topic}
                </h2>

                {/* Visual Explanation Diagram */}
                {session?.visual && (
                  <div className="teaching-visual-stage">
                    <VisualExplanation visual={session.visual} title={session.script?.conceptTitle} />
                  </div>
                )}

                {/* On-Screen Text Explanation */}
                {session?.activeConcept?.description && (
                  <div style={{ marginTop: '0.5rem', padding: '1.25rem', borderRadius: '10px', background: 'var(--bg-secondary, #1e293b)', border: '1px solid var(--border-color, #334155)' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary-light, #818cf8)' }}>
                      On-Screen Concept Summary
                    </h4>
                    <MarkdownRenderer content={session.activeConcept.description} />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Interactive Video Checkpoint Question Modal Overlay */}
      {showQuestionModal && session?.script?.interactiveQuestion && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ backgroundColor: 'var(--bg-card, #0f172a)', border: '1px solid var(--border-color, #334155)', borderRadius: '16px', width: '100%', maxWidth: '650px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <HelpCircle size={22} color="var(--primary-light, #818cf8)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>
                  Interactive Video Checkpoint
                </h3>
              </div>
              <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
                Concept Check
              </span>
            </div>

            <p style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
              {session.script.interactiveQuestion.question}
            </p>

            {/* Answer Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {session.script.interactiveQuestion.options?.map((opt, idx) => (
                <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', borderRadius: '10px', border: `1px solid ${selectedAnswer === opt ? 'var(--primary, #6366f1)' : 'var(--border-color, #334155)'}`, backgroundColor: selectedAnswer === opt ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <input
                    type="radio"
                    name="video_q"
                    value={opt}
                    checked={selectedAnswer === opt}
                    onChange={() => setSelectedAnswer(opt)}
                  />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{opt}</span>
                </label>
              ))}
            </div>

            {/* Evaluation Result View */}
            {evaluationResult && (
              <div style={{ padding: '1rem 1.25rem', borderRadius: '10px', background: evaluationResult.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', border: `1px solid ${evaluationResult.isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: evaluationResult.isCorrect ? '#10b981' : '#f43f5e', marginBottom: '0.4rem' }}>
                  {evaluationResult.isCorrect ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  <span>{evaluationResult.message}</span>
                </div>
                {evaluationResult.reTeachingText && (
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    {evaluationResult.reTeachingText}
                  </p>
                )}
              </div>
            )}

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              {!evaluationResult ? (
                <button
                  onClick={handleSubmitQuestion}
                  disabled={!selectedAnswer || evaluating}
                  className="btn-primary"
                  style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}
                >
                  {evaluating ? <span className="btn-spinner" /> : 'Submit Answer'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowQuestionModal(false);
                    handleNextConcept();
                  }}
                  className="btn-primary"
                  style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <span>Continue Next Concept</span>
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
