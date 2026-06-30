from django.urls import path
from .views import (
    MyProviderProfileView,
    MyVerificationRequestsView,
    MyVerificationDocumentUploadView,
)
from .admin_views import (
    AdminVerificationListView,
    AdminVerificationDetailView,
    AdminVerificationApproveView,
    AdminVerificationRejectView,
    AdminBlockProviderView,
    AdminUnblockProviderView,
)

app_name = 'providers'

urlpatterns = [
    # для исполнителя
    path('me/', MyProviderProfileView.as_view(), name='me'),
    path('me/verification/', MyVerificationRequestsView.as_view(), name='me-verification'),
    path('me/verification/<int:request_id>/documents/',
         MyVerificationDocumentUploadView.as_view(), name='me-verification-upload'),

    # для администратора
    path('admin/verification/', AdminVerificationListView.as_view(), name='admin-verif-list'),
    path('admin/verification/<int:request_id>/',
         AdminVerificationDetailView.as_view(), name='admin-verif-detail'),
    path('admin/verification/<int:request_id>/approve/',
         AdminVerificationApproveView.as_view(), name='admin-verif-approve'),
    path('admin/verification/<int:request_id>/reject/',
         AdminVerificationRejectView.as_view(), name='admin-verif-reject'),
    path('admin/providers/<int:profile_id>/block/',
         AdminBlockProviderView.as_view(), name='admin-provider-block'),
    path('admin/providers/<int:profile_id>/unblock/',
         AdminUnblockProviderView.as_view(), name='admin-provider-unblock'),
]