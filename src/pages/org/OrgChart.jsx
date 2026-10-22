import { useState, useEffect } from 'react';
import { Users, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';

const DEPT_COLORS = {
  Engineering:       { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
  Product:           { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
  Design:            { bg: 'bg-pink-100',   text: 'text-pink-700',   border: 'border-pink-200'   },
  Marketing:         { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  Sales:             { bg: 'bg-emerald-100',text: 'text-emerald-700',border: 'border-emerald-200'},
  Finance:           { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  'Human Resources': { bg: 'bg-rose-100',   text: 'text-rose-700',   border: 'border-rose-200'   },
  Operations:        { bg: 'bg-cyan-100',   text: 'text-cyan-700',   border: 'border-cyan-200'   },
  Legal:             { bg: 'bg-slate-100',  text: 'text-slate-700',  border: 'border-slate-200'  },
  'Customer Support':{ bg: 'bg-teal-100',   text: 'text-teal-700',   border: 'border-teal-200'   },
};
const DEFAULT_COLOR = { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };

function EmployeeCard({ emp }) {
  const color = DEPT_COLORS[emp.department] || DEFAULT_COLOR;
  return (
    <div className={`flex items-center gap-3 p-3 bg-white rounded-xl border ${color.border} shadow-sm hover:shadow-md transition-shadow`}>
      <div className={`w-10 h-10 rounded-xl ${color.bg} flex items-center justify-center ${color.text} font-bold text-sm flex-shrink-0`}>
        {emp.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{emp.fullName}</p>
        <p className="text-xs text-slate-500 truncate">{emp.jobTitle}</p>
        <Badge status={emp.status} className="mt-0.5" />
      </div>
    </div>
  );
}

function DepartmentGroup({ department, employees, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const color = DEPT_COLORS[department] || DEFAULT_COLOR;

  return (
    <div className={`rounded-2xl border-2 ${color.border} overflow-hidden`}>
      {/* Dept Header */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-5 py-4 ${color.bg} hover:opacity-90 transition-opacity`}
        id={`dept-${department.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center ${color.text}`}>
            <Users size={16} />
          </div>
          <div className="text-left">
            <p className={`font-bold ${color.text}`}>{department}</p>
            <p className={`text-xs ${color.text} opacity-70`}>{employees.length} employee{employees.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {open ? <ChevronDown size={18} className={color.text} /> : <ChevronRight size={18} className={color.text} />}
      </button>

      {/* Employee Cards */}
      {open && (
        <div className="p-4 bg-slate-50 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {employees.map((emp) => (
            <EmployeeCard key={emp._id} emp={emp} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgChart() {
  const toast = useToast();
  const [departments, setDepartments] = useState({});
  const [loading, setLoading] = useState(true);
  const [totalEmployees, setTotalEmployees] = useState(0);

  const fetchOrg = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employees?limit=200&status=Active');
      const employees = res.data.data;
      setTotalEmployees(employees.length);

      // Group by department
      const grouped = employees.reduce((acc, emp) => {
        const dept = emp.department || 'Other';
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(emp);
        return acc;
      }, {});

      // Sort employees within each dept by job title
      Object.keys(grouped).forEach((d) => {
        grouped[d].sort((a, b) => a.jobTitle.localeCompare(b.jobTitle));
      });

      setDepartments(grouped);
    } catch {
      toast.error('Failed to load organization chart.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrg(); }, []);

  const sortedDepts = Object.keys(departments).sort();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Organization Chart</h2>
          <p className="page-subtitle">{totalEmployees} active employees across {sortedDepts.length} departments</p>
        </div>
        <button onClick={fetchOrg} className="btn-secondary" id="refresh-org-btn">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Department summary pills */}
      {!loading && (
        <div className="flex flex-wrap gap-2">
          {sortedDepts.map((dept) => {
            const color = DEPT_COLORS[dept] || DEFAULT_COLOR;
            return (
              <div key={dept} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${color.bg} ${color.text} text-xs font-medium border ${color.border}`}>
                <span>{dept}</span>
                <span className="bg-white/60 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {departments[dept].length}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Org Tree */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : sortedDepts.length === 0 ? (
        <div className="card text-center py-16">
          <Users size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No active employees found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDepts.map((dept, i) => (
            <DepartmentGroup
              key={dept}
              department={dept}
              employees={departments[dept]}
              defaultOpen={i < 3}
            />
          ))}
        </div>
      )}
    </div>
  );
}
