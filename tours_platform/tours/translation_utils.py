from deep_translator import GoogleTranslator


def auto_translate(text: str, source: str = 'ru', target: str = 'en') -> str:
    """Переводит текст. При ошибке возвращает пустую строку, не роняя запрос."""
    if not text or not text.strip():
        return ''
    try:
        return GoogleTranslator(source=source, target=target).translate(text)
    except Exception as e:
        print(f'Translation error: {e}')
        return ''