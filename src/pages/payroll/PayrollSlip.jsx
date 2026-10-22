import { Building2, Briefcase, Mail, Phone, Calendar, CreditCard } from 'lucide-react';
import Badge from '../../components/ui/Badge';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const Row = ({ label, value, bold, color }) => (
  <div className={`flex justify-between py-1.5 ${bold ? 'font-semibold' : ''}`}>
    <span className="text-slate-500 text-sm">{label}</span>
    <span className={`text-sm tabular-nums ${color || 'text-slate-800'}`}>{value}</span>
  </div>
);

export default function PayrollSlip({ payroll: p }) {
  const emp = p.employee || {};
  const joiningDate = emp.joiningDate
    ? new Date(emp.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  const totalAllowances = (p.allowances?.housing || 0) + (p.allowances?.transport || 0) +
    (p.allowances?.medical || 0) + (p.allowances?.other || 0);

  return (
    <div className="space-y-4" id="payslip-content">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-lg">SmartHR</h3>
            <p className="text-indigo-200 text-xs">Human Resource Management System</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">{MONTHS[p.month - 1]} {p.year}</p>
            <p className="text-indigo-200 text-xs">Payslip</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-indigo-500">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-lg">
            {emp.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="font-bold text-base">{emp.fullName}</p>
            <p className="text-indigo-200 text-xs">{emp.jobTitle} · {emp.department}</p>
            <p className="text-indigo-300 text-xs font-mono">{emp.employeeId}</p>
          </div>
          <div className="ml-auto">
            <Badge status={p.status} text={p.status} className={p.status === 'Paid' ? 'badge-green' : 'badge-yellow'} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Earnings */}
        <div className="card">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">💰 Earnings</p>
          <div className="divide-y divide-slate-50">
            <Row label="Basic Salary" value={fmt(p.basicSalary)} />
            {p.allowances?.housing > 0   && <Row label="Housing Allowance"    value={fmt(p.allowances.housing)} />}
            {p.allowances?.transport > 0 && <Row label="Transport Allowance"  value={fmt(p.allowances.transport)} />}
            {p.allowances?.medical > 0   && <Row label="Medical Allowance"    value={fmt(p.allowances.medical)} />}
            {p.allowances?.other > 0     && <Row label="Other Allowances"     value={fmt(p.allowances.other)} />}
            {p.bonus > 0                 && <Row label="Bonus"                value={fmt(p.bonus)} color="text-emerald-600" />}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200">
            <Row label="Total Gross" value={fmt(p.grossSalary)} bold color="text-indigo-700" />
          </div>
        </div>

        {/* Deductions */}
        <div className="card">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">📉 Deductions</p>
          <div className="divide-y divide-slate-50">
            {p.deductions?.tax > 0        && <Row label="Income Tax"          value={fmt(p.deductions.tax)} color="text-red-500" />}
            {p.deductions?.insurance > 0  && <Row label="Insurance"           value={fmt(p.deductions.insurance)} color="text-red-500" />}
            {p.deductions?.other > 0      && <Row label="Other Deductions"    value={fmt(p.deductions.other)} color="text-red-500" />}
            {p.leaveDaysDeducted > 0      && <Row label={`Leave Deduction (${p.leaveDaysDeducted}d)`} value={fmt((p.basicSalary / 30) * p.leaveDaysDeducted)} color="text-red-500" />}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200">
            <Row label="Total Deductions" value={fmt(p.totalDeductions)} bold color="text-red-600" />
          </div>
        </div>
      </div>

      {/* Net Pay */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-emerald-700 font-medium">Net Pay</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              {p.paymentDate ? `Paid on ${new Date(p.paymentDate).toLocaleDateString()}` : 'Pending payment'}
            </p>
          </div>
          <p className="text-3xl font-bold text-emerald-700">{fmt(p.netSalary)}</p>
        </div>
      </div>

      {p.notes && (
        <p className="text-xs text-slate-500 italic">Note: {p.notes}</p>
      )}
    </div>
  );
}
