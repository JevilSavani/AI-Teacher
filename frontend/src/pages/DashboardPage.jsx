import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, BookOpen, Globe, Target, Brain,
  Clock, TrendingUp, Flame, Settings, Plus,
  Award, ChevronRight, BarChart2, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  const [activeTab, setActiveTab] = useState('overview');

  const firstName = user?.name?.split(' ')[0] || 'Student';
  const level = profile?.knowledge_level;
  const levelColor = LEVEL_COLORS[level] || 'var(--primary-light)';
  const levelLabel = LEVEL_LABELS[level] || 'Not set';
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  // Placeholder stats
  const stats = [
    { icon: <Flame size={20} />, label: 'Day Streak', value: '0', color: 'var(--accent-amber)' },
    { icon: <BookOpen size={20} />, label: 'Lessons', value: '0', color: 'var(--accent-cyan)' },
    { icon: <Award size={20} />, label: 'Concepts Mastered', value: '0', color: 'var(--accent-emerald)' },
    { icon: <TrendingUp size={20} />, label: 'Avg. Score', value: '—', color: 'var(--primary-light)' },
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
          <button id="btn-new-lesson" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} />
            New Lesson
          </button>
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
              <div className="empty-state">
                <div className="empty-icon">
                  <BookOpen size={32} />
                </div>
                <p className="empty-title">No lessons yet</p>
                <p className="empty-desc">
                  Start your first AI-powered lesson to begin learning.
                </p>
                <button id="btn-start-first-lesson" className="btn-primary" style={{ marginTop: '1rem', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                  <Plus size={14} />
                  Start First Lesson
                </button>
              </div>
            </div>

            {/* Progress Overview */}
            <div className="card">
              <div className="card-header">
                <TrendingUp size={18} color="var(--accent-emerald)" />
                <h2>Progress Overview</h2>
              </div>
              <div className="empty-state">
                <div className="empty-icon">
                  <BarChart2 size={32} />
                </div>
                <p className="empty-title">No progress data yet</p>
                <p className="empty-desc">
                  Complete lessons to track mastery and see your growth.
                </p>
              </div>

              {/* Placeholder progress bars */}
              <div className="progress-placeholder">
                {['Core Concepts', 'Applied Skills', 'Problem Solving'].map((topic) => (
                  <div key={topic} className="progress-row">
                    <span className="progress-label">{topic}</span>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: '0%' }} />
                    </div>
                    <span className="progress-pct">0%</span>
                  </div>
                ))}
              </div>
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
