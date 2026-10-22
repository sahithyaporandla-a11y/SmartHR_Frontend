import { useEffect, useState } from 'react';
import { Mail, Phone, Briefcase, Calendar, Building2, User, Edit } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';

const Field = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
    <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center flex-shrink-0 shadow-sm">
      <Icon size={14} className="text-indigo-500" />
    </div>
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value || '—'}</p>
    </div>
  </div>
);

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/auth/me');
        setEmployee(res.data.data.user.employee);
      } catch {
        toast.error('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="card">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-20 h-20 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="card text-center py-12">
        <p className="text-slate-500">No employee profile linked to your account. Contact HR.</p>
      </div>
    );
  }

  const joiningDate = employee.joiningDate
    ? new Date(employee.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div className="max-w-2xl space-y-4">
      <div className="page-header">
        <div>
          <h2 className="page-title">My Profile</h2>
          <p className="page-subtitle">Your employee information</p>
        </div>
      </div>

      <div className="card">
        {/* Avatar section */}
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-200">
            {employee.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{employee.fullName}</h3>
            <p className="text-slate-500">{employee.jobTitle}</p>
            <div className="flex gap-2 mt-2">
              <Badge status={employee.status} />
              <Badge status={employee.employmentType} />
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field icon={User} label="Employee ID" value={employee.employeeId} />
          <Field icon={Mail} label="Email Address" value={employee.email} />
          <Field icon={Phone} label="Phone Number" value={employee.phone} />
          <Field icon={Building2} label="Department" value={employee.department} />
          <Field icon={Briefcase} label="Job Title" value={employee.jobTitle} />
          <Field icon={Calendar} label="Joining Date" value={joiningDate} />
          {employee.manager && (
            <Field icon={User} label="Manager" value={employee.manager.fullName} />
          )}
        </div>

        {/* Account info */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400">Logged in as <span className="font-medium text-slate-600">{user?.email}</span></p>
        </div>
      </div>
    </div>
  );
}
