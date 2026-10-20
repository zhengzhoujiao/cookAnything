from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import get_db
from models import (
    AdminLoginRequest,
    TokenResponse,
    ChangePasswordRequest,
    AISettingsRequest,
    AISettingsResponse,
    TextGenerationConfig,
    ImageGenerationConfig,
)
from auth import verify_password, get_password_hash, create_access_token, verify_token
from config import settings

_p = settings.api_path_prefix.rstrip("/")
router = APIRouter(prefix=f"{_p}/admin", tags=["admin"])
security = HTTPBearer()


async def require_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = verify_token(credentials.credentials)
    if not payload or payload.get("sub") != "admin":
        raise HTTPException(status_code=401, detail="令牌无效或已过期")
    return payload


@router.post("/login", response_model=TokenResponse)
async def login(data: AdminLoginRequest):
    db = get_db()
    admin = await db.admin.find_one({"username": "admin"})
    if not admin or not verify_password(data.password, admin["hashed_password"]):
        raise HTTPException(status_code=401, detail="密码错误")
    token = create_access_token({"sub": "admin"})
    return TokenResponse(access_token=token)


@router.get("/settings", response_model=AISettingsResponse)
async def get_settings(_admin=Depends(require_admin)):
    db = get_db()
    text_cfg = await db.ai_settings.find_one({"type": "text_generation"})
    image_cfg = await db.ai_settings.find_one({"type": "image_generation"})

    return AISettingsResponse(
        text_generation=TextGenerationConfig(
            base_url=text_cfg.get("base_url", ""),
            api_key=text_cfg.get("api_key", ""),
            model=text_cfg.get("model", ""),
            temperature=text_cfg.get("temperature", 0.7),
            timeout=text_cfg.get("timeout", 300000),
            reasoning_effort=text_cfg.get("reasoning_effort", "minimal"),
        ),
        image_generation=ImageGenerationConfig(
            base_url=image_cfg.get("base_url", ""),
            api_key=image_cfg.get("api_key", ""),
            model=image_cfg.get("model", ""),
            default_size=image_cfg.get("default_size", "2K"),
            response_format=image_cfg.get("response_format", "url"),
            watermark=image_cfg.get("watermark", True),
        ),
    )


@router.put("/settings")
async def update_settings(data: AISettingsRequest, _admin=Depends(require_admin)):
    db = get_db()
    await db.ai_settings.update_one(
        {"type": "text_generation"},
        {"$set": {
            "base_url": data.text_generation.base_url,
            "api_key": data.text_generation.api_key,
            "model": data.text_generation.model,
            "temperature": data.text_generation.temperature,
            "timeout": data.text_generation.timeout,
            "reasoning_effort": data.text_generation.reasoning_effort,
        }},
    )
    await db.ai_settings.update_one(
        {"type": "image_generation"},
        {"$set": {
            "base_url": data.image_generation.base_url,
            "api_key": data.image_generation.api_key,
            "model": data.image_generation.model,
            "default_size": data.image_generation.default_size,
            "response_format": data.image_generation.response_format,
            "watermark": data.image_generation.watermark,
        }},
    )
    return {"message": "配置已保存"}


@router.put("/password")
async def change_password(data: ChangePasswordRequest, _admin=Depends(require_admin)):
    db = get_db()
    admin = await db.admin.find_one({"username": "admin"})
    if not verify_password(data.old_password, admin["hashed_password"]):
        raise HTTPException(status_code=400, detail="原密码错误")
    new_hash = get_password_hash(data.new_password)
    await db.admin.update_one(
        {"username": "admin"},
        {"$set": {"hashed_password": new_hash}},
    )
    return {"message": "密码已更新"}
