import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Terminal,
  Activity,
  Server,
  FileCheck2,
  Clock,
  Radio,
} from 'lucide-react';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminHint, setAdminHint] = useState('shettyraghavendra37@gmail.edu');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    fetch('/api/auth/admin-hint')
      .then((r) => r.json())
      .then((data) => {
        if (data.email) {
          setAdminHint(data.email);
        }
      })
      .catch(() => {});
  }, []);

  const handleAdminLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setError('Please provide administrative ID and master password.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const user = await login(email, password);

      if (user.role !== 'admin') {
        setError(
          `ACCESS DENIED: Account "${user.email}" possesses "${user.role.toUpperCase()}" privileges only. Administrative clearance is required.`
        );
        return;
      }

      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication rejected: Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdminMasterKey = () => {
    setEmail(adminHint);
    setPassword('Raghu@123');
    setError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#070a12',
        backgroundImage: `
          radial-gradient(at 10% 15%, rgba(236, 72, 153, 0.12) 0px, transparent 40%),
          radial-gradient(at 90% 85%, rgba(99, 102, 241, 0.15) 0px, transparent 45%),
          linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 100% 100%, 30px 30px, 30px 30px',
        color: '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Dedicated Executive Top Bar */}
      <header
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(11, 15, 25, 0.85)',
          backdropFilter: 'blur(16px)',
          padding: '0.85rem 2rem',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(236, 72, 153, 0.5)',
              }}
            >
              <ShieldCheck size={18} color="#fff" />
            </div>
            <div>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                SMARTQ CAMPUS
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#f472b6',
                  marginLeft: '8px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  background: 'rgba(236, 72, 153, 0.15)',
                  borderRadius: '4px',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                }}
              >
                Admin Gateway
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                color: '#34d399',
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '4px 10px',
                borderRadius: '9999px',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }}
              />
              <span>OPERATIONAL STATUS: NORMAL</span>
            </div>

            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                padding: '5px 12px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.2s',
              }}
            >
              <ArrowLeft size={14} />
              <span>Student & Staff Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Dual-Column Command Center Container */}
      <main
        style={{
          flex: 1,
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          padding: '3rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 0.9fr',
            gap: '3rem',
            width: '100%',
            alignItems: 'center',
          }}
        >
          {/* Left Column: Governance & System Status Briefing */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(236, 72, 153, 0.12)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                padding: '4px 12px',
                borderRadius: '9999px',
                color: '#f472b6',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '1.25rem',
              }}
            >
              <Radio size={14} />
              <span>High-Clearance Administrative Hub</span>
            </div>

            <h1
              style={{
                fontSize: '2.5rem',
                fontWeight: 900,
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                marginBottom: '1rem',
                background: 'linear-gradient(135deg, #ffffff 40%, #f472b6 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              College Operations & Queue Governance Console
            </h1>

            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '1rem',
                lineHeight: 1.6,
                marginBottom: '2rem',
              }}
            >
              Secure management system for College Principals, Academic Deans, Examination
              Superintendents, and Accounts Officers. Monitor live queues, reassign counter personnel,
              and analyze student service performance.
            </p>

            {/* Live Telemetry / Diagnostics Deck */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '2rem',
              }}
            >
              <div
                style={{
                  background: 'rgba(17, 24, 39, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                }}
              >
                <Server size={18} color="#818cf8" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Engine Cluster
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f3f4f6' }}>
                    MongoDB High-Throughput
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(17, 24, 39, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                }}
              >
                <Activity size={18} color="#34d399" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Queue Protocol
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f3f4f6' }}>
                    FIFO Atomic Sequences
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(17, 24, 39, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                }}
              >
                <Clock size={18} color="#fbbf24" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Campus Timezone
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f3f4f6' }}>
                    Asia/Kolkata (IST)
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(17, 24, 39, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                }}
              >
                <FileCheck2 size={18} color="#ec4899" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Audit Records
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f3f4f6' }}>
                    Service Duration Logged
                  </div>
                </div>
              </div>
            </div>

            {/* Official Security Disclaimer */}
            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                borderLeft: '2px solid rgba(236, 72, 153, 0.5)',
                paddingLeft: '0.85rem',
              }}
            >
              ⚠️ <strong>Authorized Access Only</strong>: Under College Information Security Guidelines,
              all configuration modifications and status updates are tracked. Unauthorized login attempts
              are recorded with origin IP.
            </div>
          </div>

          {/* Right Column: Terminal Authentication Console */}
          <div>
            <div
              style={{
                background: 'linear-gradient(145deg, rgba(20, 24, 39, 0.95) 0%, rgba(13, 16, 27, 0.98) 100%)',
                border: '1px solid rgba(236, 72, 153, 0.35)',
                borderRadius: '24px',
                padding: '2.5rem',
                boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.8), 0 0 35px rgba(236, 72, 153, 0.15)',
                position: 'relative',
              }}
            >
              {/* Terminal Title Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingBottom: '1.25rem',
                  marginBottom: '1.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={18} color="#f472b6" />
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#f3f4f6',
                      letterSpacing: '0.04em',
                    }}
                  >
                    AUTH_GATEWAY // PROD_NODE
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    color: '#f472b6',
                    background: 'rgba(236, 72, 153, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  SEC_LEVEL_4
                </div>
              </div>

              {error && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    color: '#fca5a5',
                    fontSize: '0.85rem',
                    lineHeight: 1.4,
                  }}
                >
                  <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label
                    className="form-label"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      color: '#d1d5db',
                      letterSpacing: '0.03em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Administrator Identifier / Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="admin@college.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        paddingLeft: '2.75rem',
                        background: '#0c101d',
                        borderColor: 'rgba(255, 255, 255, 0.12)',
                        color: '#fff',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.9rem',
                      }}
                      required
                    />
                    <Mail
                      size={18}
                      color="#f472b6"
                      style={{
                        position: 'absolute',
                        left: '0.9rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                  <label
                    className="form-label"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      color: '#d1d5db',
                      letterSpacing: '0.03em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Master Cryptographic Passkey
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        paddingLeft: '2.75rem',
                        background: '#0c101d',
                        borderColor: 'rgba(255, 255, 255, 0.12)',
                        color: '#fff',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.9rem',
                      }}
                      required
                    />
                    <Lock
                      size={18}
                      color="#f472b6"
                      style={{
                        position: 'absolute',
                        left: '0.9rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                    boxShadow: '0 4px 20px rgba(236, 72, 153, 0.4)',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    fontSize: '0.9rem',
                  }}
                  disabled={loading}
                >
                  {loading ? 'Authenticating Security Token...' : 'Enter Administrator Console'}
                  {!loading && <ArrowRight size={17} />}
                </button>
              </form>

              {/* Instant 1-Click Master Key Button */}
              <div
                style={{
                  marginTop: '1.75rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    marginBottom: '0.75rem',
                    letterSpacing: '0.05em',
                  }}
                >
                  EVALUATION / QUICK SIGN-IN
                </div>
                <button
                  type="button"
                  onClick={fillAdminMasterKey}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(236, 72, 153, 0.1)',
                    border: '1px dashed rgba(236, 72, 153, 0.4)',
                    borderRadius: '10px',
                    color: '#f472b6',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(236, 72, 153, 0.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(236, 72, 153, 0.1)')}
                >
                  <KeyRound size={16} />
                  <span>Insert Master Admin Key ({adminHint})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '1.25rem 2rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
        }}
      >
        SmartQ Campus Administrative Operating Environment • College Queue Authority
      </footer>
    </div>
  );
};

export default AdminLoginPage;
