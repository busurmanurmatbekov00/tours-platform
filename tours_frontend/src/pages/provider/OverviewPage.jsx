import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck, Award, Map, FileCheck, Plus, ArrowRight, Sparkles,
} from 'lucide-react';
import { getMyProfile, getMyVerificationRequests, getMyTours, getMyCertificates } from '../../api/provider';
import { useT } from '../../hooks/useT';
import { useAppStore } from '../../store/useAppStore';
import StatusBadge from '../../components/StatusBadge';


export default function OverviewPage() {
  const { t } = useT();
  const user = useAppStore((s) => s.user);

  const { data: profile } = useQuery({ queryKey: ['my-profile'], queryFn: getMyProfile });
  const { data: requests = [] } = useQuery({
    queryKey: ['my-verification'], queryFn: getMyVerificationRequests,
  });
  const { data: tours = [] } = useQuery({
    queryKey: ['my-tours-count'],
    queryFn: () => getMyTours().then((res) => res.data),
  });
  const { data: certificates = [] } = useQuery({
    queryKey: ['my-certificates-count'], queryFn: getMyCertificates,
  });

  const docsCount = requests.reduce((acc, r) => acc + (r.documents?.length || 0), 0);
  const publishedToursCount = tours.filter((tour) => tour.status === 'published').length;

  return (
    <div className="space-y-6">
      {/* Hero-приветствие */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-12 -bottom-12 w-72 h-72 bg-pink-400/20 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-pink-200 text-sm font-medium mb-2">
            <Sparkles size={16} /> {t.dashboard.welcome}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {user?.full_name || user?.email} 👋
          </h1>
          <p className="text-indigo-100 max-w-xl">{t.dashboard.welcome_sub}</p>
        </div>
      </div>

      {/* Карточки статистики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ShieldCheck}
          label={t.dashboard.stat_status}
          gradient="from-blue-500 to-cyan-500"
          value={
            profile ? <StatusBadge status={profile.verification_status_code} /> : '—'
          }
        />
        <StatCard
          icon={Map}
          label={t.dashboard.stat_tours}
          gradient="from-emerald-500 to-teal-500"
          value={publishedToursCount}
        />
        <StatCard
          icon={Award}
          label={t.dashboard.stat_certificates}
          gradient="from-amber-500 to-orange-500"
          value={certificates.length}
        />
        <StatCard
          icon={FileCheck}
          label={t.dashboard.stat_documents}
          gradient="from-fuchsia-500 to-pink-500"
          value={docsCount}
        />
      </div>

      {/* Быстрые действия */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">{t.dashboard.quick_actions}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionCard
            to="/dashboard/tours"
            icon={Plus}
            iconBg="bg-gradient-to-br from-emerald-500 to-teal-500"
            title={t.dashboard.action_create_tour}
            sub={t.dashboard.action_create_tour_sub}
          />
          <ActionCard
            to="/dashboard/certificates"
            icon={Award}
            iconBg="bg-gradient-to-br from-amber-500 to-orange-500"
            title={t.dashboard.action_upload_cert}
            sub={t.dashboard.action_upload_cert_sub}
          />
          <ActionCard
            to="/dashboard/verification"
            icon={ShieldCheck}
            iconBg="bg-gradient-to-br from-blue-500 to-cyan-500"
            title={t.dashboard.action_submit_verif}
            sub={t.dashboard.action_submit_verif_sub}
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, gradient }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-3 shadow-md`}>
        <Icon size={22} />
      </div>
      <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function ActionCard({ to, icon: Icon, iconBg, title, sub }) {
  return (
    <Link
      to={to}
      className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center text-white shadow-md`}>
          <Icon size={22} />
        </div>
        <ArrowRight size={18} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
      </div>
      <div className="font-semibold text-gray-900 mb-1">{title}</div>
      <div className="text-sm text-gray-500">{sub}</div>
    </Link>
  );
}   