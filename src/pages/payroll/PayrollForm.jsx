import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const currentYear = new Date().getFullYear();

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

/* ─────────────────────────────────────────────────────────────────
   Field MUST live outside the parent component so React doesn't
   unmount/remount it on every render (which resets the input).
───────────────────────────────────────────────────────────────── */
function Field({ label, name, required, register, errors }) {
  return (
    <div className="form-group">
      <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={name}
        type="number"
        step="any"
        min=""
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
        {...register(name, {
          ...(required ? { required: `${label} is required` } : {}),
          valueAsNumber: true,
        })}
      />
      {errors?.[name] && <p className="form-error">{errors[name].message}</p>}
    </div>
  );
}

export default function PayrollForm({ onSuccess, onCancel }) {
  const toast = useToast();
  const [employees, setEmployees] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      employee: '',
      month: new Date().getMonth() + 1,
      year: currentYear,
      basicSalary: '',
      bonus: '',
      'allowances.housing': '',
      'allowances.transport': '',
      'allowances.medical': '',
      'allowances.other': '',
      'deductions.tax': '',
      'deductions.insurance': '',
      'deductions.other': '',
      leaveDaysDeducted: '',
      status: 'Processed',
      notes: '',
    },
  });

  /* Live calculation */
  const basicSalary = Number(watch('basicSalary') || 0);
  const housing     = Number(watch('allowances.housing') || 0);
  const transport   = Number(watch('allowances.transport') || 0);
  const medical     = Number(watch('allowances.medical') || 0);
  const otherAllow  = Number(watch('allowances.other') || 0);
  const bonus       = Number(watch('bonus') || 0);
  const tax         = Number(watch('deductions.tax') || 0);
  const insurance   = Number(watch('deductions.insurance') || 0);
  const otherDed    = Number(watch('deductions.other') || 0);
  const leaveDays   = Number(watch('leaveDaysDeducted') || 0);

  const gross    = basicSalary + housing + transport + medical + otherAllow + bonus;
  const leaveDed = (basicSalary / 30) * leaveDays;
  const totalDed = tax + insurance + otherDed + leaveDed;
  const net      = gross - totalDed;

  useEffect(() => {
    api.get('/employees?limit=100&status=Active')
      .then((r) => setEmployees(r.data.data))
      .catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    try {
      const payload = {
        employee: data.employee,
        month: Number(data.month),
        year: Number(data.year),
        basicSalary: Number(data.basicSalary),
        bonus: Number(data.bonus) || 0,
        allowances: {
          housing:   Number(data['allowances.housing'])   || 0,
          transport: Number(data['allowances.transport']) || 0,
          medical:   Number(data['allowances.medical'])   || 0,
          other:     Number(data['allowances.other'])     || 0,
        },
        deductions: {
          tax:       Number(data['deductions.tax'])       || 0,
          insurance: Number(data['deductions.insurance']) || 0,
          other:     Number(data['deductions.other'])     || 0,
        },
        leaveDaysDeducted: Number(data.leaveDaysDeducted) || 0,
        status: data.status,
        notes:  data.notes,
      };
      await api.post('/payroll', payload);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process payroll.');
    }
  };

  /* Shared props forwarded to every Field */
  const fp = { register, errors };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

      {/* ── Employee & Period ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="form-group sm:col-span-1">
          <label htmlFor="employee" className="block text-sm font-medium text-slate-700 mb-1">
            Employee <span className="text-red-500">*</span>
          </label>
          <select
            id="employee"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            {...register('employee', { required: 'Employee is required' })}
          >
            <option value="">Select employee</option>
            {employees.map((e) => (
              <option key={e._id} value={e._id}>
                {e.fullName} ({e.employeeId})
              </option>
            ))}
          </select>
          {errors.employee && <p className="form-error">{errors.employee.message}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="month" className="block text-sm font-medium text-slate-700 mb-1">
            Month <span className="text-red-500">*</span>
          </label>
          <select
            id="month"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            {...register('month')}
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="year" className="block text-sm font-medium text-slate-700 mb-1">
            Year <span className="text-red-500">*</span>
          </label>
          <select
            id="year"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            {...register('year')}
          >
            {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Earnings & Deductions ── */}
      <div className="grid grid-cols-2 gap-6">
        {/* Earnings */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">💰 Earnings</p>
          <Field label="Basic Salary"        name="basicSalary"         required {...fp} />
          <Field label="Housing Allowance"   name="allowances.housing"  {...fp} />
          <Field label="Transport Allowance" name="allowances.transport" {...fp} />
          <Field label="Medical Allowance"   name="allowances.medical"  {...fp} />
          <Field label="Other Allowances"    name="allowances.other"    {...fp} />
          <Field label="Bonus"               name="bonus"               {...fp} />
        </div>

        {/* Deductions */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">📉 Deductions</p>
          <Field label="Tax"               name="deductions.tax"       {...fp} />
          <Field label="Insurance"         name="deductions.insurance" {...fp} />
          <Field label="Other Deductions"  name="deductions.other"     {...fp} />
          <Field label="Unpaid Leave Days" name="leaveDaysDeducted"    {...fp} />
        </div>
      </div>

      {/* ── Live Calculation ── */}
      <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
        <p className="text-xs font-semibold text-indigo-700 mb-3">📊 Live Calculation</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-slate-500">Gross</p>
            <p className="text-lg font-bold text-indigo-700">{fmt(gross)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Deductions</p>
            <p className="text-lg font-bold text-red-600">{fmt(totalDed)}</p>
          </div>
          <div className="bg-white rounded-lg p-2">
            <p className="text-xs text-slate-500">Net Pay</p>
            <p className="text-xl font-bold text-emerald-700">{fmt(net)}</p>
          </div>
        </div>
      </div>

      {/* ── Status & Notes ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select
            id="status"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            {...register('status')}
          >
            {['Draft', 'Processed', 'Paid'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <input
            id="notes"
            type="text"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            placeholder="Optional notes..."
            {...register('notes')}
          />
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="btn-secondary" id="payroll-cancel">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary" id="payroll-submit">
          {isSubmitting ? <><span className="spinner" /> Saving...</> : 'Process Payroll'}
        </button>
      </div>
    </form>
  );
}
