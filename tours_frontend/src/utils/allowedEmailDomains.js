export const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com', 'mail.ru', 'yandex.ru',
];

export function isAllowedEmailDomain(email) {
  const parts = email.toLowerCase().trim().split('@');
  if (parts.length !== 2) return false;
  return ALLOWED_EMAIL_DOMAINS.includes(parts[1]);
}