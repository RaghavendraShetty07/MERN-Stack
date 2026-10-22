import React, { useState, useEffect } from 'react';
import { serviceAPI, queueAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TokenBadge from '../components/TokenBadge';
import {
  ShieldCheck,
  PlusCircle,
  Edit2,
  Users,
  Layers,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  TrendingUp,
  RefreshCw,
  Power,
  KeyRound,
  Lock,
  User,
  Mail,
} from 'lucide-react';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'services' | 'users' | 'security'

  const { user: currentAdmin, updateCurrentUser } = useAuth();

  // Admin Account & Password State
  const [profileForm, setProfileForm] = useState({
    name: currentAdmin?.name || '',
    email: currentAdmin?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Keep profileForm in sync with loaded admin user
  useEffect(() => {
    if (currentAdmin) {
      setProfileForm((prev) => ({
        ...prev,
        name: currentAdmin.name || '',
        email: currentAdmin.email || '',
      }));
    }
  }, [currentAdmin]);

  // Service Modal state
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    prefix: '',
    description: '',
    averageServiceTime: 5,
    counterLocation: 'Counter 01',
    isActive: true,
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    try {
      setActionLoading(true);
      setError('');
      setMessage('');
      const res = await authAPI.updateProfile({
        name: profileForm.name,
        email: profileForm.email,
        currentPassword: profileForm.currentPassword || undefined,
        newPassword: profileForm.newPassword || undefined,
      });
      setMessage(res.data.message || 'Administrator account credentials updated successfully');
      updateCurrentUser(res.data.user);
      setProfileForm((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err) {
      setError(err.message || 'Failed to update admin credentials');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');
      const [analyticsRes, servicesRes, usersRes] = await Promise.all([
        queueAPI.getAnalytics(),
        serviceAPI.getAll(true), // All services including inactive
        authAPI.getUsers(),
      ]);

      setAnalytics(analyticsRes.data);
      setServices(servicesRes.data.services || []);
      setUsers(usersRes.data.users || []);
    } catch (err) {
      setError(err.message || 'Error loading admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleOpenAddService = () => {
    setEditingService(null);
    setServiceForm({
      name: '',
      prefix: '',
      description: '',
      averageServiceTime: 5,
      counterLocation: 'Counter 01, Ground Floor',
      isActive: true,
    });
    setServiceModalOpen(true);
  };

  const handleOpenEditService = (svc) => {
    setEditingService(svc);
    setServiceForm({
      name: svc.name,
      prefix: svc.prefix,
      description: svc.description || '',
      averageServiceTime: svc.averageServiceTime || 5,
      counterLocation: svc.counterLocation || '',
      isActive: svc.isActive,
    });
    setServiceModalOpen(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError('');
      if (editingService) {
        await serviceAPI.update(editingService._id, serviceForm);
        setMessage(`Service "${serviceForm.name}" updated successfully.`);
      } else {
        await serviceAPI.create(serviceForm);
        setMessage(`New service "${serviceForm.name}" created successfully.`);
      }
      setServiceModalOpen(false);
      fetchAllData();
    } catch (err) {
      setError(err.message || 'Failed to save service');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleServiceStatus = async (svc) => {
    try {
      setActionLoading(true);
      await serviceAPI.update(svc._id, { isActive: !svc.isActive });
      setMessage(`Service "${svc.name}" is now ${!svc.isActive ? 'Active' : 'Deactivated'}.`);
      fetchAllData();
    } catch (err) {
      setError(err.message || 'Failed to toggle service status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setActionLoading(true);
      await authAPI.updateUser(userId, { role: newRole });
      setMessage(`Updated user role to "${newRole}".`);
      fetchAllData();
    } catch (err) {
      setError(err.message || 'Failed to change user role');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Management Hub</h1>
          <p className="page-subtitle">Queue analytics, counter configuration, and staff access controls</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleOpenAddService} className="btn btn-primary" style={{ gap: '0.5rem' }}>
            <PlusCircle size={17} />
            <span>Add Service Counter</span>
          </button>
          <button onClick={fetchAllData} className="btn btn-secondary" title="Refresh">
            <RefreshCw size={15} />
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

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '2rem',
          paddingBottom: '0.5rem',
        }}
      >
        <button
          onClick={() => setActiveTab('overview')}
          className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Activity size={15} />
          <span>Daily Analytics & Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`btn btn-sm ${activeTab === 'services' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Layers size={15} />
          <span>Service Counters ({services.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`btn btn-sm ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Users size={15} />
          <span>Users & Staff ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`btn btn-sm ${activeTab === 'security' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <KeyRound size={15} />
          <span>Account & Password</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
          Loading admin metrics...
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW & ANALYTICS */}
          {activeTab === 'overview' && analytics && (
            <div>
              {/* KPI Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem',
                }}
              >
                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Total Tokens Today
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>
                    {analytics.overview?.totalToday || 0}
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Currently In Queue
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#93c5fd', marginTop: '0.25rem' }}>
                    {analytics.overview?.waitingToday || 0}
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Serving Now
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#6ee7b7', marginTop: '0.25rem' }}>
                    {analytics.overview?.servingToday || 0}
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Completed Today
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>
                    {analytics.overview?.completedToday || 0}
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Skipped / Cancelled
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fca5a5', marginTop: '0.25rem' }}>
                    {(analytics.overview?.skippedToday || 0) + (analytics.overview?.cancelledToday || 0)}
                  </div>
                </div>
              </div>

              {/* Department Performance Breakdown */}
              <div style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
                  Service Counter Performance Today ({analytics.dateKey})
                </h2>
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Prefix</th>
                        <th>Counter Service</th>
                        <th>Status</th>
                        <th>Total Tokens</th>
                        <th>Waiting</th>
                        <th>Completed</th>
                        <th>Avg Observed Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.serviceStats?.map((svc) => (
                        <tr key={svc.serviceId}>
                          <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{svc.prefix}</td>
                          <td style={{ fontWeight: 600 }}>{svc.name}</td>
                          <td>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '9999px',
                                background: svc.isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: svc.isActive ? '#6ee7b7' : '#fca5a5',
                              }}
                            >
                              {svc.isActive ? 'Active' : 'Closed'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700 }}>{svc.total}</td>
                          <td style={{ color: '#93c5fd' }}>{svc.waiting}</td>
                          <td style={{ color: '#34d399' }}>{svc.completed}</td>
                          <td style={{ color: '#fde68a' }}>~{svc.avgDurationMinutes} mins</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Activity Log */}
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
                  Recent Token Activity
                </h2>
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Token #</th>
                        <th>Service</th>
                        <th>Student</th>
                        <th>Status</th>
                        <th>Handled By</th>
                        <th>Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.recentTokens?.map((tok) => (
                        <tr key={tok._id}>
                          <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{tok.tokenNumber}</td>
                          <td>{tok.service?.name}</td>
                          <td>{tok.student?.name}</td>
                          <td><TokenBadge status={tok.status} /></td>
                          <td>{tok.servedBy?.name || '—'}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {new Date(tok.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SERVICES MANAGEMENT */}
          {activeTab === 'services' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Campus Service Counters</h2>
                <button onClick={handleOpenAddService} className="btn btn-primary btn-sm">
                  <PlusCircle size={15} />
                  <span>New Service</span>
                </button>
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Prefix</th>
                      <th>Service Name</th>
                      <th>Counter Location</th>
                      <th>Avg Service Time</th>
                      <th>Active Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((svc) => (
                      <tr key={svc._id}>
                        <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{svc.prefix}</td>
                        <td style={{ fontWeight: 600 }}>{svc.name}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{svc.counterLocation}</td>
                        <td>~{svc.averageServiceTime} minutes</td>
                        <td>
                          <button
                            onClick={() => handleToggleServiceStatus(svc)}
                            className={`btn btn-sm ${svc.isActive ? 'btn-success' : 'btn-danger'}`}
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', gap: '4px' }}
                          >
                            <Power size={12} />
                            <span>{svc.isActive ? 'Active (Open)' : 'Deactivated'}</span>
                          </button>
                        </td>
                        <td>
                          <button
                            onClick={() => handleOpenEditService(svc)}
                            className="btn btn-secondary btn-sm"
                            style={{ gap: '4px' }}
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: USERS & STAFF ACCESS MANAGEMENT */}
          {activeTab === 'users' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
                User & Role Access Management
              </h2>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Current Role</th>
                      <th>Change Role</th>
                      <th>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td style={{ fontWeight: 600 }}>{u.name}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td>
                          <span className={`role-pill ${u.role}`}>{u.role}</span>
                        </td>
                        <td>
                          <select
                            className="form-select"
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', width: 'auto' }}
                          >
                            <option value="student">Student</option>
                            <option value="staff">Staff Officer</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ADMIN ACCOUNT & PASSWORD SETTINGS */}
          {activeTab === 'security' && (
            <div style={{ maxWidth: '640px' }}>
              <div className="card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <KeyRound size={22} color="#fff" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Admin Account & Credentials</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                      Update administrator display name, contact email, or change master login password
                    </p>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile}>
                  <div className="form-group">
                    <label className="form-label">Administrator Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Prof. Rajesh Sharma"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        style={{ paddingLeft: '2.6rem' }}
                        required
                      />
                      <User
                        size={17}
                        color="var(--text-muted)"
                        style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Administrator Email / Login ID</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="admin@college.edu"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        style={{ paddingLeft: '2.6rem' }}
                        required
                      />
                      <Mail
                        size={17}
                        color="var(--text-muted)"
                        style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: '1.75rem',
                      paddingTop: '1.25rem',
                      borderTop: '1px solid var(--border-subtle)',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Change Master Password
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      Leave blank if you only want to change your administrator name or email.
                    </p>

                    <div className="form-group">
                      <label className="form-label">New Password (minimum 6 characters)</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="password"
                          className="form-input"
                          placeholder="••••••••••••"
                          value={profileForm.newPassword}
                          onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                          style={{ paddingLeft: '2.6rem' }}
                        />
                        <Lock
                          size={17}
                          color="var(--text-muted)"
                          style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Confirm New Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="password"
                          className="form-input"
                          placeholder="••••••••••••"
                          value={profileForm.confirmPassword}
                          onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                          style={{ paddingLeft: '2.6rem' }}
                        />
                        <Lock
                          size={17}
                          color="var(--text-muted)"
                          style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                      marginTop: '0.5rem',
                    }}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Updating Credentials...' : 'Save Updated Admin Credentials'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add / Edit Service Modal */}
      {serviceModalOpen && (
        <div className="modal-overlay" onClick={() => setServiceModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              {editingService ? 'Edit Service Counter' : 'Create New Service Counter'}
            </h3>

            <form onSubmit={handleSaveService}>
              <div className="form-group">
                <label className="form-label">Service Department Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Scholarship & Financial Aid"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Prefix (2-5 letters)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. SCH"
                    maxLength={5}
                    value={serviceForm.prefix}
                    onChange={(e) => setServiceForm({ ...serviceForm, prefix: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Avg Time (mins)</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    className="form-input"
                    value={serviceForm.averageServiceTime}
                    onChange={(e) => setServiceForm({ ...serviceForm, averageServiceTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Counter Physical Location</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Counter 05, First Floor East Wing"
                  value={serviceForm.counterLocation}
                  onChange={(e) => setServiceForm({ ...serviceForm, counterLocation: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Services provided at this counter..."
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setServiceModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
