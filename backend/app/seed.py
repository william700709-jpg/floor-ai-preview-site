from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import FloorStyle, QuoteFormulaSetting, QuoteProduct
from app.services.floor_style_catalog import (
    build_style_description,
    load_floor_style_catalog,
    palette_for_style,
    style_key,
)


def seed_floor_styles(db: Session) -> None:
    groups = load_floor_style_catalog()
    valid_keys = {
        style_key(group.code, style.code)
        for group in groups
        for style in group.styles
    }

    existing_rows = {
        row.key: row
        for row in db.scalars(select(FloorStyle)).all()
    }

    for group in groups:
        for index, style in enumerate(group.styles):
            key = style_key(group.code, style.code)
            primary, secondary, accent = palette_for_style(group.code, index)
            row = existing_rows.get(key)

            payload = {
                "name": style.name,
                "description": build_style_description(group),
                "tone": group.code,
                "badge": style.code,
                "primary_color": primary,
                "secondary_color": secondary,
                "accent_color": accent,
                "texture_scale": 1.0,
                "is_active": True,
            }

            if row is None:
                db.add(FloorStyle(key=key, **payload))
                continue

            for field, value in payload.items():
                setattr(row, field, value)

        for key, row in existing_rows.items():
            if key not in valid_keys:
                row.is_active = False

    db.commit()


def seed_quote_products(db: Session) -> None:
    products = [
        {
            "category": "curtain",
            "form": "fabric",
            "code": "CURTAIN-FABRIC",
            "name": "布簾",
            "unit_label": "副",
            "price_per_square_meter": 796,
            "fullness_factor": 2.0,
            "rail_price_per_meter": 40,
            "labor_price": 160,
            "minimum_charge": 0,
        },
        {
            "category": "curtain",
            "form": "sheer",
            "code": "CURTAIN-SHEER",
            "name": "紗簾",
            "unit_label": "副",
            "price_per_square_meter": 396,
            "fullness_factor": 1.0,
            "rail_price_per_meter": 50,
            "labor_price": 170,
            "minimum_charge": 0,
        },
        {
            "category": "curtain",
            "form": "roman",
            "code": "CURTAIN-ROMAN",
            "name": "羅馬簾",
            "unit_label": "樘",
            "price_per_square_meter": 996,
            "fullness_factor": 1.0,
            "rail_price_per_meter": 100,
            "labor_price": 40,
            "minimum_charge": 0,
        },
        {
            "category": "curtain",
            "form": "roller",
            "code": "CURTAIN-ROLLER",
            "name": "捲簾",
            "unit_label": "樘",
            "price_per_square_meter": 80,
            "fullness_factor": 1.0,
            "rail_price_per_meter": 0,
            "labor_price": 0,
            "minimum_charge": 0,
        },
        {
            "category": "curtain",
            "form": "daynight",
            "code": "CURTAIN-DAYNIGHT",
            "name": "調光簾",
            "unit_label": "樘",
            "price_per_square_meter": 80,
            "fullness_factor": 1.0,
            "rail_price_per_meter": 0,
            "labor_price": 0,
            "minimum_charge": 0,
        },
        {
            "category": "floor",
            "form": "spc",
            "code": "SPC-OAK-NATURAL",
            "name": "SPC 石塑地板 橡木原色",
            "unit_label": "坪",
            "price_per_square_meter": 2350,
            "fullness_factor": 1.0,
            "rail_price_per_meter": 0,
            "labor_price": 650,
            "minimum_charge": 4500,
        },
        {
            "category": "floor",
            "form": "laminate",
            "code": "LAM-WALNUT",
            "name": "超耐磨木地板 胡桃色",
            "unit_label": "坪",
            "price_per_square_meter": 1980,
            "fullness_factor": 1.0,
            "rail_price_per_meter": 0,
            "labor_price": 580,
            "minimum_charge": 4000,
        },
        {
            "category": "floor",
            "form": "engineered",
            "code": "ENG-HAZEL",
            "name": "海島型木地板 榛木色",
            "unit_label": "坪",
            "price_per_square_meter": 2980,
            "fullness_factor": 1.0,
            "rail_price_per_meter": 0,
            "labor_price": 780,
            "minimum_charge": 5200,
        },
        {
            "category": "floor",
            "form": "pvc",
            "code": "PVC-OAK-LIGHT",
            "name": "PVC地板 淺橡木",
            "unit_label": "坪",
            "price_per_square_meter": 1680,
            "fullness_factor": 1.0,
            "rail_price_per_meter": 0,
            "labor_price": 480,
            "minimum_charge": 3200,
        },
        {
            "category": "other",
            "form": "other",
            "code": "CUSTOM-OTHER",
            "name": "其他",
            "unit_label": "自訂",
            "price_per_square_meter": 0,
            "fullness_factor": 1.0,
            "rail_price_per_meter": 0,
            "labor_price": 0,
            "minimum_charge": 0,
        },
    ]

    existing_rows = {
        row.code: row
        for row in db.scalars(select(QuoteProduct)).all()
    }

    for product in products:
        row = existing_rows.get(product["code"])
        if row is None:
            db.add(QuoteProduct(**product, is_active=True))
            continue

        for field, value in product.items():
            setattr(row, field, value)
        row.is_active = True

    valid_codes = {product["code"] for product in products}
    for code, row in existing_rows.items():
        if code not in valid_codes:
            row.is_active = False

    db.commit()


def seed_quote_formula_settings(db: Session) -> None:
    settings = [
        {
            "form": "fabric",
            "display_name": "布簾",
            "material_unit_price_default": 796,
            "discount_rate": None,
            "rail_price_per_chi": 40,
            "labor_price": 160,
            "fabric_width_chi": 5,
            "fabric_multiplier": 2,
            "minimum_billable_talents": None,
        },
        {
            "form": "sheer",
            "display_name": "紗簾",
            "material_unit_price_default": 396,
            "discount_rate": None,
            "rail_price_per_chi": 50,
            "labor_price": 170,
            "fabric_width_chi": None,
            "fabric_multiplier": 2,
            "minimum_billable_talents": None,
        },
        {
            "form": "roman",
            "display_name": "羅馬簾",
            "material_unit_price_default": 996,
            "discount_rate": None,
            "rail_price_per_chi": 100,
            "labor_price": 40,
            "fabric_width_chi": None,
            "fabric_multiplier": None,
            "minimum_billable_talents": None,
        },
        {
            "form": "roller",
            "display_name": "捲簾",
            "material_unit_price_default": 80,
            "discount_rate": 0.4,
            "rail_price_per_chi": None,
            "labor_price": None,
            "fabric_width_chi": None,
            "fabric_multiplier": None,
            "minimum_billable_talents": 15,
        },
        {
            "form": "daynight",
            "display_name": "調光簾",
            "material_unit_price_default": 80,
            "discount_rate": 0.4,
            "rail_price_per_chi": None,
            "labor_price": None,
            "fabric_width_chi": None,
            "fabric_multiplier": None,
            "minimum_billable_talents": 15,
        },
    ]

    existing_rows = {
        row.form: row
        for row in db.scalars(select(QuoteFormulaSetting)).all()
    }

    for item in settings:
        row = existing_rows.get(item["form"])
        if row is None:
            db.add(QuoteFormulaSetting(**item, is_active=True))
            continue

        for field, value in item.items():
            setattr(row, field, value)
        row.is_active = True

    valid_forms = {item["form"] for item in settings}
    for form, row in existing_rows.items():
        if form not in valid_forms:
            row.is_active = False

    db.commit()
