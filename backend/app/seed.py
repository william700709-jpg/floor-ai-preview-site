from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import FloorStyle


SEED_FLOOR_STYLES = [
    {
        "key": "honey-oak",
        "name": "暮光橡木",
        "description": "柔和蜂蜜色，適合奶茶與米白系客廳。",
        "tone": "暖木調",
        "badge": "人氣選色",
        "primary_color": "#ceb08b",
        "secondary_color": "#b98f66",
        "accent_color": "#8f6749",
        "texture_scale": 1.0,
    },
    {
        "key": "mist-walnut",
        "name": "霧感胡桃",
        "description": "帶灰度的中木色，沉穩又不壓空間。",
        "tone": "柔灰木調",
        "badge": "臥室推薦",
        "primary_color": "#b49e88",
        "secondary_color": "#8e735d",
        "accent_color": "#685243",
        "texture_scale": 1.08,
    },
    {
        "key": "linen-beige",
        "name": "亞麻淺木",
        "description": "明亮淺木色，能放大採光與空間感。",
        "tone": "自然淺木",
        "badge": "小宅友善",
        "primary_color": "#dbc8af",
        "secondary_color": "#c9ae89",
        "accent_color": "#9e8060",
        "texture_scale": 0.95,
    },
    {
        "key": "forest-oak",
        "name": "森霧橡木",
        "description": "帶一點綠灰底蘊，適合低飽和自然風。",
        "tone": "綠灰木調",
        "badge": "設計感",
        "primary_color": "#b7b39e",
        "secondary_color": "#8c8469",
        "accent_color": "#6a624f",
        "texture_scale": 1.03,
    },
]


def seed_floor_styles(db: Session) -> None:
    existing = db.scalar(select(FloorStyle.id))
    if existing is not None:
        return

    for payload in SEED_FLOOR_STYLES:
        db.add(FloorStyle(**payload))

    db.commit()
