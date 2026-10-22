import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import Login          from './pages/auth/Login';
import Dashboard      from './pages/dashboard/Dashboard';
import EmployeeList   from './pages/employees/EmployeeList';
import AttendancePage from './pages/attendance/Attendance';
import LeaveList      from './pages/leaves/LeaveList';
import Profile        from './pages/profile/Profile';
import PayrollList    from './pages/payroll/PayrollList';
import OrgChart       from './pages/org/OrgChart';
import AnnouncementsPage from './pages/announcements/AnnouncementsPage';
import EmployeeHome    from './pages/home/EmployeeHome';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Protected — Admin */}
            <Route element={<ProtectedRoute roles={['admin']}><Layout /></ProtectedRoute>}>
              <Route path="/dashboard"     element={<Dashboard />} />
              <Route path="/employees"     element={<EmployeeList />} />
              <Route path="/attendance"    element={<AttendancePage />} />
              <Route path="/leaves"        element={<LeaveList />} />
              <Route path="/payroll"       element={<PayrollList />} />
              <Route path="/org-chart"     element={<OrgChart />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
            </Route>

            {/* Protected — Employee */}
            <Route element={<ProtectedRoute roles={['employee']}><Layout /></ProtectedRoute>}>
              <Route path="/home"          element={<EmployeeHome />} />
              <Route path="/my-profile"    element={<Profile />} />
              <Route path="/my-attendance" element={<AttendancePage />} />
              <Route path="/my-leaves"     element={<LeaveList />} />
              <Route path="/my-payroll"    element={<PayrollList />} />
              <Route path="/org-chart"     element={<OrgChart />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
            </Route>

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

