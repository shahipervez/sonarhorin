"""Throttle helpers.

``STRICT`` keeps the global anon/user limits *and* adds the view's ``throttle_scope`` (e.g. "ai", "otp", "report"):

    class SendOTPView(APIView):
        throttle_classes = STRICT
        throttle_scope = "otp"
"""
from rest_framework.throttling import AnonRateThrottle, ScopedRateThrottle, UserRateThrottle

STRICT = [AnonRateThrottle, UserRateThrottle, ScopedRateThrottle]
