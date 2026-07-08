from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/providers/', include('providers.urls')),
    path('api/admin/', include('moderation.urls')),
    path('api/', include('tours.urls')),
    path('api/help/', include('visas.urls')),
    path('api/help/', include('helpdesk.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)