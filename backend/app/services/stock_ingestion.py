from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from math import sqrt
from statistics import pstdev

from sqlalchemy import and_, delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models import (
    IngestionJob,
    StockDailyFeature,
    StockDailyPrice,
    StockInstitutionalFlow,
    StockMonthlyFundamental,
    StockSymbol,
)
from app.schemas import (
    StockBootstrapIn,
    StockDailyPriceIn,
    StockDailySyncIn,
    StockInstitutionalFlowIn,
    StockMonthlyFundamentalIn,
    StockRebuildFeaturesIn,
    StockSymbolIn,
)


@dataclass
class IngestionResult:
    job_id: int
    status: str
    symbol_count: int
    rows_written: int
    feature_rows_written: int


UPSERT_BATCH_SIZE = 1000


def _round_or_none(value: float | None, digits: int = 4) -> float | None:
    return None if value is None else round(value, digits)


def _chunked(items: list[dict], size: int = UPSERT_BATCH_SIZE):
    for index in range(0, len(items), size):
        yield items[index : index + size]


def _score_fundamentals(
    revenue_yoy_pct: float | None,
    gross_margin_pct: float | None,
    gross_margin_prev_pct: float | None,
) -> int:
    if revenue_yoy_pct is None or gross_margin_pct is None:
        return 15

    score = 0
    if revenue_yoy_pct >= 20:
        score += 15
    elif revenue_yoy_pct >= 10:
        score += 10
    elif revenue_yoy_pct >= 0:
        score += 5

    if gross_margin_pct >= 35:
        score += 10
    elif gross_margin_pct >= 25:
        score += 6

    if gross_margin_prev_pct is not None and gross_margin_pct - gross_margin_prev_pct >= 2:
        score += 5

    return max(0, min(score, 30))


def _strategy_tier(score: int | None) -> str | None:
    if score is None:
        return None
    if score >= 85:
        return "Lift-off"
    if score >= 75:
        return "Build"
    return "Watch"


def _annualized_volatility_pct(prices: list[float]) -> float | None:
    if len(prices) < 3:
        return None
    returns: list[float] = []
    for index in range(1, len(prices)):
        previous = prices[index - 1]
        current = prices[index]
        if previous <= 0 or current <= 0:
            continue
        returns.append((current - previous) / previous)
    if len(returns) < 2:
        return None
    return pstdev(returns) * sqrt(252) * 100


def _merge_symbol_inputs(
    symbols: list[StockSymbolIn],
    daily_prices: list[StockDailyPriceIn],
    flows: list[StockInstitutionalFlowIn],
    fundamentals: list[StockMonthlyFundamentalIn],
) -> list[StockSymbolIn]:
    merged: dict[str, StockSymbolIn] = {item.symbol: item for item in symbols}
    for row in daily_prices:
        merged.setdefault(row.symbol, StockSymbolIn(symbol=row.symbol))
    for row in flows:
        merged.setdefault(row.symbol, StockSymbolIn(symbol=row.symbol))
    for row in fundamentals:
        merged.setdefault(row.symbol, StockSymbolIn(symbol=row.symbol))
    return list(merged.values())


def _upsert_symbols(db: Session, symbols: list[StockSymbolIn]) -> dict[str, int]:
    if symbols:
        stmt = insert(StockSymbol).values(
            [
                {
                    "symbol": item.symbol,
                    "market": item.market,
                    "name": item.name,
                    "is_active": item.is_active,
                    "updated_at": datetime.utcnow(),
                }
                for item in symbols
            ]
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=[StockSymbol.symbol],
            set_={
                "market": stmt.excluded.market,
                "name": stmt.excluded.name,
                "is_active": stmt.excluded.is_active,
                "updated_at": datetime.utcnow(),
            },
        )
        db.execute(stmt)
        db.commit()

    rows = db.scalars(select(StockSymbol)).all()
    return {row.symbol: row.id for row in rows}


