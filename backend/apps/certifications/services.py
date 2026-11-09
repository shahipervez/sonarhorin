from .models import Certificate


def issue_certificate(user, kind, title, score=None, details=None):
    return Certificate.objects.create(user=user, kind=kind, title=title, score=score, details=details or {})
