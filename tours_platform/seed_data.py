import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from datetime import date
import bcrypt
from django.utils import timezone

from core.models import Language
from users.models import Role, User
from providers.models import (
    ProviderProfile, ProviderProfileTranslation,
    VerificationStatus, Certificate, CertificateType,
)
from locations.models import Region, Location, LocationTranslation
from visas.models import Country, VisaPolicy, VisaPolicyTranslation, CountryVisaPolicy, InsuranceRequirement, InsuranceRequirementTranslation
from tours.models import (
    Tour, TourTranslation, TourPhoto, TourRoutePoint,
    TourVisaDetails, TourInsuranceDetails,
    TourType, DifficultyLevel,
)

ru = Language.objects.get(code='ru')
en = Language.objects.get(code='en')

# ============ РЕГИОНЫ ============
region_issykkul, _ = Region.objects.get_or_create(
    code='issyk-kul', defaults={'name_ru': 'Иссык-Кульская область', 'name_en': 'Issyk-Kul Region'}
)
region_chuy, _ = Region.objects.get_or_create(
    code='chuy', defaults={'name_ru': 'Чуйская область', 'name_en': 'Chuy Region'}
)

# ============ ЛОКАЦИИ ============
loc_karakol, created = Location.objects.get_or_create(
    region=region_issykkul, latitude=42.500000, longitude=78.400000,
    defaults={'elevation_m': 1650}
)
if created:
    LocationTranslation.objects.create(location=loc_karakol, language=ru, name='Каракол')
    LocationTranslation.objects.create(location=loc_karakol, language=en, name='Karakol')

loc_jetioguz, created = Location.objects.get_or_create(
    region=region_issykkul, latitude=42.383000, longitude=78.283000,
    defaults={'elevation_m': 1800}
)
if created:
    LocationTranslation.objects.create(location=loc_jetioguz, language=ru, name='Джети-Огуз')
    LocationTranslation.objects.create(location=loc_jetioguz, language=en, name='Jeti-Oguz')

loc_bishkek, created = Location.objects.get_or_create(
    region=region_chuy, latitude=42.874600, longitude=74.569300,
    defaults={'elevation_m': 800}
)
if created:
    LocationTranslation.objects.create(location=loc_bishkek, language=ru, name='Бишкек')
    LocationTranslation.objects.create(location=loc_bishkek, language=en, name='Bishkek')

# ============ СТРАНЫ И ВИЗОВЫЕ РЕЖИМЫ ============
country_usa, _ = Country.objects.get_or_create(
    iso_alpha2='US', defaults={'iso_alpha3': 'USA', 'name_ru': 'США', 'name_en': 'United States'}
)
country_russia, _ = Country.objects.get_or_create(
    iso_alpha2='RU', defaults={'iso_alpha3': 'RUS', 'name_ru': 'Россия', 'name_en': 'Russia'}
)

policy_visa_free, created = VisaPolicy.objects.get_or_create(
    code='visa_free_30_60',
    defaults={'max_stay_days': 30, 'rolling_period_days': 60, 'requires_evisa': False, 'is_eaeu': False}
)
if created:
    VisaPolicyTranslation.objects.create(
        visa_policy=policy_visa_free, language=ru,
        title='Безвизовый режим (30/60)',
        description='Безвизовое пребывание ограничено 30 днями в течение каждых 60 дней'
    )
    VisaPolicyTranslation.objects.create(
        visa_policy=policy_visa_free, language=en,
        title='Visa-free (30/60)',
        description='Visa-free stay limited to 30 days within each 60-day period'
    )

policy_eaeu, created = VisaPolicy.objects.get_or_create(
    code='eaeu_90_180',
    defaults={'max_stay_days': 90, 'rolling_period_days': 180, 'requires_evisa': False, 'is_eaeu': True}
)
if created:
    VisaPolicyTranslation.objects.create(
        visa_policy=policy_eaeu, language=ru,
        title='Режим ЕАЭС (90/180)',
        description='До 90 дней в течение 180 дней для граждан ЕАЭС'
    )
    VisaPolicyTranslation.objects.create(
        visa_policy=policy_eaeu, language=en,
        title='EAEU regime (90/180)',
        description='Up to 90 days within 180 days for EAEU citizens'
    )

