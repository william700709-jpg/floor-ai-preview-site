# Google Sheets 收單設定

這份網站目前已支援把聯絡表單資料 POST 到 Google Apps Script webhook。

## 1. 建立 Google 試算表

先建立一份新的 Google Sheets，例如命名為「暖居空間表單收件」。

## 2. 建立 Apps Script

1. 在試算表上方選單打開「擴充功能」→「Apps Script」
2. 清空預設內容
3. 把 [google-apps-script.gs](/D:/gpt%20codex/docs/google-apps-script.gs) 的內容全部貼上
4. 儲存專案

## 3. 部署成 Web App

1. 點右上角「部署」→「新增部署作業」
2. 類型選 `網頁應用程式`
3. `執行身分` 選你自己
4. `誰可以存取` 選 `任何人`
5. 部署後複製 Web App URL

## 4. 設定網站環境變數

在專案根目錄建立 `.env.local`：

```env
GOOGLE_SHEETS_WEBHOOK_URL=你的 Web App URL
```

如果你還沒有 `.env.local`，可先複製：

```bash
copy .env.example .env.local
```

## 5. 重新啟動網站

```bash
npm run dev
```

## 6. 測試送出

從首頁快速估價表單或聯絡頁送出一筆資料，成功後試算表會新增一列。

## 收到的欄位

- `reference`
- `createdAt`
- `source`
- `name`
- `phone`
- `lineId`
- `requestType`
- `sizeInfo`
- `message`

## 備註

- 如果沒有設定 `GOOGLE_SHEETS_WEBHOOK_URL`，網站仍會把資料寫到本機 `data/submissions/contact-leads.ndjson`
- 如果 Apps Script URL 換了，記得同步更新 `.env.local`
