from slowapi import Limiter
from slowapi.util import get_remote_address

# 30 requests/minute по умолчанию для всех роутов
limiter = Limiter(key_func=get_remote_address, default_limits=["30/minute"])
