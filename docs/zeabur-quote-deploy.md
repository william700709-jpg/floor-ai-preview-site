# Zeabur 部署設定

這個專案建議在 Zeabur 建 3 個服務：

- `frontend`
- `backend`
- `postgresql`

GitHub repo：

- `https://github.com/william700709-jpg/floor-ai-preview-site`

目前已推到 `main` 分支，最新版本包含：

- 線上報價頁
- 正式報價單頁
- PDF 列印版型
- 報價公式設定頁
- 最近報價單管理

## 1. PostgreSQL

先在 Zeabur 建立 `PostgreSQL` 服務。

建立完成後，Zeabur 會提供連線資訊，通常你只需要組成一條資料庫連線字串。

格式範例：

```env
postgresql+psycopg://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

## 2. Backend 服務

建立一個新的服務，來源選同一個 GitHub repo。

建議設定：

- Service Name: `backend`
- Root Directory: `backend`
- Deploy Type: `Dockerfile`
- Port: `8000`

Zeabur backend 環境變數請填：

```env
PREVIEW_DATABASE_URL=postgresql+psycopg://USERNAME:PASSWORD@HOST:PORT/DATABASE
PREVIEW_CORS_ORIGINS=https://你的前端網址
```

如果還要保留本機一起測，也可以填成：

```env
PREVIEW_CORS_ORIGINS=https://你的前端網址,http://127.0.0.1:3000,http://localhost:3000
```

如果你有使用 AI 地板預覽，再加：

```env
PREVIEW_GEMINI_API_KEY=你的 Gemini API Key
```

如果你有用股票同步功能，再加：

```env
PREVIEW_STOCK_API_KEY=your-secret-key
PREVIEW_FINMIND_API_TOKEN=your-finmind-token
```

Backend 成功後測試：

- `https://你的後端網址/health`

正常會回：

```json
{"status":"ok"}
```

## 3. Frontend 服務

建立一個新的服務，來源選同一個 GitHub repo。

建議設定：

- Service Name: `frontend`
- Root Directory: `/`
- Framework: `Next.js`

Frontend 環境變數請填：

```env
NEXT_PUBLIC_PREVIEW_API_BASE_URL=https://你的後端網址/api/v1
```

如果有接收單 webhook，再加：

```env
GOOGLE_SHEETS_WEBHOOK_URL=https://你的-google-apps-script-url
```

## 4. 部署完成後要測

前端網址打開後測：

- `/curtain-quote`
- `/quote-settings`

後端網址測：

- `/health`
- `/api/v1/quote-products`

## 5. 最常見問題

### 前端打得開，但報價資料抓不到

通常是：

- `NEXT_PUBLIC_PREVIEW_API_BASE_URL` 沒填
- 或 `PREVIEW_CORS_ORIGINS` 沒加前端網址

### 後端啟動失敗

通常先檢查：

- `PREVIEW_DATABASE_URL` 是否正確
- PostgreSQL 是否已建立

### 報價頁能開，但送出失敗

通常是：

- backend 沒連到 PostgreSQL
- 或 database URL 帳密錯誤

## 6. 建議填法範例

假設：

- 前端網址：`https://cozy-home-web.zeabur.app`
- 後端網址：`https://cozy-home-api.zeabur.app`

那就填：

Backend：

```env
PREVIEW_DATABASE_URL=postgresql+psycopg://USERNAME:PASSWORD@HOST:PORT/DATABASE
PREVIEW_CORS_ORIGINS=https://cozy-home-web.zeabur.app
```

Frontend：

```env
NEXT_PUBLIC_PREVIEW_API_BASE_URL=https://cozy-home-api.zeabur.app/api/v1
```
