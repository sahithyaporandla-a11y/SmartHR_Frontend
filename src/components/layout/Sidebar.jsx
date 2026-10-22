import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Clock, CalendarOff, DollarSign,
  GitBranch, Megaphone, LogOut, X, Briefcase, User, Home,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const adminLinks = [
  { group: 'Main', items: [
    { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/announcements',  icon: Megaphone,       label: 'Announcements' },
  ]},
  { group: 'People', items: [
    { to: '/employees',      icon: Users,           label: 'Employees' },
    { to: '/org-chart',      icon: GitBranch,       label: 'Org Chart' },
  ]},
  { group: 'Operations', items: [
    { to: '/attendance',     icon: Clock,           label: 'Attendance' },
    { to: '/leaves',         icon: CalendarOff,     label: 'Leave Requests' },
    { to: '/payroll',        icon: DollarSign,      label: 'Payroll' },
  ]},
];

const employeeLinks = [
  { group: 'My Workspace', items: [
    { to: '/home',          icon: Home,        label: 'Home' },
    { to: '/my-profile',    icon: User,        label: 'My Profile' },
    { to: '/my-attendance', icon: Clock,       label: 'My Attendance' },
    { to: '/my-leaves',     icon: CalendarOff, label: 'My Leaves' },
    { to: '/my-payroll',    icon: DollarSign,  label: 'My Payslips' },
  ]},
];


export default function Sidebar({ open, onClose }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const links = isAdmin ? adminLinks : employeeLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: 'linear-gradient(180deg, #0f1f3d 0%, #0d1b35 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Briefcase size={16} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">SmartHR</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-5 py-4">
          <div className="bg-white/5 rounded-lg px-3 py-2">
            <p className="text-slate-400 text-xs">Logged in as</p>
            <p className="text-white text-sm font-semibold truncate">{user?.employee?.fullName || user?.email}</p>
            <span className={`text-xs font-medium mt-0.5 inline-block ${isAdmin ? 'text-indigo-300' : 'text-emerald-300'}`}>
              {isAdmin ? '◆ Administrator' : '● Employee'}
            </span>
          </div>
        </div>

        {/* Nav links — grouped */}
        <nav className="flex-1 px-3 overflow-y-auto pb-2">
          {links.map(({ group, items }) => (
            <div key={group} className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-1.5">{group}</p>
              {items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
