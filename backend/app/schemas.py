from datetime import date, datetime

from pydantic import BaseModel, Field


class FloorStyleSpecOut(BaseModel):
    dimension: str
    thickness_mm: float
    wear_layer_mm: float
    packaging: str


class FloorStyleOut(BaseModel):
    id: int
    key: str
    code: str
    name: str
    description: str
    tone: str
    badge: str
    group_code: str
    group_name: str
    image_url: str | None = None
    colors: tuple[str, str, str]


class FloorStyleGroupOut(BaseModel):
    code: str
    name: str
    description: str
    cover_url: str | None = None
    spec: FloorStyleSpecOut
    styles: list[FloorStyleOut]


class FloorStyleListOut(BaseModel):
    items: list[FloorStyleOut]
    groups: list[FloorStyleGroupOut]


class UploadOut(BaseModel):
    upload_id: str
    original_url: str
    status: str


class PreviewCreateIn(BaseModel):
    upload_id: str
    floor_style_id: int
    lead_name: str | None = None
    lead_phone: str | None = None
    lead_line_id: str | None = None
    lead_message: str | None = None


class PreviewOut(BaseModel):
    job_id: str
    status: str
    engine: str = "opencv"
    original_url: str
    result_url: str
    mask_url: str
    note: str = Field(
        default="此圖為展示版模擬結果，實際效果依現場採光、空間條件與施工方式為準。"
    )


class LeadCreateIn(BaseModel):
    preview_job_id: str | None = None
    name: str
    phone: str
    line_id: str | None = None
    message: str | None = None


class LeadOut(BaseModel):
    id: str
    preview_job_id: str | None
    name: str | None
    phone: str | None
    line_id: str | None
    message: str | None
    created_at: datetime


class StockSymbolIn(BaseModel):
    symbol: str
    market: str = "TWSE"
    name: str | None = None
    is_active: bool = True


class StockDailyPriceIn(BaseModel):
    symbol: str
    trade_date: date
    open_price: float | None = None
    high_price: float | None = None
    low_price: float | None = None
    close_price: float
    volume: int
    turnover_value: float | None = None


class StockInstitutionalFlowIn(BaseModel):
    symbol: str
    trade_date: date
    foreign_net_buy: int | None = None
    trust_net_buy: int | None = None
    dealer_net_buy: int | None = None
    total_net_buy: int | None = None


class StockMonthlyFundamentalIn(BaseModel):
    symbol: str
    report_month: date
    revenue: float | None = None
    revenue_yoy_pct: float | None = None
    gross_margin_pct: float | None = None
    gross_margin_prev_pct: float | None = None
    source_note: str | None = None


class StockBootstrapIn(BaseModel):
    months: int = Field(default=40, ge=1, le=120)
    universe: str = "custom"
    symbols: list[StockSymbolIn] = Field(default_factory=list)
    daily_prices: list[StockDailyPriceIn] = Field(default_factory=list)
    institutional_flows: list[StockInstitutionalFlowIn] = Field(default_factory=list)
    monthly_fundamentals: list[StockMonthlyFundamentalIn] = Field(default_factory=list)


class StockDailySyncIn(BaseModel):
    trade_date: date
    lookback_days: int = Field(default=3, ge=1, le=10)
    symbols: list[StockSymbolIn] = Field(default_factory=list)
    daily_prices: list[StockDailyPriceIn] = Field(default_factory=list)
    institutional_flows: list[StockInstitutionalFlowIn] = Field(default_factory=list)
    monthly_fundamentals: list[StockMonthlyFundamentalIn] = Field(default_factory=list)


class StockRebuildFeaturesIn(BaseModel):
    trade_date_from: date | None = None
    trade_date_to: date | None = None
    symbols: list[str] = Field(default_factory=list)


class StockIngestionOut(BaseModel):
    job_id: int
    status: str
    symbol_count: int
    rows_written: int
    feature_rows_written: int


class StockFeatureOut(BaseModel):
    symbol: str
    trade_date: date
    avg_volume_5: float | None
    avg_volume_20: float | None
    amplitude_10d_pct: float | None
    vwap_20: float | None
    bias_10d_pct: float | None
    annualized_volatility_pct: float | None
    fair_value_discount_pct: float | None
    total_score: int | None
    strategy_tier: str | None


class StockFeatureListOut(BaseModel):
    items: list[StockFeatureOut]


class StockRemoteBootstrapIn(BaseModel):
    months: int = Field(default=40, ge=1, le=120)
    symbols: list[str] = Field(default_factory=list)
    include_fundamentals: bool = True


class StockRemoteDailySyncIn(BaseModel):
    trade_date: date
    lookback_days: int = Field(default=3, ge=1, le=10)
    symbols: list[str] = Field(default_factory=list)
    include_fundamentals: bool = True
