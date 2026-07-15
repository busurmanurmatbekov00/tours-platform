import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerProvider } from '../../api/auth';
import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../hooks/useT';
import PhoneInput from '../../components/PhoneInput';
import EmailVerification from '../../components/EmailVerification';

export default function RegisterPage() {
  const { t } = useT();
  const navigate = useNavigate();
  const setAuth = useAppStore((s) => s.setAuth);

  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '+996',
    display_name: '',
    role_code: 'guide',
  });
  const [emailVerified, setEmailVerified] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const isGuide = form.role_code === 'guide';

  const change = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // если пользователь меняет email после подтверждения — сбрасываем верификацию
  const handleEmailChange = (val) => {
    setForm((f) => ({ ...f, email: val }));
    if (emailVerified) setEmailVerified(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!emailVerified) {
      setError('Подтвердите email перед регистрацией.');
      return;
    }

    const phoneDigits = form.phone.replace('+996', '');
    if (phoneDigits.length > 0 && phoneDigits.length < 9) {
      setError('Номер телефона должен состоять из 9 цифр после кода +996');
      return;
    }

    setLoading(true);
    try {
      const payload = { ...form };
      if (isGuide) delete payload.display_name;

      const data = await registerProvider(payload);
      setAuth({ access: data.access, refresh: data.refresh, user: data.user });
      navigate('/dashboard');
    } catch (err) {
      const resp = err.response?.data;
      setError(typeof resp === 'object' ? JSON.stringify(resp) : 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.auth.register_title}</h1>
      <form onSubmit={onSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.role}</label>
          <select
            value={form.role_code} onChange={change('role_code')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
          >
            <option value="guide">{t.auth.role_guide}</option>
            <option value="tour_operator">{t.auth.role_tour_operator}</option>
            <option value="travel_agent">{t.auth.role_travel_agent}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.full_name}</label>
          <input type="text" required value={form.full_name} onChange={change('full_name')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500" />
        </div>

        {!isGuide && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.display_name}</label>
            <input type="text" required value={form.display_name} onChange={change('display_name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500" />
          </div>
        )}

        <EmailVerification
          email={form.email}
          onEmailChange={handleEmailChange}
          verified={emailVerified}
          onVerified={setEmailVerified}
        />

        <PhoneInput
          label={t.auth.phone}
          value={form.phone}
          onChange={(val) => setForm({ ...form, phone: val })}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.password}</label>
          <input type="password" required minLength={8} value={form.password} onChange={change('password')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500" />
        </div>

        {error && <div className="text-sm text-red-600 break-words">{error}</div>}

        <button
          type="submit"
          disabled={loading || !emailVerified}
          className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '...' : !emailVerified ? 'Сначала подтвердите email' : t.auth.submit_register}
        </button>

        <p className="text-sm text-gray-600 text-center">
          {t.auth.have_account}{' '}
          <Link to="/login" className="text-blue-600 hover:underline">{t.auth.sign_in}</Link>
        </p>
      </form>
    </div>
  );
}