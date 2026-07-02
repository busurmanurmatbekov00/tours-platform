from django.urls import path
from .views import (
    VisaPoliciesListView, CountriesVisaListView, CountryVisaDetailView,
    InsuranceRequirementsListView,
)

from .admin_views import (
    AdminVisaPolicyListCreateView, AdminVisaPolicyDetailView,
    AdminCountryVisaAssignView,
    AdminInsuranceListCreateView, AdminInsuranceDetailView,
)

app_name = 'visas'

urlpatterns = [
    # Визы
    path('visa-policies/', VisaPoliciesListView.as_view(), name='visa-policies'),
    path('countries/', CountriesVisaListView.as_view(), name='countries'),
    path('countries/<str:iso>/', CountryVisaDetailView.as_view(), name='country-detail'),

    # Страхование
    path('insurance/', InsuranceRequirementsListView.as_view(), name='insurance'),

    # Админ CRUD — визовые режимы
    path('admin/visa-policies/', AdminVisaPolicyListCreateView.as_view(), name='admin-visa-policies'),
    path('admin/visa-policies/<int:policy_id>/', AdminVisaPolicyDetailView.as_view(), name='admin-visa-policy-detail'),

    # Админ — привязка стран
    path('admin/country-visa-policies/', AdminCountryVisaAssignView.as_view(), name='admin-country-visa-assign'),

    # Админ CRUD — страхование
    path('admin/insurance/', AdminInsuranceListCreateView.as_view(), name='admin-insurance'),
    path('admin/insurance/<int:insurance_id>/', AdminInsuranceDetailView.as_view(), name='admin-insurance-detail'),
]