import React, { useState, useEffect } from 'react';
import { queueAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import TokenBadge from '../components/TokenBadge';
import {
  Ticket,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  XCircle,
  CheckCircle,
  Sparkles,
  RefreshCw,
  Bell,
} from 'lucide-react';

const MyTokensPage = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModalToken, setCancelModalToken] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { lastQueueEvent, joinService, leaveService } = useSocket();

  const fetchMyTokens = async () => {
    try {
      setError('');
      const res = await queueAPI.getMyTokens();
      setTokens(res.data.tokens || []);
    } catch (err) {
      setError(err.message || 'Error fetching your tokens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTokens();
  }, []);

  // Listen to live queue updates from Socket.IO
  useEffect(() => {
    if (lastQueueEvent) {
      fetchMyTokens();
    }
  }, [lastQueueEvent]);

  // Join rooms for any active token services
  useEffect(() => {
    tokens.forEach((t) => {
      if (['waiting', 'called', 'serving'].includes(t.status) && t.service?._id) {
        joinService(t.service._id);
      }
    });

    return () => {
      tokens.forEach((t) => {
        if (t.service?._id) {
          leaveService(t.service._id);
        }
      });
    };
  }, [tokens]);

  const handleCancelToken = async (e) => {
    e.preventDefault();
    if (!cancelModalToken) return;

    try {
      setCancelling(true);
      setError('');
      await queueAPI.cancelToken(cancelModalToken._id, cancelReason);
      setMessage(`Token ${cancelModalToken.tokenNumber} was cancelled successfully`);
      setCancelModalToken(null);
      setCancelReason('');
      fetchMyTokens();
    } catch (err) {
      setError(err.message || 'Failed to cancel token');
    } finally {
      setCancelling(false);
    }
  };

  const activeTokens = tokens.filter((t) => ['waiting', 'called', 'serving'].includes(t.status));
  const pastTokens = tokens.filter((t) => !['waiting', 'called', 'serving'].includes(t.status));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Queue Tokens</h1>
          <p className="page-subtitle">Track your digital token position and estimated waiting time in real time</p>
        </div>
        <button
          onClick={fetchMyTokens}
          className="btn btn-secondary btn-sm"
          style={{ gap: '0.4rem' }}
        >
          <RefreshCw size={14} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {message && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Active Tokens Hero Section */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="#818cf8" />
          <span>Active Bookings for Today</span>
        </h2>

        {loading ? (
          <div style={{ padding: '2rem 0', color: 'var(--text-secondary)' }}>Loading your tokens...</div>
        ) : activeTokens.length === 0 ? (
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Ticket size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
            <h3>No Active Tokens in Line</h3>
            <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
              You don't have any waiting or called tokens right now.
            </p>
          </div>
        ) : (
          <div className="grid-cols-2">
            {activeTokens.map((t) => {
              const isCalled = t.status === 'called';
              const isServing = t.status === 'serving';

              return (
                <div
                  key={t._id}
                  className="card"
                  style={{
                    border: isCalled
                      ? '1px solid rgba(245, 158, 11, 0.6)'
                      : isServing
                      ? '1px solid rgba(16, 185, 129, 0.6)'
                      : '1px solid rgba(99, 102, 241, 0.3)',
                    background: isCalled
                      ? 'rgba(245, 158, 11, 0.08)'
                      : isServing
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'var(--bg-card)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {isCalled && (
                    <div
                      style={{
                        background: '#f59e0b',
                        color: '#000',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '0.3rem 0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderRadius: '0 0 var(--radius-md) 0',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                      }}
                    >
                      <Bell size={13} />
                      YOUR TURN! PLEASE PROCEED TO COUNTER
                    </div>
                  )}

                  <div style={{ marginTop: isCalled ? '1.5rem' : '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {t.service?.name}
                        </span>
                        <div
                          style={{
                            fontSize: '2.4rem',
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: '-0.02em',
                            color: isCalled ? '#fde68a' : isServing ? '#6ee7b7' : '#fff',
                            lineHeight: 1.1,
                            margin: '0.35rem 0',
                          }}
                        >
                          {t.tokenNumber}
                        </div>
                      </div>
                      <TokenBadge status={t.status} />
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.75rem',
                        padding: '0.85rem',
                        background: 'rgba(0,0,0,0.25)',
                        borderRadius: 'var(--radius-md)',
                        margin: '1.25rem 0',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>QUEUE POSITION</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#93c5fd' }}>
                          {isServing
                            ? 'At Counter'
                            : isCalled
                            ? 'Called to Counter'
                            : t.peopleAhead === 0
                            ? 'Next in line!'
                            : `${t.peopleAhead} ahead of you`}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ESTIMATED WAIT</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fde68a' }}>
                          {isServing ? 'In Service' : isCalled ? 'Ready now' : `~${t.estimatedWaitMinutes} mins`}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                      <MapPin size={16} color="#818cf8" />
                      <span>{t.service?.counterLocation || 'Main Office'}</span>
                    </div>

                    {t.notes && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem', fontStyle: 'italic' }}>
                        Note: "{t.notes}"
                      </p>
                    )}

                    {/* Actions: Cancel if waiting or called */}
                    {['waiting', 'called'].includes(t.status) && (
                      <button
                        onClick={() => setCancelModalToken(t)}
                        className="btn btn-danger btn-sm"
                        style={{ width: '100%' }}
                      >
                        <XCircle size={15} />
                        <span>Cancel Token</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Tokens History Table */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Token History</h2>
        {pastTokens.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No past token history yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Token #</th>
                  <th>Service Counter</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Served By</th>
                  <th>Completed At</th>
                </tr>
              </thead>
              <tbody>
                {pastTokens.map((tok) => (
                  <tr key={tok._id}>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{tok.tokenNumber}</td>
                    <td>{tok.service?.name || 'N/A'}</td>
                    <td>{tok.dateKey}</td>
                    <td><TokenBadge status={tok.status} /></td>
                    <td>{tok.servedBy?.name || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {tok.completedAt ? new Date(tok.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModalToken && (
        <div className="modal-overlay" onClick={() => setCancelModalToken(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <XCircle size={22} color="#f87171" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Cancel Queue Token</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Token {cancelModalToken.tokenNumber} ({cancelModalToken.service?.name})
                </p>
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Are you sure you want to surrender your spot in line? This action is permanent and cannot be undone.
            </p>

            <form onSubmit={handleCancelToken}>
              <div className="form-group">
                <label className="form-label">Reason for cancellation (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Schedule clash or issue resolved"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setCancelModalToken(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Keep Spot
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  disabled={cancelling}
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTokensPage;
