import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { API_BASE } from '../services/api';
import { AuthUser } from '../types';

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAppStore();
  const [email, setEmail] = useState('client@wms.demo');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const user: AuthUser = await res.json();
      setUser(user);
      navigate(user.onboarding_complete ? '/dashboard' : '/onboarding');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ maxWidth: '420px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-primary)' }}>Wealth Management System</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Personal Wealth Management Platform</p>
        </div>

        {error && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: '8px', fontSize: '0.875rem', color: '#e63946' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>Email</label>
            <input
              type="email" className="form-input"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com" required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>Password</label>
            <input
              type="password" className="form-input"
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: '0.5rem', padding: '0.875rem', background: loading ? 'rgba(99,102,241,0.5)' : 'var(--accent-primary)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Demo Credentials:</strong><br />
          Client: <code>client@wms.demo</code> / <code>demo1234</code><br />
          Advisor: <code>advisor@wms.demo</code> / <code>demo1234</code>
        </div>

        <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>Create Account</Link>
        </p>

        <p style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6 }}>
          Advisory simulation only. Not financial advice. For demonstration purposes only.
        </p>
      </div>
    </div>
  );
}