def _upsert_daily_prices(db: Session, symbol_map: dict[str, int], rows: list[StockDailyPriceIn]) -> int:
    values = [
        {
            "symbol_id": symbol_map[item.symbol],
            "trade_date": item.trade_date,
            "open_price": item.open_price,
            "high_price": item.high_price,
            "low_price": item.low_price,
            "close_price": item.close_price,
            "volume": item.volume,
            "turnover_value": item.turnover_value,
            "updated_at": datetime.utcnow(),
        }
        for item in rows
        if item.symbol in symbol_map
    ]
    if not values:
        return 0

    for chunk in _chunked(values):
        stmt = insert(StockDailyPrice).values(chunk)
        stmt = stmt.on_conflict_do_update(
            index_elements=[StockDailyPrice.symbol_id, StockDailyPrice.trade_date],
            set_={
                "open_price": stmt.excluded.open_price,
                "high_price": stmt.excluded.high_price,
                "low_price": stmt.excluded.low_price,
                "close_price": stmt.excluded.close_price,
                "volume": stmt.excluded.volume,
                "turnover_value": stmt.excluded.turnover_value,
                "updated_at": datetime.utcnow(),
            },
        )
        db.execute(stmt)
        db.commit()
    return len(values)


def _upsert_flows(db: Session, symbol_map: dict[str, int], rows: list[StockInstitutionalFlowIn]) -> int:
    values = [
        {
            "symbol_id": symbol_map[item.symbol],
            "trade_date": item.trade_date,
            "foreign_net_buy": item.foreign_net_buy,
            "trust_net_buy": item.trust_net_buy,
            "dealer_net_buy": item.dealer_net_buy,
            "total_net_buy": item.total_net_buy,
            "updated_at": datetime.utcnow(),
        }
        for item in rows
        if item.symbol in symbol_map
    ]
    if not values:
        return 0

    for chunk in _chunked(values):
        stmt = insert(StockInstitutionalFlow).values(chunk)
        stmt = stmt.on_conflict_do_update(
            index_elements=[StockInstitutionalFlow.symbol_id, StockInstitutionalFlow.trade_date],
            set_={
                "foreign_net_buy": stmt.excluded.foreign_net_buy,
                "trust_net_buy": stmt.excluded.trust_net_buy,
                "dealer_net_buy": stmt.excluded.dealer_net_buy,
                "total_net_buy": stmt.excluded.total_net_buy,
                "updated_at": datetime.utcnow(),
            },
        )
        db.execute(stmt)
        db.commit()
    return len(values)


def _upsert_fundamentals(
    db: Session, symbol_map: dict[str, int], rows: list[StockMonthlyFundamentalIn]
) -> int:
    values = [
        {
            "symbol_id": symbol_map[item.symbol],
            "report_month": item.report_month,
            "revenue": item.revenue,
            "revenue_yoy_pct": item.revenue_yoy_pct,
            "gross_margin_pct": item.gross_margin_pct,
            "gross_margin_prev_pct": item.gross_margin_prev_pct,
            "source_note": item.source_note,
            "updated_at": datetime.utcnow(),
        }
        for item in rows
        if item.symbol in symbol_map
    ]
    if not values:
        return 0

    for chunk in _chunked(values):
        stmt = insert(StockMonthlyFundamental).values(chunk)
        stmt = stmt.on_conflict_do_update(
            index_elements=[StockMonthlyFundamental.symbol_id, StockMonthlyFundamental.report_month],
            set_={
                "revenue": stmt.excluded.revenue,
                "revenue_yoy_pct": stmt.excluded.revenue_yoy_pct,
                "gross_margin_pct": stmt.excluded.gross_margin_pct,
                "gross_margin_prev_pct": stmt.excluded.gross_margin_prev_pct,
                "source_note": stmt.excluded.source_note,
                "updated_at": datetime.utcnow(),
            },
        )
        db.execute(stmt)
        db.commit()
    return len(values)


