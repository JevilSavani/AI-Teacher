import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, HelpCircle, Award, RefreshCw, Send, Loader } from 'lucide-react';
import { assessmentService } from '../services/assessmentService';

export default function QuizModal({ isOpen, onClose, lessonId, topic, onComplete }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (isOpen && lessonId) {
      loadQuiz();
    }
  }, [isOpen, lessonId]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      setError('');
      setResult(null);
      setAnswers({});
      const data = await assessmentService.generateQuiz(lessonId);
      setQuiz(data.quiz || data);
    } catch (err) {
      console.error('Quiz loading error:', err);
      setError(err.message || 'Failed to load quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');

      const answersArray = Object.keys(answers).map(qId => ({
        questionId: qId,
        answer: answers[qId]
      }));

      const evalData = await assessmentService.submitQuiz(lessonId, answersArray, quiz);
      setResult(evalData);
      if (onComplete) onComplete(evalData);
    } catch (err) {
      console.error('Quiz submission error:', err);
      setError(err.message || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '750px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Award size={22} color="var(--primary-light)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', margin: 0 }}>
              {quiz?.title || `${topic || 'Lesson'} Knowledge Check`}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div className="auth-alert" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div className="btn-spinner" style={{ margin: '0 auto 1rem', width: '32px', height: '32px' }} />
              <p>Generating personalized quiz questions...</p>
            </div>
          ) : result ? (
            /* Results View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{
                textAlign: 'center', padding: '1.5rem', borderRadius: 'var(--radius-md)',
                backgroundColor: result.score >= 70 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                border: `1px solid ${result.score >= 70 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`
              }}>
                <h3 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 0.5rem', color: result.score >= 70 ? '#10b981' : 'var(--primary-light)' }}>
                  {result.score}%
                </h3>
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {result.feedback}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Correct: {result.correctAnswers} / {result.totalQuestions} Questions
                </p>
              </div>

              {result.weakConcepts && result.weakConcepts.length > 0 && (
                <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--accent-rose)' }}>
                    Concepts Needing Practice:
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {result.weakConcepts.map((wc, idx) => (
                      <span key={idx} className="lang-chip" style={{ backgroundColor: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e' }}>
                        {wc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>Detailed Evaluations:</h4>
                {result.evaluatedQuestions?.map((eq, idx) => (
                  <div key={idx} style={{
                    padding: '1rem', borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${eq.isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Q{idx + 1}. {eq.question}</span>
                      <span style={{ fontWeight: '700', fontSize: '0.85rem', color: eq.isCorrect ? '#10b981' : '#f43f5e' }}>
                        {eq.score}%
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem' }}>
                      <strong>Your Answer:</strong> {eq.userAnswer || 'No answer provided'}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      <strong>Explanation / Feedback:</strong> {eq.explanation || eq.feedback}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Question Form */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {quiz?.questions?.map((q, idx) => (
                <div key={q.id || idx} style={{
                  padding: '1.25rem', borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                      Q{idx + 1}: {q.question}
                    </span>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-light)' }}>
                      {q.type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}
                    </span>
                  </div>

                  {q.type === 'mcq' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                      {q.options?.map((opt, oIdx) => (
                        <label key={oIdx} style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.85rem',
                          borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                          backgroundColor: answers[q.id] === opt ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="radio"
                            name={`q_${q.id}`}
                            value={opt}
                            checked={answers[q.id] === opt}
                            onChange={() => handleAnswerChange(q.id, opt)}
                          />
                          <span style={{ fontSize: '0.85rem' }}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div style={{ marginTop: '0.75rem' }}>
                      <textarea
                        className="form-input"
                        rows={3}
                        placeholder="Write your explanation..."
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        style={{ width: '100%', fontSize: '0.85rem', resize: 'vertical' }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.02)'
        }}>
          {result ? (
            <>
              <button className="btn-secondary" onClick={loadQuiz}>
                <RefreshCw size={16} /> Retake Quiz
              </button>
              <button className="btn-primary" onClick={onClose}>
                Done
              </button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={submitting || loading || Object.keys(answers).length === 0}
              >
                {submitting ? <span className="btn-spinner" /> : <><Send size={16} /> Submit Quiz</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
