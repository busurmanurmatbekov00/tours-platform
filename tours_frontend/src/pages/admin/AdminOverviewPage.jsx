import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Map, Users, Clock } from 'lucide-react';
import { useT } from '../../hooks/useT';
import { getAdminVerificationList, getAdminTours, getAdminProviders } from '../../api/admin';

export default function AdminOverviewPage() {
    const { t } = useT();

    const { data: requests = [] } = useQuery({
        queryKey: ['admin-verification'], queryFn: getAdminVerificationList,
    });
    const { data: toursResponse } = useQuery({
        queryKey: ['admin-tours'], queryFn: () => getAdminTours(),
    });
    const tours = toursResponse?.results || toursResponse || [];

    const { data: providersResponse } = useQuery({
        queryKey: ['admin-providers'], queryFn: () => getAdminProviders(),
    });
    const providers = providersResponse?.results || providersResponse || [];

  const pendingRequests = requests.filter((r) => r.status_code === 'pending').length;
  const pendingTours = tours.filter((tr) => tr.status === 'pending_review').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.admin_panel.overview_title}</h1>
        <p className="text-gray-500">{t.admin_panel.overview_sub}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Clock} label={t.admin_panel.stat_pending_verif} value={pendingRequests} gradient="from-amber-500 to-orange-500" />
        <StatCard icon={Map} label={t.admin_panel.stat_pending_tours} value={pendingTours} gradient="from-blue-500 to-cyan-500" />
        <StatCard icon={Users} label={t.admin_panel.stat_providers} value={providers.length} gradient="from-emerald-500 to-teal-500" />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, gradient }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-3`}>
        <Icon size={22} />
      </div>
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}