from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any, Dict, Literal


# ---------- 管理员认证 ----------

class AdminLoginRequest(BaseModel):
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(min_length=12, max_length=72, repr=False)

    @field_validator("new_password")
    @classmethod
    def validate_password_bytes(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must not exceed 72 UTF-8 bytes")
        return value


# ---------- AI 配置 ----------

# 文本模型 Responses API 的 reasoning.effort；off = 不发送该参数（兼容不支持推理参数的模型）
ReasoningEffortConfig = Literal["off", "none", "minimal", "low", "medium", "high", "xhigh"]


class TextGenerationConfig(BaseModel):
    base_url: str = ""
    api_key: str = ""
    model: str = ""
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    timeout: int = Field(default=300000, gt=0)
    # Doubao-Seed 等：minimal 关闭「深度思考」、响应快；medium/high 为更深推理（更慢）
    reasoning_effort: ReasoningEffortConfig = Field(
        default="minimal",
        description="模型级默认；off 表示不传 reasoning 字段",
    )


class ImageGenerationConfig(BaseModel):
    base_url: str = ""
    api_key: str = ""
    model: str = ""
    # 与火山文生图 OpenAI 示例一致：见官网「文生图-生成单张图」
    default_size: str = "2K"
    response_format: str = "url"
    watermark: bool = True


class AISettingsRequest(BaseModel):
    text_generation: TextGenerationConfig
    image_generation: ImageGenerationConfig


class AISettingsResponse(BaseModel):
    text_generation: TextGenerationConfig
    image_generation: ImageGenerationConfig


# ---------- AI 代理请求 ----------

class ChatMessage(BaseModel):
    role: str
    content: str
    # 与火山 Responses 多模态示例一致：有 URL 时 content 为 input_text，并附带 input_image
    image_url: Optional[str] = None


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    stream: Optional[bool] = False
    # 单次请求可覆盖 JManage 中的模型级 reasoning_effort；未传则使用「文本生成」里的配置
    reasoning_effort: Optional[Literal["off", "none", "minimal", "low", "medium", "high", "xhigh"]] = None


class ImageRequest(BaseModel):
    prompt: str
    # 空则使用管理端「默认尺寸」（默认 2K，与官网文生图示例一致）
    size: Optional[str] = None
    n: Optional[int] = 1
    response_format: Optional[str] = None
    watermark: Optional[bool] = None
