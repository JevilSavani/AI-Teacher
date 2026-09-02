import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  TrendingUp, Award, Zap, BookOpen, Flame, CheckCircle, 
  AlertCircle, BarChart2, ChevronRight, Plus, Sparkles, RefreshCw
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';

export default function ProgressPage() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await analyticsService.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load progress analytics:', err);
      setError(err.message || 'Failed to load progress analytics.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthenticatedLayout activeRoute="/progress">

      {/* Main Content */}
      <main className="dashboard-main" style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
              Learning <span className="brand-text-gradient">Progress & Analytics</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Comprehensive performance report, concept mastery, and quiz assessments.
            </p>
          </div>
          <button onClick={fetchAnalytics} className="btn-secondary" style={{ padding: '0.5rem 0.85rem' }}>
            <RefreshCw size={16} /> Refresh Data
          </button>
        </div>

        {error && (
          <div className="auth-alert" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <LoadingSpinner />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Top Metric Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {/* Overall Progress Card */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)' }}>
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: '800', display: 'block' }}>{analytics?.overallProgressPercentage || 0}%</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Overall Progress</span>
                  </div>
                </div>
                <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${analytics?.overallProgressPercentage || 0}%`, height: '100%', background: 'var(--primary-gradient)', transition: 'width 0.4s' }} />
                </div>
              </div>

              {/* Accuracy Rate */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: '800', display: 'block', color: '#10b981' }}>{analytics?.accuracyRate || 0}%</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Accuracy Rate</span>
                  </div>
                </div>
              </div>

              {/* Questions Attempted */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899' }}>
                    <Zap size={20} />
                  </div>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: '800', display: 'block' }}>{analytics?.questionsAttempted || 0}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Questions Attempted</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  <span style={{ color: '#10b981', fontWeight: '600' }}>{analytics?.questionsCorrect || 0} Correct</span> &bull; <span style={{ color: '#f43f5e', fontWeight: '600' }}>{analytics?.questionsIncorrect || 0} Incorrect</span>
                </div>
              </div>

              {/* Learning Streak */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                    <Flame size={20} />
                  </div>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: '800', display: 'block', color: '#f59e0b' }}>{analytics?.learningStreakDays || 0} Days</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Streak</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Concept Mastery & Weak Concepts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
              {/* Concept Mastery Section */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div className="card-header" style={{ marginBottom: '1rem' }}>
                  <BarChart2 size={18} color="var(--primary-light)" />
                  <h2>Concept Mastery</h2>
                </div>
                {!analytics?.conceptMastery || analytics.conceptMastery.length === 0 ? (
                  <div className="empty-state">
                    <p className="empty-title">No concept data yet</p>
                    <p className="empty-desc">Complete practice exercises to build mastery scores.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {analytics.conceptMastery.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: '600' }}>{item.concept}</span>
                          <span style={{ fontWeight: '700', color: item.mastery >= 70 ? '#10b981' : 'var(--text-secondary)' }}>
                            {item.mastery}% ({item.status})
                          </span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${item.mastery}%`, height: '100%',
                            background: item.mastery >= 70 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #6366f1, #a855f7)',
                            transition: 'width 0.4s'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Weak Concepts & Remediation */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div className="card-header" style={{ marginBottom: '1rem' }}>
                  <AlertCircle size={18} color="#f43f5e" />
                  <h2>Weak Concepts & Remediation</h2>
                </div>
                {!analytics?.weakConcepts || analytics.weakConcepts.length === 0 ? (
                  <div className="empty-state">
                    <p className="empty-title">No weak concepts identified</p>
                    <p className="empty-desc">Great job! You are demonstrating solid understanding across concepts.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {analytics.weakConcepts.map((wc, idx) => (
                      <div key={idx} style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: '700', color: '#f43f5e', fontSize: '0.9rem' }}>{wc.concept}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{wc.topic}</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>{wc.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quiz History & Results */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div className="card-header" style={{ marginBottom: '1rem' }}>
                <Award size={18} color="var(--primary-light)" />
                <h2>Quiz History & Results</h2>
              </div>
              {!analytics?.quizScoresOverTime || analytics.quizScoresOverTime.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-title">No quiz history available</p>
                  <p className="empty-desc">Take lesson quizzes to see your historical evaluation trends.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {analytics.quizScoresOverTime.map((quiz, idx) => (
                    <div key={idx} style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{quiz.topic}</span>
                        <span style={{
                          padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700',
                          backgroundColor: quiz.score >= 70 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                          color: quiz.score >= 70 ? '#10b981' : '#f43f5e'
                        }}>
                          {quiz.score}%
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                        Date: {quiz.date} &bull; {quiz.correctAnswers}/{quiz.totalQuestions} Correct
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommended Next Steps */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div className="card-header" style={{ marginBottom: '1rem' }}>
                <Sparkles size={18} color="var(--primary-light)" />
                <h2>Recommended Next Steps</h2>
              </div>
              {!analytics?.recommendations || analytics.recommendations.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-title">No recommendations yet</p>
                  <p className="empty-desc">Start a lesson to receive tailored guidance.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {analytics.recommendations.map((rec) => (
                    <div key={rec.id} style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--primary-light)', display: 'block', marginBottom: '0.35rem' }}>
                          {rec.recommendation}
                        </span>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
                          {rec.reason}
                        </p>
                      </div>
                      <button onClick={() => navigate(rec.link || `/classroom/${rec.lessonId}`)} className="btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                        {rec.actionLabel || 'Start Practice'} <ChevronRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </AuthenticatedLayout>
  );
}
