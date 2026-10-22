import React, { useState, useEffect } from 'react';
import { serviceAPI, queueAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import {
  Monitor,
  Volume2,
  VolumeX,
  Maximize2,
  Clock,
  Sparkles,
  RefreshCw,
  Bell,
  ArrowRight,
} from 'lucide-react';

const PublicDisplayPage = () => {
  const [services, setServices] = useState([]);
  const [snapshots, setSnapshots] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [fullscreen, setFullscreen] = useState(false);
  const [lastCalledAlert, setLastCalledAlert] = useState(null);

  const { lastQueueEvent, joinDisplay, leaveDisplay, soundEnabled, toggleSound } = useSocket();

  // Clock in Asia/Kolkata
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDisplayData = async () => {
    try {
      const res = await serviceAPI.getAll();
      const activeServices = res.data.services || [];
      setServices(activeServices);

      const map = {};
      await Promise.all(
        activeServices.map(async (svc) => {
          try {
            const statusRes = await queueAPI.getServiceStatus(svc._id);
            map[svc._id] = statusRes.data;
          } catch (e) {}
        })
      );
      setSnapshots(map);
    } catch (e) {
      console.error('Error fetching display data:', e);
    }
  };

  useEffect(() => {
    fetchDisplayData();
    joinDisplay();
    return () => leaveDisplay();
  }, []);

  useEffect(() => {
    if (lastQueueEvent) {
      fetchDisplayData();
      if (lastQueueEvent.eventType === 'called' && lastQueueEvent.tokenNumber) {
        setLastCalledAlert(lastQueueEvent);
        const timeout = setTimeout(() => setLastCalledAlert(null), 8000);
        return () => clearTimeout(timeout);
      }
    }
  }, [lastQueueEvent]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  };

  const formattedTime = currentTime.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = currentTime.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      style={{
        minHeight: '85vh',
        background: '#090d16',
        borderRadius: 'var(--radius-xl)',
        padding: '2rem',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
      }}
    >
      {/* Top Kiosk Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
            }}
          >
            <Monitor size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
              SmartQ Campus • Live Queue Display
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Student Services & Counter Status Board
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Clock & Date */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#6ee7b7' }}>
              {formattedTime}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {formattedDate} (Asia/Kolkata)
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={toggleSound}
              className="btn btn-secondary btn-sm"
              title={soundEnabled ? 'Chime ON' : 'Chime MUTED'}
            >
              {soundEnabled ? <Volume2 size={16} color="#10b981" /> : <VolumeX size={16} color="#9ca3af" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="btn btn-secondary btn-sm"
              title="Toggle Fullscreen"
            >
              <Maximize2 size={16} />
            </button>
            <button onClick={fetchDisplayData} className="btn btn-secondary btn-sm" title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Flashing Announcement Banner when a token is called */}
      {lastCalledAlert && (
        <div
          style={{
            background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
            color: '#000',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 2rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 0 30px rgba(245, 158, 11, 0.6)',
            animation: 'pulse-border 1s infinite alternate',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Bell size={28} />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Now Calling to Counter
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                TOKEN {lastCalledAlert.tokenNumber}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              {lastCalledAlert.serviceName}
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
              {lastCalledAlert.counterLocation}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid of Service Counters */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {services.map((svc) => {
          const snapshot = snapshots[svc._id] || {};
          const servingToken = snapshot.currentlyServing;
          const calledToken = snapshot.currentlyCalled && snapshot.currentlyCalled.length > 0 ? snapshot.currentlyCalled[0] : null;
          const currentToken = servingToken || calledToken;
          const upcomingList = (snapshot.waitingList || []).slice(0, 4);

          return (
            <div
              key={svc._id}
              style={{
                background: 'rgba(17, 24, 39, 0.85)',
                border: currentToken ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{svc.name}</h2>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {svc.counterLocation}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      background: 'rgba(99, 102, 241, 0.2)',
                      color: '#a5b4fc',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                    }}
                  >
                    {svc.prefix}
                  </span>
                </div>

                {/* Big NOW SERVING Display */}
                <div
                  style={{
                    background: currentToken
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(17, 24, 39, 0.6) 100%)'
                      : 'rgba(0, 0, 0, 0.25)',
                    border: currentToken ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem 1rem',
                    textAlign: 'center',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: currentToken ? '#6ee7b7' : 'var(--text-muted)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {servingToken ? '• NOW SERVING •' : calledToken ? '• CALLED TO COUNTER •' : 'COUNTER IDLE'}
                  </div>

                  <div
                    style={{
                      fontSize: '3.2rem',
                      fontWeight: 900,
                      fontFamily: 'var(--font-mono)',
                      color: currentToken ? '#fff' : 'rgba(255, 255, 255, 0.2)',
                      letterSpacing: '-0.02em',
                      lineHeight: 1,
                    }}
                  >
                    {currentToken ? currentToken.tokenNumber : '——'}
                  </div>
                </div>

                {/* Next in Line Upcoming Tokens */}
                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.6rem',
                    }}
                  >
                    Upcoming In Line ({snapshot.waitingCount || 0} waiting)
                  </div>

                  {upcomingList.length === 0 ? (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                      No waiting tokens in line
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {upcomingList.map((tok) => (
                        <div
                          key={tok._id}
                          style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.4rem 0.75rem',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.95rem',
                            fontWeight: 700,
                            color: '#93c5fd',
                          }}
                        >
                          {tok.tokenNumber}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer info */}
              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingTop: '0.85rem',
                  marginTop: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span>Completed today: {snapshot.completedTodayCount || 0}</span>
                <span>Avg wait: ~{snapshot.estimatedNextWaitMinutes || 0}m</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PublicDisplayPage;
