ROLE_ALLOWED_DOCUMENT_TYPES = {
    'guide': ['passport', 'guide_license', 'certificate_scan', 'other'],
    'tour_operator': ['passport', 'tour_operator_license', 'business_registration', 'insurance_contract', 'other'],
    'travel_agent': ['passport', 'business_registration', 'certificate_scan', 'other'],
}


def get_allowed_document_type_codes(role_code: str) -> list[str]:
    return ROLE_ALLOWED_DOCUMENT_TYPES.get(role_code, [])