def _compute_feature_row(
    price_rows: list[StockDailyPrice],
    flow_rows_by_date: dict[date, StockInstitutionalFlow],
    fundamentals_by_month: dict[date, StockMonthlyFundamental],
    current_index: int,
) -> dict[str, float | int | str | date | None]:
    row = price_rows[current_index]
    price_window_5 = price_rows[max(0, current_index - 4) : current_index + 1]
    price_window_10 = price_rows[max(0, current_index - 9) : current_index + 1]
    price_window_20 = price_rows[max(0, current_index - 19) : current_index + 1]

    avg_volume_5 = sum(int(item.volume) for item in price_window_5) / len(price_window_5)
    avg_volume_20 = sum(int(item.volume) for item in price_window_20) / len(price_window_20)

    highs = [float(item.high_price or item.close_price) for item in price_window_10]
    lows = [float(item.low_price or item.close_price) for item in price_window_10]
    amplitude_10d_pct = None
    if lows and min(lows) > 0:
        amplitude_10d_pct = ((max(highs) - min(lows)) / min(lows)) * 100

    turnover_sum = sum(float(item.turnover_value or 0) for item in price_window_20)
    volume_sum = sum(int(item.volume) for item in price_window_20)
    vwap_20 = None
    if volume_sum > 0:
        if turnover_sum > 0:
            vwap_20 = turnover_sum / volume_sum
        else:
            vwap_20 = (
                sum(float(item.close_price) * int(item.volume) for item in price_window_20) / volume_sum
            )

    avg_close_10 = sum(float(item.close_price) for item in price_window_10) / len(price_window_10)
    bias_10d_pct = None
    if avg_close_10 > 0:
        bias_10d_pct = ((float(row.close_price) - avg_close_10) / avg_close_10) * 100

    annualized_volatility_pct = _annualized_volatility_pct(
        [float(item.close_price) for item in price_window_20]
    )

    recent_trade_dates_3 = [item.trade_date for item in price_rows[max(0, current_index - 2) : current_index + 1]]
    recent_trade_dates_5 = [item.trade_date for item in price_rows[max(0, current_index - 4) : current_index + 1]]
    trust_net_buy_3d = sum(
        int(flow_rows_by_date[item].trust_net_buy or 0) for item in recent_trade_dates_3 if item in flow_rows_by_date
    )
    foreign_net_buy_5d = sum(
        int(flow_rows_by_date[item].foreign_net_buy or 0) for item in recent_trade_dates_5 if item in flow_rows_by_date
    )

    fundamental_month = row.trade_date.replace(day=1)
    available_months = sorted(month for month in fundamentals_by_month if month <= fundamental_month)
    fundamental = fundamentals_by_month[available_months[-1]] if available_months else None

    revenue_yoy_pct = float(fundamental.revenue_yoy_pct) if fundamental and fundamental.revenue_yoy_pct is not None else None
    gross_margin_pct = float(fundamental.gross_margin_pct) if fundamental and fundamental.gross_margin_pct is not None else None
    gross_margin_prev_pct = (
        float(fundamental.gross_margin_prev_pct)
        if fundamental and fundamental.gross_margin_prev_pct is not None
        else None
    )

    score = 0
    score += 15 if avg_volume_5 < avg_volume_20 else 0
    score += 10 if amplitude_10d_pct is not None and amplitude_10d_pct < 8 else 0
    score += 10 if vwap_20 is not None and abs(float(row.close_price) - vwap_20) / vwap_20 <= 0.03 else 0
    score += 20 if trust_net_buy_3d > 0 else 0
    score += 15 if foreign_net_buy_5d > 0 else 0
    score += _score_fundamentals(revenue_yoy_pct, gross_margin_pct, gross_margin_prev_pct)

    if bias_10d_pct is not None and bias_10d_pct > 15:
        score -= 100
    if vwap_20 is not None and float(row.close_price) < vwap_20 * 0.95:
        score -= 100
    if trust_net_buy_3d <= 0:
        score -= 50

    score = max(-100, min(score, 100))

    return {
        "trade_date": row.trade_date,
        "avg_volume_5": _round_or_none(avg_volume_5, 2),
        "avg_volume_20": _round_or_none(avg_volume_20, 2),
        "amplitude_10d_pct": _round_or_none(amplitude_10d_pct),
        "vwap_20": _round_or_none(vwap_20),
        "bias_10d_pct": _round_or_none(bias_10d_pct),
        "annualized_volatility_pct": _round_or_none(annualized_volatility_pct),
        "fair_value_discount_pct": _round_or_none(revenue_yoy_pct),
        "total_score": int(score),
        "strategy_tier": _strategy_tier(int(score)),
    }


