import { useForm } from 'react-hook-form';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

const LEAVE_TYPES = ['Annual', 'Sick', 'Maternity', 'Paternity', 'Unpaid', 'Emergency', 'Other'];

export default function LeaveForm({ onSuccess, onCancel }) {
  const toast = useToast();
  const today = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { leaveType: 'Annual' } });

  const startDate = watch('startDate');

  const onSubmit = async (data) => {
    try {
      await api.post('/leaves', data);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit leave request.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="form-group">
        <label htmlFor="leaveType">Leave Type <span className="text-red-500">*</span></label>
        <select id="leaveType" {...register('leaveType', { required: 'Leave type is required' })}>
          {LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        {errors.leaveType && <p className="form-error">{errors.leaveType.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="startDate">Start Date <span className="text-red-500">*</span></label>
          <input
            id="startDate"
            type="date"
            min={today}
            {...register('startDate', { required: 'Start date is required' })}
          />
          {errors.startDate && <p className="form-error">{errors.startDate.message}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="endDate">End Date <span className="text-red-500">*</span></label>
          <input
            id="endDate"
            type="date"
            min={startDate || today}
            {...register('endDate', {
              required: 'End date is required',
              validate: (v) => !startDate || v >= startDate || 'End date must be after start date',
            })}
          />
          {errors.endDate && <p className="form-error">{errors.endDate.message}</p>}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="reason">Reason <span className="text-red-500">*</span></label>
        <textarea
          id="reason"
          rows={3}
          placeholder="Describe the reason for your leave..."
          className="resize-none"
          {...register('reason', {
            required: 'Reason is required',
            maxLength: { value: 500, message: 'Max 500 characters' },
          })}
        />
        {errors.reason && <p className="form-error">{errors.reason.message}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary" id="leave-form-cancel">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="btn-primary" id="leave-form-submit">
          {isSubmitting ? <><span className="spinner" /> Submitting...</> : 'Submit Request'}
        </button>
      </div>
    </form>
  );
}
