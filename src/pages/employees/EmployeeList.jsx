import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Search, Filter, ChevronUp, ChevronDown,
  Eye, Edit, UserX, Users, RefreshCw,
} from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import EmployeeForm from './EmployeeForm';
import EmployeeDetail from './EmployeeDetail';

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Finance', 'Human Resources', 'Operations', 'Legal', 'Customer Support'];
const STATUSES = ['Active', 'Inactive', 'On Leave', 'Terminated'];

export default function EmployeeList() {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(true);

  // Filters & sort
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filterDept, setFilterDept] = useState(searchParams.get('department') || '');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [viewEmployee, setViewEmployee] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10, sortBy, sortOrder });
      if (search) params.set('search', search);
      if (filterDept) params.set('department', filterDept);
      if (filterStatus) params.set('status', filterStatus);
      const res = await api.get(`/employees?${params}`);
      setEmployees(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load employees.');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterDept, filterStatus, sortBy, sortOrder]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const handleDeactivate = async () => {
    try {
      await api.patch(`/employees/${deactivateTarget._id}/status`, { status: 'Inactive' });
      toast.success(`${deactivateTarget.fullName} deactivated.`);
      fetchEmployees();
    } catch {
      toast.error('Failed to deactivate employee.');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditEmployee(null);
    fetchEmployees();
    toast.success(editEmployee ? 'Employee updated.' : 'Employee created.');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Employees</h2>
          <p className="page-subtitle">{pagination.total} total employees</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary" id="add-employee-btn">
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="card py-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, email, ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
              id="employee-search"
            />
          </div>
          <select
            value={filterDept}
            onChange={(e) => { setFilterDept(e.target.value); setPage(1); }}
            className="w-48"
            id="department-filter"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="w-36"
            id="status-filter"
          >
            <option value="">All Status</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button onClick={fetchEmployees} className="btn-secondary" id="refresh-employees-btn">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : employees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No employees found"
            description={search || filterDept || filterStatus ? 'Try adjusting your filters.' : 'Add your first employee to get started.'}
            action={
              !search && !filterDept && !filterStatus && (
                <button onClick={() => setShowForm(true)} className="btn-primary btn-sm">
                  <Plus size={14} /> Add Employee
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>
                      <button className="flex items-center gap-1" onClick={() => handleSort('employeeId')}>
                        ID <SortIcon field="employeeId" />
                      </button>
                    </th>
                    <th>
                      <button className="flex items-center gap-1" onClick={() => handleSort('fullName')}>
                        Employee <SortIcon field="fullName" />
                      </button>
                    </th>
                    <th>Department</th>
                    <th>Job Title</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp._id}>
                      <td className="font-mono text-xs text-slate-500">{emp.employeeId}</td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs flex-shrink-0">
                            {emp.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{emp.fullName}</p>
                            <p className="text-xs text-slate-400">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>{emp.department}</td>
                      <td className="text-slate-500">{emp.jobTitle}</td>
                      <td><Badge status={emp.employmentType} /></td>
                      <td><Badge status={emp.status} /></td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setViewEmployee(emp)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="View details"
                            id={`view-emp-${emp._id}`}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => { setEditEmployee(emp); setShowForm(true); }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Edit employee"
                            id={`edit-emp-${emp._id}`}
                          >
                            <Edit size={15} />
                          </button>
                          {emp.status !== 'Inactive' && emp.status !== 'Terminated' && (
                            <button
                              onClick={() => setDeactivateTarget(emp)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                              title="Deactivate"
                              id={`deactivate-emp-${emp._id}`}
                            >
                              <UserX size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Showing {(pagination.page - 1) * 10 + 1}–{Math.min(pagination.page * 10, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-1">
                  {Array.from({ length: pagination.pages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                        pagination.page === i + 1
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditEmployee(null); }}
        title={editEmployee ? 'Edit Employee' : 'Add New Employee'}
        size="lg"
      >
        <EmployeeForm
          employee={editEmployee}
          onSuccess={handleFormSuccess}
          onCancel={() => { setShowForm(false); setEditEmployee(null); }}
        />
      </Modal>

      {/* View Employee Modal */}
      <Modal
        isOpen={!!viewEmployee}
        onClose={() => setViewEmployee(null)}
        title="Employee Details"
        size="lg"
      >
        {viewEmployee && <EmployeeDetail employee={viewEmployee} />}
      </Modal>

      {/* Deactivate Confirm */}
      <ConfirmDialog
        isOpen={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Employee"
        message={`Are you sure you want to deactivate ${deactivateTarget?.fullName}? Their account will be disabled.`}
        confirmText="Deactivate"
        danger
      />
    </div>
  );
}
