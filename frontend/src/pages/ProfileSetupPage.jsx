import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, BookOpen, Globe, Target, Brain,
  Clock, CheckCircle, ChevronRight, AlertCircle, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';

const EDUCATION_LEVELS = [
  { value: 'middle_school', label: 'Middle School' },
  { value: 'high_school', label: 'High School' },
  { value: 'undergraduate', label: 'Undergraduate' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'professional', label: 'Professional' },
  { value: 'self_learner', label: 'Self Learner' },
];

const KNOWLEDGE_LEVELS = [
  { value: 'beginner', label: '🌱 Beginner', desc: 'Just starting out' },
  { value: 'intermediate', label: '📈 Intermediate', desc: 'Some experience' },
  { value: 'advanced', label: '🚀 Advanced', desc: 'Solid foundation' },
  { value: 'expert', label: '⭐ Expert', desc: 'Deep expertise' },
];

const TEACHING_STYLES = [
  { value: 'socratic', label: '💬 Socratic', desc: 'Learn through questions' },
  { value: 'explanatory', label: '📖 Explanatory', desc: 'Clear explanations' },
  { value: 'visual', label: '🎨 Visual', desc: 'Diagrams & examples' },
  { value: 'practical', label: '🛠 Practical', desc: 'Hands-on exercises' },
  { value: 'mixed', label: '🔀 Mixed', desc: 'Variety of methods' },
];

const LANGUAGES = [
  'English', 'Hindi', 'Spanish', 'French', 'German',
  'Chinese', 'Japanese', 'Arabic', 'Portuguese'
];

const TIME_OPTIONS = [
  { value: 15, label: '15 min / day' },
  { value: 30, label: '30 min / day' },
  { value: 60, label: '1 hour / day' },
  { value: 90, label: '1.5 hours / day' },
  { value: 120, label: '2 hours / day' },
  { value: 180, label: '3+ hours / day' },
];

