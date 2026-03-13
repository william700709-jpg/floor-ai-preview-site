from __future__ import annotations

import json
import threading
import time
from datetime import date, timedelta
from collections import deque
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from app.config import settings
from app.schemas import (
    StockBootstrapIn,
    StockDailyPriceIn,
    StockDailySyncIn,
    StockInstitutionalFlowIn,
    StockMonthlyFundamentalIn,
    StockRemoteBootstrapIn,
    StockRemoteDailySyncIn,
    StockSymbolIn,
)

TWSE_BASE = "https://www.twse.com.tw"
TWSE_OPENAPI_BASE = "https://openapi.twse.com.tw/v1"
FINMIND_BASE = "https://api.finmindtrade.com/api/v4/data"
USER_AGENT = "Mozilla/5.0"
FINMIND_WINDOW_SECONDS = 3600
_finmind_request_times: deque[float] = deque()
_finmind_rate_lock = threading.Lock()


def _wait_for_finmind_slot() -> None:
    limit = settings.finmind_rate_limit_per_hour
    if limit <= 0:
        return

    while True:
        with _finmind_rate_lock:
            now = time.time()
            while _finmind_request_times and now - _finmind_request_times[0] >= FINMIND_WINDOW_SECONDS:
                _finmind_request_times.popleft()

            if len(_finmind_request_times) < limit:
                _finmind_request_times.append(now)
                return

            sleep_seconds = max(1.0, FINMIND_WINDOW_SECONDS - (now - _finmind_request_times[0]) + 1.0)

        print(
            f"FinMind rate limit nearing {limit}/hour. Sleeping for {round(sleep_seconds, 1)} seconds..."
        )
        time.sleep(sleep_seconds)


def _fetch_json(url: str, headers: dict[str, str] | None = None) -> dict | list:
    if url.startswith(FINMIND_BASE):
        _wait_for_finmind_slot()
    merged_headers = {"User-Agent": USER_AGENT}
    if headers:
        merged_headers.update(headers)
    request = Request(url, headers=merged_headers)
    with urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8", errors="ignore"))


def _clean_number(value: str | int | float | None) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    value = value.strip()
    if value in {"", "--", "---", "----", "X", "除權息"}:
        return None
    value = (
        value.replace(",", "")
        .replace("\u3000", "")
        .replace("<p style= color:red>+</p>", "")
        .replace("<p style= color:green>-</p>", "")
        .replace("<p style ='color:red'>+</p>", "")
        .replace("<p style ='color:green'>-</p>", "")
    )
    try:
        return float(value)
    except ValueError:
        return None


def _clean_int(value: str | None) -> int | None:
    number = _clean_number(value)
    return None if number is None else int(number)


def _roc_ym_to_date(roc_ym: str) -> date:
    year = int(roc_ym[:3]) + 1911
    month = int(roc_ym[3:])
    return date(year, month, 1)


def _iter_weekdays(date_from: date, date_to: date):
    current = date_from
    while current <= date_to:
        if current.weekday() < 5:
            yield current
        current += timedelta(days=1)


def _iter_weekdays_desc(date_from: date, date_to: date):
    current = date_to
    while current >= date_from:
        if current.weekday() < 5:
            yield current
        current -= timedelta(days=1)


def _mi_index_url(trade_date: date) -> str:
    query = urlencode(
        {"response": "json", "date": trade_date.strftime("%Y%m%d"), "type": "ALLBUT0999"}
    )
    return f"{TWSE_BASE}/exchangeReport/MI_INDEX?{query}"


def _t86_url(trade_date: date) -> str:
    query = urlencode(
        {"response": "json", "date": trade_date.strftime("%Y%m%d"), "selectType": "ALLBUT0999"}
    )
    return f"{TWSE_BASE}/rwd/zh/fund/T86?{query}"


def _find_price_table(tables: list[dict]) -> dict | None:
    for table in tables:
        fields = table.get("fields", [])
        if "證券代號" in fields and "收盤價" in fields and "成交股數" in fields:
            return table
    return None


def _field_index(fields: list[str], keyword: str) -> int | None:
    for index, field in enumerate(fields):
        if keyword in field:
            return index
    return None


def fetch_twse_daily_prices(trade_date: date, symbols: set[str] | None = None) -> list[StockDailyPriceIn]:
    try:
        payload = _fetch_json(_mi_index_url(trade_date))
    except Exception:
        return []
    if not isinstance(payload, dict):
        return []
    table = _find_price_table(payload.get("tables", []))
    if not table:
        return []

    rows: list[StockDailyPriceIn] = []
    for row in table.get("data", []):
        symbol = row[0]
        if symbols and symbol not in symbols:
            continue
        close_price = _clean_number(row[8])
        volume = _clean_int(row[2])
        if close_price is None or volume is None:
            continue
        rows.append(
            StockDailyPriceIn(
                symbol=symbol,
                trade_date=trade_date,
                open_price=_clean_number(row[5]),
                high_price=_clean_number(row[6]),
                low_price=_clean_number(row[7]),
                close_price=close_price,
                volume=volume,
                turnover_value=_clean_number(row[4]),
            )
        )
    return rows


