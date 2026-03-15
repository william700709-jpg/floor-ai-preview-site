from __future__ import annotations

import math
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Quote, QuoteFormulaSetting, QuoteItem, QuoteProduct
from app.schemas import (
    QuoteCreateIn,
    QuoteFormulaSettingListOut,
    QuoteFormulaSettingOut,
    QuoteFormulaSettingSaveIn,
    QuoteListOut,
    QuoteOut,
    QuoteProductOut,
)

router = APIRouter(tags=["quotes"])

CM_PER_CHI = Decimal("30.3")


def _money(value: Decimal | float | int) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _chi(value_cm: float) -> Decimal:
    return Decimal(str(value_cm)) / CM_PER_CHI


def _ceil_decimal(value: Decimal) -> int:
    return math.ceil(float(value))


def _setting_value(setting: QuoteFormulaSetting | None, field: str, fallback: float | int | None) -> Decimal | None:
    raw_value = getattr(setting, field) if setting is not None else fallback
    if raw_value is None:
        return None
    return Decimal(str(raw_value))


def _calculate_curtain_item(
    product: QuoteProduct,
    setting: QuoteFormulaSetting | None,
    width_cm: float,
    height_cm: float,
    quantity: int,
    material_unit_price: Decimal,
) -> tuple[Decimal, Decimal, str, str]:
    width_chi = _chi(width_cm)
    height_chi = _chi(height_cm)
    rounded_width = Decimal(_ceil_decimal(width_chi))
    rail_price_per_chi = _setting_value(setting, "rail_price_per_chi", product.rail_price_per_meter) or Decimal("0")
    labor_price = _setting_value(setting, "labor_price", product.labor_price) or Decimal("0")
    fabric_width_chi = _setting_value(setting, "fabric_width_chi", 5) or Decimal("5")
    fabric_multiplier = _setting_value(setting, "fabric_multiplier", 2) or Decimal("2")
    discount_rate = _setting_value(setting, "discount_rate", None) or Decimal("0.4")
    minimum_billable_talents = int(getattr(setting, "minimum_billable_talents", None) or 0)

    if product.form == "fabric":
        panels = Decimal(_ceil_decimal((width_chi * fabric_multiplier) / fabric_width_chi))
        yards = ((height_chi + Decimal("1")) * panels) / Decimal("3")
        material_cost = (yards / Decimal("2")) * material_unit_price
        labor_cost = panels * labor_price
        rail_cost = rounded_width * rail_price_per_chi
        single_total = material_cost + labor_cost + rail_cost
        summary = f"布簾：{yards.quantize(Decimal('0.01'))} 碼，{int(panels)} 幅，軌道 {int(rounded_width)} 尺"
        pricing_unit = "碼"
    elif product.form == "sheer":
        yards = Decimal(_ceil_decimal((width_chi * fabric_multiplier) / Decimal("3")))
        material_cost = (yards / Decimal("2")) * material_unit_price
        labor_cost = yards * labor_price
        rail_cost = rounded_width * rail_price_per_chi
        single_total = material_cost + labor_cost + rail_cost
        summary = f"紗簾：{yards.quantize(Decimal('0.01'))} 碼，軌道 {int(rounded_width)} 尺"
        pricing_unit = "碼"
    elif product.form == "roman":
        talents = width_chi * height_chi
        yards = Decimal(max(1, _ceil_decimal(((height_chi + Decimal("1")) * Decimal("2")) / Decimal("3"))))
        material_cost = (yards / Decimal("2")) * material_unit_price
        labor_cost = talents * labor_price
        rail_cost = rounded_width * rail_price_per_chi
        single_total = material_cost + labor_cost + rail_cost
        summary = f"羅馬簾：{yards.quantize(Decimal('0.01'))} 碼，{talents.quantize(Decimal('0.01'))} 才"
        pricing_unit = "碼"
    elif product.form in {"roller", "daynight"}:
        talents = Decimal(max(max(1, minimum_billable_talents), _ceil_decimal(width_chi * height_chi)))
        single_total = talents * material_unit_price * discount_rate
        display_name = "調光簾" if product.form == "daynight" else "捲簾"
        summary = f"{display_name}：{int(talents)} 才，折數 {discount_rate.normalize()}"
        pricing_unit = "才"
    else:
        area = (Decimal(str(width_cm)) / Decimal("100")) * (Decimal(str(height_cm)) / Decimal("100"))
        single_total = area * material_unit_price
        summary = f"{product.name}：{area.quantize(Decimal('0.01'))} 平方公尺"
        pricing_unit = product.unit_label

    single_total = _money(single_total)
    if product.minimum_charge and single_total < Decimal(str(product.minimum_charge)):
        single_total = _money(product.minimum_charge)

    subtotal = _money(single_total * quantity)
    return single_total, subtotal, summary, pricing_unit


def _calculate_floor_item(
    quantity: int,
    material_unit_price: Decimal,
) -> tuple[Decimal, Decimal, str, str]:
    single_total = _money(material_unit_price)
    subtotal = _money(single_total * quantity)
    summary = f"地板：每坪 {material_unit_price.quantize(Decimal('0.01'))}，數量 {quantity} 坪"
    return single_total, subtotal, summary, "坪"


