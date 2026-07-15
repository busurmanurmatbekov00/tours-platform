import { useState } from 'react';
import { X } from 'lucide-react';
import { requestEmailChange, verifyEmailChange } from '../api/provider';
import { isAllowedEmailDomain } from '../utils/allowedEmailDomains';

export default function EmailChangeModal({ onClose, onChanged }) {
  const [newEmail, setNewEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'code'
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    setError(null);
    if (!isAllowedEmailDomain(newEmail)) {
      setError('Пожалуйста, используйте надежный почтовый сервис (Gmail, Mail.ru и др.)');
      return;
    }
    setLoading(true);
    try {
      await requestEmailChange(newEmail);
      setStep('code');
    } catch (err) {
      setError(err.response?.data?.detail || 'Не удалось отправить код.');
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async () => {
    setError(null);
    if (code.length !== 5) {
      setError('Введите код из 5 цифр');
      return;
    }
    setLoading(true);
    try {
      const result = await verifyEmailChange(code);
      onChanged(result.new_email);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Неверный код.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Смена email</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {step === 'email' ? (
          <>
            <input
              type="email"
              placeholder="Новый email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              onClick={sendCode}
              disabled={loading || !newEmail}
              className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '...' : 'Получить код'}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600">Код отправлен на {newEmail}</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder="Код из 5 цифр"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 tracking-widest"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              onClick={confirmCode}
              disabled={loading || code.length !== 5}
              className="w-full px-4 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? '...' : 'Подтвердить'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}