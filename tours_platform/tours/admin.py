from django.contrib import admin
from .models import (
    TourType, TourTypeTranslation,
    DifficultyLevel, DifficultyLevelTranslation,
    Tour, TourTranslation, TourPhoto, TourRoutePoint,
    TourVisaDetails, TourInsuranceDetails,
)


class TourTypeTranslationInline(admin.TabularInline):
    model = TourTypeTranslation
    extra = 1


class DifficultyLevelTranslationInline(admin.TabularInline):
    model = DifficultyLevelTranslation
    extra = 1


class TourTranslationInline(admin.TabularInline):
    model = TourTranslation
    extra = 1


class TourPhotoInline(admin.TabularInline):
    model = TourPhoto
    extra = 0


class TourRoutePointInline(admin.TabularInline):
    model = TourRoutePoint
    extra = 1


class TourVisaDetailsInline(admin.StackedInline):
    model = TourVisaDetails
    can_delete = False


class TourInsuranceDetailsInline(admin.StackedInline):
    model = TourInsuranceDetails
    can_delete = False


@admin.register(TourType)
class TourTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'icon', 'is_active', 'sort_order')
    list_editable = ('is_active', 'sort_order')
    inlines = [TourTypeTranslationInline]


@admin.register(DifficultyLevel)
class DifficultyLevelAdmin(admin.ModelAdmin):
    list_display = ('code', 'sort_order')
    inlines = [DifficultyLevelTranslationInline]


@admin.register(Tour)
class TourAdmin(admin.ModelAdmin):
    list_display = (
        'slug', 'provider_profile', 'tour_type', 'difficulty_level',
        'price', 'currency_code', 'duration_days', 'status', 'is_custom',
    )
    list_filter = ('status', 'tour_type', 'difficulty_level', 'is_custom')
    search_fields = ('slug', 'translations__title')
    inlines = [
        TourTranslationInline,
        TourPhotoInline,
        TourRoutePointInline,
        TourVisaDetailsInline,
        TourInsuranceDetailsInline,
    ]