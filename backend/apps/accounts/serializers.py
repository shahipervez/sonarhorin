from django.contrib.auth import password_validation
from django.db.models import Q
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "full_name", "phone", "major", "university", "graduation_year", "cgpa", "skills", "linkedin", "github", "track", "headline", "is_employer", "date_joined"]
        read_only_fields = ["id", "email", "is_employer", "date_joined"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    phone = serializers.CharField(required=True)
    email = serializers.EmailField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["email", "password", "full_name", "phone", "major", "university", "graduation_year", "cgpa", "skills", "linkedin", "github", "track"]
        extra_kwargs = {f: {"required": False} for f in ["email", "university", "graduation_year", "cgpa", "skills", "linkedin", "github", "track"]}

    def validate_phone(self, value):
        clean = value.replace(" ", "").replace("-", "").strip()
        if not clean:
            raise serializers.ValidationError("একটি সঠিক ফোন নম্বর দিন (Phone number is required).")
        # Check if phone already registered
        if User.objects.filter(Q(phone=clean) | Q(phone=value)).exists():
            raise serializers.ValidationError("এই ফোন নম্বর দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে (An account with this phone already exists).")
        return value

    def validate_email(self, value):
        if not value:
            return ""
        value = value.lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_password(self, value):
        password_validation.validate_password(value)
        return value

    def validate(self, attrs):
        phone = attrs.get("phone", "").strip()
        email = attrs.get("email", "").strip().lower()
        if not email and phone:
            clean = phone.replace(" ", "").replace("-", "").replace("+", "")
            attrs["email"] = f"{clean}@phone.sonarhorin.com"
        return attrs

    def create(self, data):
        return User.objects.create_user(**data)


class EmailTokenSerializer(TokenObtainPairSerializer):
    """JWT login that accepts either Phone Number (for Users) or Gmail/Email (for Admin)."""

    def validate(self, attrs):
        raw_login = attrs.get(self.username_field, "").strip()

        # If it doesn't contain '@', treat it as a phone number
        if "@" not in raw_login:
            clean = raw_login.replace(" ", "").replace("-", "")
            variants = {clean, raw_login}
            if clean.startswith("+880"):
                variants.add("0" + clean[4:])
            elif clean.startswith("880"):
                variants.add("0" + clean[3:])
            elif clean.startswith("01"):
                variants.add("+880 " + clean[1:5] + " " + clean[5:])
                variants.add("+88" + clean)
                variants.add("+880" + clean[1:])

            # Match user by phone or generated phone-email
            user_by_phone = User.objects.filter(
                Q(phone__in=variants) |
                Q(phone__icontains=clean[-10:] if len(clean) >= 10 else clean) |
                Q(email=f"{clean.replace('+', '')}@phone.sonarhorin.com")
            ).first()

            if user_by_phone:
                attrs[self.username_field] = user_by_phone.email
            else:
                attrs[self.username_field] = raw_login.lower()
        else:
            attrs[self.username_field] = raw_login.lower()

        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
