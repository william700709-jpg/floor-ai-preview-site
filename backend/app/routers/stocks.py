from datetime import date

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.schemas import (
    StockBootstrapIn,
    StockDailySyncIn,
    StockFeatureListOut,
    StockFeatureOut,
    StockIngestionOut,
    StockRemoteBootstrapIn,
    StockRemoteDailySyncIn,
    StockRebuildFeaturesIn,
)
from app.services.stock_ingestion import ingest_bootstrap, ingest_daily_sync, list_features, rebuild_features
from app.services.stock_sources import build_remote_bootstrap_payload, build_remote_daily_sync_payload

router = APIRouter(prefix="/stocks", tags=["stocks"])


def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    if settings.stock_api_key and x_api_key != settings.stock_api_key:
        raise HTTPException(status_code=401, detail="invalid api key")


@router.post("/bootstrap", response_model=StockIngestionOut, dependencies=[Depends(require_api_key)])
def stock_bootstrap(payload: StockBootstrapIn, db: Session = Depends(get_db)) -> StockIngestionOut:
    result = ingest_bootstrap(db, payload)
    return StockIngestionOut(**result.__dict__)


@router.post("/daily-sync", response_model=StockIngestionOut, dependencies=[Depends(require_api_key)])
def stock_daily_sync(payload: StockDailySyncIn, db: Session = Depends(get_db)) -> StockIngestionOut:
    result = ingest_daily_sync(db, payload)
    return StockIngestionOut(**result.__dict__)


@router.post("/bootstrap-remote", response_model=StockIngestionOut, dependencies=[Depends(require_api_key)])
def stock_bootstrap_remote(
    payload: StockRemoteBootstrapIn, db: Session = Depends(get_db)
) -> StockIngestionOut:
    normalized_payload = build_remote_bootstrap_payload(payload)
    result = ingest_bootstrap(db, normalized_payload)
    return StockIngestionOut(**result.__dict__)


@router.post("/daily-sync-remote", response_model=StockIngestionOut, dependencies=[Depends(require_api_key)])
def stock_daily_sync_remote(
    payload: StockRemoteDailySyncIn, db: Session = Depends(get_db)
) -> StockIngestionOut:
    normalized_payload = build_remote_daily_sync_payload(payload)
    result = ingest_daily_sync(db, normalized_payload)
    return StockIngestionOut(**result.__dict__)


@router.post("/rebuild-features", response_model=StockIngestionOut, dependencies=[Depends(require_api_key)])
def stock_rebuild_features(
    payload: StockRebuildFeaturesIn, db: Session = Depends(get_db)
) -> StockIngestionOut:
    feature_rows_written = rebuild_features(db, payload)
    return StockIngestionOut(
        job_id=0,
        status="completed",
        symbol_count=len(payload.symbols),
        rows_written=0,
        feature_rows_written=feature_rows_written,
    )


@router.get("/features", response_model=StockFeatureListOut)
def get_stock_features(
    trade_date: date | None = Query(default=None),
    symbols: list[str] = Query(default_factory=list),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> StockFeatureListOut:
    rows = list_features(db, trade_date=trade_date, symbols=symbols or None, limit=limit)
    return StockFeatureListOut(
        items=[
            StockFeatureOut(
                symbol=symbol,
                trade_date=feature.trade_date,
                avg_volume_5=float(feature.avg_volume_5) if feature.avg_volume_5 is not None else None,
                avg_volume_20=float(feature.avg_volume_20) if feature.avg_volume_20 is not None else None,
                amplitude_10d_pct=float(feature.amplitude_10d_pct)
                if feature.amplitude_10d_pct is not None
                else None,
                vwap_20=float(feature.vwap_20) if feature.vwap_20 is not None else None,
                bias_10d_pct=float(feature.bias_10d_pct) if feature.bias_10d_pct is not None else None,
                annualized_volatility_pct=float(feature.annualized_volatility_pct)
                if feature.annualized_volatility_pct is not None
                else None,
                fair_value_discount_pct=float(feature.fair_value_discount_pct)
                if feature.fair_value_discount_pct is not None
                else None,
                total_score=feature.total_score,
                strategy_tier=feature.strategy_tier,
            )
            for feature, symbol in rows
        ]
    )
