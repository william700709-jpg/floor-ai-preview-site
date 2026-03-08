# 暖居空間報價網站

使用 Next.js + Tailwind CSS 製作的地板與窗簾報價展示站，包含首頁、案例頁、聯絡頁，以及地板與窗簾試算功能。

## 開發

```bash
npm install
npm run dev
```

## AI 地板預覽 MVP

前端頁面位於：

- [floor-ai-preview/page.tsx](/D:/gpt%20codex/app/floor-ai-preview/page.tsx)

後端為獨立 FastAPI 服務，放在：

- [backend/app/main.py](/D:/gpt%20codex/backend/app/main.py)

### 前端環境變數

```bash
NEXT_PUBLIC_PREVIEW_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

### 後端環境變數

```bash
PREVIEW_DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/cozy_home
```

### 啟動 FastAPI

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Zeabur 部署後端

如果 Zeabur 無法正確把 `/backend` 偵測成 Python 服務，可直接使用：

- [Dockerfile](/D:/gpt%20codex/backend/Dockerfile)
- [backend/.dockerignore](/D:/gpt%20codex/backend/.dockerignore)

Zeabur 後端服務建議：

- Root Directory: `/backend`
- Deploy Type: Dockerfile
- Port: `8000`
- Runtime Command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### 後端 API

- `GET /api/v1/floor-styles`
- `POST /api/v1/uploads`
- `POST /api/v1/previews`
- `POST /api/v1/leads`

### PostgreSQL Schema

- [schema.sql](/D:/gpt%20codex/backend/schema.sql)

## 收單設定

目前聯絡表單支援兩種模式：

1. 設定 `GOOGLE_SHEETS_WEBHOOK_URL`
   會把表單資料 POST 到你的 Google Apps Script / webhook。
2. 沒有設定 webhook
   會自動把資料寫入 `data/submissions/contact-leads.ndjson`，方便本機測試。

請先複製環境變數：

```bash
copy .env.example .env.local
```

然後在 `.env.local` 填入：

```bash
GOOGLE_SHEETS_WEBHOOK_URL=https://your-google-apps-script-url
```

## Google Sheets 欄位建議

Webhook 會收到以下欄位：

- `reference`
- `name`
- `phone`
- `lineId`
- `requestType`
- `sizeInfo`
- `message`
- `source`
- `createdAt`

## Apps Script 範本

如果你要直接接 Google Sheets，可參考：

- [google-apps-script.gs](/D:/gpt%20codex/docs/google-apps-script.gs)
- [google-sheets-setup.md](/D:/gpt%20codex/docs/google-sheets-setup.md)
