import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Megaphone, Clock, CalendarOff, DollarSign,
  User, GitBranch, ArrowRight, RefreshCw,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Skeleton } from '../../components/ui/Skeleton';

/* ─── Priority styling ──────────────────────────────────────── */
const PRIORITY_CONFIG = {
  Normal:    { border: 'border-l-4 border-slate-300',  badge: 'bg-slate-100 text-slate-600',   icon: '📢' },
  Important: { border: 'border-l-4 border-amber-400',  badge: 'bg-amber-100 text-amber-700',   icon: '⚠️' },
  Urgent:    { border: 'border-l-4 border-red-500',    badge: 'bg-red-100 text-red-700',       icon: '🚨' },
};

/* ─── Single announcement card ──────────────────────────────── */
function AnnCard({ ann }) {
  const cfg = PRIORITY_CONFIG[ann.priority] || PRIORITY_CONFIG.Normal;
  const date = new Date(ann.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm ${cfg.border} transition-shadow hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4 className="font-semibold text-slate-900 text-sm">{ann.title}</h4>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}>
              {ann.priority}
            </span>
            {ann.targetAudience !== 'All' && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {ann.targetAudience} Only
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
          <div className="mt-2 flex gap-3 text-xs text-slate-400">
            <span>📅 {date}</span>
            {ann.expiresAt && (
              <span>⏳ Expires {new Date(ann.expiresAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Quick-action card ─────────────────────────────────────── */
function QuickCard({ icon: Icon, label, desc, color, to, id }) {
  const navigate = useNavigate();
  return (
    <button
      id={id}
      onClick={() => navigate(to)}
      className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-left flex items-center gap-3 w-full group"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm">{label}</p>
        <p className="text-xs text-slate-400 truncate">{desc}</p>
      </div>
      <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
    </button>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function EmployeeHome() {
  const { user } = useAuth();
  const toast = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const firstName = user?.employee?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/announcements?limit=20');
      setAnnouncements(res.data.data);
    } catch {
      toast.error('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const quickLinks = [
    { icon: Clock,       label: 'My Attendance', desc: 'View & manage check-ins',    color: 'bg-indigo-500',  to: '/my-attendance', id: 'home-btn-attendance' },
    { icon: CalendarOff, label: 'My Leaves',     desc: 'Apply or track leave',       color: 'bg-amber-500',   to: '/my-leaves',     id: 'home-btn-leaves'     },
    { icon: DollarSign,  label: 'My Payslips',   desc: 'View salary & payslips',     color: 'bg-emerald-500', to: '/my-payroll',    id: 'home-btn-payroll'    },
    { icon: User,        label: 'My Profile',    desc: 'Update your information',    color: 'bg-violet-500',  to: '/my-profile',    id: 'home-btn-profile'    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">
            {greeting}, {firstName}! 👋
          </h2>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={fetchAnnouncements} className="btn-secondary" id="home-refresh-btn">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Quick links */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Access</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickLinks.map((q) => (
            <QuickCard key={q.to} {...q} />
          ))}
        </div>
      </div>

      {/* Announcements feed */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Megaphone size={14} />
            Latest Announcements
            {!loading && announcements.length > 0 && (
              <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full normal-case tracking-normal">
                {announcements.length}
              </span>
            )}
          </h3>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-xl p-10 shadow-sm text-center">
            <Megaphone size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-600">No active announcements</p>
            <p className="text-sm text-slate-400 mt-1">HR will post company notices here. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <AnnCard key={ann._id} ann={ann} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
