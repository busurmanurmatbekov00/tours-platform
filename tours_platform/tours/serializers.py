from rest_framework import serializers
from .models import (
    Tour, TourTranslation, TourPhoto, TourRoutePoint,
    TourVisaDetails, TourInsuranceDetails,
    TourType, TourTypeTranslation,
    DifficultyLevel, DifficultyLevelTranslation,
)
from locations.models import Location, LocationTranslation

from .translation_utils import auto_translate
from core.models import Language



# ---------- Справочники (публичные) ----------

class TourTypePublicSerializer(serializers.ModelSerializer):
    name_ru = serializers.SerializerMethodField()
    name_en = serializers.SerializerMethodField()

    class Meta:
        model = TourType
        fields = ('id', 'code', 'icon', 'name_ru', 'name_en')

    def get_name_ru(self, obj):
        tr = obj.translations.filter(language__code='ru').first()
        return tr.name if tr else obj.code

    def get_name_en(self, obj):
        tr = obj.translations.filter(language__code='en').first()
        return tr.name if tr else obj.code


class DifficultyLevelPublicSerializer(serializers.ModelSerializer):
    name_ru = serializers.SerializerMethodField()
    name_en = serializers.SerializerMethodField()

    class Meta:
        model = DifficultyLevel
        fields = ('id', 'code', 'name_ru', 'name_en')

    def get_name_ru(self, obj):
        tr = obj.translations.filter(language__code='ru').first()
        return tr.name if tr else obj.code

    def get_name_en(self, obj):
        tr = obj.translations.filter(language__code='en').first()
        return tr.name if tr else obj.code


class LocationPublicSerializer(serializers.ModelSerializer):
    name_ru = serializers.SerializerMethodField()
    name_en = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = ('id', 'latitude', 'longitude', 'elevation_m', 'name_ru', 'name_en')

    def get_name_ru(self, obj):
        tr = obj.translations.filter(language__code='ru').first()
        return tr.name if tr else f'Location #{obj.id}'

    def get_name_en(self, obj):
        tr = obj.translations.filter(language__code='en').first()
        return tr.name if tr else f'Location #{obj.id}'


# ---------- Компоненты тура ----------

class TourTranslationSerializer(serializers.ModelSerializer):
    language_code = serializers.CharField(source='language.code', read_only=True)

    class Meta:
        model = TourTranslation
        fields = ('id', 'language', 'language_code', 'title', 'summary', 'description', 'route_overview')


class TourPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TourPhoto
        fields = (
            'id', 'file_path', 'original_filename', 'mime_type', 'file_size',
            'alt_text', 'is_cover', 'sort_order', 'uploaded_at',
        )
        read_only_fields = (
            'id', 'file_path', 'original_filename', 'mime_type', 'file_size', 'uploaded_at',
        )


class TourRoutePointSerializer(serializers.ModelSerializer):
    location_name_ru = serializers.SerializerMethodField()
    location_name_en = serializers.SerializerMethodField()
    latitude = serializers.DecimalField(source='location.latitude', max_digits=9, decimal_places=6, read_only=True)
    longitude = serializers.DecimalField(source='location.longitude', max_digits=9, decimal_places=6, read_only=True)

    class Meta:
        model = TourRoutePoint
        fields = (
            'id', 'location', 'location_name_ru', 'location_name_en',
            'latitude', 'longitude',
            'sequence_order', 'day_number', 'notes_ru', 'notes_en',
        )

    def get_location_name_ru(self, obj):
        tr = obj.location.translations.filter(language__code='ru').first()
        return tr.name if tr else f'Location #{obj.location_id}'

    def get_location_name_en(self, obj):
        tr = obj.location.translations.filter(language__code='en').first()
        return tr.name if tr else f'Location #{obj.location_id}'


class TourVisaDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TourVisaDetails
        exclude = ('tour',)


class TourInsuranceDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TourInsuranceDetails
        exclude = ('tour',)


# ---------- Основные сериализаторы тура ----------

class TourListSerializer(serializers.ModelSerializer):
    """Краткий вид тура для списка."""
    title_ru = serializers.SerializerMethodField()
    title_en = serializers.SerializerMethodField()
    tour_type_code = serializers.CharField(source='tour_type.code', read_only=True)
    difficulty_code = serializers.CharField(source='difficulty_level.code', read_only=True)
    cover_photo = serializers.SerializerMethodField()
    photos_count = serializers.IntegerField(source='photos.count', read_only=True)

    class Meta:
        model = Tour
        fields = (
            'id', 'slug', 'status', 'is_custom',
            'title_ru', 'title_en',
            'tour_type_code', 'difficulty_code',
            'price', 'currency_code', 'duration_days',
            'cover_photo', 'photos_count',
            'created_at', 'updated_at',
        )

    def get_title_ru(self, obj):
        tr = obj.translations.filter(language__code='ru').first()
        return tr.title if tr else obj.slug

    def get_title_en(self, obj):
        tr = obj.translations.filter(language__code='en').first()
        return tr.title if tr else obj.slug

    def get_cover_photo(self, obj):
        cover = obj.photos.filter(is_cover=True).first() or obj.photos.first()
        return cover.file_path if cover else None


