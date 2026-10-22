import { Mail, Phone, Briefcase, Calendar, Building2, User } from 'lucide-react';
import Badge from '../../components/ui/Badge';

const Field = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
      <Icon size={14} className="text-slate-500" />
    </div>
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value || '—'}</p>
    </div>
  </div>
);

export default function EmployeeDetail({ employee }) {
  const joiningDate = employee.joiningDate
    ? new Date(employee.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div className="space-y-5">
      {/* Avatar + name */}
      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">
          {employee.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">{employee.fullName}</h3>
          <p className="text-sm text-slate-500">{employee.jobTitle}</p>
          <div className="flex gap-2 mt-1.5">
            <Badge status={employee.status} />
            <Badge status={employee.employmentType} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field icon={User} label="Employee ID" value={employee.employeeId} />
        <Field icon={Mail} label="Email" value={employee.email} />
        <Field icon={Phone} label="Phone" value={employee.phone} />
        <Field icon={Building2} label="Department" value={employee.department} />
        <Field icon={Briefcase} label="Job Title" value={employee.jobTitle} />
        <Field icon={Calendar} label="Joining Date" value={joiningDate} />
        {employee.manager && (
          <Field icon={User} label="Manager" value={employee.manager.fullName} />
        )}
      </div>
    </div>
  );
}
