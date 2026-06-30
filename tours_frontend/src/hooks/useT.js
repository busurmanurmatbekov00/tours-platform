import { useAppStore } from '../store/useAppStore';
import { translations } from '../i18n/translations';

export function useT() {
  const lang = useAppStore((s) => s.language);
  return {
    t: translations[lang],
    lang,
  };
}