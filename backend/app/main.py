from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.routers.floor_styles import router as floor_styles_router
from app.routers.leads import router as leads_router
from app.routers.previews import router as previews_router
from app.routers.quotes import router as quotes_router
from app.routers.stocks import router as stocks_router
from app.routers.uploads import router as uploads_router
from app.seed import seed_floor_styles, seed_quote_formula_settings, seed_quote_products
from app.services.storage import ensure_storage_dirs


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_storage_dirs()
    Base.metadata.create_all(bind=engine)
    with engine.begin() as connection:
        # Keep local databases compatible when new quote fields are added.
        connection.execute(text("ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS custom_model VARCHAR(120)"))
        connection.execute(text("ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS pricing_unit VARCHAR(20)"))
        connection.execute(text("ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS material_unit_price NUMERIC(12, 2)"))
    with SessionLocal() as db:
        seed_floor_styles(db)
        seed_quote_products(db)
        seed_quote_formula_settings(db)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/storage", StaticFiles(directory=settings.storage_root), name="storage")

app.include_router(floor_styles_router, prefix=settings.api_prefix)
app.include_router(uploads_router, prefix=settings.api_prefix)
app.include_router(previews_router, prefix=settings.api_prefix)
app.include_router(leads_router, prefix=settings.api_prefix)
app.include_router(quotes_router, prefix=settings.api_prefix)
app.include_router(stocks_router, prefix=settings.api_prefix)


@app.get("/health")
def health_check():
    return {"status": "ok"}