export default function ProfileSetupPage() {
  const { user, profile, hasProfile, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    education_level: '',
    knowledge_level: '',
    preferred_language: 'English',
    learning_goal: '',
    teaching_style: '',
    available_time_minutes: 30,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  // Pre-fill form if profile already exists
  useEffect(() => {
    const prefs = profile?.preferences || profile || {};
    if (prefs) {
      setForm({
        education_level: prefs.education_level || '',
        knowledge_level: prefs.knowledge_level || '',
        preferred_language: prefs.preferred_language || 'English',
        learning_goal: prefs.learning_goal || '',
        teaching_style: prefs.teaching_style || '',
        available_time_minutes: prefs.available_time_minutes || 30,
      });
    }
  }, [profile]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSelect = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.knowledge_level) {
      setError('Please select your knowledge level.');
      return;
    }

    setSaving(true);
    const res = await profileService.updateProfile(form);
    setSaving(false);

    if (res.ok && res.data) {
      updateProfile({
        ...res.data,
        profile_completed: true,
        preferences: {
          ...(res.data.preferences || res.data),
          profile_completed: true
        }
      });
      setSaved(true);
      setTimeout(() => navigate('/dashboard', { replace: true }), 800);
    } else {
      setError(res.message || 'Failed to save profile. Please try again.');
    }
  };

  return (
    <div className="setup-page">
      <div className="setup-container">
        {/* Header */}
        <div className="setup-header" style={{ position: 'relative' }}>
          {hasProfile && (
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => navigate('/dashboard')}
              style={{ position: 'absolute', right: 0, top: 0, padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
            >
              &larr; Back to Dashboard
            </button>
          )}
          <div className="setup-logo">
            <Sparkles size={22} />
          </div>
          <h1 className="setup-title">
            {hasProfile ? 'Edit Learning Preferences' : <>Welcome, <span className="brand-text-gradient">{user?.name?.split(' ')[0]}!</span></>}
          </h1>
          <p className="setup-subtitle">
            {hasProfile 
              ? 'Update your study goals, teaching style, and knowledge level anytime.' 
              : 'Let\'s personalize your learning experience. This takes about 2 minutes.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          {/* Error */}
          {error && (
            <div className="auth-alert" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Education Level */}
          <div className="setup-section">
            <div className="setup-section-header">
              <GraduationCap size={18} color="var(--primary-light)" />
              <h2 className="setup-section-title">Education Level</h2>
            </div>
            <select
              id="education-level"
              className="form-select"
              value={form.education_level}
              onChange={handleChange('education_level')}
            >
              <option value="">Select your education level</option>
              {EDUCATION_LEVELS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Section 2: Knowledge Level */}
          <div className="setup-section">
            <div className="setup-section-header">
              <Brain size={18} color="var(--accent-cyan)" />
              <h2 className="setup-section-title">Current Knowledge Level <span className="setup-required">*</span></h2>
            </div>
            <div className="option-grid">
              {KNOWLEDGE_LEVELS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  id={`knowledge-${value}`}
                  className={`option-card${form.knowledge_level === value ? ' option-card-selected' : ''}`}
                  onClick={() => handleSelect('knowledge_level', value)}
                >
                  <span className="option-card-label">{label}</span>
                  <span className="option-card-desc">{desc}</span>
                  {form.knowledge_level === value && (
                    <CheckCircle size={14} className="option-check" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Teaching Style */}
          <div className="setup-section">
            <div className="setup-section-header">
              <BookOpen size={18} color="var(--accent-emerald)" />
              <h2 className="setup-section-title">Preferred Teaching Style</h2>
            </div>
            <div className="option-grid">
              {TEACHING_STYLES.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  id={`style-${value}`}
                  className={`option-card${form.teaching_style === value ? ' option-card-selected' : ''}`}
                  onClick={() => handleSelect('teaching_style', value)}
                >
                  <span className="option-card-label">{label}</span>
                  <span className="option-card-desc">{desc}</span>
                  {form.teaching_style === value && (
                    <CheckCircle size={14} className="option-check" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Preferred Language */}
          <div className="setup-section">
            <div className="setup-section-header">
              <Globe size={18} color="var(--accent-amber)" />
              <h2 className="setup-section-title">Preferred Language</h2>
            </div>
            <div className="language-grid">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  id={`lang-${lang.toLowerCase()}`}
                  className={`lang-chip${form.preferred_language === lang ? ' lang-chip-selected' : ''}`}
                  onClick={() => handleSelect('preferred_language', lang)}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Section 5: Learning Goal */}
          <div className="setup-section">
            <div className="setup-section-header">
              <Target size={18} color="var(--accent-rose)" />
              <h2 className="setup-section-title">Learning Goal</h2>
            </div>
            <textarea
              id="learning-goal"
              className="form-textarea"
              value={form.learning_goal}
              onChange={handleChange('learning_goal')}
              placeholder="What do you want to achieve? e.g., 'Master Python for data science', 'Understand calculus for engineering'"
              rows={3}
            />
          </div>

          {/* Section 6: Available Time */}
          <div className="setup-section">
            <div className="setup-section-header">
              <Clock size={18} color="var(--primary-light)" />
              <h2 className="setup-section-title">Daily Learning Time</h2>
            </div>
            <div className="time-grid">
              {TIME_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  id={`time-${value}`}
                  className={`time-chip${Number(form.available_time_minutes) === value ? ' time-chip-selected' : ''}`}
                  onClick={() => handleSelect('available_time_minutes', value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            id="btn-save-profile"
            type="submit"
            className={`btn-primary setup-submit${saved ? ' setup-submit-success' : ''}`}
            disabled={saving || saved}
          >
            {saved ? (
              <>
                <CheckCircle size={18} />
                Profile Saved! Redirecting...
              </>
            ) : saving ? (
              <>
                <span className="btn-spinner" />
                Saving...
              </>
            ) : (
              <>
                Start Learning
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
