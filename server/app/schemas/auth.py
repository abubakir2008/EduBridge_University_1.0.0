from pydantic import BaseModel


class LoginRequest(BaseModel):
    login: str
    password: str


class LoginResponse(BaseModel):
    """Tokens are delivered as httpOnly cookies; the body only carries the role."""
    role: str


class CredentialsResponse(BaseModel):
    login: str
    password: str
