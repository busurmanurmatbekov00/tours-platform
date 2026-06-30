import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { useT } from '../hooks/useT';

const CONFIG = {
  not_submitted: { Icon: AlertCircle, color: 'bg-gray-100 text-gray-700 border-gray-200' },
  pending:       { Icon: Clock,        color: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved:      { Icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected:      { Icon: XCircle,      color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export default function StatusBadge({ status }) {
  const { t } = useT();
  const cfg = CONFIG[status] || CONFIG.not_submitted;
  const Icon = cfg.Icon;
  const label = t.dashboard[`status_${status}`] || status;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border ${cfg.color}`}>
      <Icon size={14} />
      {label}
    </span>
  );
}