def fetch_finmind_daily_prices_range(
    symbols: set[str], start_date: date, end_date: date
) -> list[StockDailyPriceIn]:
    if not symbols:
        return []

    headers: dict[str, str] = {}
    if settings.finmind_api_token:
        headers["Authorization"] = f"Bearer {settings.finmind_api_token}"

    rows: list[StockDailyPriceIn] = []
    for index, symbol in enumerate(sorted(symbols), start=1):
        if index % 50 == 0:
            print(
                f"FinMind price progress: {index}/{len(symbols)} symbols "
                f"for {start_date.isoformat()} to {end_date.isoformat()}",
                flush=True,
            )
        query = urlencode(
            {
                "dataset": "TaiwanStockPrice",
                "data_id": symbol,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
            }
        )
        payload = _fetch_json(f"{FINMIND_BASE}?{query}", headers=headers)
        if not isinstance(payload, dict):
            continue
        for row in payload.get("data", []):
            trade_date = date.fromisoformat(row["date"])
            if trade_date < start_date or trade_date > end_date:
                continue
            rows.append(
                StockDailyPriceIn(
                    symbol=symbol,
                    trade_date=trade_date,
                    open_price=_clean_number(row.get("open")),
                    high_price=_clean_number(row.get("max")),
                    low_price=_clean_number(row.get("min")),
                    close_price=float(row["close"]),
                    volume=int(row["Trading_Volume"]),
                    turnover_value=_clean_number(row.get("Trading_money")),
                )
            )
    return rows


def fetch_daily_prices_with_fallback(
    start_date: date, end_date: date, symbols: set[str] | None = None
) -> list[StockDailyPriceIn]:
    symbol_filter = symbols or set()
    prefer_finmind = start_date < date(2024, 1, 1) and bool(symbol_filter)
    if not prefer_finmind:
        rows: list[StockDailyPriceIn] = []
        try:
            for trade_date in _iter_weekdays(start_date, end_date):
                rows.extend(fetch_twse_daily_prices(trade_date, symbols))
            return rows
        except Exception:
            if not symbol_filter:
                raise

    return fetch_finmind_daily_prices_range(symbol_filter, start_date, end_date)


def fetch_twse_institutional_flows(
    trade_date: date, symbols: set[str] | None = None
) -> list[StockInstitutionalFlowIn]:
    try:
        payload = _fetch_json(_t86_url(trade_date))
    except Exception:
        return []
    if not isinstance(payload, dict) or payload.get("stat") != "OK":
        return []

    fields = payload.get("fields", [])
    symbol_idx = _field_index(fields, "證券代號")
    foreign_net_primary_idx = _field_index(fields, "外陸資買賣超股數(不含外資自營商)")
    foreign_net_dealer_idx = _field_index(fields, "外資自營商買賣超股數")
    trust_net_idx = _field_index(fields, "投信買賣超股數")
    dealer_self_idx = _field_index(fields, "自營商買賣超股數(自行買賣)")
    dealer_hedge_idx = _field_index(fields, "自營商買賣超股數(避險)")
    dealer_total_idx = _field_index(fields, "自營商買賣超股數")

    if symbol_idx is None:
        return []

    rows: list[StockInstitutionalFlowIn] = []
    for row in payload.get("data", []):
        if len(row) <= symbol_idx:
            continue
        symbol = row[symbol_idx]
        if symbols and symbol not in symbols:
            continue
        foreign_net = 0
        if foreign_net_primary_idx is not None and len(row) > foreign_net_primary_idx:
            foreign_net += _clean_int(row[foreign_net_primary_idx]) or 0
        if foreign_net_dealer_idx is not None and len(row) > foreign_net_dealer_idx:
            foreign_net += _clean_int(row[foreign_net_dealer_idx]) or 0

        trust_net = 0
        if trust_net_idx is not None and len(row) > trust_net_idx:
            trust_net = _clean_int(row[trust_net_idx]) or 0

        dealer_net = 0
        used_split_dealer = False
        if dealer_self_idx is not None and len(row) > dealer_self_idx:
            dealer_net += _clean_int(row[dealer_self_idx]) or 0
            used_split_dealer = True
        if dealer_hedge_idx is not None and len(row) > dealer_hedge_idx:
            dealer_net += _clean_int(row[dealer_hedge_idx]) or 0
            used_split_dealer = True
        if not used_split_dealer and dealer_total_idx is not None and len(row) > dealer_total_idx:
            dealer_net = _clean_int(row[dealer_total_idx]) or 0

        total_net = foreign_net + trust_net + dealer_net
        rows.append(
            StockInstitutionalFlowIn(
                symbol=symbol,
                trade_date=trade_date,
                foreign_net_buy=foreign_net,
                trust_net_buy=trust_net,
                dealer_net_buy=dealer_net,
                total_net_buy=total_net,
            )
        )
    return rows


