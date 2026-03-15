from __future__ import annotations

from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import BIGINT, Boolean, Date, DateTime, Float, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FloorStyle(Base):
    __tablename__ = "floor_styles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    key: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text)
    tone: Mapped[str] = mapped_column(String(80))
    badge: Mapped[str] = mapped_column(String(80))
    primary_color: Mapped[str] = mapped_column(String(20))
    secondary_color: Mapped[str] = mapped_column(String(20))
    accent_color: Mapped[str] = mapped_column(String(20))
    texture_scale: Mapped[float] = mapped_column(Float, default=1.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    preview_jobs: Mapped[list["PreviewJob"]] = relationship(back_populates="floor_style")


class PreviewJob(Base):
    __tablename__ = "preview_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    floor_style_id: Mapped[int | None] = mapped_column(ForeignKey("floor_styles.id"), nullable=True)
    original_image_path: Mapped[str] = mapped_column(Text)
    result_image_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    mask_image_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="uploaded")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    floor_style: Mapped[FloorStyle | None] = relationship(back_populates="preview_jobs")
    leads: Mapped[list["Lead"]] = relationship(back_populates="preview_job")


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    preview_job_id: Mapped[str | None] = mapped_column(
        ForeignKey("preview_jobs.id"), nullable=True, index=True
    )
    name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(60), nullable=True)
    line_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    preview_job: Mapped[PreviewJob | None] = relationship(back_populates="leads")


class ContactRequest(Base):
    __tablename__ = "contact_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    reference: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(60))
    line_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    request_type: Mapped[str] = mapped_column(String(80))
    installation_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    size_info: Mapped[str | None] = mapped_column(String(160), nullable=True)
    message: Mapped[str] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(40), default="unknown")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class QuoteProduct(Base):
    __tablename__ = "quote_products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    category: Mapped[str] = mapped_column(String(20), index=True)
    form: Mapped[str] = mapped_column(String(40), index=True)
    code: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    unit_label: Mapped[str] = mapped_column(String(20), default="set")
    price_per_square_meter: Mapped[float] = mapped_column(Numeric(12, 2))
    fullness_factor: Mapped[float] = mapped_column(Float, default=1.0)
    rail_price_per_meter: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    labor_price: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    minimum_charge: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    quote_items: Mapped[list["QuoteItem"]] = relationship(back_populates="product")


class QuoteFormulaSetting(Base):
    __tablename__ = "quote_formula_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    form: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(80))
    material_unit_price_default: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    discount_rate: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    rail_price_per_chi: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    labor_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    fabric_width_chi: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    fabric_multiplier: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    minimum_billable_talents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class Quote(Base):
    __tablename__ = "quotes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    quote_number: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    customer_name: Mapped[str] = mapped_column(String(120))
    customer_phone: Mapped[str | None] = mapped_column(String(60), nullable=True)
    installation_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    quote_date: Mapped[date] = mapped_column(Date, default=date.today, index=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    items: Mapped[list["QuoteItem"]] = relationship(
        back_populates="quote",
        cascade="all, delete-orphan",
        order_by="QuoteItem.sort_order",
    )


class QuoteItem(Base):
    __tablename__ = "quote_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    quote_id: Mapped[str] = mapped_column(ForeignKey("quotes.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("quote_products.id"), index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    category: Mapped[str] = mapped_column(String(20))
    form: Mapped[str] = mapped_column(String(40))
    location_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    custom_model: Mapped[str | None] = mapped_column(String(120), nullable=True)
    pricing_unit: Mapped[str | None] = mapped_column(String(20), nullable=True)
    material_unit_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    product_code: Mapped[str] = mapped_column(String(40))
    product_name: Mapped[str] = mapped_column(String(120))
    width_cm: Mapped[float] = mapped_column(Numeric(10, 2))
    height_cm: Mapped[float] = mapped_column(Numeric(10, 2))
    quantity: Mapped[int] = mapped_column(Integer)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 2))
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2))
    formula_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    quote: Mapped[Quote] = relationship(back_populates="items")
    product: Mapped[QuoteProduct] = relationship(back_populates="quote_items")


