import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap, BookOpen, Globe, Target, Brain,
  Clock, TrendingUp, Flame, Settings, Plus,
  Award, ChevronRight, BarChart2, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import lessonService from '../services/lessonService';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const LEVEL_COLORS = {
  beginner: 'var(--accent-emerald)',
  intermediate: 'var(--accent-cyan)',
  advanced: 'var(--primary-light)',
  expert: 'var(--accent-amber)',
};

const LEVEL_LABELS = {
  beginner: '🌱 Beginner',
  intermediate: '📈 Intermediate',
  advanced: '🚀 Advanced',
  expert: '⭐ Expert',
};

const EDUCATION_LABELS = {
  middle_school: 'Middle School',
  high_school: 'High School',
  undergraduate: 'Undergraduate',
  graduate: 'Graduate',
  professional: 'Professional',
  self_learner: 'Self Learner',
};

const STYLE_LABELS = {
  socratic: '💬 Socratic',
  explanatory: '📖 Explanatory',
  visual: '🎨 Visual',
  practical: '🛠 Practical',
  mixed: '🔀 Mixed',
};

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);

  const firstName = user?.name?.split(' ')[0] || 'Student';
  const level = profile?.knowledge_level;
  const levelColor = LEVEL_COLORS[level] || 'var(--primary-light)';
  const levelLabel = LEVEL_LABELS[level] || 'Not set';
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  // Load lessons on mount
  useEffect(() => {
    const loadLessons = async () => {
      try {
        setLessonsLoading(true);
        const data = await lessonService.getLessons();
        setLessons(data || []);
      } catch (error) {
        console.error('Error loading lessons:', error);
        setLessons([]);
      } finally {
        setLessonsLoading(false);
      }
    };
    loadLessons();
  }, []);

  // Calculate real stats from persisted database records
  const totalLessons = lessons.length;
  const completedConceptsSet = new Set();
  const conceptProgressList = [];
  let totalScoreSum = 0;
  let scoredLessonsCount = 0;

  lessons.forEach((lesson) => {
    const teachingState =
      typeof lesson.teaching_state === 'string'
        ? JSON.parse(lesson.teaching_state || '{}')
        : lesson.teaching_state || {};

    const lessonPlan =
      typeof lesson.lesson_plan === 'string'
        ? JSON.parse(lesson.lesson_plan || '{}')
        : lesson.lesson_plan || {};

    const completed = teachingState.completedConcepts || [];
    completed.forEach((c) => completedConceptsSet.add(c));

    if (typeof teachingState.understandingScore === 'number' && teachingState.understandingScore > 0) {
      totalScoreSum += teachingState.understandingScore;
      scoredLessonsCount++;
    }

    const concepts = lessonPlan.concepts || [];
    const masteryMap = teachingState.conceptMastery || {};

    concepts.forEach((c) => {
      const title = typeof c === 'object' ? (c.title || c.conceptTitle) : String(c);
      let masteryPct = 0;
      if (masteryMap[title] !== undefined) {
        masteryPct = masteryMap[title];
      } else if (completed.includes(title)) {
        masteryPct = 85;
      }
      conceptProgressList.push({
        title,
        lessonTopic: lesson.topic,
        mastery: Math.min(100, Math.max(0, masteryPct))
      });
    });
  });

  const avgScoreFormatted = scoredLessonsCount > 0
    ? `${Math.round(totalScoreSum / scoredLessonsCount)}%`
    : '—';

  const stats = [
    { icon: <Flame size={20} />, label: 'Day Streak', value: totalLessons > 0 ? '1' : '0', color: 'var(--accent-amber)' },
    { icon: <BookOpen size={20} />, label: 'Lessons', value: String(totalLessons), color: 'var(--accent-cyan)' },
    { icon: <Award size={20} />, label: 'Concepts Mastered', value: String(completedConceptsSet.size), color: 'var(--accent-emerald)' },
    { icon: <TrendingUp size={20} />, label: 'Avg. Score', value: avgScoreFormatted, color: 'var(--primary-light)' },
  ];

  return (
    <div className="dashboard-page">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <GraduationCap size={20} />
          </div>
          <span className="brand-text-gradient">AI Teacher</span>
        </div>

        <nav className="sidebar-nav">
          <button
            id="tab-overview"
            className={`sidebar-link${activeTab === 'overview' ? ' sidebar-link-active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BarChart2 size={18} />
            Overview
          </button>
          <button
            id="tab-lessons"
            className={`sidebar-link${activeTab === 'lessons' ? ' sidebar-link-active' : ''}`}
            onClick={() => setActiveTab('lessons')}
          >
            <BookOpen size={18} />
            Lessons
          </button>
          <button
            id="tab-progress"
            className={`sidebar-link${activeTab === 'progress' ? ' sidebar-link-active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            <TrendingUp size={18} />
            Progress
          </button>
        </nav>

        <div className="sidebar-profile">
          <Link to="/profile/setup" id="sidebar-profile-link" className="sidebar-profile-link">
            <div className="sidebar-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-profile-info">
              <span className="sidebar-profile-name">{user?.name}</span>
              <span className="sidebar-profile-level" style={{ color: levelColor }}>
                {levelLabel}
              </span>
            </div>
            <Settings size={14} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="dashboard-main">
        {/* Top bar */}
        <div className="dashboard-topbar">
          <div>
            <h1 className="dashboard-greeting">
              Good {getTimeOfDay()}, <span className="brand-text-gradient">{firstName}</span> 👋
            </h1>
            <p className="dashboard-date">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Link to="/learn/topic" id="btn-new-lesson" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <Plus size={16} />
            New Lesson
          </Link>
        </div>

        {/* Stats row */}
        <div className="dashboard-stats">
          {stats.map(({ icon, label, value, color }) => (
            <div key={label} className="stat-card">
              <div className="stat-icon" style={{ color, background: `${color}18` }}>
                {icon}
              </div>
              <div className="stat-info">
                <span className="stat-value">{value}</span>
                <span className="stat-label">{label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Content grid */}
        <div className="dashboard-grid">
          {/* Profile Summary Card */}
          <div className="card dashboard-profile-card">
            <div className="card-header">
              <Sparkles size={18} color="var(--primary-light)" />
              <h2>Your Learning Profile</h2>
              <Link to="/profile/setup" className="card-edit-link">Edit</Link>
            </div>
            <div className="profile-info-list">
              <ProfileRow
                icon={<Brain size={15} />}
                label="Level"
                value={levelLabel}
                valueColor={levelColor}
              />
              <ProfileRow
                icon={<GraduationCap size={15} />}
                label="Education"
                value={EDUCATION_LABELS[profile?.education_level] || 'Not set'}
              />
              <ProfileRow
                icon={<Globe size={15} />}
                label="Language"
                value={profile?.preferred_language || 'English'}
              />
              <ProfileRow
                icon={<BookOpen size={15} />}
                label="Style"
                value={STYLE_LABELS[profile?.teaching_style] || 'Not set'}
              />
              <ProfileRow
                icon={<Clock size={15} />}
                label="Daily Time"
                value={profile?.available_time_minutes ? `${profile.available_time_minutes} min` : 'Not set'}
              />
              <ProfileRow
                icon={<Target size={15} />}
                label="Goal"
                value={profile?.learning_goal || 'Not set'}
                multiline
              />
            </div>
            <p className="profile-member-since">Member since {memberSince}</p>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Recent Lessons */}
            <div className="card">
              <div className="card-header">
                <BookOpen size={18} color="var(--accent-cyan)" />
                <h2>Recent Lessons</h2>
              </div>
              {lessonsLoading ? (
                <div style={{ padding: '1rem' }}><LoadingSpinner /></div>
              ) : lessons.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <BookOpen size={32} />
                  </div>
                  <p className="empty-title">No lessons yet</p>
                  <p className="empty-desc">
                    Start your first AI-powered lesson to begin learning.
                  </p>
                  <button
                    onClick={() => navigate('/learn/topic')}
                    className="btn-primary"
                    style={{ marginTop: '1rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                  >
                    <Plus size={14} />
                    Start First Lesson
                  </button>
                </div>
              ) : (
                <div className="lessons-list">
                  {lessons.slice(0, 5).map((lesson) => (
                    <div key={lesson.id} className="lesson-card">
                      <div className="lesson-header">
                        <h3 className="lesson-title">{lesson.topic}</h3>
                        <span className="lesson-level" style={{ background: LEVEL_COLORS[lesson.level?.toLowerCase()] || 'var(--primary-light)' }}>
                          {lesson.level}
                        </span>
                      </div>
                      <p className="lesson-status">{lesson.status || 'created'}</p>
                      <div className="lesson-footer">
                        <span className="lesson-duration">{lesson.duration_minutes} min</span>
                        <button
                          onClick={() => navigate(`/classroom/${lesson.id}`)}
                          className="btn-lesson"
                        >
                          Continue <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Progress Overview */}
            <div className="card">
              <div className="card-header">
                <TrendingUp size={18} color="var(--accent-emerald)" />
                <h2>Progress Overview</h2>
              </div>
              {conceptProgressList.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <BarChart2 size={32} />
                  </div>
                  <p className="empty-title">No progress data yet</p>
                  <p className="empty-desc">
                    Complete lessons to track mastery and see your growth.
                  </p>
                </div>
              ) : (
                <div className="progress-placeholder" style={{ padding: '1rem' }}>
                  {conceptProgressList.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="progress-row" style={{ marginBottom: '0.85rem' }}>
                      <span className="progress-label" style={{ fontWeight: '500', fontSize: '0.85rem' }}>
                        {item.title}
                      </span>
                      <div className="progress-bar-track" style={{ flex: 1, height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${item.mastery}%`,
                            height: '100%',
                            background: item.mastery >= 70
                              ? 'linear-gradient(90deg, #10b981, #059669)'
                              : 'linear-gradient(90deg, #6366f1, #a855f7)',
                            transition: 'width 0.4s ease'
                          }}
                        />
                      </div>
                      <span className="progress-pct" style={{ fontWeight: '600', fontSize: '0.85rem', color: item.mastery >= 70 ? '#10b981' : 'var(--text-secondary)' }}>
                        {item.mastery}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProfileRow({ icon, label, value, valueColor, multiline }) {
  return (
    <div className="profile-row">
      <span className="profile-row-icon" style={{ color: 'var(--text-muted)' }}>{icon}</span>
      <span className="profile-row-label">{label}</span>
      <span
        className={`profile-row-value${multiline ? ' profile-row-value-multiline' : ''}`}
        style={valueColor ? { color: valueColor } : {}}
      >
        {value}
      </span>
    </div>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
