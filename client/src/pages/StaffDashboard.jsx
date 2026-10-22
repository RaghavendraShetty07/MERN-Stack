import React, { useState, useEffect } from 'react';
import { serviceAPI, queueAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import TokenBadge from '../components/TokenBadge';
import confetti from 'canvas-confetti';
import {
  UserCheck,
  PhoneCall,
  Play,
  CheckCircle,
  SkipForward,
  RotateCcw,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Volume2,
} from 'lucide-react';

const StaffDashboard = () => {
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [queueStatus, setQueueStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { lastQueueEvent, joinService, leaveService } = useSocket();

  // Load services list
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await serviceAPI.getAll();
        const activeServices = res.data.services || [];
        setServices(activeServices);
        if (activeServices.length > 0 && !selectedServiceId) {
          setSelectedServiceId(activeServices[0]._id);
        }
      } catch (err) {
        setError('Failed to fetch services: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Fetch status of currently selected service
  const fetchStatus = async () => {
    if (!selectedServiceId) return;
    try {
      setError('');
      const res = await queueAPI.getServiceStatus(selectedServiceId);
      setQueueStatus(res.data);
    } catch (err) {
      setError(err.message || 'Error fetching queue status');
    }
  };

  useEffect(() => {
    if (selectedServiceId) {
      fetchStatus();
      joinService(selectedServiceId);
    }
    return () => {
      if (selectedServiceId) {
        leaveService(selectedServiceId);
      }
    };
  }, [selectedServiceId]);

  // Real-time update from Socket.IO
  useEffect(() => {
    if (lastQueueEvent && (!lastQueueEvent.serviceId || lastQueueEvent.serviceId === selectedServiceId)) {
      fetchStatus();
    }
  }, [lastQueueEvent]);

  // Live timer for currently serving token
  useEffect(() => {
    let interval = null;
    if (queueStatus?.currentlyServing?.startedAt) {
      const startTime = new Date(queueStatus.currentlyServing.startedAt).getTime();
      interval = setInterval(() => {
        const secs = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
        setElapsedSeconds(secs);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [queueStatus?.currentlyServing]);

  const handleCallNext = async () => {
    try {
      setActionLoading(true);
      setError('');
      setMessage('');
      const res = await queueAPI.callNext(selectedServiceId);
      setMessage(`Called token ${res.data.token.tokenNumber}`);
      await fetchStatus();
    } catch (err) {
      setError(err.message || 'Error calling next token');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartService = async (tokenId) => {
    try {
      setActionLoading(true);
      setError('');
      setMessage('');
      const res = await queueAPI.startService(tokenId);
      setMessage(`Started service for token ${res.data.token.tokenNumber}`);
      await fetchStatus();
    } catch (err) {
      setError(err.message || 'Error starting service');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteService = async (tokenId) => {
    try {
      setActionLoading(true);
      setError('');
      setMessage('');
      const res = await queueAPI.completeService(tokenId);

      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
      });

      setMessage(`Completed token ${res.data.token.tokenNumber} in ${res.data.durationSeconds}s`);
      await fetchStatus();
    } catch (err) {
      setError(err.message || 'Error completing service');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkipToken = async (tokenId) => {
    try {
      setActionLoading(true);
      setError('');
      setMessage('');
      const res = await queueAPI.skipToken(tokenId);
      setMessage(`Skipped token ${res.data.token.tokenNumber}`);
      await fetchStatus();
    } catch (err) {
      setError(err.message || 'Error skipping token');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecallToken = async (tokenId) => {
    try {
      setActionLoading(true);
      setError('');
      setMessage('');
      const res = await queueAPI.recallToken(tokenId);
      setMessage(`Recalled token ${res.data.token.tokenNumber} to counter`);
      await fetchStatus();
    } catch (err) {
      setError(err.message || 'Error recalling token');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentServing = queueStatus?.currentlyServing;
  const currentCalled = queueStatus?.currentlyCalled && queueStatus.currentlyCalled.length > 0 ? queueStatus.currentlyCalled[0] : null;
  const currentActiveToken = currentServing || currentCalled;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Counter Desk</h1>
          <p className="page-subtitle">Process students, call digital tokens, and record service durations</p>
        </div>

        {/* Counter Service Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Service Counter:
          </label>
          <select
            className="form-select"
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            style={{ width: 'auto', minWidth: '240px', fontWeight: 600 }}
          >
            {services.map((svc) => (
              <option key={svc._id} value={svc._id}>
                {svc.prefix} — {svc.name}
              </option>
            ))}
          </select>
          <button onClick={fetchStatus} className="btn btn-secondary btn-sm" title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
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

      {/* KPI Overview Pills */}
      {queueStatus && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            marginBottom: '1.75rem',
          }}
        >
          <div className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Waiting In Queue</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#93c5fd' }}>{queueStatus.waitingCount || 0}</div>
          </div>
          <div className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Now Serving</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: currentServing ? '#6ee7b7' : 'var(--text-muted)' }}>
              {currentServing ? currentServing.tokenNumber : 'Idle'}
            </div>
          </div>
          <div className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completed Today</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399' }}>{queueStatus.completedTodayCount || 0}</div>
          </div>
          <div className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Service Time</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fde68a' }}>
              ~{queueStatus.service?.averageServiceTime || 5} min
            </div>
          </div>
        </div>
      )}

      {/* Hero Active Control Panel */}
      <div
        className="card"
        style={{
          background: currentServing
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(17, 24, 39, 0.8) 100%)'
            : currentCalled
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(17, 24, 39, 0.8) 100%)'
            : 'var(--bg-card)',
          border: currentServing
            ? '1px solid rgba(16, 185, 129, 0.5)'
            : currentCalled
            ? '1px solid rgba(245, 158, 11, 0.5)'
            : '1px solid var(--border-subtle)',
          padding: '2rem',
          marginBottom: '2.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {queueStatus?.service?.name} ({queueStatus?.service?.counterLocation})
              </span>
              {currentActiveToken && <TokenBadge status={currentActiveToken.status} />}
            </div>

            {currentActiveToken ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                  <span
                    style={{
                      fontSize: '3.5rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color: currentServing ? '#6ee7b7' : '#fde68a',
                      lineHeight: 1,
                    }}
                  >
                    {currentActiveToken.tokenNumber}
                  </span>
                  {currentServing && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(16, 185, 129, 0.2)',
                        padding: '0.4rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        color: '#6ee7b7',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                      }}
                    >
                      <Clock size={16} />
                      <span>{formatTimer(elapsedSeconds)}</span>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  Student: <strong style={{ color: '#fff' }}>{currentActiveToken.student?.name || 'Student'}</strong>
                  {currentActiveToken.notes && (
                    <span style={{ marginLeft: '1rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                      "{currentActiveToken.notes}"
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                  Counter Free
                </div>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {queueStatus?.waitingCount > 0
                    ? `${queueStatus.waitingCount} student(s) waiting in queue. Ready to call.`
                    : 'No students waiting in line for this counter.'}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* If currently serving -> Complete button */}
            {currentServing && (
              <button
                onClick={() => handleCompleteService(currentServing._id)}
                className="btn btn-success btn-lg"
                disabled={actionLoading}
              >
                <CheckCircle size={20} />
                <span>Complete Service & Record Time</span>
              </button>
            )}

            {/* If called -> Start Service or Skip */}
            {currentCalled && !currentServing && (
              <>
                <button
                  onClick={() => handleStartService(currentCalled._id)}
                  className="btn btn-primary btn-lg"
                  disabled={actionLoading}
                >
                  <Play size={20} />
                  <span>Student Arrived — Start Service</span>
                </button>
                <button
                  onClick={() => handleSkipToken(currentCalled._id)}
                  className="btn btn-warning"
                  disabled={actionLoading}
                >
                  <SkipForward size={18} />
                  <span>Skip (Absent)</span>
                </button>
              </>
            )}

            {/* If free -> Call Next button */}
            {!currentServing && !currentCalled && (
              <button
                onClick={handleCallNext}
                className="btn btn-primary btn-lg"
                disabled={actionLoading || queueStatus?.waitingCount === 0}
              >
                <PhoneCall size={20} />
                <span>Call Next Token (FIFO)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Waiting Students Queue Table */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="#818cf8" />
            <span>Waiting in Line ({queueStatus?.waitingList?.length || 0})</span>
          </h2>
        </div>

        {queueStatus?.waitingList?.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No students currently waiting in this queue.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Seq #</th>
                  <th>Token #</th>
                  <th>Student Name</th>
                  <th>Booked At</th>
                  <th>Notes / Request</th>
                  <th>Status</th>
                  <th>Direct Actions</th>
                </tr>
              </thead>
              <tbody>
                {queueStatus?.waitingList?.map((tok) => (
                  <tr key={tok._id}>
                    <td style={{ color: 'var(--text-muted)' }}>#{tok.sequence}</td>
                    <td style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#93c5fd' }}>
                      {tok.tokenNumber}
                    </td>
                    <td style={{ fontWeight: 600 }}>{tok.student?.name || 'Student'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(tok.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tok.notes || '—'}
                    </td>
                    <td><TokenBadge status={tok.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => handleSkipToken(tok._id)}
                          className="btn btn-secondary btn-sm"
                          title="Skip token"
                        >
                          Skip
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
