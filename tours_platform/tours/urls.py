from django.urls import path
from .views import (
    LocationListView,
    MyToursListCreateView, MyTourDetailView,
    MyTourPhotosView, MyTourPhotoDeleteView,
    MyTourRouteView, MyTourRouteDeleteView,
    MyTourVisaView, MyTourInsuranceView,
    MyTourSubmitView,
)
from .catalog_views import (
    CatalogToursListView, CatalogTourDetailView,
    CatalogTourTypesView, CatalogDifficultyLevelsView,
)

from .public_providers_views import (
    PublicProvidersListView, PublicProviderDetailView, PublicProviderToursView,
)

from .admin_moderation_views import (
    AdminToursListView, AdminTourHideView, AdminTourUnhideView, AdminTourDeleteView,
)

app_name = 'tours'

urlpatterns = [
    # Публичный каталог (без авторизации)
    path('catalog/tours/', CatalogToursListView.as_view(), name='catalog-tours'),
    path('catalog/tours/<slug:slug>/', CatalogTourDetailView.as_view(), name='catalog-tour-detail'),
    path('catalog/tour-types/', CatalogTourTypesView.as_view(), name='catalog-tour-types'),
    path('catalog/difficulty-levels/', CatalogDifficultyLevelsView.as_view(), name='catalog-difficulty-levels'),
    path('catalog/locations/', LocationListView.as_view(), name='locations'),

    # Мои туры (только для авторизованных исполнителей)
    path('providers/me/tours/', MyToursListCreateView.as_view(), name='my-tours'),
    path('providers/me/tours/<int:tour_id>/', MyTourDetailView.as_view(), name='my-tour-detail'),
    path('providers/me/tours/<int:tour_id>/submit/', MyTourSubmitView.as_view(), name='my-tour-submit'),

    # Фото туров
    path('providers/me/tours/<int:tour_id>/photos/', MyTourPhotosView.as_view(), name='my-tour-photos'),
    path('providers/me/tours/<int:tour_id>/photos/<int:photo_id>/', MyTourPhotoDeleteView.as_view(), name='my-tour-photo-delete'),

    # Маршрут тура
    path('providers/me/tours/<int:tour_id>/route/', MyTourRouteView.as_view(), name='my-tour-route'),
    path('providers/me/tours/<int:tour_id>/route/<int:point_id>/', MyTourRouteDeleteView.as_view(), name='my-tour-route-delete'),

    # Виза/страховка тура
    path('providers/me/tours/<int:tour_id>/visa/', MyTourVisaView.as_view(), name='my-tour-visa'),
    path('providers/me/tours/<int:tour_id>/insurance/', MyTourInsuranceView.as_view(), name='my-tour-insurance'),

    # Публичные профили исполнителей
    path('catalog/providers/', PublicProvidersListView.as_view(), name='catalog-providers'),
    path('catalog/providers/<slug:slug>/', PublicProviderDetailView.as_view(), name='catalog-provider-detail'),
    path('catalog/providers/<slug:slug>/tours/', PublicProviderToursView.as_view(), name='catalog-provider-tours'),

    # Админ-модерация туров
    path('providers/admin/tours/', AdminToursListView.as_view(), name='admin-tours'),
    path('providers/admin/tours/<int:tour_id>/hide/', AdminTourHideView.as_view(), name='admin-tour-hide'),
    path('providers/admin/tours/<int:tour_id>/unhide/', AdminTourUnhideView.as_view(), name='admin-tour-unhide'),
    path('providers/admin/tours/<int:tour_id>/delete/', AdminTourDeleteView.as_view(), name='admin-tour-delete'),
]