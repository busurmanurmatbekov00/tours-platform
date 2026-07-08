import os
import uuid
from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils.text import slugify
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Language
from providers.models import ProviderProfile
from locations.models import Location

from .models import (
    Tour, TourTranslation, TourPhoto, TourRoutePoint,
    TourVisaDetails, TourInsuranceDetails,
    TourType, DifficultyLevel,
)
from .serializers import (
    TourListSerializer, TourDetailSerializer, TourCreateSerializer,
    TourPhotoSerializer, TourRoutePointSerializer,
    TourVisaDetailsSerializer, TourInsuranceDetailsSerializer,
    TourTypePublicSerializer, DifficultyLevelPublicSerializer,
    LocationPublicSerializer,
)
from .translation_utils import auto_translate

# ---------- Публичные справочники ----------

class TourTypeListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = TourType.objects.filter(is_active=True).order_by('sort_order')
        return Response(TourTypePublicSerializer(qs, many=True).data)


class DifficultyLevelListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = DifficultyLevel.objects.all().order_by('sort_order')
        return Response(DifficultyLevelPublicSerializer(qs, many=True).data)


class LocationListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Location.objects.select_related('region').prefetch_related('translations').all()
        return Response(LocationPublicSerializer(qs, many=True).data)


# ---------- Утилиты ----------

def _get_my_profile(request):
    return get_object_or_404(ProviderProfile, user_id=request.user.id)


def _get_my_tour(request, tour_id):
    profile = _get_my_profile(request)
    return get_object_or_404(Tour, id=tour_id, provider_profile=profile)


def _make_unique_slug(base):
    slug = base or 'tour'
    n = 1
    unique = slug
    while Tour.objects.filter(slug=unique).exists():
        n += 1
        unique = f'{slug}-{n}'
    return unique


# ---------- Мои туры ----------

class MyToursListCreateView(APIView):
    """GET список моих туров, POST создать тур (draft)."""

    def get(self, request):
        profile = _get_my_profile(request)
        qs = profile.tours.prefetch_related(
            'photos', 'translations',
        ).select_related('tour_type', 'difficulty_level').order_by('-created_at')

        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        return Response(TourListSerializer(qs, many=True).data)

    @transaction.atomic
    def post(self, request):
        profile = _get_my_profile(request)
        serializer = TourCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # уникальный slug из title_ru
        base_slug = slugify(data['title_ru'], allow_unicode=False)
        slug = _make_unique_slug(base_slug)

        tour = Tour.objects.create(
            provider_profile=profile,
            tour_type=data['tour_type'],
            difficulty_level=data['difficulty_level'],
            slug=slug,
            is_custom=data.get('is_custom', False),
            price=data['price'],
            currency_code=data.get('currency_code', 'USD'),
            duration_days=data.get('duration_days', 1),
            duration_hours=data.get('duration_hours'),
            min_group_size=data.get('min_group_size'),
            max_group_size=data.get('max_group_size'),
            status='draft',
        )

        # переводы RU/EN
        lang_ru = Language.objects.get(code='ru')
        TourTranslation.objects.create(
            tour=tour, language=lang_ru,
            title=data['title_ru'],
            summary=data.get('summary_ru') or None,
            description=data.get('description_ru') or None,
            route_overview=data.get('route_overview_ru') or None,
        )

        lang_en = Language.objects.get(code='en')
        if data.get('title_en'):
            TourTranslation.objects.create(
                tour=tour, language=lang_en,
                title=data['title_en'],
                summary=data.get('summary_en') or None,
                description=data.get('description_en') or None,
                route_overview=data.get('route_overview_en') or None,
                is_auto_translated=False,
            )
        else:
            # автоперевод, если English не прислан
            TourTranslation.objects.create(
                tour=tour, language=lang_en,
                title=auto_translate(data['title_ru'], 'ru', 'en'),
                summary=auto_translate(data.get('summary_ru', ''), 'ru', 'en') if data.get('summary_ru') else None,
                description=auto_translate(data.get('description_ru', ''), 'ru', 'en') if data.get('description_ru') else None,
                route_overview=auto_translate(data.get('route_overview_ru', ''), 'ru', 'en') if data.get('route_overview_ru') else None,
                is_auto_translated=True,
            )

            return Response(TourDetailSerializer(tour).data, status=status.HTTP_201_CREATED)


