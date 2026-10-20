from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
from config import settings
import logging

logger = logging.getLogger(__name__)

_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


async def connect_db():
    global _client, _db
    _client = AsyncIOMotorClient(settings.mongodb_url)
    _db = _client[settings.database_name]

    await _init_default_data()
    logger.info("已连接到 MongoDB，数据库: %s", settings.database_name)


async def close_db():
    global _client
    if _client:
        _client.close()
        logger.info("已断开 MongoDB 连接")


def get_db() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError("数据库未初始化，请确保应用已启动")
    return _db


async def _init_default_data():
    """首次启动时写入默认管理员账号和 AI 配置"""
    from auth import get_password_hash

    # 初始化管理员账号
    admin = await _db.admin.find_one({"username": "admin"})
    if not admin:
        hashed = get_password_hash(settings.admin_initial_password.get_secret_value())
        await _db.admin.insert_one({"username": "admin", "hashed_password": hashed})
        logger.info("已创建管理员账号；请使用本机配置的初始密码登录并及时修改")

    # 初始化文本生成配置
    text_cfg = await _db.ai_settings.find_one({"type": "text_generation"})
    if not text_cfg:
        await _db.ai_settings.insert_one({
            "type": "text_generation",
            "base_url": "",
            "api_key": "",
            "model": "",
            "temperature": 0.7,
            "timeout": 300000,
            "reasoning_effort": "minimal",
        })

    # 初始化图片生成配置
    image_cfg = await _db.ai_settings.find_one({"type": "image_generation"})
    if not image_cfg:
        await _db.ai_settings.insert_one({
            "type": "image_generation",
            "base_url": "",
            "api_key": "",
            "model": "",
            "default_size": "2K",
            "response_format": "url",
            "watermark": True,
        })
