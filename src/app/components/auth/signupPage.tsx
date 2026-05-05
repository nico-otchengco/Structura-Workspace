import React, { useState } from 'react';
import { useAuth } from '../../../context/authContext';
import '@/styles/style.css';

interface SignupPageProps {
  onSwitchToLogin: () => void;
  onGoHome: () => void;
}

export function SignupPage({ onSwitchToLogin, onGoHome }: SignupPageProps) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    const result = await signUp(email, password, name);
    if (result.error) { setError(result.error); setLoading(false); }
  };

  return (
    <>
      <div className="auth-root">
        <div className="auth-grid" />
        <div className="auth-orb" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-box">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="white">
                <path d="M2 2h5v5H2zm7 0h5v5H9zM2 9h5v5H2zm7 0h5v5H9z"/>
              </svg>
            </div>
            <span className="auth-logo-name" onClick={onGoHome} style={{ cursor: 'pointer' }}>Structura</span>
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-sub">Start managing your projects today</p>
          <div className="auth-divider" />
          <form onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}
            <div className="auth-field">
              <label className="auth-label" htmlFor="name">Full Name</label>
              <input
                id="name" type="text" className="auth-input"
                placeholder="John Doe" value={name}
                onChange={e => setName(e.target.value)} required
              />
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="email">Email</label>
              <input
                id="email" type="email" className="auth-input"
                placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} required
              />
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="password">Password</label>
              <input
                id="password" type="password" className="auth-input"
                placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} required
              />
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword" type="password" className="auth-input"
                placeholder="••••••••" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)} required
              />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
            <div className="auth-switch">
              Already have an account?{' '}
              <button type="button" className="auth-switch-btn" onClick={onSwitchToLogin}>
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}