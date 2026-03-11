from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from app.config import settings


CATALOG_PATH = Path(__file__).resolve().parent.parent / "catalog" / "floor_style_catalog.json"
IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")

GROUP_PALETTES: dict[str, list[tuple[str, str, str]]] = {
    "FSPC4.2": [
        ("#ece5db", "#d9c8b7", "#b89f83"),
        ("#efe7dc", "#d4c0aa", "#b58c67"),
        ("#f0ebe2", "#d8cabc", "#baa38e"),
        ("#e7dfd4", "#cdb79b", "#9f805f"),
    ],
    "FSPC5.0": [
        ("#ece4cb", "#d8c79d", "#b59f67"),
        ("#eadcc2", "#d1bc8b", "#a9834f"),
        ("#ddd4c6", "#c0af97", "#8e7a60"),
        ("#e1ddd5", "#c5beb1", "#968873"),
    ],
}


@dataclass(frozen=True)
class CatalogStyle:
    code: str
    name: str
    source_page: int


@dataclass(frozen=True)
class CatalogGroup:
    code: str
    name: str
    description: str
    spec: dict[str, object]
    styles: list[CatalogStyle]


def style_key(group_code: str, style_code: str) -> str:
    return f"{group_code.lower()}-{style_code.lower()}"


def load_floor_style_catalog() -> list[CatalogGroup]:
    payload = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    groups: list[CatalogGroup] = []

    for group in payload.get("groups", []):
        groups.append(
            CatalogGroup(
                code=group["code"],
                name=group["name"],
                description=group["description"],
                spec=group["spec"],
                styles=[
                    CatalogStyle(
                        code=style["code"],
                        name=style["name"],
                        source_page=style["source_page"],
                    )
                    for style in group.get("styles", [])
                ],
            )
        )

    return groups


def build_style_description(group: CatalogGroup) -> str:
    return (
        f"{group.description}，規格 {group.spec['dimension']}，"
        f"厚度 {group.spec['thickness_mm']}mm，"
        f"耐磨層 {group.spec['wear_layer_mm']}mm，"
        f"{group.spec['packaging']}。"
    )


def palette_for_style(group_code: str, index: int) -> tuple[str, str, str]:
    palette_list = GROUP_PALETTES.get(group_code, GROUP_PALETTES["FSPC4.2"])
    return palette_list[index % len(palette_list)]


def resolve_group_cover_url(group_code: str) -> str | None:
    base_dir = settings.storage_root / "floor-style-groups" / group_code
    for extension in IMAGE_EXTENSIONS:
        candidate = base_dir / f"cover{extension}"
        if candidate.exists():
            return f"/storage/floor-style-groups/{group_code}/cover{extension}"
    return None


def resolve_group_cover_path(group_code: str) -> Path | None:
    base_dir = settings.storage_root / "floor-style-groups" / group_code
    for extension in IMAGE_EXTENSIONS:
        candidate = base_dir / f"cover{extension}"
        if candidate.exists():
            return candidate
    return None


def resolve_style_image_url(group_code: str, style_code: str) -> str | None:
    image_path = resolve_style_image_path(group_code, style_code)
    if image_path is None:
        return None
    return f"/storage/floor-style-groups/{group_code}/{image_path.name}"


def resolve_style_image_path(group_code: str, style_code: str) -> Path | None:
    base_dir = settings.storage_root / "floor-style-groups" / group_code
    for extension in IMAGE_EXTENSIONS:
        candidate = base_dir / f"{style_code}{extension}"
        if candidate.exists():
            return candidate
    return None
