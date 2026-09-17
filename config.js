export default {
  // 觀測網格半徑（以「步」為單位）。1 = 3x3（9 點），2 = 5x5（25 點）
  GRID_RADIUS_STEPS: 1,

  // 每一步的經緯度間距（度）
  GRID_STEP_DEGREE: 0.5,

  // 每做 1 次「觀測輪」（呼叫 OpenWeather）之後，插入幾輪「緩衝輪」（不呼叫 API）
  // 平均每次 trigger 的 OpenWeather 呼叫數 ≈ (3x3 格點數) / (1 + BUFFER_ROUNDS)
  // 例：9 點 / (1+3) = 2.25 次/trigger，一天 144 次 trigger ≈ 324 次，在 1000 次/日額度內留有餘裕
  BUFFER_ROUNDS: 3,

  // 每次 OpenWeather 呼叫之間的延遲（毫秒），避免超過每分鐘上限（60 次/分）
  OPENWEATHER_CALL_DELAY_MS: 1100,

  // 單一颱風歷史紀錄最多保留幾筆（超過從最舊開始丟棄，避免檔案無限成長）
  MAX_HISTORY_RECORDS: 500
};
