import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, Target, Clock, TrendingUp, Flame, Plus, 
  Sparkles, ChevronRight, BarChart2, Zap, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import lessonService from '../services/lessonService';
import { assessmentService } from '../services/assessmentService';
import { analyticsService } from '../services/analyticsService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';

const LEVEL_COLORS = {
  beginner: 'var(--accent-emerald)',
  intermediate: 'var(--primary-light)',
  advanced: 'var(--accent-purple)',
  expert: 'var(--accent-rose)',
};

const LEVEL_LABELS = {
  beginner: '🌱 Beginner',
  intermediate: '📈 Intermediate',
  advanced: '🚀 Advanced',
  expert: '⭐ Expert',
};

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const firstName = user?.name?.split(' ')[0] || 'Student';
  const level = profile?.knowledge_level;
  const levelColor = LEVEL_COLORS[level] || 'var(--primary-light)';
  const levelLabel = LEVEL_LABELS[level] || 'Not set';

  // Load lessons, recommendations, & analytics on mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLessonsLoading(true);
        setRecsLoading(true);
        setAnalyticsLoading(true);
        const [lessonsData, recsData, analyticsData] = await Promise.all([
          lessonService.getLessons(),
          lessonService.getRecommendations(),
          analyticsService.getAnalytics()
        ]);
        setLessons(lessonsData || []);
        setRecommendations(recsData || []);
        setAnalytics(analyticsData || null);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setLessons([]);
        setRecommendations([]);
        setAnalytics(null);
      } finally {
        setLessonsLoading(false);
        setRecsLoading(false);
        setAnalyticsLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const stats = [
    {
      icon: <TrendingUp size={20} />,
      label: 'Overall Progress',
      value: `${analytics?.overallProgressPercentage || 0}%`,
      color: '#6366f1'
    },
    {
      icon: <Zap size={20} />,
      label: 'Questions Attempted',
      value: `${analytics?.questionsAttempted || 0}`,
      color: '#ec4899'
    },
    {
      icon: <BookOpen size={20} />,
      label: 'Lessons Completed',
      value: `${analytics?.lessonsCompleted || 0} / ${analytics?.totalLessons || lessons.length}`,
      color: '#06b6d4'
    },
    {
      icon: <Flame size={20} />,
      label: 'Learning Streak',
      value: `${analytics?.learningStreakDays || 0} Days`,
      color: '#f59e0b'
    }
  ];

  return (
    <AuthenticatedLayout activeRoute="/dashboard">
      <main className="dashboard-main" style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Top bar */}
        <div className="dashboard-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 className="dashboard-greeting" style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }}>
              Good {getTimeOfDay()}, <span className="brand-text-gradient">{firstName}</span> 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem', margin: 0 }}>
              Welcome to your personal learning hub
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-color)', color: levelColor, fontWeight: '600' }}>
              {levelLabel}
            </span>
            <Link to="/learn/topic" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={16} /> New Lesson
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid-4" style={{ gap: '1.25rem', marginBottom: '2rem' }}>
          {stats.map((s, idx) => (
            <div key={idx} className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{s.label}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.15rem' }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Grid Section: Recent Lessons & Recommendations */}
        <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Recent Lessons */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={18} color="var(--primary-light)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0 }}>Recent Lessons</h3>
              </div>
              <Link to="/learn/topic" style={{ fontSize: '0.82rem', color: 'var(--primary-light)', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                View All <ChevronRight size={14} />
              </Link>
            </div>

            {lessonsLoading ? (
              <LoadingSpinner message="Loading lessons..." />
            ) : lessons.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>No lessons started yet!</p>
                <Link to="/learn/topic" className="btn-primary" style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}>
                  Start Your First Lesson
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {lessons.slice(0, 4).map((l) => (
                  <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{l.topic}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {l.level} &bull; {l.language || 'English'} &bull; {l.duration_minutes || 20}m
                      </div>
                    </div>
                    <Link to={`/classroom/${l.id}`} className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                      Continue
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Recommendations */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Sparkles size={18} color="var(--accent-amber)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700', margin: 0 }}>Recommended for You</h3>
            </div>

            {recsLoading ? (
              <LoadingSpinner message="Generating recommendations..." />
            ) : recommendations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Complete lessons to receive tailored AI recommendations.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recommendations.slice(0, 3).map((rec, idx) => (
                  <div key={idx} style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text-primary)' }}>{rec.topic}</div>
                      <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{rec.difficulty || 'Recommended'}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: '1.4' }}>
                      {rec.reason || 'Builds on your recent learning progress'}
                    </div>
                    <button 
                      onClick={() => navigate('/learn/topic', { state: { presetTopic: rec.topic } })}
                      className="btn-secondary" 
                      style={{ marginTop: '0.6rem', padding: '0.3rem 0.65rem', fontSize: '0.75rem', width: '100%', justifyContent: 'center' }}
                    >
                      Start Recommended Topic
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Footer Strip */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(6, 182, 212, 0.1))', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700 }}>Want to learn from your own study materials?</h4>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Upload PDFs, Word docs, or slides to generate scoped visual lessons.</p>
            </div>
            <Link to="/materials" className="btn-primary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}>
              Upload Study Material
            </Link>
          </div>
        </div>
      </main>
    </AuthenticatedLayout>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
