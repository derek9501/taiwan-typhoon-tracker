# 台灣颱風追蹤器（GitHub Actions 版）

從 Google Apps Script 搬過來的版本，移除了原本的台灣本島氣象網格功能，
只保留「多颱風追蹤 + 5x5(可調) 網格內插估算」的核心邏輯。

## 運作邏輯

1. 每次執行先打 **CWA 官方開放資料**，拿到所有目前有分析資料的活動颱風清單（官方座標，通常每 3–4 小時更新一次）。
2. 用「觀測輪／緩衝輪」輪流排程（見 `config.js` 的 `BUFFER_ROUNDS`），
   在官方發布之間，用 OpenWeather 網格資料做**內插估算**，補上更頻繁的位置更新。
3. 結果寫進 `data/latest.json`（目前狀態快照）與 `data/typhoons/<颱風名>.json`（該颱風的歷史軌跡）。
4. `estimatedPosition` 一律標記 `source: "estimated"`，跟 `officialPosition`（CWA）分開，
   避免誤以為每次都是官方等級的精度。

## 額度計算（務必依你實際的 API 方案調整 `config.js`）

- OpenWeather 免費額度：每日 1000 次、每分鐘 60 次
- 平均每次 trigger 呼叫數 ≈ 觀測網格點數 ÷ (1 + BUFFER_ROUNDS)
- 預設 `GRID_RADIUS_STEPS=1`（3x3=9 點）、`BUFFER_ROUNDS=3`
  → 平均 9 ÷ 4 = 2.25 次/trigger
  → 每 10 分鐘一次、一天 144 次 trigger → 約 324 次/天，在額度內留有餘裕（不論同時有幾個颱風，n 會互相抵消）
- 如果額度快用完，優先調大 `BUFFER_ROUNDS`（降低頻率）而不是縮小網格（會犧牲內插的空間解析度）

## 設定步驟

1. 建立 GitHub repo，把這個資料夾內容 push 上去。
2. 到 repo 的 **Settings → Secrets and variables → Actions**，新增兩個 secrets：
   - `CWA_API_KEY`：你的 CWA 開放資料 Authorization key（**不要**寫進程式碼或 commit）
   - `OPENWEATHER_API_KEY`：你的 OpenWeather API key
3. 確認 repo 的 **Settings → Actions → General** 已允許 Workflow 有讀寫權限
   （或保留 workflow 檔案裡的 `permissions: contents: write` 即可，兩者擇一生效）。
4. Push 之後到 **Actions** 分頁，手動觸發一次 `workflow_dispatch` 測試是否成功。

## 已知限制，請注意

- **排程非準點**：GitHub Actions 的 `schedule` 官方文件明講高負載時可能延遲，
  尤其整點附近；`*/10` 只是「大約每 10 分鐘」，不是精準計時器。
  若真的需要準點，需另外用外部服務（如 cron-job.org）打 `workflow_dispatch` 的 REST API 觸發，
  而不是單靠 GitHub 自己的 `schedule`。
- **60 天無活動自動停用**的規則，這個 repo 因為每次執行都會自己 commit `data/`，
  等於自帶活動紀錄，理論上不會被這條規則停用——但如果你之後改成不 commit（例如資料改存別處），要留意這件事會重新變成風險。
- **CWA XML 欄位路徑未經實測驗證**：`scripts/lib/cwa.js` 裡 `parseTyphoonXML()`
  的節點路徑（`cwaopendata > dataset > TropicalCyclones > TropicalCyclone ...`）
  是依 CWA 開放資料常見格式寫的，正式串接前**務必**拿你帳號實際打到的 XML 內容核對一次欄位名稱，
  不對的話只需要改這一個函式。
- `estimatedPosition` 是網格內插估算，不是真正的雷達/衛星定位，颱風結構複雜（尤其外型不對稱時）誤差會更大，
  UI 呈現時建議清楚標示「估算」字樣，避免使用者誤解為官方定位。

## 目錄結構

```
taiwan-typhoon-tracker/
├── .github/workflows/update-typhoon.yml   # 排程 + commit 回 repo
├── scripts/
│   ├── update.js                          # 主流程
│   └── lib/
│       ├── cwa.js                         # CWA 官方颱風資料
│       ├── openweather.js                 # OpenWeather 網格查詢（含節流延遲）
│       ├── gridEstimate.js                # 颱風眼特徵估算邏輯
│       └── storage.js                     # JSON 讀寫 / 歷史紀錄
├── config.js                              # 可調參數（網格大小、緩衝輪數、延遲）
├── data/
│   ├── latest.json                        # 執行後自動產生：目前狀態快照
│   ├── state.json                         # 執行後自動產生：排程記憶（對應原本 GAS 的 B7 步數）
│   └── typhoons/<name>.json               # 每個颱風各自的歷史軌跡
└── package.json
```