class TourDetailSerializer(serializers.ModelSerializer):
    """Полный тур со всеми связями."""
    translations = TourTranslationSerializer(many=True, read_only=True)
    photos = TourPhotoSerializer(many=True, read_only=True)
    route_points = TourRoutePointSerializer(many=True, read_only=True)
    visa_details = TourVisaDetailsSerializer(read_only=True)
    insurance_details = TourInsuranceDetailsSerializer(read_only=True)
    tour_type_code = serializers.CharField(source='tour_type.code', read_only=True)
    difficulty_code = serializers.CharField(source='difficulty_level.code', read_only=True)

    class Meta:
        model = Tour
        fields = (
            'id', 'slug', 'status', 'is_custom',
            'tour_type', 'tour_type_code',
            'difficulty_level', 'difficulty_code',
            'price', 'currency_code',
            'duration_days', 'duration_hours',
            'min_group_size', 'max_group_size',
            'published_at', 'created_at', 'updated_at',
            'translations', 'photos', 'route_points',
            'visa_details', 'insurance_details',
        )
        read_only_fields = ('id', 'slug', 'status', 'published_at', 'created_at', 'updated_at')


class TourCreateSerializer(serializers.ModelSerializer):
    """Создание/редактирование тура + переводы одним запросом."""
    title_ru = serializers.CharField(write_only=True, max_length=255)
    title_en = serializers.CharField(write_only=True, max_length=255, required=False, allow_blank=True)
    summary_ru = serializers.CharField(write_only=True, max_length=500, required=False, allow_blank=True)
    summary_en = serializers.CharField(write_only=True, max_length=500, required=False, allow_blank=True)
    description_ru = serializers.CharField(write_only=True, required=False, allow_blank=True)
    description_en = serializers.CharField(write_only=True, required=False, allow_blank=True)
    route_overview_ru = serializers.CharField(write_only=True, required=False, allow_blank=True)
    route_overview_en = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Tour
        fields = (
            'tour_type', 'difficulty_level', 'is_custom',
            'price', 'currency_code',
            'duration_days', 'duration_hours',
            'min_group_size', 'max_group_size',
            'title_ru', 'title_en',
            'summary_ru', 'summary_en',
            'description_ru', 'description_en',
            'route_overview_ru', 'route_overview_en',
        )   

    def create(self, validated_data):
        # достаём текстовые поля переводов
        title_ru = validated_data.pop('title_ru')
        title_en = validated_data.pop('title_en', '') or ''
        summary_ru = validated_data.pop('summary_ru', '') or ''
        summary_en = validated_data.pop('summary_en', '') or ''
        description_ru = validated_data.pop('description_ru', '') or ''
        description_en = validated_data.pop('description_en', '') or ''
        route_overview_ru = validated_data.pop('route_overview_ru', '') or ''
        route_overview_en = validated_data.pop('route_overview_en', '') or ''

        # создаём сам тур
        tour = Tour.objects.create(**validated_data)

        # определяем, нужен ли автоперевод (ен пустой, а ru заполнен)
        auto_en = not title_en.strip()

        if auto_en:
            title_en = auto_translate(title_ru, 'ru', 'en')
            summary_en = auto_translate(summary_ru, 'ru', 'en') if summary_ru else ''
            description_en = auto_translate(description_ru, 'ru', 'en') if description_ru else ''
            route_overview_en = auto_translate(route_overview_ru, 'ru', 'en') if route_overview_ru else ''

        ru = Language.objects.get(code='ru')
        en = Language.objects.get(code='en')

        TourTranslation.objects.create(
            tour=tour, language=ru,
            title=title_ru, summary=summary_ru,
            description=description_ru, route_overview=route_overview_ru,
            is_auto_translated=False,
        )
        TourTranslation.objects.create(
            tour=tour, language=en,
            title=title_en, summary=summary_en,
            description=description_en, route_overview=route_overview_en,
            is_auto_translated=auto_en,
        )

        return tour
    
    def update(self, instance, validated_data):
        title_ru = validated_data.pop('title_ru', None)
        title_en = validated_data.pop('title_en', None)
        summary_ru = validated_data.pop('summary_ru', None)
        summary_en = validated_data.pop('summary_en', None)
        description_ru = validated_data.pop('description_ru', None)
        description_en = validated_data.pop('description_en', None)
        route_overview_ru = validated_data.pop('route_overview_ru', None)
        route_overview_en = validated_data.pop('route_overview_en', None)

        # обновляем основные поля тура (price, duration и т.д.)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        ru = Language.objects.get(code='ru')
        en = Language.objects.get(code='en')

        tr_ru = instance.translations.filter(language=ru).first()
        tr_en = instance.translations.filter(language=en).first()

        if title_ru is not None and tr_ru:
            tr_ru.title = title_ru
            if summary_ru is not None:
                tr_ru.summary = summary_ru
            if description_ru is not None:
                tr_ru.description = description_ru
            if route_overview_ru is not None:
                tr_ru.route_overview = route_overview_ru
            tr_ru.save()

        if tr_en:
            # если исполнитель прислал свой English текст — используем его, снимаем флаг авто
            if title_en:
                tr_en.title = title_en
                tr_en.is_auto_translated = False
            # если English пустой, а русский текст поменялся, и раньше это был автоперевод — переводим заново
            elif tr_en.is_auto_translated and title_ru is not None:
                tr_en.title = auto_translate(title_ru, 'ru', 'en')

            tr_en.save()

        return instance