def rebuild_features(db: Session, payload: StockRebuildFeaturesIn) -> int:
    symbol_stmt = select(StockSymbol)
    if payload.symbols:
        symbol_stmt = symbol_stmt.where(StockSymbol.symbol.in_(payload.symbols))
    symbols = db.scalars(symbol_stmt.order_by(StockSymbol.symbol)).all()

    feature_rows_written = 0
    for symbol in symbols:
        full_price_stmt = select(StockDailyPrice).where(StockDailyPrice.symbol_id == symbol.id)
        if payload.trade_date_to:
            full_price_stmt = full_price_stmt.where(StockDailyPrice.trade_date <= payload.trade_date_to)
        full_price_rows = db.scalars(full_price_stmt.order_by(StockDailyPrice.trade_date)).all()
        if not full_price_rows:
            continue

        target_dates = {
            item.trade_date
            for item in full_price_rows
            if (payload.trade_date_from is None or item.trade_date >= payload.trade_date_from)
            and (payload.trade_date_to is None or item.trade_date <= payload.trade_date_to)
        }
        if not target_dates:
            continue

        flow_rows = db.scalars(
            select(StockInstitutionalFlow)
            .where(StockInstitutionalFlow.symbol_id == symbol.id)
            .order_by(StockInstitutionalFlow.trade_date)
        ).all()
        fundamentals = db.scalars(
            select(StockMonthlyFundamental)
            .where(StockMonthlyFundamental.symbol_id == symbol.id)
            .order_by(StockMonthlyFundamental.report_month)
        ).all()
        flow_rows_by_date = {item.trade_date: item for item in flow_rows}
        fundamentals_by_month = {item.report_month: item for item in fundamentals}

        values = []
        for index, _ in enumerate(full_price_rows):
            feature = _compute_feature_row(full_price_rows, flow_rows_by_date, fundamentals_by_month, index)
            if feature["trade_date"] not in target_dates:
                continue
            values.append({"symbol_id": symbol.id, **feature, "updated_at": datetime.utcnow()})

        if not values:
            continue

        db.execute(
            delete(StockDailyFeature).where(
                and_(
                    StockDailyFeature.symbol_id == symbol.id,
                    StockDailyFeature.trade_date.in_(target_dates),
                )
            )
        )
        for chunk in _chunked(values):
            stmt = insert(StockDailyFeature).values(chunk)
            stmt = stmt.on_conflict_do_update(
                index_elements=[StockDailyFeature.symbol_id, StockDailyFeature.trade_date],
                set_={
                    "avg_volume_5": stmt.excluded.avg_volume_5,
                    "avg_volume_20": stmt.excluded.avg_volume_20,
                    "amplitude_10d_pct": stmt.excluded.amplitude_10d_pct,
                    "vwap_20": stmt.excluded.vwap_20,
                    "bias_10d_pct": stmt.excluded.bias_10d_pct,
                    "annualized_volatility_pct": stmt.excluded.annualized_volatility_pct,
                    "fair_value_discount_pct": stmt.excluded.fair_value_discount_pct,
                    "total_score": stmt.excluded.total_score,
                    "strategy_tier": stmt.excluded.strategy_tier,
                    "updated_at": datetime.utcnow(),
                },
            )
            db.execute(stmt)
            db.commit()
        feature_rows_written += len(values)

    return feature_rows_written


