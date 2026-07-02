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
]