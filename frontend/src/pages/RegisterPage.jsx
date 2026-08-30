import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, User, UserPlus, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FormInput from '../components/ui/FormInput';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { register, authError, setAuthError } = useAuth();
  const navigate = useNavigate();

  const passwordStrength = (pwd) => {
    if (pwd.length === 0) return null;
    if (pwd.length < 6) return 'weak';
    if (pwd.length < 10) return 'medium';
    return 'strong';
  };

  const strength = passwordStrength(password);

  const validate = () => {
    const errs = {};
    if (!name.trim() || name.trim().length < 2) errs.name = 'Name must be at least 2 characters.';
    if (!email.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    setSubmitting(true);
    const result = await register(name, email, password);
    setSubmitting(false);

    if (result.success) {
      navigate('/profile/setup', { replace: true });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />

      <div className="auth-card" style={{ maxWidth: '420px' }}>
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">
            <GraduationCap size={28} />
          </div>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Start your personalized AI learning experience</p>
        </div>

        {/* Global error */}
        {authError && (
          <div className="auth-alert" role="alert">
            <AlertCircle size={16} />
            <span>{authError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <FormInput
            id="register-name"
            label="Full name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            error={errors.name}
            required
          />

          <FormInput
            id="register-email"
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email}
            required
          />

          <div style={{ position: 'relative' }}>
            <FormInput
              id="register-password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              error={errors.password}
              hint={!errors.password && strength ? undefined : undefined}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>

            {/* Password strength bar */}
            {password && (
              <div className="password-strength">
                <div className={`strength-bar strength-${strength}`} />
                <span className={`strength-label strength-label-${strength}`}>
                  {strength === 'weak' ? '⚠ Weak' : strength === 'medium' ? '◑ Medium' : '✓ Strong'}
                </span>
              </div>
            )}
          </div>

          <FormInput
            id="register-confirm-password"
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your password"
            autoComplete="new-password"
            error={errors.confirmPassword}
            required
          />

          <button
            id="btn-register-submit"
            type="submit"
            className="btn-primary auth-submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="btn-spinner" />
                Creating account...
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Features teaser */}
        <div className="auth-features">
          {['Personalized AI tutoring', 'Adaptive learning paths', 'Progress tracking'].map((feat) => (
            <div key={feat} className="auth-feature-item">
              <CheckCircle size={14} color="var(--accent-emerald)" />
              <span>{feat}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" id="link-to-login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