CountryVisaPolicy.objects.get_or_create(
    country=country_usa, effective_from=date(2025, 12, 31),
    defaults={'visa_policy': policy_visa_free}
)
CountryVisaPolicy.objects.get_or_create(
    country=country_russia, effective_from=date(2020, 1, 1),
    defaults={'visa_policy': policy_eaeu}
)

# ============ ТРЕБОВАНИЯ К СТРАХОВАНИЮ ============
insurance_mountain, created = InsuranceRequirement.objects.get_or_create(
    code='mountain_evacuation',
    defaults={
        'applies_to': 'mountain',
        'min_medical_coverage': 100000, 'medical_currency': 'USD',
        'requires_evacuation': True,
        'min_evacuation_coverage': 30000, 'evacuation_currency': 'EUR',
        'is_mandatory': True,
    }
)
if created:
    InsuranceRequirementTranslation.objects.create(
        insurance_requirement=insurance_mountain, language=ru,
        title='Страхование для горных маршрутов',
        description='Требуется страховка с покрытием медицинской эвакуации не менее 30 000 евро'
    )
    InsuranceRequirementTranslation.objects.create(
        insurance_requirement=insurance_mountain, language=en,
        title='Mountain route insurance',
        description='Insurance with medical evacuation coverage of at least 30,000 EUR required'
    )

# ============ ТЕСТОВЫЙ ИСПОЛНИТЕЛЬ ============
role_guide = Role.objects.get(code='guide')
status_approved = VerificationStatus.objects.get(code='approved')

