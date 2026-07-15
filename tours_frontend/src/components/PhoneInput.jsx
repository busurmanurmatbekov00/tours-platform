import { useState } from 'react';

const PREFIX = '+996';
const DIGITS_COUNT = 9;

export default function PhoneInput({ value, onChange, error, label }) {
  const [touched, setTouched] = useState(false);

  // value хранится в родителе в формате "+996XXXXXXXXX" или ""
  const digitsOnly = value.startsWith(PREFIX) ? value.slice(PREFIX.length) : value;

  const handleChange = (e) => {
    // оставляем только цифры, обрезаем до 9 символов
    const raw = e.target.value.replace(/\D/g, '').slice(0, DIGITS_COUNT);
    onChange(PREFIX + raw);
  };

  const handleBlur = () => setTouched(true);

  const isIncomplete = touched && digitsOnly.length > 0 && digitsOnly.length < DIGITS_COUNT;
  const localError = isIncomplete
    ? 'Номер телефона должен состоять из 9 цифр после кода +996'
    : null;
  const displayError = error || localError;

  // визуально форматируем как "555 123 456"
  const formatted = digitsOnly.replace(/(\d{3})(\d{0,3})(\d{0,3})/, (_, a, b, c) =>
    [a, b, c].filter(Boolean).join(' ')
  );

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className={`flex items-center border rounded-md overflow-hidden focus-within:border-blue-500 ${
        displayError ? 'border-red-400' : 'border-gray-300'
      }`}>
        <span className="px-3 py-2 bg-gray-50 text-gray-600 text-sm border-r border-gray-300 select-none">
          {PREFIX}
        </span>
        <input
          type="tel"
          inputMode="numeric"
          value={formatted}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="555 123 456"
          className="flex-1 px-3 py-2 text-sm focus:outline-none"
        />
      </div>
      {displayError && (
        <p className="text-xs text-red-600 mt-1">{displayError}</p>
      )}
    </div>
  );
}