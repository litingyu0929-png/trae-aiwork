import { KEYWORD_MATRIX, DomainKey, KeywordDefinition } from './matrix';

export class KeywordEngine {
  /**
   * 計算輸入詞與特定領域的匹配分數
   * @param inputTerms 使用者輸入的關鍵字陣列 (例如: ['運彩', 'nba'])
   * @param domain 目標領域
   */
  static calculateDomainScore(inputTerms: string[], domain: DomainKey): number {
    const definitions = KEYWORD_MATRIX[domain] || [];
    let totalScore = 0;
    const lowerInputTerms = inputTerms.map(t => t.toLowerCase());

    for (const def of definitions) {
      // 1. 完全匹配
      if (lowerInputTerms.includes(def.term.toLowerCase())) {
        totalScore += def.weight * 10; // 完全命中加權高
        continue;
      }

      // 2. 部分匹配 (模糊搜尋)
      for (const input of lowerInputTerms) {
        if (input.includes(def.term) || def.term.includes(input)) {
          // 避免太短的詞造成誤判 (例如 'a' include 'nba')
          if (input.length >= 2 && def.term.length >= 2) {
            totalScore += def.weight * 3;
          }
        }
      }
    }

    return totalScore;
  }

  /**
   * 推斷最可能的領域
   * @param inputTerms 使用者輸入的關鍵字
   * @param threshold 最低匹配門檻分數
   */
  static inferDomains(inputTerms: string[], threshold = 5): DomainKey[] {
    const scores: { domain: DomainKey; score: number }[] = [];

    // 遍歷所有領域計算分數
    (Object.keys(KEYWORD_MATRIX) as DomainKey[]).forEach(domain => {
      if (domain === 'general') return; // Skip general in calculation
      const score = this.calculateDomainScore(inputTerms, domain);
      if (score > 0) {
        scores.push({ domain, score });
      }
    });

    // 排序並過濾
    const matchedDomains = scores
      .filter(item => item.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .map(item => item.domain);

    // 如果沒有命中任何領域，回傳 general
    if (matchedDomains.length === 0) {
      return ['general'];
    }

    return matchedDomains;
  }

  /**
   * 擴充關鍵字 (未來可接 LLM)
   * 目前僅回傳靜態矩陣中的相關詞
   */
  static expandKeywords(inputTerm: string): string[] {
    const expanded = new Set<string>();
    const lowerInput = inputTerm.toLowerCase();

    // 簡單查表
    Object.values(KEYWORD_MATRIX).forEach(defs => {
      const match = defs.some(d => d.term.toLowerCase() === lowerInput);
      if (match) {
        defs.forEach(d => expanded.add(d.term));
      }
    });

    return Array.from(expanded);
  }
}