class MyTourDetailView(APIView):
    """GET/PATCH/DELETE один тур."""

    def get(self, request, tour_id):
        tour = _get_my_tour(request, tour_id)
        return Response(TourDetailSerializer(tour).data)

    @transaction.atomic
    def patch(self, request, tour_id):
        tour = _get_my_tour(request, tour_id)

        # опубликованный/на проверке тур нельзя редактировать напрямую
        if tour.status not in ('draft', 'rejected'):
            return Response(
                {'detail': f'Тур в статусе "{tour.status}" нельзя редактировать. Сначала снимите с публикации.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # простые поля
        simple_fields = [
            'tour_type', 'difficulty_level', 'is_custom',
            'price', 'currency_code', 'duration_days', 'duration_hours',
            'min_group_size', 'max_group_size',
        ]
        for f in simple_fields:
            if f in request.data:
                setattr(tour, f, request.data[f])
        tour.save()

        # переводы
        _upsert_translation(tour, 'ru', request.data)
        _upsert_translation(tour, 'en', request.data)

        return Response(TourDetailSerializer(tour).data)

    def delete(self, request, tour_id):
        """Мягкое удаление — переводим в archived."""
        tour = _get_my_tour(request, tour_id)
        tour.status = 'archived'
        tour.save(update_fields=['status'])
        return Response(status=status.HTTP_204_NO_CONTENT)


def _upsert_translation(tour, lang_code, data):
    title = data.get(f'title_{lang_code}')
    if title is None:
        return
    lang = Language.objects.get(code=lang_code)
    tr, _ = TourTranslation.objects.get_or_create(tour=tour, language=lang)
    tr.title = title
    if f'summary_{lang_code}' in data:
        tr.summary = data[f'summary_{lang_code}'] or None
    if f'description_{lang_code}' in data:
        tr.description = data[f'description_{lang_code}'] or None
    if f'route_overview_{lang_code}' in data:
        tr.route_overview = data[f'route_overview_{lang_code}'] or None
    tr.save()


# ---------- Фотографии тура ----------

class MyTourPhotosView(APIView):
    """POST загрузить фото."""
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 МБ
    MAX_PHOTOS = 10
    ALLOWED_MIME = {'image/jpeg', 'image/png', 'image/webp'}

    def post(self, request, tour_id):
        tour = _get_my_tour(request, tour_id)

        current_count = tour.photos.count()
        if current_count >= self.MAX_PHOTOS:
            return Response(
                {'detail': f'Максимум {self.MAX_PHOTOS} фото на тур.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        upload = request.FILES.get('file')
        if not upload:
            return Response({'file': 'Файл обязателен.'}, status=status.HTTP_400_BAD_REQUEST)

        if upload.size > self.MAX_FILE_SIZE:
            return Response({'file': 'Файл больше 10 МБ.'}, status=status.HTTP_400_BAD_REQUEST)
        if upload.content_type not in self.ALLOWED_MIME:
            return Response(
                {'file': f'Недопустимый тип: {upload.content_type}. Разрешены JPEG, PNG, WEBP.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # сохраняем файл в media/tours/<tour_id>/<uuid>.<ext>
        ext = os.path.splitext(upload.name)[1].lower()
        unique = f'{uuid.uuid4().hex}{ext}'
        rel_dir = os.path.join('tours', str(tour.id))
        abs_dir = os.path.join(settings.MEDIA_ROOT, rel_dir)
        os.makedirs(abs_dir, exist_ok=True)
        rel_path = os.path.join(rel_dir, unique).replace('\\', '/')
        with open(os.path.join(settings.MEDIA_ROOT, rel_path), 'wb') as f:
            for chunk in upload.chunks():
                f.write(chunk)

        # первая фотография — автоматически обложка
        is_cover = (current_count == 0)

        photo = TourPhoto.objects.create(
            tour=tour,
            file_path=rel_path,
            original_filename=upload.name[:255],
            mime_type=upload.content_type[:100],
            file_size=upload.size,
            alt_text=request.data.get('alt_text', '')[:255] or None,
            is_cover=is_cover,
            sort_order=current_count,
        )
        return Response(TourPhotoSerializer(photo).data, status=status.HTTP_201_CREATED)


class MyTourPhotoDeleteView(APIView):
    def delete(self, request, tour_id, photo_id):
        tour = _get_my_tour(request, tour_id)
        photo = get_object_or_404(TourPhoto, id=photo_id, tour=tour)

        # физически удалить файл
        abs_path = os.path.join(settings.MEDIA_ROOT, photo.file_path)
        if os.path.exists(abs_path):
            try:
                os.remove(abs_path)
            except OSError:
                pass

        was_cover = photo.is_cover
        photo.delete()

        # если удалили обложку — назначаем новую
        if was_cover:
            new_cover = tour.photos.first()
            if new_cover:
                new_cover.is_cover = True
                new_cover.save(update_fields=['is_cover'])

        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------- Точки маршрута ----------

class MyTourRouteView(APIView):
    """POST добавить точку маршрута."""

    @transaction.atomic
    def post(self, request, tour_id):
        tour = _get_my_tour(request, tour_id)
        data = request.data.copy()

        location_id = data.get('location')
        if not location_id:
            return Response({'location': 'Обязательное поле.'}, status=status.HTTP_400_BAD_REQUEST)

        location = get_object_or_404(Location, id=location_id)

        # sequence_order — следующий свободный, если не задан
        seq = data.get('sequence_order')
        if seq is None:
            last = tour.route_points.order_by('-sequence_order').first()
            seq = (last.sequence_order + 1) if last else 1

        point = TourRoutePoint.objects.create(
            tour=tour,
            location=location,
            sequence_order=seq,
            day_number=data.get('day_number') or None,
            notes_ru=data.get('notes_ru') or None,
            notes_en=data.get('notes_en') or None,
        )
        return Response(TourRoutePointSerializer(point).data, status=status.HTTP_201_CREATED)


class MyTourRouteDeleteView(APIView):
    def delete(self, request, tour_id, point_id):
        tour = _get_my_tour(request, tour_id)
        point = get_object_or_404(TourRoutePoint, id=point_id, tour=tour)
        point.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------- Визы / страховка ----------

class MyTourVisaView(APIView):
    def put(self, request, tour_id):
        tour = _get_my_tour(request, tour_id)
        obj, _ = TourVisaDetails.objects.update_or_create(
            tour=tour,
            defaults={
                'requires_border_permit': request.data.get('requires_border_permit', False),
                'requires_special_permit': request.data.get('requires_special_permit', False),
                'notes_ru': request.data.get('notes_ru') or None,
                'notes_en': request.data.get('notes_en') or None,
            },
        )
        return Response(TourVisaDetailsSerializer(obj).data)


class MyTourInsuranceView(APIView):
    def put(self, request, tour_id):
        tour = _get_my_tour(request, tour_id)
        obj, _ = TourInsuranceDetails.objects.update_or_create(
            tour=tour,
            defaults={
                'is_insurance_required': request.data.get('is_insurance_required', True),
                'min_medical_coverage': request.data.get('min_medical_coverage') or None,
                'medical_currency': request.data.get('medical_currency') or None,
                'requires_evacuation': request.data.get('requires_evacuation', False),
                'min_evacuation_coverage': request.data.get('min_evacuation_coverage') or None,
                'evacuation_currency': request.data.get('evacuation_currency') or None,
                'notes_ru': request.data.get('notes_ru') or None,
                'notes_en': request.data.get('notes_en') or None,
            },
        )
        return Response(TourInsuranceDetailsSerializer(obj).data)


# ---------- Отправка на модерацию ----------

class MyTourSubmitView(APIView):
    """POST перевести тур из draft в pending_review."""

    def post(self, request, tour_id):
        tour = _get_my_tour(request, tour_id)

        if tour.status != 'draft':
            return Response(
                {'detail': f'Отправить можно только из статуса draft (сейчас: "{tour.status}").'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # проверки перед отправкой
        errors = {}
        if tour.photos.count() < 1:
            errors['photos'] = 'Загрузите хотя бы 1 фотографию.'
        if tour.photos.count() > 10:
            errors['photos'] = 'Максимум 10 фотографий.'
        if tour.route_points.count() < 1:
            errors['route_points'] = 'Добавьте хотя бы 1 точку маршрута.'
        if not tour.translations.filter(language__code='ru').exists():
            errors['translations'] = 'Перевод на русский язык обязателен.'

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        tour.status = 'pending_review'
        tour.save(update_fields=['status'])

        return Response(TourDetailSerializer(tour).data)