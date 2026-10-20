from pathlib import Path
from typing import List

from pydantic import SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(_BACKEND_DIR / ".env" if (_BACKEND_DIR / ".env").is_file() else None),
        env_file_encoding="utf-8",
        extra="ignore",
        hide_input_in_errors=True,
    )

    mongodb_url: str = "mongodb://localhost:27019"
    database_name: str = "chishenme"
    # 对外 API 根路径（与前端 VITE_API_PATH_PREFIX、Nginx 一致；勿与站点上其它 /api 冲突）
    api_path_prefix: str = "/wte-api"
    secret_key: SecretStr
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480  # 8小时
    admin_initial_password: SecretStr
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, value: SecretStr) -> SecretStr:
        raw = value.get_secret_value()
        if len(raw) < 32 or raw.lower().startswith(("change", "replace", "your", "example")):
            raise ValueError("SECRET_KEY must be an independently generated random value of at least 32 characters")
        return value

    @field_validator("admin_initial_password")
    @classmethod
    def validate_initial_password(cls, value: SecretStr) -> SecretStr:
        raw = value.get_secret_value()
        if len(raw) < 12 or len(raw.encode("utf-8")) > 72:
            raise ValueError("ADMIN_INITIAL_PASSWORD must contain at least 12 characters and at most 72 UTF-8 bytes")
        if raw.lower().startswith(("change", "replace", "your", "example")):
            raise ValueError("ADMIN_INITIAL_PASSWORD must be generated before startup")
        return value

    @model_validator(mode="after")
    def validate_independent_credentials(self):
        if self.secret_key.get_secret_value() == self.admin_initial_password.get_secret_value():
            raise ValueError("SECRET_KEY and ADMIN_INITIAL_PASSWORD must be different")
        return self

    @property
    def cors_origins(self) -> List[str]:
        if not self.allowed_origins:
            return []
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


settings = Settings()
