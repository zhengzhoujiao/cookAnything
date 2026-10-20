import json
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from openai import APIConnectionError, APIStatusError, APITimeoutError, AsyncOpenAI
from openai.types.shared.reasoning import Reasoning

from database import get_db
from models import ChatMessage, ChatRequest, ImageRequest
from config import settings

_p = settings.api_path_prefix.rstrip("/")
router = APIRouter(prefix=f"{_p}/ai", tags=["ai-proxy"])
logger = logging.getLogger(__name__)


def _ark_v3_base(url: str) -> str:
    """
    方舟 OpenAI 兼容基址，只保留到 /api/v3，例如：
    https://ark.cn-beijing.volces.com/api/v3
    去掉管理端可能误填的 /responses、/images/generations 等尾缀。
    """
    u = (url or "").strip().rstrip("/")
    for suffix in (
        "/images/generations",
        "/responses",
        "/chat/completions",
        "/chat",
    ):
        if u.endswith(suffix):
            u = u[: -len(suffix)].rstrip("/")
    return u


def _messages_to_ark_input(messages: List[ChatMessage]) -> List[Dict[str, Any]]:
    """
    与火山「Responses」示例一致：input 为 role + content。
    - 无图：单块 input_text（与纯文本官方用法一致）；
    - 有图：input_image + input_text（与官网多模态示例一致）。
    """
    out: List[Dict[str, Any]] = []
    for m in messages:
        if m.image_url:
            out.append(
                {
                    "role": m.role,
                    "content": [
                        {"type": "input_image", "image_url": m.image_url},
                        {"type": "input_text", "text": m.content},
                    ],
                }
            )
        else:
            out.append(
                {
                    "role": m.role,
                    "content": [{"type": "input_text", "text": m.content}],
                }
            )
    return out


def _extract_ark_output_text(data: Dict[str, Any]) -> str:
    """从 Responses 返回（或 model_dump）中取助手文本（兼容多种字段）。"""
    if not data:
        return ""
    ch = data.get("choices")
    if ch and isinstance(ch, list):
        msg = ch[0].get("message") or {}
        if isinstance(msg.get("content"), str):
            return msg["content"]
    parts: List[str] = []
    output = data.get("output")
    if isinstance(output, list):
        for item in output:
            if not isinstance(item, dict):
                continue
            if item.get("type") == "message" and item.get("content"):
                for block in item["content"]:
                    if not isinstance(block, dict):
                        continue
                    if block.get("type") in ("output_text", "text") and "text" in block:
                        parts.append(str(block["text"]))
                    elif "text" in block:
                        parts.append(str(block["text"]))
    if parts:
        return "".join(parts)
    if isinstance(data.get("output"), str):
        return data["output"]
    return ""


def _openai_shape_from_text(text: str) -> Dict[str, Any]:
    return {"choices": [{"message": {"content": text}}]}


def _extract_stream_delta(obj: Dict[str, Any]) -> Optional[str]:
    """从流式事件中取文本增量（方舟 / OpenAI Responses 混用）。"""
    if not obj:
        return None
    if obj.get("choices"):
        d = (obj["choices"][0].get("delta") or {}).get("content")
        if d:
            return str(d)
    t = str(obj.get("type", ""))
    if "delta" in obj:
        delta = obj["delta"]
        if isinstance(delta, str):
            return delta
        if isinstance(delta, dict):
            if "text" in delta:
                return str(delta["text"])
            if "content" in delta:
                return str(delta["content"])
    if "output_text" in obj and obj["output_text"]:
        return str(obj["output_text"])
    if "text" in obj and obj["text"]:
        return str(obj["text"])
    if t.endswith("output_text.done") or "message" in t:
        pass
    return None


def _stream_event_to_delta(event: Any) -> Optional[str]:
    if hasattr(event, "model_dump"):
        return _extract_stream_delta(event.model_dump())
    if isinstance(event, dict):
        return _extract_stream_delta(event)
    return None


async def _get_text_config() -> dict:
    db = get_db()
    cfg = await db.ai_settings.find_one({"type": "text_generation"})
    if not cfg or not cfg.get("api_key") or not cfg.get("base_url"):
        raise HTTPException(
            status_code=503,
            detail="AI 文本生成服务尚未配置，请联系管理员在 /JManage 中完成配置",
        )
    return cfg


