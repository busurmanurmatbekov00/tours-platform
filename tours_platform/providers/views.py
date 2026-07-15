import os
import uuid
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction  

from .models import (
    ProviderProfile, VerificationRequest, VerificationDocument,
    VerificationStatus, VerificationDocumentType,Certificate, CertificateType
)
from .serializers import (
    ProviderProfileSerializer,
    VerificationRequestSerializer,
    VerificationDocumentSerializer, MyCertificateSerializer,
)


def _get_my_profile(request):
    """Возвращает ProviderProfile текущего пользователя или 404."""
    return get_object_or_404(ProviderProfile, user_id=request.user.id)


class MyProviderProfileView(APIView):
    """GET / PATCH свой профиль."""
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        profile = _get_my_profile(request)
        return Response(
            ProviderProfileSerializer(profile, context={'request': request}).data
        )

    def patch(self, request):
        profile = _get_my_profile(request)
        serializer = ProviderProfileSerializer(
            profile, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            ProviderProfileSerializer(profile, context={'request': request}).data
        )
    

class MyProviderAvatarView(APIView):
    """POST загрузить/заменить аватар, DELETE удалить."""
    parser_classes = [MultiPartParser, FormParser]

    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 МБ
    ALLOWED_MIME = {'image/jpeg', 'image/png', 'image/webp'}

    def post(self, request):
        profile = _get_my_profile(request)
        upload = request.FILES.get('file')
        if not upload:
            return Response({'file': 'Файл обязателен.'}, status=status.HTTP_400_BAD_REQUEST)
        if upload.size > self.MAX_FILE_SIZE:
            return Response({'file': 'Файл больше 5 МБ.'}, status=status.HTTP_400_BAD_REQUEST)
        if upload.content_type not in self.ALLOWED_MIME:
            return Response(
                {'file': 'Разрешены только JPEG, PNG, WEBP.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if profile.avatar_path:
            old_path = os.path.join(settings.MEDIA_ROOT, profile.avatar_path)
            if os.path.exists(old_path):
                os.remove(old_path)

        ext = os.path.splitext(upload.name)[1].lower()
        unique = f'{uuid.uuid4().hex}{ext}'
        rel_dir = os.path.join('avatars', str(profile.id))
        abs_dir = os.path.join(settings.MEDIA_ROOT, rel_dir)
        os.makedirs(abs_dir, exist_ok=True)
        rel_path = os.path.join(rel_dir, unique).replace('\\', '/')
        with open(os.path.join(settings.MEDIA_ROOT, rel_path), 'wb') as f:
            for chunk in upload.chunks():
                f.write(chunk)

        profile.avatar_path = rel_path
        profile.save(update_fields=['avatar_path'])

        return Response(
            ProviderProfileSerializer(profile, context={'request': request}).data
        )

    def delete(self, request):
        profile = _get_my_profile(request)
        if profile.avatar_path:
            old_path = os.path.join(settings.MEDIA_ROOT, profile.avatar_path)
            if os.path.exists(old_path):
                os.remove(old_path)
            profile.avatar_path = None
            profile.save(update_fields=['avatar_path'])
        return Response(
            ProviderProfileSerializer(profile, context={'request': request}).data
        )
    
class MyVerificationRequestsView(APIView):
    """GET список своих заявок, POST — создать новую заявку."""

    def get(self, request):
        profile = _get_my_profile(request)
        qs = profile.verification_requests.all().order_by('-submitted_at')
        return Response(VerificationRequestSerializer(qs, many=True).data)

    def post(self, request):
        profile = _get_my_profile(request)

        # уже одобрен — повторная подача не нужна
        if profile.verification_status.code == 'approved':
            return Response(
                {'detail': 'Вы уже верифицированы.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # обязательные поля профиля перед подачей заявки
        # обязательные поля профиля перед подачей заявки
        missing = []
        if not profile.display_name or not profile.display_name.strip():
            missing.append('display_name')
        if not profile.user.email or not profile.user.email.strip():
            missing.append('contact_email')
        if not profile.user.phone or not profile.user.phone.strip():
            missing.append('contact_phone')
        if missing:
            return Response(
                {'detail': 'Заполните профиль перед подачей заявки на верификацию.', 'missing_fields': missing},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # запретить повторную подачу, если уже есть pending
        pending = profile.verification_requests.filter(status__code='pending').exists()
        if pending:
            return Response(
                {'detail': 'У вас уже есть заявка на рассмотрении.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pending_status = VerificationStatus.objects.get(code='pending')
        req = VerificationRequest.objects.create(
            provider_profile=profile,
            status=pending_status,
        )
        # обновим оперативный статус в профиле
        profile.verification_status = pending_status
        profile.save(update_fields=['verification_status'])

        return Response(
            VerificationRequestSerializer(req).data,
            status=status.HTTP_201_CREATED,
        )


from .document_rules import get_allowed_document_type_codes


class MyVerificationDocumentUploadView(APIView):
    """POST загрузить документ в свою заявку."""
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 МБ
    ALLOWED_MIME = {
        'application/pdf',
        'image/jpeg', 'image/png', 'image/webp',
    }

    def post(self, request, request_id: int):
        profile = _get_my_profile(request)
        ver_req = get_object_or_404(
            VerificationRequest, id=request_id, provider_profile=profile
        )
        if ver_req.status.code != 'pending':
            return Response(
                {'detail': 'Документы можно загружать только к заявке на рассмотрении.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        document_type_id = request.data.get('document_type')
        upload = request.FILES.get('file')

        if not document_type_id:
            return Response({'document_type': 'Это поле обязательно.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if not upload:
            return Response({'file': 'Файл обязателен.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            doc_type = VerificationDocumentType.objects.get(id=document_type_id)
        except (VerificationDocumentType.DoesNotExist, ValueError):
            return Response({'document_type': 'Неверный тип документа.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # проверка: разрешён ли этот тип документа для роли пользователя
        role_code = profile.user.role.code
        allowed_codes = get_allowed_document_type_codes(role_code)
        if doc_type.code not in allowed_codes:
            return Response(
                {'document_type': f'Тип документа "{doc_type.name_ru}" недоступен для вашей роли.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if upload.size > self.MAX_FILE_SIZE:
            return Response({'file': 'Файл больше 10 МБ.'},
                            status=status.HTTP_400_BAD_REQUEST)
        if upload.content_type not in self.ALLOWED_MIME:
            return Response(
                {'file': f'Недопустимый тип: {upload.content_type}. '
                         'Разрешены PDF, JPEG, PNG, WEBP.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ext = os.path.splitext(upload.name)[1].lower()
        unique = f'{uuid.uuid4().hex}{ext}'
        rel_dir = os.path.join('verification', str(profile.id))
        abs_dir = os.path.join(settings.MEDIA_ROOT, rel_dir)
        os.makedirs(abs_dir, exist_ok=True)
        rel_path = os.path.join(rel_dir, unique).replace('\\', '/')
        abs_path = os.path.join(settings.MEDIA_ROOT, rel_path)

        with open(abs_path, 'wb') as f:
            for chunk in upload.chunks():
                f.write(chunk)

        doc = VerificationDocument.objects.create(
            verification_request=ver_req,
            document_type=doc_type,
            file_path=rel_path,
            original_filename=upload.name[:255],
            mime_type=upload.content_type[:100],
            file_size=upload.size,
        )
        return Response(
            VerificationDocumentSerializer(doc).data,
            status=status.HTTP_201_CREATED,
        )

class MyCertificatesView(APIView):
    """GET список своих сертификатов, POST создать новый (с файлом)."""
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 МБ
    ALLOWED_MIME = {'application/pdf', 'image/jpeg', 'image/png', 'image/webp'}

    def get(self, request):
        profile = _get_my_profile(request)
        qs = profile.certificates.all().order_by('-created_at')
        return Response(MyCertificateSerializer(qs, many=True, context={'request': request}).data)

    def post(self, request):
        profile = _get_my_profile(request)
        serializer = MyCertificateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cert = serializer.save(provider_profile=profile)

        upload = request.FILES.get('file')
        if upload:
            if upload.size > self.MAX_FILE_SIZE:
                cert.delete()
                return Response({'file': 'Файл больше 10 МБ.'}, status=status.HTTP_400_BAD_REQUEST)
            if upload.content_type not in self.ALLOWED_MIME:
                cert.delete()
                return Response(
                    {'file': f'Недопустимый тип: {upload.content_type}. Разрешены PDF, JPEG, PNG, WEBP.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            ext = os.path.splitext(upload.name)[1].lower()
            unique = f'{uuid.uuid4().hex}{ext}'
            rel_dir = os.path.join('certificates', str(profile.id))
            abs_dir = os.path.join(settings.MEDIA_ROOT, rel_dir)
            os.makedirs(abs_dir, exist_ok=True)
            rel_path = os.path.join(rel_dir, unique).replace('\\', '/')
            with open(os.path.join(settings.MEDIA_ROOT, rel_path), 'wb') as f:
                for chunk in upload.chunks():
                    f.write(chunk)

            cert.file_path = rel_path
            cert.save(update_fields=['file_path'])

        return Response(MyCertificateSerializer(cert, context={'request': request}).data, status=status.HTTP_201_CREATED)
    
class MyCertificateDetailView(APIView):
    """DELETE удалить свой сертификат."""

    def delete(self, request, cert_id):
        profile = _get_my_profile(request)
        cert = get_object_or_404(Certificate, id=cert_id, provider_profile=profile)
        cert.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CertificateTypesListView(APIView):
    """GET список типов сертификатов (для выпадающего списка в форме)."""

    def get(self, request):
        qs = CertificateType.objects.all()
        return Response([
            {'id': ct.id, 'code': ct.code, 'name_ru': ct.name_ru, 'name_en': ct.name_en}
            for ct in qs
        ])

class AllowedDocumentTypesView(APIView):
    """GET /api/providers/me/allowed-document-types/ — типы документов для роли текущего пользователя."""

    def get(self, request):
        profile = _get_my_profile(request)
        role_code = profile.user.role.code
        allowed_codes = get_allowed_document_type_codes(role_code)
        qs = VerificationDocumentType.objects.filter(code__in=allowed_codes)
        return Response([
            {'id': dt.id, 'code': dt.code, 'name_ru': dt.name_ru, 'name_en': dt.name_en}
            for dt in qs
        ])
class MyVerificationCancelView(APIView):
    """POST /api/providers/me/verification/<id>/cancel/ — отозвать заявку на рассмотрении."""

    @transaction.atomic
    def post(self, request, request_id: int):
        profile = _get_my_profile(request)
        req = get_object_or_404(
            VerificationRequest, id=request_id, provider_profile=profile
        )

        if req.status.code != 'pending':
            return Response(
                {'detail': f'Нельзя отменить заявку в статусе "{req.status.code}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # удаляем загруженные файлы с диска
        for doc in req.documents.all():
            if doc.file_path:
                abs_path = os.path.join(settings.MEDIA_ROOT, doc.file_path)
                if os.path.exists(abs_path):
                    try:
                        os.remove(abs_path)
                    except OSError:
                        pass

        req.delete()

        # возвращаем профиль в состояние "не подано"
        not_submitted = VerificationStatus.objects.get(code='not_submitted')
        profile.verification_status = not_submitted
        profile.save(update_fields=['verification_status'])

        return Response({'detail': 'Заявка отменена.'})