user_guide, created = User.objects.get_or_create(
    email='ivan.petrov@example.com',
    defaults={
        'role': role_guide,
        'preferred_language': ru,
        'password_hash': bcrypt.hashpw('Test1234!'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
        'full_name': 'Иван Петров',
        'is_active': True,
        'is_blocked': False,
    }
)

provider, created = ProviderProfile.objects.get_or_create(
    user=user_guide,
    defaults={
        'verification_status': status_approved,
        'slug': 'ivan-petrov',
        'display_name': 'Иван Петров',
        'contact_email': 'ivan.petrov@example.com',
        'contact_phone': '+996700123456',
        'address': 'г. Каракол',
        'is_published': True,
    }
)
if created:
    ProviderProfileTranslation.objects.create(
        provider_profile=provider, language=ru,
        headline='Опытный горный гид с 10-летним стажем',
        bio='Провожу треккинг-туры по Иссык-Кульской области уже более 10 лет. Сертифицированный специалист по первой помощи.'
    )
    ProviderProfileTranslation.objects.create(
        provider_profile=provider, language=en,
        headline='Experienced mountain guide with 10 years of practice',
        bio='I have been leading trekking tours around Issyk-Kul region for over 10 years. Certified first-aid specialist.'
    )

cert_type_mountain, _ = CertificateType.objects.get_or_create(
    code='mountain_guide',
    defaults={'name_ru': 'Сертификат горного гида', 'name_en': 'Mountain guide certificate'}
)
Certificate.objects.get_or_create(
    provider_profile=provider, title='Сертификат горного гида КР',
    defaults={
        'certificate_type': cert_type_mountain,
        'issuer': 'Федерация альпинизма Кыргызстана',
        'issued_date': date(2018, 5, 1),
    }
)

# ============ ТУРЫ ============
tt_trekking = TourType.objects.get(code='trekking')
dl_moderate = DifficultyLevel.objects.get(code='moderate')

tour1, created = Tour.objects.get_or_create(
    slug='issyk-kul-trek-7d',
    defaults={
        'provider_profile': provider,
        'tour_type': tt_trekking,
        'difficulty_level': dl_moderate,
        'is_custom': False,
        'price': 450,
        'currency_code': 'USD',
        'duration_days': 7,
        'min_group_size': 2,
        'max_group_size': 12,
        'status': 'published',
        'published_at': timezone.now(),
    }
)
if created:
    TourTranslation.objects.create(
        tour=tour1, language=ru,
        title='Трекинг вокруг Иссык-Куля',
        summary='Семидневный поход по живописным берегам и горам.',
        description='Полное описание маршрута с деталями по дням, снаряжению и достопримечательностям.',
        route_overview='Каракол → Джети-Огуз → возврат в Каракол'
    )
    TourTranslation.objects.create(
        tour=tour1, language=en,
        title='Issyk-Kul Trek',
        summary='Seven-day hike along scenic shores and mountains.',
        description='Full route description with day-by-day details, gear and highlights.',
        route_overview='Karakol → Jeti-Oguz → back to Karakol'
    )
    TourPhoto.objects.create(
        tour=tour1,
        file_path='tours/issyk-kul-1.jpg',
        alt_text='Issyk-Kul lake view',
        is_cover=True, sort_order=0,
    )
    TourRoutePoint.objects.create(
        tour=tour1, location=loc_karakol, sequence_order=1, day_number=1,
        notes_ru='Старт маршрута', notes_en='Route start'
    )
    TourRoutePoint.objects.create(
        tour=tour1, location=loc_jetioguz, sequence_order=2, day_number=3,
        notes_ru='Красные скалы', notes_en='Red rocks'
    )
    TourVisaDetails.objects.create(
        tour=tour1, requires_border_permit=False, requires_special_permit=False,
        notes_ru='Специальных разрешений не требуется', notes_en='No special permits required'
    )
    TourInsuranceDetails.objects.create(
        tour=tour1, is_insurance_required=True,
        min_medical_coverage=100000, medical_currency='USD',
        requires_evacuation=True, min_evacuation_coverage=30000, evacuation_currency='EUR',
        notes_ru='Рекомендуется страховка с покрытием эвакуации', notes_en='Evacuation coverage insurance recommended'
    )

tour2, created = Tour.objects.get_or_create(
    slug='ala-archa-day-hike',
    defaults={
        'provider_profile': provider,
        'tour_type': tt_trekking,
        'difficulty_level': DifficultyLevel.objects.get(code='easy'),
        'is_custom': False,
        'price': 35,
        'currency_code': 'USD',
        'duration_days': 1,
        'min_group_size': 1,
        'max_group_size': 15,
        'status': 'published',
        'published_at': timezone.now(),
    }
)
if created:
    TourTranslation.objects.create(
        tour=tour2, language=ru,
        title='Однодневный поход в Ала-Арчу',
        summary='Лёгкий маршрут в национальном парке возле Бишкека.',
        description='Идеально подходит для новичков — красивые виды без серьёзной физической подготовки.',
        route_overview='Бишкек → ущелье Ала-Арча → возврат'
    )
    TourTranslation.objects.create(
        tour=tour2, language=en,
        title='Ala-Archa Day Hike',
        summary='Easy route in the national park near Bishkek.',
        description='Perfect for beginners — beautiful views without serious physical preparation.',
        route_overview='Bishkek → Ala-Archa gorge → return'
    )
    TourPhoto.objects.create(
        tour=tour2, file_path='tours/ala-archa-1.jpg',
        alt_text='Ala-Archa gorge', is_cover=True, sort_order=0,
    )
    TourRoutePoint.objects.create(
        tour=tour2, location=loc_bishkek, sequence_order=1, day_number=1,
        notes_ru='Выезд из Бишкека', notes_en='Departure from Bishkek'
    )
    TourVisaDetails.objects.create(tour=tour2, requires_border_permit=False, requires_special_permit=False)
    TourInsuranceDetails.objects.create(tour=tour2, is_insurance_required=False)

print("Готово! Тестовые данные загружены.")
print(f"Тестовый логин: ivan.petrov@example.com / Test1234!")