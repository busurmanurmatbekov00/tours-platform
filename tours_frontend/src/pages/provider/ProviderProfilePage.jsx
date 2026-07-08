import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Phone, Globe, MapPin, Check, Save } from 'lucide-react';
import { getMyProfile, updateMyProfile } from '../../api/provider';
import { useT } from '../../hooks/useT';
import StatusBadge from '../../components/StatusBadge';
import PageHeader from '../../components/PageHeader';

export default function ProviderProfilePage() {
  const { t } = useT();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: getMyProfile,
  });

  const [form, setForm] = useState({
    display_name: '', contact_email: '', contact_phone: '',
    website_url: '', address: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || '',
        contact_email: profile.contact_email || '',
        contact_phone: profile.contact_phone || '',
        website_url: profile.website_url || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (isLoading) return <Loading />;
  if (!profile) return <div className="text-gray-500">Профиль не найден.</div>;

  const change = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const submit = (e) => { e.preventDefault(); mutation.mutate(form); };

  return (
    <div className="space-y-6">
      <PageHeader title={t.dashboard.profile_title} subtitle={t.dashboard.profile_sub} />

      {/* Статусная карточка */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{t.dashboard.status}:</span>
            <StatusBadge status={profile.verification_status_code} />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">{t.dashboard.is_published}:</span>
            <span className={`font-semibold ${profile.is_published ? 'text-emerald-600' : 'text-gray-400'}`}>
              {profile.is_published ? `✓ ${t.dashboard.yes}` : t.dashboard.no}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Основная информация */}
        <Section title={t.dashboard.basic_info} icon={User}>
          <Input
            label={t.auth.display_name}
            value={form.display_name}
            onChange={change('display_name')}
            icon={User} required
          />
          <Input
            label={t.dashboard.address}
            value={form.address}
            onChange={change('address')}
            icon={MapPin}
          />
        </Section>

        {/* Контакты */}
        <Section title={t.dashboard.contacts} icon={Mail}>
          <Input
            label={t.dashboard.contact_email}
            type="email"
            value={form.contact_email}
            onChange={change('contact_email')}
            icon={Mail}
          />
          <Input
            label={t.dashboard.contact_phone}
            value={form.contact_phone}
            onChange={change('contact_phone')}
            icon={Phone}
          />
          <Input
            label={t.dashboard.website}
            value={form.website_url}
            onChange={change('website_url')}
            icon={Globe}
            placeholder="https://"
          />
        </Section>

        {/* Кнопка сохранить — на весь ряд */}
        <div className="lg:col-span-2 flex items-center gap-4">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            <Save size={18} />
            {mutation.isPending ? t.dashboard.saving : t.dashboard.save}
          </button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium animate-pulse">
              <Check size={18} /> {t.dashboard.saved}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white">
          <Icon size={18} />
        </div>
        <h2 className="font-bold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Input({ label, icon: Icon, ...rest }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        )}
        <input
          {...rest}
          className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors`}
        />
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-gray-200 rounded-lg w-1/3 animate-pulse" />
      <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
      <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
    </div>
  );
}