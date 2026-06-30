from django.urls import path
from .views import ModerationLogView

app_name = 'moderation'

urlpatterns = [
    path('moderation-log/', ModerationLogView.as_view(), name='log'),
]