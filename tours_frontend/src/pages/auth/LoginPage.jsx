import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../../api/auth';
import { useAppStore } from '../../store/useAppStore';
import { useT } from '../../hooks/useT';

export default function LoginPage() {
  const { t } = useT();
  const navigate = useNavigate();
  const setAuth = useAppStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login(email, password);
      setAuth({ access: data.access, refresh: data.refresh, user: data.user });
      if (data.user.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.auth.login_title}</h1>
      <form onSubmit={onSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.email}</label>
          <input
            type="email" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.password}</label>
          <input
            type="password" required
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button
          type="submit" disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '...' : t.auth.submit_login}
        </button>
        <p className="text-sm text-gray-600 text-center">
          {t.auth.no_account}{' '}
          <Link to="/register" className="text-blue-600 hover:underline">{t.auth.sign_up}</Link>
        </p>
      </form>
    </div>
  );
}