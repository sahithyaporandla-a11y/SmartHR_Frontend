const statusConfig = {
  // Employee status
  Active: 'badge-green',
  Inactive: 'badge-slate',
  'On Leave': 'badge-yellow',
  Terminated: 'badge-red',
  // Leave status
  Pending: 'badge-yellow',
  Approved: 'badge-green',
  Rejected: 'badge-red',
  Cancelled: 'badge-slate',
  // Attendance status
  Present: 'badge-green',
  Absent: 'badge-red',
  Late: 'badge-yellow',
  'Half Day': 'badge-blue',
  // Employment type
  'Full-time': 'badge-blue',
  'Part-time': 'badge-purple',
  Contract: 'badge-yellow',
  Intern: 'badge-slate',
};

export default function Badge({ status, text, className = '' }) {
  const label = text || status;
  const cls = statusConfig[status] || 'badge-slate';
  return <span className={`${cls} ${className}`}>{label}</span>;
}