class StockSymbol(Base):
    __tablename__ = "stock_symbols"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    symbol: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    market: Mapped[str] = mapped_column(String(20), default="TWSE")
    name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class StockDailyPrice(Base):
    __tablename__ = "stock_daily_prices"
    __table_args__ = (UniqueConstraint("symbol_id", "trade_date", name="uq_stock_daily_prices_symbol_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    symbol_id: Mapped[int] = mapped_column(ForeignKey("stock_symbols.id"), index=True)
    trade_date: Mapped[date] = mapped_column(Date, index=True)
    open_price: Mapped[float | None] = mapped_column(Numeric(12, 4), nullable=True)
    high_price: Mapped[float | None] = mapped_column(Numeric(12, 4), nullable=True)
    low_price: Mapped[float | None] = mapped_column(Numeric(12, 4), nullable=True)
    close_price: Mapped[float] = mapped_column(Numeric(12, 4))
    volume: Mapped[int] = mapped_column(BIGINT)
    turnover_value: Mapped[float | None] = mapped_column(Numeric(18, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class StockInstitutionalFlow(Base):
    __tablename__ = "stock_institutional_flows"
    __table_args__ = (
        UniqueConstraint("symbol_id", "trade_date", name="uq_stock_institutional_flows_symbol_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    symbol_id: Mapped[int] = mapped_column(ForeignKey("stock_symbols.id"), index=True)
    trade_date: Mapped[date] = mapped_column(Date, index=True)
    foreign_net_buy: Mapped[int | None] = mapped_column(BIGINT, nullable=True)
    trust_net_buy: Mapped[int | None] = mapped_column(BIGINT, nullable=True)
    dealer_net_buy: Mapped[int | None] = mapped_column(BIGINT, nullable=True)
    total_net_buy: Mapped[int | None] = mapped_column(BIGINT, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class StockMonthlyFundamental(Base):
    __tablename__ = "stock_monthly_fundamentals"
    __table_args__ = (
        UniqueConstraint("symbol_id", "report_month", name="uq_stock_monthly_fundamentals_symbol_month"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    symbol_id: Mapped[int] = mapped_column(ForeignKey("stock_symbols.id"), index=True)
    report_month: Mapped[date] = mapped_column(Date, index=True)
    revenue: Mapped[float | None] = mapped_column(Numeric(18, 2), nullable=True)
    revenue_yoy_pct: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    gross_margin_pct: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    gross_margin_prev_pct: Mapped[float | None] = mapped_column(Numeric(8, 2), nullable=True)
    source_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class StockDailyFeature(Base):
    __tablename__ = "stock_daily_features"
    __table_args__ = (
        UniqueConstraint("symbol_id", "trade_date", name="uq_stock_daily_features_symbol_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    symbol_id: Mapped[int] = mapped_column(ForeignKey("stock_symbols.id"), index=True)
    trade_date: Mapped[date] = mapped_column(Date, index=True)
    avg_volume_5: Mapped[float | None] = mapped_column(Numeric(18, 2), nullable=True)
    avg_volume_20: Mapped[float | None] = mapped_column(Numeric(18, 2), nullable=True)
    amplitude_10d_pct: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    vwap_20: Mapped[float | None] = mapped_column(Numeric(12, 4), nullable=True)
    bias_10d_pct: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    annualized_volatility_pct: Mapped[float | None] = mapped_column(Numeric(8, 4), nullable=True)
    fair_value_discount_pct: Mapped[float | None] = mapped_column(Numeric(12, 4), nullable=True)
    total_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    strategy_tier: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class IngestionJob(Base):
    __tablename__ = "ingestion_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    job_type: Mapped[str] = mapped_column(String(40))
    run_mode: Mapped[str] = mapped_column(String(20))
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="running")
    requested_trade_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    symbol_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    rows_written: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
