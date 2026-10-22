import { Users } from 'lucide-react';

export function EmptyState({ icon: Icon = Users, title, description, action }) {
  return (
    <div className="text-center py-16 px-6">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon size={24} className="text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 mb-4 max-w-xs mx-auto">{description}</p>
      {action}
    </div>
  );
}
