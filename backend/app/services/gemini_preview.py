from __future__ import annotations

import base64
import json
import mimetypes
from io import BytesIO
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from PIL import Image

from app.config import settings


def _inline_part(image_path: Path) -> dict[str, object]:
    mime_type = mimetypes.guess_type(image_path.name)[0] or "image/jpeg"
    return {
        "inline_data": {
            "mime_type": mime_type,
            "data": base64.b64encode(image_path.read_bytes()).decode("utf-8"),
        }
    }


def _extract_image_bytes(payload: dict[str, object]) -> bytes:
    candidates = payload.get("candidates", [])
    if not isinstance(candidates, list):
        raise ValueError("Gemini response did not include candidates.")

    for candidate in candidates:
        if not isinstance(candidate, dict):
            continue
        content = candidate.get("content", {})
        if not isinstance(content, dict):
            continue
        parts = content.get("parts", [])
        if not isinstance(parts, list):
            continue
        for part in parts:
            if not isinstance(part, dict):
                continue
            inline = part.get("inline_data") or part.get("inlineData")
            if isinstance(inline, dict) and inline.get("data"):
                return base64.b64decode(str(inline["data"]))

    raise ValueError("Gemini response did not include an image output.")


def generate_gemini_floor_preview(
    *,
    original_path: Path,
    style_reference_path: Path,
    guide_preview_path: Path,
    output_path: Path,
    group_code: str,
    style_code: str,
) -> None:
    if not settings.gemini_api_key:
        raise ValueError("Missing Gemini API key.")

    prompt = (
        "You are editing an interior photo for a flooring quotation website. "
        "Image 1 is the original room photo. "
        "Image 2 is the exact flooring material reference that must be used. "
        "Image 3 is a rough guide preview showing where the floor replacement should appear. "
        f"Replace only the visible floor in the original room with the flooring from image 2 ({group_code} {style_code}). "
        "Preserve all people, furniture, walls, decorations, camera angle, perspective, room structure, and lighting. "
        "Do not alter faces, clothing, walls, curtains, or objects. "
        "Do not add or remove furniture. "
        "Keep the result photorealistic and suitable for commercial presentation. "
        "Use the exact wood/SPC tone and plank feeling from the reference image as closely as possible."
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    _inline_part(original_path),
                    _inline_part(style_reference_path),
                    _inline_part(guide_preview_path),
                ]
            }
        ],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"],
        },
    }

    endpoint = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
    )

    request = Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=180) as response:
            response_payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        body = error.read().decode("utf-8", errors="ignore")
        raise ValueError(f"Gemini API request failed: {body}") from error
    except URLError as error:
        raise ValueError(f"Gemini API connection failed: {error}") from error

    image_bytes = _extract_image_bytes(response_payload)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    image.save(output_path, format="PNG")
