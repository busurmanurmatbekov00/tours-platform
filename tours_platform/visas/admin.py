from django.contrib import admin
from .models import (
    Country, VisaPolicy, VisaPolicyTranslation,
    CountryVisaPolicy, InsuranceRequirement, InsuranceRequirementTranslation,
)


class VisaPolicyTranslationInline(admin.TabularInline):
    model = VisaPolicyTranslation
    extra = 1


class InsuranceRequirementTranslationInline(admin.TabularInline):
    model = InsuranceRequirementTranslation
    extra = 1


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ('iso_alpha2', 'iso_alpha3', 'name_ru', 'name_en')
    search_fields = ('name_ru', 'name_en', 'iso_alpha2', 'iso_alpha3')


@admin.register(VisaPolicy)
class VisaPolicyAdmin(admin.ModelAdmin):
    list_display = ('code', 'max_stay_days', 'rolling_period_days', 'requires_evisa', 'is_eaeu')
    inlines = [VisaPolicyTranslationInline]


@admin.register(CountryVisaPolicy)
class CountryVisaPolicyAdmin(admin.ModelAdmin):
    list_display = ('country', 'visa_policy', 'effective_from', 'effective_to')
    list_filter = ('visa_policy',)
    search_fields = ('country__name_ru', 'country__name_en')


@admin.register(InsuranceRequirement)
class InsuranceRequirementAdmin(admin.ModelAdmin):
    list_display = ('code', 'applies_to', 'min_medical_coverage', 'requires_evacuation', 'is_mandatory')
    list_filter = ('applies_to', 'is_mandatory')
    inlines = [InsuranceRequirementTranslationInline]