from rest_framework import serializers
from .models import Tour, TourType, DifficultyLevel


def _get_translation(translations, lang, field):
    """Ищет перевод на нужном языке, fallback на любой доступный."""
    tr = next((t for t in translations if t.language.code == lang), None)
    if tr is None and translations:
        tr = translations[0]
    return getattr(tr, field, None) if tr else None


def _build_media_url(file_path, request):
    """
    Строит полный URL к файлу.
    Если file_path — уже полный URL (http/https), возвращает как есть.
    Иначе — приклеивает /media/ и делает абсолютный URL через request.
    """
    if not file_path:
        return None
    if file_path.startswith(('http://', 'https://')):
        return file_path
    path = f'/media/{file_path}'
    return request.build_absolute_uri(path) if request else path


class CatalogTourTypeSerializer(serializers.ModelSerializer):
    """Тип тура для фильтра каталога — с переводами RU/EN."""
    name_ru = serializers.SerializerMethodField()
    name_en = serializers.SerializerMethodField()

    class Meta:
        model = TourType
        fields = ('id', 'code', 'icon', 'name_ru', 'name_en')

    def get_name_ru(self, obj):
        tr = next((t for t in obj.translations.all() if t.language.code == 'ru'), None)
        return tr.name if tr else obj.code

    def get_name_en(self, obj):
        tr = next((t for t in obj.translations.all() if t.language.code == 'en'), None)
        return tr.name if tr else obj.code


class CatalogDifficultySerializer(serializers.ModelSerializer):
    """Уровень сложности для фильтра."""
    name_ru = serializers.SerializerMethodField()
    name_en = serializers.SerializerMethodField()

    class Meta:
        model = DifficultyLevel
        fields = ('id', 'code', 'name_ru', 'name_en')

    def get_name_ru(self, obj):
        tr = next((t for t in obj.translations.all() if t.language.code == 'ru'), None)
        return tr.name if tr else obj.code

    def get_name_en(self, obj):
        tr = next((t for t in obj.translations.all() if t.language.code == 'en'), None)
        return tr.name if tr else obj.code


class CatalogTourCardSerializer(serializers.ModelSerializer):
    """
    Карточка тура для каталога — минимум данных, оптимизировано для списка.
    Возвращает title/summary сразу на обоих языках — фронт сам выберет нужный.
    """
    title = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()

    tour_type = serializers.SerializerMethodField()
    difficulty_level = serializers.SerializerMethodField()

    cover_photo = serializers.SerializerMethodField()
    provider = serializers.SerializerMethodField()

    class Meta:
        model = Tour
        fields = (
            'id', 'slug', 'is_custom',
            'price', 'currency_code',
            'duration_days', 'duration_hours',
            'title', 'summary',
            'tour_type', 'difficulty_level',
            'cover_photo', 'provider',
            'published_at',
        )

    def get_title(self, obj):
        translations = list(obj.translations.all())
        return {
            'ru': _get_translation(translations, 'ru', 'title'),
            'en': _get_translation(translations, 'en', 'title'),
        }

    def get_summary(self, obj):
        translations = list(obj.translations.all())
        return {
            'ru': _get_translation(translations, 'ru', 'summary'),
            'en': _get_translation(translations, 'en', 'summary'),
        }

    def get_tour_type(self, obj):
        tt = obj.tour_type
        translations = list(tt.translations.all())
        return {
            'id': tt.id,
            'code': tt.code,
            'name': {
                'ru': _get_translation(translations, 'ru', 'name'),
                'en': _get_translation(translations, 'en', 'name'),
            },
        }

    def get_difficulty_level(self, obj):
        dl = obj.difficulty_level
        translations = list(dl.translations.all())
        return {
            'id': dl.id,
            'code': dl.code,
            'name': {
                'ru': _get_translation(translations, 'ru', 'name'),
                'en': _get_translation(translations, 'en', 'name'),
            },
        }

    def get_cover_photo(self, obj):
        photos = list(obj.photos.all())
        cover = next((p for p in photos if p.is_cover), None) or (photos[0] if photos else None)
        if not cover:
            return None
        return _build_media_url(cover.file_path, self.context.get('request'))

    def get_provider(self, obj):
        p = obj.provider_profile
        return {
            'id': p.id,
            'slug': p.slug,
            'display_name': p.display_name,
            'is_verified': p.verification_status.code == 'approved',
        }


class CatalogTourDetailSerializer(CatalogTourCardSerializer):
    """
    Детальная страница тура — всё что нужно для просмотра тура туристом:
    карточка + фото галерея + маршрут + виза + страховка.
    """
    photos = serializers.SerializerMethodField()
    route_points = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    route_overview = serializers.SerializerMethodField()
    visa_details = serializers.SerializerMethodField()
    insurance_details = serializers.SerializerMethodField()

    class Meta(CatalogTourCardSerializer.Meta):
        fields = CatalogTourCardSerializer.Meta.fields + (
            'min_group_size', 'max_group_size',
            'description', 'route_overview',
            'photos', 'route_points',
            'visa_details', 'insurance_details',
        )

    def get_description(self, obj):
        translations = list(obj.translations.all())
        return {
            'ru': _get_translation(translations, 'ru', 'description'),
            'en': _get_translation(translations, 'en', 'description'),
        }

    def get_route_overview(self, obj):
        translations = list(obj.translations.all())
        return {
            'ru': _get_translation(translations, 'ru', 'route_overview'),
            'en': _get_translation(translations, 'en', 'route_overview'),
        }

    def get_photos(self, obj):
        request = self.context.get('request')
        result = []
        for p in obj.photos.all().order_by('sort_order', 'id'):
            result.append({
                'id': p.id,
                'url': _build_media_url(p.file_path, request),
                'is_cover': p.is_cover,
                'alt_text': p.alt_text,
                'sort_order': p.sort_order,
            })
        return result

    def get_route_points(self, obj):
        points = []
        for rp in obj.route_points.all().order_by('sequence_order'):
            loc = rp.location
            loc_translations = list(loc.translations.all())
            points.append({
                'id': rp.id,
                'sequence_order': rp.sequence_order,
                'day_number': rp.day_number,
                'notes': {'ru': rp.notes_ru, 'en': rp.notes_en},
                'location': {
                    'id': loc.id,
                    'latitude': str(loc.latitude),
                    'longitude': str(loc.longitude),
                    'elevation_m': loc.elevation_m,
                    'name': {
                        'ru': _get_translation(loc_translations, 'ru', 'name'),
                        'en': _get_translation(loc_translations, 'en', 'name'),
                    },
                },
            })
        return points

    def get_visa_details(self, obj):
        vd = getattr(obj, 'visa_details', None)
        if not vd:
            return None
        return {
            'requires_border_permit': vd.requires_border_permit,
            'requires_special_permit': vd.requires_special_permit,
            'notes': {'ru': vd.notes_ru, 'en': vd.notes_en},
        }

    def get_insurance_details(self, obj):
        ind = getattr(obj, 'insurance_details', None)
        if not ind:
            return None
        return {
            'is_insurance_required': ind.is_insurance_required,
            'min_medical_coverage': str(ind.min_medical_coverage) if ind.min_medical_coverage else None,
            'medical_currency': ind.medical_currency,
            'requires_evacuation': ind.requires_evacuation,
            'min_evacuation_coverage': str(ind.min_evacuation_coverage) if ind.min_evacuation_coverage else None,
            'evacuation_currency': ind.evacuation_currency,
            'notes': {'ru': ind.notes_ru, 'en': ind.notes_en},
        }