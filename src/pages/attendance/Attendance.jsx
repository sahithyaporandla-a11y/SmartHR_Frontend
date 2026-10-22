import { useState, useEffect, useCallback } from 'react';
import { Clock, RefreshCw, Filter, CheckCircle, LogOut } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export default function AttendancePage() {
  const toast = useToast();
  const { isAdmin, user } = useAuth();
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Today's status for employee check-in/out
  const [todayRecord, setTodayRecord] = useState(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (dateFilter) params.set('date', dateFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/attendance?${params}`);
      setRecords(res.data.data);
      setPagination(res.data.pagination);

      // Find today's record for employee (compare local date, not UTC)
      if (!isAdmin) {
        const now = new Date();
        const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const todayRec = res.data.data.find((r) => {
          const recDate = new Date(r.date);
          const recLocal = `${recDate.getFullYear()}-${String(recDate.getMonth() + 1).padStart(2, '0')}-${String(recDate.getDate()).padStart(2, '0')}`;
          return recLocal === todayLocal;
        });
        setTodayRecord(todayRec || null);
      }
    } catch {
      toast.error('Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  }, [page, dateFilter, statusFilter, isAdmin]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await api.post('/attendance/check-in');
      toast.success('Checked in successfully!');
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      await api.post('/attendance/check-out');
      toast.success('Checked out successfully!');
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Attendance</h2>
          <p className="page-subtitle">{isAdmin ? `${pagination.total} records` : 'Your attendance history'}</p>
        </div>
        <button onClick={fetchRecords} className="btn-secondary" id="refresh-attendance-btn">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Employee check-in card */}
      {!isAdmin && (
        <div className="card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Current time</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{timeString}</p>
              <p className="text-sm text-slate-500 mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="flex flex-col gap-2 items-start sm:items-end">
              {todayRecord ? (
                <div className="text-sm text-slate-600 space-y-1">
                  <p>✅ Check-in: <strong>{formatTime(todayRecord.checkIn)}</strong></p>
                  {todayRecord.checkOut && <p>🏁 Check-out: <strong>{formatTime(todayRecord.checkOut)}</strong></p>}
                  {todayRecord.workedHours && <p className="text-slate-400">Worked: {todayRecord.workedHours}h</p>}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No record for today</p>
              )}
              <div className="flex gap-2">
                {!todayRecord && (
                  <button
                    onClick={handleCheckIn}
                    disabled={actionLoading}
                    className="btn-primary"
                    id="check-in-btn"
                  >
                    {actionLoading ? <span className="spinner" /> : <CheckCircle size={16} />}
                    Check In
                  </button>
                )}
                {todayRecord && !todayRecord.checkOut && (
                  <button
                    onClick={handleCheckOut}
                    disabled={actionLoading}
                    className="btn-secondary"
                    id="check-out-btn"
                  >
                    {actionLoading ? <span className="spinner" /> : <LogOut size={16} />}
                    Check Out
                  </button>
                )}
                {todayRecord?.checkOut && (
                  <span className="badge-green">All done for today!</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card py-3">
        <div className="flex flex-wrap gap-3">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            className="w-44"
            id="date-filter"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-36"
            id="attendance-status-filter"
          >
            <option value="">All Status</option>
            {['Present', 'Absent', 'Late', 'Half Day', 'On Leave'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} cols={isAdmin ? 6 : 5} />
        ) : records.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No attendance records"
            description="No records found for the selected filters."
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {isAdmin && <th>Employee</th>}
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec._id}>
                    {isAdmin && (
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold flex-shrink-0">
                            {rec.employee?.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2) || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{rec.employee?.fullName}</p>
                            <p className="text-xs text-slate-400">{rec.employee?.department}</p>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="text-slate-600">{formatDate(rec.date)}</td>
                    <td className="tabular-nums text-slate-600">{formatTime(rec.checkIn)}</td>
                    <td className="tabular-nums text-slate-600">{formatTime(rec.checkOut)}</td>
                    <td className="text-slate-500">{rec.workedHours ? `${rec.workedHours}h` : '—'}</td>
                    <td><Badge status={rec.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
