
# 變更影響報告 (Change Impact Report)

**日期**: 2026-01-20
**變更**: 資產分類標準化 (Asset Category Standardization)

## 1. 變更摘要
為了統一系統內的資產分類，我們執行了以下變更：
- **前端**: `AssetsLibrary` 頁面現在使用標準化的 `ASSET_CATEGORIES` 常量生成篩選器，移除了硬編碼的舊選項。
- **資料庫**: 創建了遷移腳本 `supabase/migrations/20260120_migrate_asset_categories.sql` 以將舊數據清洗為新標準。

## 2. 新分類標準 (ASSET_CATEGORIES)
| Value | Label | 舊標籤映射 (Mapping) |
|:---|:---|:---|
| `Sports_Basket` | 🏀 籃球 (NBA/WNBA) | NBA, Basketball, nba |
| `Sports_Base` | ⚾ 棒球 (MLB/中職) | MLB, Baseball, mlb |
| `Casino_Baccarat` | 🃏 百家樂 | CASINO BACCARAT, baccarat |
| `Casino_Slots` | 🎰 電子/老虎機 | CASINO SLOT, slot |
| `Lottery_Six` | 🎲 六合彩/539 | Lottery, Six Mark, 六合彩 |
| `Traffic_Funny` | 🤣 搞笑/日常/梗圖 | DAILY, NEWS, daily, news, funny |
| `Winning_Proof` | 💰 獲利/入帳證明 | (New) |

## 3. 預估影響 (Estimated Impact)
- **受影響記錄**: 預計影響現有數據庫中約 95% 的 `assets` 記錄（視乎舊數據的分布）。
- **前端顯示**: 
  - 舊有的 'all', 'nba' 等 URL 參數或狀態可能暫時失效，需用戶重新點擊篩選器。
  - 用戶現在能看到更清晰的中文分類標籤。

## 4. 驗證步驟
1.  **執行 SQL**: 在 Supabase SQL Editor 中運行遷移腳本。
2.  **前端檢查**: 刷新素材庫頁面，確認篩選器顯示正確，且點擊分類能篩選出對應數據。
3.  **功能回歸**: 檢查爬蟲 (Crawler) 是否使用了新的分類標準（需確認 `rss_feeds` 中的 `category` 設定是否也同步更新）。

## 5. 建議後續行動
- 更新 `rss_feeds` 表中的 `category` 欄位，確保新抓取的內容自動符合新標準。
- 建議運行以下 SQL 更新 Feed 設定：
  ```sql
  UPDATE rss_feeds SET category = 'Sports_Basket' WHERE category IN ('NBA', 'Basketball');
  -- (依此類推)
  ```