def _create_job(db: Session, job_type: str, run_mode: str, requested_trade_date: date | None) -> IngestionJob:
    job = IngestionJob(
        job_type=job_type,
        run_mode=run_mode,
        requested_trade_date=requested_trade_date,
        status="running",
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def _finish_job(
    db: Session,
    job: IngestionJob,
    status: str,
    symbol_count: int,
    rows_written: int,
    error_message: str | None = None,
) -> None:
    db.rollback()
    job.status = status
    job.symbol_count = symbol_count
    job.rows_written = rows_written
    job.error_message = error_message
    job.finished_at = datetime.utcnow()
    db.add(job)
    db.commit()


def ingest_bootstrap(db: Session, payload: StockBootstrapIn) -> IngestionResult:
    job = _create_job(db, "stocks-bootstrap", "bootstrap", None)
    try:
        merged_symbols = _merge_symbol_inputs(
            payload.symbols,
            payload.daily_prices,
            payload.institutional_flows,
            payload.monthly_fundamentals,
        )
        symbol_map = _upsert_symbols(db, merged_symbols)
        rows_written = 0
        rows_written += _upsert_daily_prices(db, symbol_map, payload.daily_prices)
        rows_written += _upsert_flows(db, symbol_map, payload.institutional_flows)
        rows_written += _upsert_fundamentals(db, symbol_map, payload.monthly_fundamentals)

        feature_rows_written = rebuild_features(
            db,
            StockRebuildFeaturesIn(
                symbols=[item.symbol for item in merged_symbols],
                trade_date_from=min((item.trade_date for item in payload.daily_prices), default=None),
                trade_date_to=max((item.trade_date for item in payload.daily_prices), default=None),
            ),
        )
        _finish_job(db, job, "completed", len(symbol_map), rows_written + feature_rows_written)
        return IngestionResult(job.id, "completed", len(symbol_map), rows_written, feature_rows_written)
    except Exception as error:
        _finish_job(db, job, "failed", 0, 0, str(error))
        raise


def ingest_daily_sync(db: Session, payload: StockDailySyncIn) -> IngestionResult:
    job = _create_job(db, "stocks-daily-sync", "incremental", payload.trade_date)
    try:
        merged_symbols = _merge_symbol_inputs(
            payload.symbols,
            payload.daily_prices,
            payload.institutional_flows,
            payload.monthly_fundamentals,
        )
        symbol_map = _upsert_symbols(db, merged_symbols)
        rows_written = 0
        rows_written += _upsert_daily_prices(db, symbol_map, payload.daily_prices)
        rows_written += _upsert_flows(db, symbol_map, payload.institutional_flows)
        rows_written += _upsert_fundamentals(db, symbol_map, payload.monthly_fundamentals)

        sync_symbols = sorted(
            {
                *(item.symbol for item in payload.symbols),
                *(item.symbol for item in payload.daily_prices),
                *(item.symbol for item in payload.institutional_flows),
                *(item.symbol for item in payload.monthly_fundamentals),
            }
        )
        feature_rows_written = rebuild_features(
            db,
            StockRebuildFeaturesIn(
                symbols=sync_symbols,
                trade_date_from=min((item.trade_date for item in payload.daily_prices), default=payload.trade_date),
                trade_date_to=max((item.trade_date for item in payload.daily_prices), default=payload.trade_date),
            ),
        )
        _finish_job(db, job, "completed", len(symbol_map), rows_written + feature_rows_written)
        return IngestionResult(job.id, "completed", len(symbol_map), rows_written, feature_rows_written)
    except Exception as error:
        _finish_job(db, job, "failed", 0, 0, str(error))
        raise


def list_features(
    db: Session,
    trade_date: date | None = None,
    symbols: list[str] | None = None,
    limit: int = 50,
):
    stmt = (
        select(StockDailyFeature, StockSymbol.symbol)
        .join(StockSymbol, StockSymbol.id == StockDailyFeature.symbol_id)
        .order_by(StockDailyFeature.trade_date.desc(), StockSymbol.symbol)
        .limit(limit)
    )
    if trade_date:
        stmt = stmt.where(StockDailyFeature.trade_date == trade_date)
    if symbols:
        stmt = stmt.where(StockSymbol.symbol.in_(symbols))
    return db.execute(stmt).all()
