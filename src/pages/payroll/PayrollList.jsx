import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Plus, RefreshCw, Eye, CheckCircle, ChevronDown } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import PayrollForm from './PayrollForm';
import PayrollSlip from './PayrollSlip';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

function SummaryCard({ label, value, color }) {
  return (
    <div className="card">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default function PayrollList() {
  const toast = useToast();
  const { isAdmin } = useAuth();

  const [payrolls, setPayrolls] = useState([]);
  const [pagination, setPagination] = useState({ total: 0 });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [viewSlip, setViewSlip] = useState(null);
  const [editPayroll, setEditPayroll] = useState(null);

  const fetchPayrolls = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15, month: filterMonth, year: filterYear });
      if (filterStatus) params.set('status', filterStatus);
      const [payrollRes, summaryRes] = await Promise.all([
        api.get(`/payroll?${params}`),
        isAdmin ? api.get(`/payroll/summary?month=${filterMonth}&year=${filterYear}`) : Promise.resolve(null),
      ]);
      setPayrolls(payrollRes.data.data || []);
      setPagination(payrollRes.data.pagination || { total: 0, page: 1, pages: 1 });
      if (summaryRes) setSummary(summaryRes.data.data || {});

    } catch {
      toast.error('Failed to load payroll records.');
    } finally {
      setLoading(false);
    }
  }, [page, filterMonth, filterYear, filterStatus, isAdmin]);

  useEffect(() => { fetchPayrolls(); }, [fetchPayrolls]);

  const handleMarkPaid = async (id) => {
    try {
      await api.patch(`/payroll/${id}/status`, { status: 'Paid' });
      toast.success('Marked as Paid!');
      fetchPayrolls();
    } catch { toast.error('Failed to update status.'); }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditPayroll(null);
    fetchPayrolls();
    toast.success(editPayroll ? 'Payroll updated.' : 'Payroll created.');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Payroll</h2>
          <p className="page-subtitle">{MONTHS[filterMonth - 1]} {filterYear} — {pagination.total} records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchPayrolls} className="btn-secondary" id="refresh-payroll-btn"><RefreshCw size={15} /></button>
          {isAdmin && (
            <button onClick={() => setShowForm(true)} className="btn-primary" id="add-payroll-btn">
              <Plus size={16} /> Process Payroll
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards (Admin) */}
      {isAdmin && summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard label="Total Gross" value={fmt(summary.totalGross)} color="text-indigo-700" />
          <SummaryCard label="Total Net" value={fmt(summary.totalNet)} color="text-emerald-700" />
          <SummaryCard label="Total Deductions" value={fmt(summary.totalDeductions)} color="text-red-600" />
          <SummaryCard label="Records" value={`${summary.paid || 0} Paid / ${summary.draft || 0} Draft`} color="text-slate-700" />
        </div>
      )}

      {/* Filters */}
      <div className="card py-3">
        <div className="flex flex-wrap gap-3">
          <select value={filterMonth} onChange={(e) => { setFilterMonth(Number(e.target.value)); setPage(1); }} className="w-32" id="payroll-month-filter">
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select value={filterYear} onChange={(e) => { setFilterYear(Number(e.target.value)); setPage(1); }} className="w-28" id="payroll-year-filter">
            {[currentYear, currentYear - 1, currentYear - 2].map((y) => <option key={y}>{y}</option>)}
          </select>
          {isAdmin && (
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="w-32" id="payroll-status-filter">
              <option value="">All Status</option>
              {['Draft', 'Processed', 'Paid'].map((s) => <option key={s}>{s}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} cols={isAdmin ? 7 : 5} />
        ) : payrolls.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="No payroll records"
            description={`No payroll for ${MONTHS[filterMonth - 1]} ${filterYear}.`}
            action={isAdmin && <button onClick={() => setShowForm(true)} className="btn-primary btn-sm"><Plus size={14} /> Process Payroll</button>}
          />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {isAdmin && <th>Employee</th>}
                  <th>Month/Year</th>
                  <th>Basic Salary</th>
                  <th>Gross</th>
                  <th>Deductions</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((p) => (
                  <tr key={p._id}>
                    {isAdmin && (
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold">
                            {p.employee?.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-800">{p.employee?.fullName}</p>
                            <p className="text-xs text-slate-400">{p.employee?.department}</p>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="text-slate-600">{MONTHS[p.month - 1]} {p.year}</td>
                    <td className="tabular-nums">{fmt(p.basicSalary)}</td>
                    <td className="tabular-nums text-indigo-700 font-medium">{fmt(p.grossSalary)}</td>
                    <td className="tabular-nums text-red-500">{fmt(p.totalDeductions)}</td>
                    <td className="tabular-nums text-emerald-700 font-bold">{fmt(p.netSalary)}</td>
                    <td>
                      <Badge
                        status={p.status}
                        text={p.status}
                        className={p.status === 'Paid' ? 'badge-green' : p.status === 'Processed' ? 'badge-blue' : 'badge-yellow'}
                      />
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setViewSlip(p)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="View Payslip"
                          id={`view-slip-${p._id}`}
                        >
                          <Eye size={15} />
                        </button>
                        {isAdmin && p.status !== 'Paid' && (
                          <button
                            onClick={() => handleMarkPaid(p._id)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                            title="Mark as Paid"
                            id={`mark-paid-${p._id}`}
                          >
                            <CheckCircle size={15} />
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

      {/* Process Payroll Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditPayroll(null); }} title="Process Payroll" size="lg">
        <PayrollForm employee={editPayroll} onSuccess={handleFormSuccess} onCancel={() => setShowForm(false)} />
      </Modal>

      {/* Payslip View Modal */}
      <Modal isOpen={!!viewSlip} onClose={() => setViewSlip(null)} title="Payslip" size="lg">
        {viewSlip && <PayrollSlip payroll={viewSlip} />}
      </Modal>
    </div>
  );
}