def fetch_finmind_institutional_flows_range(
    symbols: set[str], start_date: date, end_date: date
) -> list[StockInstitutionalFlowIn]:
    if not symbols:
        return []

    headers: dict[str, str] = {}
    if settings.finmind_api_token:
        headers["Authorization"] = f"Bearer {settings.finmind_api_token}"

    aggregated: dict[tuple[str, date], dict[str, int]] = {}
    for index, symbol in enumerate(sorted(symbols), start=1):
        if index % 50 == 0:
            print(
                f"FinMind flow progress: {index}/{len(symbols)} symbols "
                f"for {start_date.isoformat()} to {end_date.isoformat()}",
                flush=True,
            )
        query = urlencode(
            {
                "dataset": "TaiwanStockInstitutionalInvestorsBuySell",
                "data_id": symbol,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
            }
        )
        payload = _fetch_json(f"{FINMIND_BASE}?{query}", headers=headers)
        if not isinstance(payload, dict):
            continue
        for row in payload.get("data", []):
            trade_date = date.fromisoformat(row["date"])
            if trade_date < start_date or trade_date > end_date:
                continue
            key = (symbol, trade_date)
            item = aggregated.setdefault(
                key,
                {
                    "foreign_net_buy": 0,
                    "trust_net_buy": 0,
                    "dealer_net_buy": 0,
                },
            )
            net_buy = int(row.get("buy", 0)) - int(row.get("sell", 0))
            name = row.get("name", "")
            if name in {"Foreign_Investor", "Foreign_Dealer_Self"}:
                item["foreign_net_buy"] += net_buy
            elif name == "Investment_Trust":
                item["trust_net_buy"] += net_buy
            elif name in {"Dealer_self", "Dealer_Hedging"}:
                item["dealer_net_buy"] += net_buy

    return [
        StockInstitutionalFlowIn(
            symbol=symbol,
            trade_date=trade_date,
            foreign_net_buy=values["foreign_net_buy"],
            trust_net_buy=values["trust_net_buy"],
            dealer_net_buy=values["dealer_net_buy"],
            total_net_buy=values["foreign_net_buy"]
            + values["trust_net_buy"]
            + values["dealer_net_buy"],
        )
        for (symbol, trade_date), values in sorted(aggregated.items(), key=lambda item: (item[0][1], item[0][0]))
    ]


def fetch_institutional_flows_with_fallback(
    start_date: date, end_date: date, symbols: set[str]
) -> list[StockInstitutionalFlowIn]:
    prefer_finmind = start_date < date(2024, 1, 1)
    if not prefer_finmind:
        rows: list[StockInstitutionalFlowIn] = []
        try:
            for trade_date in _iter_weekdays(start_date, end_date):
                rows.extend(fetch_twse_institutional_flows(trade_date, symbols))
            return rows
        except Exception:
            pass

    return fetch_finmind_institutional_flows_range(symbols, start_date, end_date)


def fetch_twse_latest_monthly_revenue(
    symbols: set[str] | None = None,
) -> list[StockMonthlyFundamentalIn]:
    payload = _fetch_json(f"{TWSE_OPENAPI_BASE}/opendata/t187ap05_L")
    if not isinstance(payload, list):
        return []

    rows: list[StockMonthlyFundamentalIn] = []
    for row in payload:
        symbol = row.get("公司代號")
        if not symbol or (symbols and symbol not in symbols):
            continue
        roc_month = row.get("資料年月")
        if not roc_month:
            continue
        rows.append(
            StockMonthlyFundamentalIn(
                symbol=symbol,
                report_month=_roc_ym_to_date(roc_month),
                revenue=_clean_number(row.get("營業收入-當月營收")),
                revenue_yoy_pct=_clean_number(row.get("營業收入-去年同月增減(%)")),
                gross_margin_pct=None,
                gross_margin_prev_pct=None,
                source_note="TWSE OpenAPI t187ap05_L latest monthly revenue snapshot",
            )
        )
    return rows


def fetch_twse_listed_company_symbols() -> set[str]:
    payload = _fetch_json(f"{TWSE_OPENAPI_BASE}/opendata/t187ap03_L")
    if not isinstance(payload, list):
        return set()
    return {
        row.get("公司代號")
        for row in payload
        if row.get("公司代號") and str(row.get("公司代號")).isdigit()
    }


