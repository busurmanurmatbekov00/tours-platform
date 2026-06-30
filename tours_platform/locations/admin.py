from django.contrib import admin
from .models import Region, Location, LocationTranslation


class LocationTranslationInline(admin.TabularInline):
    model = LocationTranslation
    extra = 1


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ('code', 'name_ru', 'name_en')


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('id', '__str__', 'region', 'latitude', 'longitude', 'elevation_m')
    list_filter = ('region',)
    inlines = [LocationTranslationInline]