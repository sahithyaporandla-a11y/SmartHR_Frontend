import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Finance', 'Human Resources', 'Operations', 'Legal', 'Customer Support'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Intern'];
const STATUSES = ['Active', 'Inactive', 'On Leave', 'Terminated'];

export default function EmployeeForm({ employee, onSuccess, onCancel }) {
  const toast = useToast();
  const isEdit = !!employee;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: employee
      ? {
          ...employee,
          joiningDate: employee.joiningDate
            ? new Date(employee.joiningDate).toISOString().split('T')[0]
            : '',
        }
      : { employmentType: 'Full-time', status: 'Active' },
  });

  useEffect(() => {
    if (employee) {
      reset({
        ...employee,
        joiningDate: employee.joiningDate
          ? new Date(employee.joiningDate).toISOString().split('T')[0]
          : '',
      });
    }
  }, [employee, reset]);

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await api.put(`/employees/${employee._id}`, data);
      } else {
        await api.post('/employees', data);
      }
      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || 'An error occurred.';
      toast.error(msg);
    }
  };

  const F = ({ label, name, required, children }) => (
    <div className="form-group">
      <label htmlFor={name}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {errors[name] && <p className="form-error">{errors[name].message}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {!isEdit && (
          <F label="Employee ID" name="employeeId" required>
            <input
              id="employeeId"
              type="text"
              placeholder="EMP001"
              {...register('employeeId', { required: 'Employee ID is required' })}
            />
          </F>
        )}

        <F label="Full Name" name="fullName" required>
          <input
            id="fullName"
            type="text"
            placeholder="John Doe"
            {...register('fullName', { required: 'Full name is required' })}
          />
        </F>

        <F label="Email Address" name="email" required>
          <input
            id="email"
            type="email"
            placeholder="john@company.com"
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
            })}
          />
        </F>

        <F label="Phone Number" name="phone">
          <input id="phone" type="tel" placeholder="+1-555-0100" {...register('phone')} />
        </F>

        <F label="Department" name="department" required>
          <select id="department" {...register('department', { required: 'Department is required' })}>
            <option value="">Select department</option>
            {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </F>

        <F label="Job Title" name="jobTitle" required>
          <input
            id="jobTitle"
            type="text"
            placeholder="Software Engineer"
            {...register('jobTitle', { required: 'Job title is required' })}
          />
        </F>

        <F label="Employment Type" name="employmentType">
          <select id="employmentType" {...register('employmentType')}>
            {EMPLOYMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </F>

        <F label="Joining Date" name="joiningDate" required>
          <input
            id="joiningDate"
            type="date"
            {...register('joiningDate', { required: 'Joining date is required' })}
          />
        </F>

        <F label="Status" name="status">
          <select id="status" {...register('status')}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </F>

        {!isEdit && (
          <F label="Initial Password" name="password">
            <input
              id="password"
              type="text"
              placeholder="Leave empty for Employee@123"
              {...register('password')}
            />
          </F>
        )}

        <div className="sm:col-span-2">
          <F label="Profile Image URL (optional)" name="profileImage">
            <input id="profileImage" type="url" placeholder="https://..." {...register('profileImage')} />
          </F>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="btn-secondary" id="employee-form-cancel">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary" id="employee-form-submit">
          {isSubmitting ? <><span className="spinner" /> Saving...</> : isEdit ? 'Save Changes' : 'Add Employee'}
        </button>
      </div>
    </form>
  );
}
