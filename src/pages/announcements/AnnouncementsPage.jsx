import { useState, useEffect, useCallback } from 'react';
import { Plus, Megaphone, Trash2, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { useForm } from 'react-hook-form';

const PRIORITY_CONFIG = {
  Normal:    { cls: 'border-l-4 border-slate-300',   badge: 'badge-slate',  icon: '📢' },
  Important: { cls: 'border-l-4 border-amber-400',   badge: 'badge-yellow', icon: '⚠️' },
  Urgent:    { cls: 'border-l-4 border-red-500',     badge: 'badge-red',    icon: '🚨' },
};

function AnnouncementCard({ ann, isAdmin, onDelete }) {
  const cfg = PRIORITY_CONFIG[ann.priority] || PRIORITY_CONFIG.Normal;
  const timeAgo = new Date(ann.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className={`bg-white rounded-xl p-5 shadow-sm ${cfg.cls} transition-shadow hover:shadow-md`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-base">{cfg.icon}</span>
            <h3 className="font-semibold text-slate-900">{ann.title}</h3>
            <span className={`${cfg.badge} text-xs`}>{ann.priority}</span>
            {ann.targetAudience !== 'All' && (
              <span className="badge-blue text-xs">{ann.targetAudience} Only</span>
            )}
          </div>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
            <span>📅 {timeAgo}</span>
            {ann.expiresAt && <span>⏳ Expires {new Date(ann.expiresAt).toLocaleDateString()}</span>}
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => onDelete(ann)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
            title="Remove"
            id={`delete-ann-${ann._id}`}
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

function AnnouncementForm({ onSuccess, onCancel }) {
  const toast = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { priority: 'Normal', targetAudience: 'All' },
  });

  const onSubmit = async (data) => {
    try {
      await api.post('/announcements', data);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post announcement.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="form-group">
        <label htmlFor="ann-title">Title <span className="text-red-500">*</span></label>
        <input id="ann-title" type="text" placeholder="e.g. Office Holiday Notice" {...register('title', { required: 'Title is required' })} />
        {errors.title && <p className="form-error">{errors.title.message}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="ann-content">Message <span className="text-red-500">*</span></label>
        <textarea id="ann-content" rows={4} className="resize-none" placeholder="Write your announcement here..."
          {...register('content', { required: 'Content is required', maxLength: { value: 2000, message: 'Max 2000 chars' } })} />
        {errors.content && <p className="form-error">{errors.content.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label htmlFor="ann-priority">Priority</label>
          <select id="ann-priority" {...register('priority')}>
            <option>Normal</option>
            <option>Important</option>
            <option>Urgent</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="ann-audience">Audience</label>
          <select id="ann-audience" {...register('targetAudience')}>
            <option value="All">All Staff</option>
            <option value="Employee">Employees Only</option>
            <option value="Admin">Admins Only</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="ann-expires">Expires On (optional)</label>
        <input id="ann-expires" type="date" {...register('expiresAt')} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary" id="ann-cancel">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="btn-primary" id="ann-submit">
          {isSubmitting ? <><span className="spinner" /> Posting...</> : '📢 Post Announcement'}
        </button>
      </div>
    </form>
  );
}

export default function AnnouncementsPage() {
  const toast = useToast();
  const { isAdmin } = useAuth();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/announcements?limit=50');
      setAnnouncements(res.data.data);
    } catch {
      toast.error('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const handleDelete = async () => {
    try {
      await api.delete(`/announcements/${deleteTarget._id}`);
      toast.success('Announcement removed.');
      setDeleteTarget(null);
      fetchAnnouncements();
    } catch { toast.error('Failed to remove announcement.'); }
  };

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h2 className="page-title">Announcements</h2>
          <p className="page-subtitle">{announcements.length} active notices</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAnnouncements} className="btn-secondary" id="refresh-ann-btn"><RefreshCw size={15} /></button>
          {isAdmin && (
            <button onClick={() => setShowForm(true)} className="btn-primary" id="post-ann-btn">
              <Plus size={16} /> Post Announcement
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements"
          description={isAdmin ? "Post the first company announcement." : "No active announcements from HR."}
          action={isAdmin && <button onClick={() => setShowForm(true)} className="btn-primary btn-sm"><Plus size={14} /> Post Announcement</button>}
        />
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <AnnouncementCard
              key={ann._id}
              ann={ann}
              isAdmin={isAdmin}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Post Announcement">
        <AnnouncementForm onSuccess={() => { setShowForm(false); fetchAnnouncements(); toast.success('Announcement posted!'); }} onCancel={() => setShowForm(false)} />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Announcement"
        message={`Remove "${deleteTarget?.title}"? It will no longer be visible to staff.`}
        confirmText="Remove"
        danger
      />
    </div>
  );
}