async def _get_image_config() -> dict:
    db = get_db()
    cfg = await db.ai_settings.find_one({"type": "image_generation"})
    if not cfg or not cfg.get("api_key") or not cfg.get("base_url"):
        raise HTTPException(
            status_code=503,
            detail="图片生成服务尚未配置，请联系管理员在 /JManage 中完成配置",
        )
    return cfg


@router.post("/chat")
async def chat_proxy(request: ChatRequest):
    cfg = await _get_text_config()
    base = _ark_v3_base(cfg["base_url"])
    timeout = cfg.get("timeout", 300000) / 1000
    client = AsyncOpenAI(
        base_url=base,
        api_key=cfg["api_key"],
        timeout=timeout,
    )

    temperature = request.temperature if request.temperature is not None else cfg.get("temperature", 0.7)
    create_kwargs: Dict[str, Any] = {
        "model": cfg["model"],
        "input": _messages_to_ark_input(request.messages),
        "temperature": temperature,
    }
    if request.max_tokens:
        create_kwargs["max_output_tokens"] = request.max_tokens

    # JManage 模型级默认 + 可选单次请求覆盖；off=不传 reasoning；minimal=关闭深度思考、明显降延迟
    eff: Optional[str] = request.reasoning_effort
    if eff is None:
        eff = cfg.get("reasoning_effort", "minimal")
    if eff in ("none", "minimal", "low", "medium", "high", "xhigh"):
        create_kwargs["reasoning"] = Reasoning(effort=eff)

    if request.stream:

        async def generate():
            try:
                create_kwargs_s = {**create_kwargs, "stream": True}
                stream = await client.responses.create(**create_kwargs_s)
                async for event in stream:
                    delta = _stream_event_to_delta(event)
                    if delta:
                        out = {"choices": [{"delta": {"content": delta}}]}
                        yield f"data: {json.dumps(out, ensure_ascii=False)}\n\n"
                yield "data: [DONE]\n\n"
            except APIStatusError as e:
                err = "上游 AI 服务请求失败，请联系管理员检查服务配置"
                logger.warning("流式 Responses 上游错误: HTTP %s", e.status_code)
                yield f"data: {json.dumps({'error': err}, ensure_ascii=False)}\n\n"
            except APITimeoutError:
                yield f"data: {json.dumps({'error': 'AI 服务请求超时'})}\n\n"
            except APIConnectionError as e:
                yield f"data: {json.dumps({'error': '无法连接到 AI 服务，请联系管理员'}, ensure_ascii=False)}\n\n"
            except Exception as e:
                logger.error("流式代理异常: %s", type(e).__name__)
                yield f"data: {json.dumps({'error': 'AI 服务请求失败，请联系管理员'}, ensure_ascii=False)}\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")

    try:
        response = await client.responses.create(**{**create_kwargs, "stream": False})
    except APIStatusError as e:
        raise HTTPException(status_code=e.status_code, detail="上游 AI 服务请求失败，请联系管理员检查服务配置")
    except APITimeoutError:
        raise HTTPException(status_code=504, detail="AI 服务请求超时")
    except APIConnectionError as e:
        raise HTTPException(status_code=502, detail="无法连接到 AI 服务，请联系管理员")

    data = response.model_dump()
    text = _extract_ark_output_text(data)
    return _openai_shape_from_text(text)


@router.post("/images")
async def image_proxy(request: ImageRequest):
    cfg = await _get_image_config()
    base = _ark_v3_base(cfg.get("base_url", ""))
    client = AsyncOpenAI(
        base_url=base,
        api_key=cfg["api_key"],
        timeout=120,
    )
    # 与火山文生图 OpenAI 示例：size / response_format / extra_body.watermark
    size = request.size or cfg.get("default_size", "2K")
    response_format = request.response_format or cfg.get("response_format", "url")
    if request.watermark is not None:
        wm = request.watermark
    else:
        wm = bool(cfg.get("watermark", True))
    try:
        result = await client.images.generate(
            model=cfg["model"],
            prompt=request.prompt,
            n=request.n or 1,
            size=size,
            response_format=response_format,
            extra_body={"watermark": wm},
        )
    except APIStatusError as e:
        logger.warning(
            "图片生成上游错误: %s -> HTTP %s",
            e.request.url,
            e.status_code,
        )
        raise HTTPException(status_code=e.status_code, detail="上游 AI 服务请求失败，请联系管理员检查服务配置")
    except APITimeoutError:
        raise HTTPException(status_code=504, detail="图片生成服务请求超时")
    except APIConnectionError as e:
        raise HTTPException(status_code=502, detail="无法连接到图片生成服务，请联系管理员")

    return result.model_dump()