def _calculate_other_item(
    quantity: int,
    material_unit_price: Decimal,
    custom_product_name: str,
    custom_unit: str,
) -> tuple[Decimal, Decimal, str, str]:
    single_total = _money(material_unit_price)
    subtotal = _money(single_total * quantity)
    summary = f"{custom_product_name}：{quantity} {custom_unit}"
    return single_total, subtotal, summary, custom_unit


def _serialize_quote(quote: Quote) -> QuoteOut:
    return QuoteOut(
        id=quote.id,
        quote_number=quote.quote_number,
        customer_name=quote.customer_name,
        customer_phone=quote.customer_phone,
        installation_address=quote.installation_address,
        quote_date=quote.quote_date,
        remarks=quote.remarks,
        total_amount=float(quote.total_amount),
        created_at=quote.created_at,
        items=[
            {
                "id": item.id,
                "sort_order": item.sort_order,
                "category": item.category,
                "form": item.form,
                "location_name": item.location_name,
                "custom_model": item.custom_model,
                "pricing_unit": item.pricing_unit,
                "material_unit_price": float(item.material_unit_price) if item.material_unit_price is not None else None,
                "product_id": item.product_id,
                "product_code": item.product_code,
                "product_name": item.product_name,
                "width_cm": float(item.width_cm),
                "height_cm": float(item.height_cm),
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "subtotal": float(item.subtotal),
                "formula_summary": item.formula_summary,
                "notes": item.notes,
            }
            for item in quote.items
        ],
    )


def _serialize_formula_setting(setting: QuoteFormulaSetting) -> QuoteFormulaSettingOut:
    return QuoteFormulaSettingOut(
        id=setting.id,
        form=setting.form,
        display_name=setting.display_name,
        material_unit_price_default=float(setting.material_unit_price_default),
        discount_rate=float(setting.discount_rate) if setting.discount_rate is not None else None,
        rail_price_per_chi=float(setting.rail_price_per_chi) if setting.rail_price_per_chi is not None else None,
        labor_price=float(setting.labor_price) if setting.labor_price is not None else None,
        fabric_width_chi=float(setting.fabric_width_chi) if setting.fabric_width_chi is not None else None,
        fabric_multiplier=float(setting.fabric_multiplier) if setting.fabric_multiplier is not None else None,
        minimum_billable_talents=setting.minimum_billable_talents,
    )


def _build_quote_number(db: Session, quote_date: date) -> str:
    prefix = f"Q{quote_date.strftime('%Y%m%d')}"
    existing_count = db.scalar(
        select(func.count()).select_from(Quote).where(Quote.quote_number.like(f"{prefix}%"))
    )
    next_index = int(existing_count or 0) + 1
    return f"{prefix}-{next_index:03d}"


