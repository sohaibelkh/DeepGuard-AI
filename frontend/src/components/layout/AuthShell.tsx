import React from 'react';
import { Heart, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/landing.css';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({ title, subtitle, children }) => {
  return (
    <div className="auth-page">
      {/* Sidebar — visible on desktop only */}
      <aside className="auth-sidebar">
        <div>
          <Link to="/" className="auth-logo" style={{ textDecoration: 'none' }}>
            <Heart size={26} className="brand-icon" />
            <div className="auth-logo-text">
              <span>CardioAI</span>
              <span>Cardiac Diagnosis Platform</span>
            </div>
          </Link>

          <div className="auth-sidebar-content">
            <h1>Intelligent ECG-based cardiac diagnosis.</h1>
            <p>
              Sign in to upload ECG time-series data, run deep learning analysis,
              and review prediction history and model performance.
            </p>
          </div>
        </div>

        <div className="auth-sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Activity size={14} style={{ color: '#a5c422' }} />
            <span style={{ fontSize: 12, color: '#888' }}>
              Advanced deep learning for time-series cardiac signal analysis.
            </span>
          </div>
          <p>Sessions are protected with short-lived access tokens.</p>
        </div>
      </aside>

      {/* Main form area */}
      <main className="auth-main">
        <div className="auth-form-container">
          {/* Mobile logo */}
          <div style={{ marginBottom: 24 }} className="auth-mobile-logo">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <Heart size={22} style={{ color: '#a5c422' }} />
              <span style={{ fontWeight: 600, fontSize: 15, color: '#393939', fontFamily: 'Poppins, sans-serif' }}>
                CardioAI
              </span>
            </Link>
          </div>

          <div className="auth-form-header">
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>

          <div className="auth-form-card">
            {children}
          </div>
        </div>
      </main>

      <style>{`
        .auth-mobile-logo { display: none; }
        @media (max-width: 992px) {
          .auth-mobile-logo { display: block; }
        }
      `}</style>
    </div>
  );
};
