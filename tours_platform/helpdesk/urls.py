from django.urls import path
from .views import (
    HelpCategoriesListView, HelpArticlesListView, HelpArticleDetailView,
)

from .admin_views import (
    AdminHelpCategoryListCreateView, AdminHelpCategoryDetailView,
    AdminHelpArticleListCreateView, AdminHelpArticleDetailView,
)


app_name = 'helpdesk'

urlpatterns = [
    path('categories/', HelpCategoriesListView.as_view(), name='categories'),
    path('articles/', HelpArticlesListView.as_view(), name='articles'),
    path('articles/<slug:slug>/', HelpArticleDetailView.as_view(), name='article-detail'),

    # Админ CRUD
    path('admin/categories/', AdminHelpCategoryListCreateView.as_view(), name='admin-categories'),
    path('admin/categories/<int:category_id>/', AdminHelpCategoryDetailView.as_view(), name='admin-category-detail'),
    path('admin/articles/', AdminHelpArticleListCreateView.as_view(), name='admin-articles'),
    path('admin/articles/<int:article_id>/', AdminHelpArticleDetailView.as_view(), name='admin-article-detail'),
]