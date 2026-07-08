// Вытаскивает нужный язык из объекта {ru: '...', en: '...'}
export function loc(field, lang = 'ru') {
  if (!field) return '';
  return field[lang] ?? field.ru ?? field.en ?? '';
}