import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { serviceAPI, queueAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import confetti from 'canvas-confetti';
import {
  Layers,
  Clock,
  MapPin,
  Users,
  Ticket,
  ChevronRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Info,
  Calendar,
} from 'lucide-react';

const StudentDashboard = () => {
  const [services, setServices] = useState([]);
  const [serviceSnapshots, setServiceSnapshots] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [error, setError] = useState('');

  const { lastQueueEvent } = useSocket();
  const navigate = useNavigate();

  const fetchServicesAndQueues = async () => {
    try {
      const res = await serviceAPI.getAll();
      const activeServices = res.data.services || [];
      setServices(activeServices);

      // Fetch snapshot for each service
      const snapshotMap = {};
      await Promise.all(
        activeServices.map(async (svc) => {
          try {
            const statusRes = await queueAPI.getServiceStatus(svc._id);
            snapshotMap[svc._id] = statusRes.data;
          } catch (e) {
            // Service might be newly created
          }
        })
      );
      setServiceSnapshots(snapshotMap);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicesAndQueues();
  }, []);

  // Real-time refresh when Socket.IO sends a queue:updated event
  useEffect(() => {
    if (lastQueueEvent) {
      fetchServicesAndQueues();
    }
  }, [lastQueueEvent]);

  const handleOpenBookingModal = (svc) => {
    setSelectedService(svc);
    setNotes('');
    setError('');
  };

  const handleBookToken = async (e) => {
    e.preventDefault();
    if (!selectedService) return;

    try {
      setBookingLoading(true);
      setError('');
      const res = await queueAPI.book({
        serviceId: selectedService._id,
        notes,
      });

      // Celebration effect
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      setBookingResult(res.data);
      setSelectedService(null);
      fetchServicesAndQueues();
    } catch (err) {
      setError(err.message || 'Could not book token.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">College Service Counters</h1>
          <p className="page-subtitle">
            Select a college department to book your digital queue token in real time
          </p>
        </div>
        <button
          onClick={() => navigate('/my-tokens')}
          className="btn btn-secondary"
          style={{ gap: '0.6rem' }}
        >
          <Ticket size={18} color="#818cf8" />
          <span>View My Active Tokens</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Booking Success Modal Banner */}
      {bookingResult && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
            borderColor: 'rgba(16, 185, 129, 0.4)',
            marginBottom: '2rem',
            padding: '1.75rem',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--status-serving)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
                }}
              >
                <CheckCircle size={32} color="#fff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#6ee7b7' }}>
                    {bookingResult.token?.tokenNumber}
                  </span>
                  <span className="status-badge waiting">Booked & Waiting</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.2rem' }}>
                  {bookingResult.token?.service?.name} • Est. Wait:{' '}
                  <strong style={{ color: '#fff' }}>~{bookingResult.estimatedWaitMinutes} mins</strong> ({bookingResult.peopleAhead} people ahead)
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => navigate('/my-tokens')}
                className="btn btn-primary"
              >
                <span>Track Live Queue</span>
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setBookingResult(null)}
                className="btn btn-secondary"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading service counters...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Info size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3>No Active Services Available</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Service counters are currently closed or being updated by administrators.
          </p>
        </div>
      ) : (
        <div className="grid-cols-2">
          {services.map((svc) => {
            const snapshot = serviceSnapshots[svc._id] || {};
            const waitingCount = snapshot.waitingCount ?? 0;
            const currentlyServing = snapshot.currentlyServing;
            const estWait = (waitingCount + (currentlyServing ? 1 : 0)) * (svc.averageServiceTime || 5);

            return (
              <div
                key={svc._id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.65rem',
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: '#a5b4fc',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {svc.prefix}
                    </span>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        color: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                      Counter Open
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    {svc.name}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', minHeight: '2.5rem' }}>
                    {svc.description || 'General administrative counter services and student support.'}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      marginTop: '1rem',
                      padding: '0.75rem',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                      <MapPin size={15} color="#818cf8" />
                      <span>{svc.counterLocation || 'Main Hall'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                      <Clock size={15} color="#f59e0b" />
                      <span>Avg: ~{svc.averageServiceTime} mins</span>
                    </div>
                  </div>
                </div>

                {/* Queue Stats Bar */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1rem',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Waiting In Line
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#93c5fd' }}>
                        {waitingCount} students
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Estimated Wait
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: estWait > 0 ? '#fde68a' : '#6ee7b7' }}>
                        {estWait === 0 ? 'No Wait (Walk-in)' : `~${estWait} mins`}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenBookingModal(svc)}
                    className="btn btn-primary"
                    style={{ width: '100%', gap: '0.5rem' }}
                  >
                    <Ticket size={17} />
                    <span>Book Digital Token</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Book Token Modal */}
      {selectedService && (
        <div className="modal-overlay" onClick={() => setSelectedService(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ticket size={22} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Book Queue Token</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {selectedService.name} ({selectedService.prefix})
                </p>
              </div>
            </div>

            <div
              style={{
                padding: '0.85rem',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                color: '#c7d2fe',
              }}
            >
              📍 Counter: <strong>{selectedService.counterLocation}</strong>
              <br />
              ⏱ Estimated handling time: <strong>~{selectedService.averageServiceTime} mins per student</strong>
            </div>

            <form onSubmit={handleBookToken}>
              <div className="form-group">
                <label className="form-label">Purpose / Notes (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Submitting exam re-evaluation form and receipt"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  disabled={bookingLoading}
                >
                  {bookingLoading ? 'Generating Token...' : 'Confirm Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
