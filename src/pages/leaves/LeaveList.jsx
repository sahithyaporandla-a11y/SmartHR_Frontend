import { useState, useEffect, useCallback } from 'react';
import { Plus, CalendarOff, Check, X, RefreshCw, Eye } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import LeaveForm from './LeaveForm';

const LEAVE_TYPES = ['Annual', 'Sick', 'Maternity', 'Paternity', 'Unpaid', 'Emergency', 'Other'];

export default function LeaveList() {
  const toast = useToast();
  const { isAdmin } = useAuth();

  const [leaves, setLeaves] = useState([]);
  const [pagination, setPagination] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [viewLeave, setViewLeave] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewAction, setReviewAction] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('leaveType', typeFilter);
      const res = await api.get(`/leaves?${params}`);
      setLeaves(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load leave requests.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const handleReview = async () => {
    try {
      await api.patch(`/leaves/${reviewTarget._id}/status`, {
        status: reviewAction,
        reviewNotes,
      });
      toast.success(`Leave request ${reviewAction.toLowerCase()}.`);
      setReviewTarget(null);
      setReviewNotes('');
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  const handleCancel = async () => {
    try {
      await api.delete(`/leaves/${cancelTarget._id}`);
      toast.success('Leave request cancelled.');
      setCancelTarget(null);
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed.');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Leave Requests</h2>
          <p className="page-subtitle">{pagination.total} total requests</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchLeaves} className="btn-secondary" id="refresh-leaves-btn">
            <RefreshCw size={15} />
          </button>
          {!isAdmin && (
            <button onClick={() => setShowForm(true)} className="btn-primary" id="request-leave-btn">
              <Plus size={16} /> Request Leave
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card py-3">
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-36"
            id="leave-status-filter"
          >
            <option value="">All Status</option>
            {['Pending', 'Approved', 'Rejected', 'Cancelled'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="w-36"
            id="leave-type-filter"
          >
            <option value="">All Types</option>
            {LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={isAdmin ? 7 : 6} />
        ) : leaves.length === 0 ? (
          <EmptyState
            icon={CalendarOff}
            title="No leave requests"
            description={statusFilter || typeFilter ? 'Try changing your filters.' : isAdmin ? 'No leave requests submitted yet.' : 'You have no leave requests.'}
            action={
              !isAdmin && (
                <button onClick={() => setShowForm(true)} className="btn-primary btn-sm">
                  <Plus size={14} /> Request Leave
                </button>
              )
            }
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {isAdmin && <th>Employee</th>}
                  <th>Type</th>
                  <th>Period</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave._id}>
                    {isAdmin && (
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-semibold flex-shrink-0">
                            {leave.employee?.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2) || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{leave.employee?.fullName}</p>
                            <p className="text-xs text-slate-400">{leave.employee?.department}</p>
                          </div>
                        </div>
                      </td>
                    )}
                    <td><Badge status={leave.leaveType} text={leave.leaveType} className="badge-blue" /></td>
                    <td className="text-slate-600 text-xs">
                      {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                    </td>
                    <td className="font-medium">{leave.totalDays}d</td>
                    <td className="text-slate-500 max-w-xs">
                      <p className="truncate text-xs">{leave.reason}</p>
                    </td>
                    <td><Badge status={leave.status} /></td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewLeave(leave)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="View details"
                          id={`view-leave-${leave._id}`}
                        >
                          <Eye size={15} />
                        </button>
                        {isAdmin && leave.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => { setReviewTarget(leave); setReviewAction('Approved'); }}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                              title="Approve"
                              id={`approve-leave-${leave._id}`}
                            >
                              <Check size={15} />
                            </button>
                            <button
                              onClick={() => { setReviewTarget(leave); setReviewAction('Rejected'); }}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                              title="Reject"
                              id={`reject-leave-${leave._id}`}
                            >
                              <X size={15} />
                            </button>
                          </>
                        )}
                        {!isAdmin && leave.status === 'Pending' && (
                          <button
                            onClick={() => setCancelTarget(leave)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                            title="Cancel"
                            id={`cancel-leave-${leave._id}`}
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Leave Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Request Leave">
        <LeaveForm
          onSuccess={() => { setShowForm(false); fetchLeaves(); toast.success('Leave request submitted!'); }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      {/* View Leave Modal */}
      <Modal isOpen={!!viewLeave} onClose={() => setViewLeave(null)} title="Leave Request Details">
        {viewLeave && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-slate-400 text-xs">Employee</p><p className="font-medium">{viewLeave.employee?.fullName}</p></div>
              <div><p className="text-slate-400 text-xs">Type</p><p className="font-medium">{viewLeave.leaveType}</p></div>
              <div><p className="text-slate-400 text-xs">Start Date</p><p className="font-medium">{formatDate(viewLeave.startDate)}</p></div>
              <div><p className="text-slate-400 text-xs">End Date</p><p className="font-medium">{formatDate(viewLeave.endDate)}</p></div>
              <div><p className="text-slate-400 text-xs">Total Days</p><p className="font-medium">{viewLeave.totalDays} days</p></div>
              <div><p className="text-slate-400 text-xs">Status</p><Badge status={viewLeave.status} /></div>
              <div className="col-span-2"><p className="text-slate-400 text-xs mb-1">Reason</p><p className="text-slate-700">{viewLeave.reason}</p></div>
              {viewLeave.reviewNotes && (
                <div className="col-span-2"><p className="text-slate-400 text-xs mb-1">Review Notes</p><p className="text-slate-700">{viewLeave.reviewNotes}</p></div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={!!reviewTarget && !!reviewAction}
        onClose={() => { setReviewTarget(null); setReviewAction(''); setReviewNotes(''); }}
        title={`${reviewAction} Leave Request`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {reviewAction === 'Approved' ? '✅' : '❌'} You are about to {reviewAction.toLowerCase()} the leave request from{' '}
            <strong>{reviewTarget?.employee?.fullName}</strong>.
          </p>
          <div className="form-group">
            <label htmlFor="review-notes">Notes (optional)</label>
            <textarea
              id="review-notes"
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add a note for the employee..."
              className="resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => { setReviewTarget(null); setReviewAction(''); }} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleReview}
              className={reviewAction === 'Approved' ? 'btn-success' : 'btn-danger'}
              id="confirm-review-btn"
            >
              {reviewAction}
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancel Confirm */}
      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel Leave Request"
        message="Are you sure you want to cancel this leave request?"
        confirmText="Cancel Request"
        danger
      />
    </div>
  );
}
