import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, Clock, CalendarOff, TrendingUp,
  ArrowRight, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/ui/Badge';
import { StatCardSkeleton, ChartSkeleton } from '../../components/ui/Skeleton';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

function StatCard({ icon: Icon, label, value, sub, color, onClick }) {
  return (
    <div className="stat-card" onClick={onClick}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-slate-900">{value ?? '—'}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-slate-600 capitalize">{p.dataKey}: {p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard/stats');
      setData(res.data.data);
    } catch (err) {
      setError('Failed to load dashboard data.');
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div><h2 className="page-title">Dashboard</h2><p className="page-subtitle">Overview of your organization</p></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartSkeleton height={250} />
          <ChartSkeleton height={250} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={fetchStats} className="btn-primary">
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  const { stats, departmentStats, attendanceTrend, recentEmployees, recentLeaves } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Overview of your organization — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <button onClick={fetchStats} className="btn-secondary" id="refresh-dashboard-btn">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Employees"
          value={stats.totalEmployees}
          sub={`${stats.activeEmployees} active`}
          color="bg-indigo-500"
          onClick={() => navigate('/employees')}
        />
        <StatCard
          icon={UserCheck}
          label="Present Today"
          value={stats.presentToday}
          sub={`${stats.attendanceRate}% attendance rate`}
          color="bg-emerald-500"
          onClick={() => navigate('/attendance')}
        />
        <StatCard
          icon={CalendarOff}
          label="Pending Leaves"
          value={stats.pendingLeaves}
          sub="Awaiting review"
          color="bg-amber-500"
          onClick={() => navigate('/leaves')}
        />
        <StatCard
          icon={TrendingUp}
          label="Active Employees"
          value={stats.activeEmployees}
          sub={`of ${stats.totalEmployees} total`}
          color="bg-violet-500"
          onClick={() => navigate('/employees?status=Active')}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attendance Trend */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">Attendance Trend (Last 7 Days)</h3>
          {attendanceTrend.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">No attendance data available yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendanceTrend} margin={{ top: 0, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="present" name="Present" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" name="Absent" fill="#fca5a5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="onLeave" name="On Leave" fill="#fcd34d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Department distribution */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">Department Distribution</h3>
          {departmentStats.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">No department data available yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={departmentStats}
                  dataKey="count"
                  nameKey="department"
                  cx="40%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={45}
                >
                  {departmentStats.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [v, name]} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Employees */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Recent Employees</h3>
            <button onClick={() => navigate('/employees')} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>
          {recentEmployees.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No employees added yet.</p>
          ) : (
            <div className="space-y-3">
              {recentEmployees.map((emp) => (
                <div key={emp._id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
                    {emp.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{emp.fullName}</p>
                    <p className="text-xs text-slate-400 truncate">{emp.jobTitle} · {emp.department}</p>
                  </div>
                  <Badge status={emp.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Leave Requests */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Recent Leave Requests</h3>
            <button onClick={() => navigate('/leaves')} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>
          {recentLeaves.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No leave requests yet.</p>
          ) : (
            <div className="space-y-3">
              {recentLeaves.map((leave) => (
                <div key={leave._id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-sm flex-shrink-0">
                    {leave.employee?.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{leave.employee?.fullName}</p>
                    <p className="text-xs text-slate-400">{leave.leaveType} · {leave.totalDays}d</p>
                  </div>
                  <Badge status={leave.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
