from django.conf import settings
from django.core import signing
from rest_framework import authentication, exceptions


class TokenUser:
    def __init__(self, user_id, username=''):
        self.id = user_id
        self.pk = user_id
        self.username = username
        self.is_authenticated = True

    def __str__(self):
        return self.username or str(self.id)


class SignedTokenAuthentication(authentication.BaseAuthentication):
    keyword = 'Bearer'

    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request).decode('utf-8')
        token = request.query_params.get('token')

        if auth_header:
            parts = auth_header.split()
            if len(parts) != 2 or parts[0] != self.keyword:
                raise exceptions.AuthenticationFailed('Invalid Authorization header.')
            token = parts[1]

        if not token:
            return None

        try:
            payload = signing.loads(
                token,
                key=settings.AUTH_TOKEN_SECRET,
                salt=settings.TOKEN_SIGNING_SALT,
            )
        except signing.BadSignature as exc:
            raise exceptions.AuthenticationFailed('Invalid auth token.') from exc

        user_id = payload.get('user_id')
        if not user_id:
            raise exceptions.AuthenticationFailed('Auth token has no user_id.')

        return TokenUser(user_id=user_id, username=payload.get('username', '')), token
