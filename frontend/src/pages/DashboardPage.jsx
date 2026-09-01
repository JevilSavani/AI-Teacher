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
import Sidebar from '../components/Sidebar';

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
    <div className="dashboard-page" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Shared Sidebar */}
      <Sidebar activeRoute="/dashboard" />

      {/* Main content */}
      <main className="dashboard-main" style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Top bar */}
        <div className="dashboard-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 className="dashboard-greeting" style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0 }}>
              Good {getTimeOfDay()}, <span className="brand-text-gradient">{firstName}</span> 👋
            </h1>
            <p className="dashboard-date" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Link to="/learn/topic" id="btn-new-lesson" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <Plus size={16} />
            Generate Course
          </Link>
        </div>

        {/* Stats row */}
        <div className="dashboard-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          {stats.map(({ icon, label, value, color }) => (
            <div key={label} className="stat-card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="stat-icon" style={{ width: '42px', height: '42px', borderRadius: '10px', color, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
              </div>
              <div className="stat-info">
                <span className="stat-value" style={{ fontSize: '1.35rem', fontWeight: '800', display: 'block', color: 'var(--text-primary)' }}>{value}</span>
                <span className="stat-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Content grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {/* Left Column: Recent Lessons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookOpen size={18} color="var(--accent-cyan)" />
                  <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Recent Lessons</h2>
                </div>
                <Link to="/learn/topic" style={{ fontSize: '0.85rem', color: 'var(--primary-light)', textDecoration: 'none', fontWeight: '600' }}>
                  View All
                </Link>
              </div>

              {lessonsLoading ? (
                <div style={{ padding: '2rem' }}><LoadingSpinner /></div>
              ) : lessons.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
                  <p className="empty-title" style={{ fontWeight: '700', marginBottom: '0.5rem' }}>No active lessons</p>
                  <p className="empty-desc" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    Generate your first AI-powered lesson to begin learning.
                  </p>
                  <button onClick={() => navigate('/learn/topic')} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    <Plus size={14} /> Start First Lesson
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {lessons.slice(0, 4).map((lesson) => (
                    <div key={lesson.id} style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: '700', margin: '0 0 0.25rem', color: 'var(--text-primary)' }}>{lesson.topic}</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {lesson.level} &bull; {lesson.duration_minutes} min
                        </span>
                      </div>
                      <button onClick={() => navigate(`/classroom/${lesson.id}`)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        Continue <ChevronRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Recommended for You & Compact Progress Link */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Recommended for You */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Sparkles size={18} color="var(--primary-light)" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Recommended for You</h2>
              </div>

              {recsLoading ? (
                <div style={{ padding: '1.5rem' }}><LoadingSpinner /></div>
              ) : recommendations.length === 0 ? (
                <div className="empty-state" style={{ padding: '1.5rem', textAlign: 'center' }}>
                  <p className="empty-title" style={{ fontSize: '0.9rem' }}>No recommendations yet</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {recommendations.slice(0, 2).map((rec) => (
                    <div key={rec.id} style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--primary-light)' }}>{rec.recommendation}</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{rec.reason}</p>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                        <button onClick={() => navigate(rec.link || `/classroom/${rec.lessonId}`)} className="btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          {rec.actionLabel || 'Start Practice'} <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Compact Progress Summary Card */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={18} color="#10b981" />
                  <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Progress Summary</h2>
                </div>
                <Link to="/progress" style={{ fontSize: '0.85rem', color: 'var(--primary-light)', fontWeight: '600', textDecoration: 'none' }}>
                  Full Report &rarr;
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Accuracy Rate</span>
                  <span style={{ fontWeight: '700', color: '#10b981' }}>{analytics?.accuracyRate || 0}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Mastered Concepts</span>
                  <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{analytics?.completedConceptsCount || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Weak Concepts</span>
                  <span style={{ fontWeight: '700', color: '#f43f5e' }}>{analytics?.weakConcepts?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
