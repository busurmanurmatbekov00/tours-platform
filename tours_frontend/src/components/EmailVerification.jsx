import { useState, useEffect, useRef } from 'react';
import { requestEmailOtp, verifyEmailOtp } from '../api/auth';
import { isAllowedEmailDomain } from '../utils/allowedEmailDomains';

const COOLDOWN_SECONDS = 100;

export default function EmailVerification({ email, onEmailChange, onVerified, verified }) {
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);
  const [codeSent, setCodeSent] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (cooldown <= 0) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [cooldown > 0]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const domainAllowed = emailValid && isAllowedEmailDomain(email);

  const sendCode = async () => {
    setError(null);
    if (!emailValid || !domainAllowed) {
      setError('Пожалуйста, используйте надежный почтовый сервис (Gmail, Mail.ru и др.)');
      return;
    }
    setSending(true);
    try {
      await requestEmailOtp(email);
      setCodeSent(true);
      setCooldown(COOLDOWN_SECONDS);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 429) {
        setError(detail || 'Повторный запрос будет доступен позже.');
        if (err.response?.data?.retry_after) {
          setCooldown(err.response.data.retry_after);
        }
      } else {
        setError(detail || 'Не удалось отправить код. Попробуйте позже.');
      }
    } finally {
      setSending(false);
    }
  };

  const checkCode = async () => {
    setError(null);
    if (code.length !== 5) {
      setError('Введите код из 5 цифр');
      return;
    }
    setChecking(true);
    try {
      await verifyEmailOtp(email, code);
      onVerified(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Неверный код подтверждения');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Email</label>
      <div className="flex gap-2">
        <input
          type="email"
          required
          readOnly={verified}
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className={`flex-1 px-3 py-2 border rounded-md focus:outline-none ${
            verified ? 'bg-gray-100 border-gray-200 text-gray-500' : 'border-gray-300 focus:border-blue-500'
          }`}
        />
        {!verified && (
          <button
            type="button"
            onClick={sendCode}
            disabled={sending || cooldown > 0 || !emailValid}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {cooldown > 0
              ? `Повтор через ${cooldown}с`
              : sending
              ? '...'
              : codeSent
              ? 'Отправить снова'
              : 'Получить код'}
          </button>
        )}
        {verified && (
          <span className="px-4 py-2 text-sm font-medium bg-emerald-50 text-emerald-700 rounded-md whitespace-nowrap">
            ✓ Подтверждено
          </span>
        )}
      </div>

      {codeSent && !verified && (
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={5}
            placeholder="Код из 5 цифр"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 tracking-widest"
          />
          <button
            type="button"
            onClick={checkCode}
            disabled={checking || code.length !== 5}
            className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap"
          >
            {checking ? '...' : 'Проверить код'}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}