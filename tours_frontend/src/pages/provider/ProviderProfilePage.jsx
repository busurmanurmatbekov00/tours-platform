import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Phone, Globe, MapPin, Check, Save, Camera, Trash2 } from 'lucide-react';
import { getMyProfile, updateMyProfile, uploadAvatar, deleteAvatar } from '../../api/provider';
import { useT } from '../../hooks/useT';
import StatusBadge from '../../components/StatusBadge';
import PageHeader from '../../components/PageHeader';
import EmailChangeModal from '../../components/EmailChangeModal';
import PhoneInput from '../../components/PhoneInput';

const LANGUAGE_OPTIONS = [
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
];

export default function ProviderProfilePage() {
  const { t } = useT();
  const qc = useQueryClient();
  const fileInputRef = useRef(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: getMyProfile,
  });

  const [form, setForm] = useState({
  display_name: '', website_url: '', address: '', bio: '', phone: '+996',
});
  const [selectedLangs, setSelectedLangs] = useState([]);
  const [saved, setSaved] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

useEffect(() => {
  if (profile) {
    setForm({
      display_name: profile.display_name || '',
      website_url: profile.website_url || '',
      address: profile.address || '',
      bio: profile.bio || '',
      phone: profile.contact_phone || '+996',
    });
    setSelectedLangs((profile.languages || []).map((l) => l.code));
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

  const avatarUpload = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      setAvatarError(null);
    },
    onError: (err) => setAvatarError(err.response?.data?.file || 'Ошибка загрузки'),
  });

  const avatarDelete = useMutation({
    mutationFn: deleteAvatar,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-profile'] }),
  });

  if (isLoading) return <Loading />;
  if (!profile) return <div className="text-gray-500">Профиль не найден.</div>;

  const change = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const toggleLang = (code) => {
    setSelectedLangs((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const submit = (e) => {
    e.preventDefault();
    const payload = { ...form, language_codes: selectedLangs };
    mutation.mutate(payload);
  };

  const onAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) avatarUpload.mutate(file);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t.dashboard.profile_title} subtitle={t.dashboard.profile_sub} />

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

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-5">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={36} className="text-gray-300" />
            )}
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUpload.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Camera size={16} />
                {avatarUpload.isPending ? '...' : t.dashboard.change_avatar}
              </button>
              {profile.avatar_url && (
                <button
                  type="button"
                  onClick={() => avatarDelete.mutate()}
                  disabled={avatarDelete.isPending}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onAvatarFileChange}
              className="hidden"
            />
            {avatarError && <p className="text-xs text-red-600">{avatarError}</p>}
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title={t.dashboard.basic_info} icon={User}>
          <Input
            label={t.auth.display_name}
            value={form.display_name}
            onChange={change('display_name')}
            icon={User}
            required
          />
          <Input
            label={t.dashboard.address}
            value={form.address}
            onChange={change('address')}
            icon={MapPin}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.dashboard.about_me}</label>
            <textarea
              rows={4}
              value={form.bio}
              onChange={change('bio')}
              placeholder={t.dashboard.about_me_placeholder}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.dashboard.languages}</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => toggleLang(lang.code)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    selectedLangs.includes(lang.code)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section title={t.dashboard.contacts} icon={Mail}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.dashboard.contact_email}</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  readOnly
                  value={profile.contact_email || ''}
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-100 border border-gray-200 rounded-lg text-gray-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(true)}
                className="px-4 py-2 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 whitespace-nowrap"
              >
                {t.dashboard.change_email}
              </button>
            </div>
          </div>

          <PhoneInput
             label={t.dashboard.contact_phone}
             value={form.phone}
             onChange={(val) => setForm({ ...form, phone: val })}
           />

          <Input
            label={t.dashboard.website}
            value={form.website_url}
            onChange={change('website_url')}
            icon={Globe}
            placeholder="https://"
          />
        </Section>

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

      {showEmailModal && (
        <EmailChangeModal
          onClose={() => setShowEmailModal(false)}
          onChanged={() => qc.invalidateQueries({ queryKey: ['my-profile'] })}
        />
      )}
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

function Input({ label, icon: Icon, hint, readOnly, ...rest }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        )}
        <input
          {...rest}
          readOnly={readOnly}
          className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 text-sm border rounded-lg focus:outline-none transition-colors ${
            readOnly
              ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
          }`}
        />
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
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