def fetch_twse_etf_symbols() -> set[str]:
    payload = _fetch_json(f"{TWSE_OPENAPI_BASE}/opendata/t187ap47_L")
    if not isinstance(payload, list):
        return set()
    return {
        row.get("基金代號")
        for row in payload
        if row.get("基金代號") and str(row.get("基金代號")).isdigit()
    }


def build_current_twse_symbol_universe(anchor_date: date | None = None) -> set[str]:
    listed = fetch_twse_listed_company_symbols()
    etfs = fetch_twse_etf_symbols()
    symbols = listed | etfs
    print(
        f"Universe built from TWSE OpenAPI: listed={len(listed)} etf={len(etfs)} total={len(symbols)}",
        flush=True,
    )
    return symbols


def build_remote_bootstrap_payload(payload: StockRemoteBootstrapIn) -> StockBootstrapIn:
    date_to = date.today()
    date_from = date_to - timedelta(days=payload.months * 31)
    symbol_filter = set(payload.symbols) if payload.symbols else None

    discovered_symbols: dict[str, StockSymbolIn] = {}
    effective_symbols = symbol_filter or build_current_twse_symbol_universe(date_to)
    if not effective_symbols:
        raise RuntimeError("Unable to build TWSE symbol universe for bootstrap")

    if symbol_filter:
        daily_prices = fetch_daily_prices_with_fallback(date_from, date_to, effective_symbols)
        for row in daily_prices:
            discovered_symbols.setdefault(row.symbol, StockSymbolIn(symbol=row.symbol))
    else:
        daily_prices = fetch_finmind_daily_prices_range(effective_symbols, date_from, date_to)
        for row in daily_prices:
            discovered_symbols.setdefault(row.symbol, StockSymbolIn(symbol=row.symbol))

    for symbol in effective_symbols:
        discovered_symbols.setdefault(symbol, StockSymbolIn(symbol=symbol))

    institutional_flows = fetch_institutional_flows_with_fallback(date_from, date_to, effective_symbols)
    for row in institutional_flows:
        discovered_symbols.setdefault(row.symbol, StockSymbolIn(symbol=row.symbol))

    monthly_fundamentals = (
        fetch_twse_latest_monthly_revenue(symbol_filter or set(discovered_symbols))
        if payload.include_fundamentals
        else []
    )
    for row in monthly_fundamentals:
        discovered_symbols.setdefault(row.symbol, StockSymbolIn(symbol=row.symbol))

    return StockBootstrapIn(
        months=payload.months,
        universe="twse_official",
        symbols=list(discovered_symbols.values()),
        daily_prices=daily_prices,
        institutional_flows=institutional_flows,
        monthly_fundamentals=monthly_fundamentals,
    )


def build_remote_daily_sync_payload(payload: StockRemoteDailySyncIn) -> StockDailySyncIn:
    symbol_filter = set(payload.symbols) if payload.symbols else None
    discovered_symbols: dict[str, StockSymbolIn] = {}
    trade_dates: list[date] = []

    start_date = min(trade_dates) if trade_dates else payload.trade_date
    end_date = max(trade_dates) if trade_dates else payload.trade_date
    for offset in range(payload.lookback_days):
        trade_date = payload.trade_date - timedelta(days=offset)
        if trade_date.weekday() < 5:
            trade_dates.append(trade_date)
    start_date = min(trade_dates) if trade_dates else payload.trade_date
    end_date = max(trade_dates) if trade_dates else payload.trade_date

    daily_prices = fetch_daily_prices_with_fallback(start_date, end_date, symbol_filter)
    for row in daily_prices:
        discovered_symbols.setdefault(row.symbol, StockSymbolIn(symbol=row.symbol))

    effective_symbols = symbol_filter or set(discovered_symbols)
    institutional_flows = fetch_institutional_flows_with_fallback(
        start_date,
        end_date,
        effective_symbols,
    )
    for row in institutional_flows:
        discovered_symbols.setdefault(row.symbol, StockSymbolIn(symbol=row.symbol))

    monthly_fundamentals = (
        fetch_twse_latest_monthly_revenue(symbol_filter or set(discovered_symbols))
        if payload.include_fundamentals
        else []
    )
    for row in monthly_fundamentals:
        discovered_symbols.setdefault(row.symbol, StockSymbolIn(symbol=row.symbol))

    return StockDailySyncIn(
        trade_date=payload.trade_date,
        lookback_days=payload.lookback_days,
        symbols=list(discovered_symbols.values()),
        daily_prices=daily_prices,
        institutional_flows=institutional_flows,
        monthly_fundamentals=monthly_fundamentals,
    )