@router.get("/quote-products", response_model=list[QuoteProductOut])
def list_quote_products(
    category: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[QuoteProductOut]:
    statement = select(QuoteProduct).where(QuoteProduct.is_active.is_(True)).order_by(
        QuoteProduct.category, QuoteProduct.id
    )
    if category:
        statement = statement.where(QuoteProduct.category == category)

    rows = db.scalars(statement).all()
    return [
        QuoteProductOut(
            id=row.id,
            category=row.category,
            form=row.form,
            code=row.code,
            name=row.name,
            unit_label=row.unit_label,
            price_per_square_meter=float(row.price_per_square_meter),
            fullness_factor=float(row.fullness_factor),
            rail_price_per_meter=float(row.rail_price_per_meter),
            labor_price=float(row.labor_price),
            minimum_charge=float(row.minimum_charge),
        )
        for row in rows
    ]


@router.get("/quote-formulas", response_model=QuoteFormulaSettingListOut)
def list_quote_formulas(db: Session = Depends(get_db)) -> QuoteFormulaSettingListOut:
    rows = db.scalars(
        select(QuoteFormulaSetting)
        .where(QuoteFormulaSetting.is_active.is_(True))
        .order_by(QuoteFormulaSetting.id)
    ).all()
    return QuoteFormulaSettingListOut(items=[_serialize_formula_setting(row) for row in rows])


@router.put("/quote-formulas", response_model=QuoteFormulaSettingListOut)
def save_quote_formulas(payload: QuoteFormulaSettingSaveIn, db: Session = Depends(get_db)) -> QuoteFormulaSettingListOut:
    rows = db.scalars(select(QuoteFormulaSetting).where(QuoteFormulaSetting.is_active.is_(True))).all()
    row_map = {row.form: row for row in rows}

    for item in payload.items:
        row = row_map.get(item.form)
        if row is None:
            raise HTTPException(status_code=404, detail=f"Formula setting not found: {item.form}")

        row.material_unit_price_default = item.material_unit_price_default
        row.discount_rate = item.discount_rate
        row.rail_price_per_chi = item.rail_price_per_chi
        row.labor_price = item.labor_price
        row.fabric_width_chi = item.fabric_width_chi
        row.fabric_multiplier = item.fabric_multiplier
        row.minimum_billable_talents = item.minimum_billable_talents

    db.commit()
    refreshed = db.scalars(
        select(QuoteFormulaSetting)
        .where(QuoteFormulaSetting.is_active.is_(True))
        .order_by(QuoteFormulaSetting.id)
    ).all()
    return QuoteFormulaSettingListOut(items=[_serialize_formula_setting(row) for row in refreshed])


@router.get("/quotes", response_model=QuoteListOut)
def list_quotes(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> QuoteListOut:
    rows = db.scalars(
        select(Quote)
        .options(selectinload(Quote.items))
        .order_by(Quote.created_at.desc())
        .limit(limit)
    ).all()
    return QuoteListOut(items=[_serialize_quote(row) for row in rows])


@router.get("/quotes/{quote_id}", response_model=QuoteOut)
def get_quote(quote_id: str, db: Session = Depends(get_db)) -> QuoteOut:
    quote = db.scalar(
        select(Quote)
        .options(selectinload(Quote.items))
        .where(Quote.id == quote_id)
    )
    if quote is None:
        raise HTTPException(status_code=404, detail="Quote not found")

    return _serialize_quote(quote)


@router.delete("/quotes/{quote_id}")
def delete_quote(quote_id: str, db: Session = Depends(get_db)) -> dict[str, str]:
    quote = db.scalar(
        select(Quote)
        .options(selectinload(Quote.items))
        .where(Quote.id == quote_id)
    )
    if quote is None:
        raise HTTPException(status_code=404, detail="Quote not found")

    db.delete(quote)
    db.commit()
    return {"status": "deleted"}


@router.post("/quotes", response_model=QuoteOut)
def create_quote(payload: QuoteCreateIn, db: Session = Depends(get_db)) -> QuoteOut:
    product_ids = [item.product_id for item in payload.items]
    products = db.scalars(
        select(QuoteProduct).where(
            QuoteProduct.id.in_(product_ids),
            QuoteProduct.is_active.is_(True),
        )
    ).all()
    product_map = {product.id: product for product in products}
    settings = db.scalars(
        select(QuoteFormulaSetting).where(QuoteFormulaSetting.is_active.is_(True))
    ).all()
    setting_map = {setting.form: setting for setting in settings}

    missing_ids = [product_id for product_id in product_ids if product_id not in product_map]
    if missing_ids:
        raise HTTPException(status_code=404, detail=f"Products not found: {missing_ids}")

    quote = Quote(
        quote_number=_build_quote_number(db, payload.quote_date),
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        installation_address=payload.installation_address,
        quote_date=payload.quote_date,
        remarks=payload.remarks,
    )

    total_amount = Decimal("0")

    for index, item in enumerate(payload.items):
        product = product_map[item.product_id]
        setting = setting_map.get(product.form)
        material_unit_price = (
            _money(item.material_unit_price)
            if item.material_unit_price is not None
            else _money(setting.material_unit_price_default if setting else product.price_per_square_meter)
        )

        if product.category == "curtain":
            unit_price, subtotal, summary, pricing_unit = _calculate_curtain_item(
                product=product,
                setting=setting,
                width_cm=item.width_cm,
                height_cm=item.height_cm,
                quantity=item.quantity,
                material_unit_price=material_unit_price,
            )
            product_name = product.name
        elif product.category == "floor":
            unit_price, subtotal, summary, pricing_unit = _calculate_floor_item(
                quantity=item.quantity,
                material_unit_price=material_unit_price,
            )
            product_name = product.name
        elif product.category == "other":
            custom_product_name = (item.custom_product_name or "").strip()
            custom_unit = (item.custom_unit or "").strip()
            if not custom_product_name:
                raise HTTPException(status_code=422, detail="Other items require a custom product name")
            if not custom_unit:
                raise HTTPException(status_code=422, detail="Other items require a custom unit")

            unit_price, subtotal, summary, pricing_unit = _calculate_other_item(
                quantity=item.quantity,
                material_unit_price=material_unit_price,
                custom_product_name=custom_product_name,
                custom_unit=custom_unit,
            )
            product_name = custom_product_name
        else:
            raise HTTPException(status_code=422, detail=f"Unsupported product category: {product.category}")

        total_amount += subtotal
        quote.items.append(
            QuoteItem(
                product_id=product.id,
                sort_order=index + 1,
                category=product.category,
                form=product.form,
                location_name=item.location_name,
                custom_model=item.custom_model,
                pricing_unit=pricing_unit,
                material_unit_price=material_unit_price,
                product_code=product.code,
                product_name=product_name,
                width_cm=item.width_cm,
                height_cm=item.height_cm,
                quantity=item.quantity,
                unit_price=unit_price,
                subtotal=subtotal,
                formula_summary=summary,
                notes=item.notes,
            )
        )

    quote.total_amount = _money(total_amount)
    db.add(quote)
    db.commit()
    db.refresh(quote)

    saved_quote = db.scalar(
        select(Quote)
        .options(selectinload(Quote.items))
        .where(Quote.id == quote.id)
    )
    if saved_quote is None:
        raise HTTPException(status_code=500, detail="Quote could not be reloaded")

    return _serialize_quote(saved_quote)
