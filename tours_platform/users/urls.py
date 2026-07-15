from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterProviderView, LoginView
from .otp_views import RequestEmailOtpView, VerifyEmailOtpView

app_name = 'users'

urlpatterns = [
    path('register/', RegisterProviderView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='refresh'),

    path('email-otp/request/', RequestEmailOtpView.as_view(), name='email-otp-request'),
    path('email-otp/verify/', VerifyEmailOtpView.as_view(), name='email-otp-verify'),
]