from django.contrib import admin
from .models import Language

@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
    list_display = ('code', 'name_native', 'is_default', 'is_active', 'sort_order')
    list_editable = ('is_default', 'is_active', 'sort_order')