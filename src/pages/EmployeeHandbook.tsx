import React, { useState, useEffect } from 'react';
import { Book, Shield, Users, Clock, Coffee, DollarSign, AlertTriangle, UserPlus, Scale, ChevronDown, ChevronUp, Calculator } from 'lucide-react';

const BonusCalculator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [teamBite, setTeamBite] = useState<number | ''>('');
  const [teamCashFlow, setTeamCashFlow] = useState<number | ''>('');
  const [teamPromo, setTeamPromo] = useState<number | ''>('');
  const [fixedCost, setFixedCost] = useState<number | ''>('');
  const [lastMonthNegative, setLastMonthNegative] = useState<number | ''>('');
  const [personalBite, setPersonalBite] = useState<number | ''>('');

  const [teamNetProfit, setTeamNetProfit] = useState(0);
  const [bonusPool, setBonusPool] = useState(0);
  const [bonusPoolRate, setBonusPoolRate] = useState(0);
  const [personalRatio, setPersonalRatio] = useState(0);
  const [estimatedBonus, setEstimatedBonus] = useState(0);

  useEffect(() => {
    // 1. Calculate Team Net Profit
    const bite = Number(teamBite) || 0;
    const cashFlow = Number(teamCashFlow) || 0;
    const promo = Number(teamPromo) || 0;
    const cost = Number(fixedCost) || 0;
    const negative = Number(lastMonthNegative) || 0;

    const netProfit = ((bite - cashFlow - promo) * 0.4) - cost - negative;
    setTeamNetProfit(netProfit);

    // 2. Calculate Bonus Pool
    let rate = 0;
    if (netProfit > 500000) {
      rate = 0.5;
    } else if (netProfit > 200000) {
      rate = 0.35;
    } else if (netProfit > 0) {
      rate = 0.2;
    }
    setBonusPoolRate(rate);
    const pool = netProfit > 0 ? netProfit * rate : 0;
    setBonusPool(pool);

    // 3. Calculate Personal Share
    const pBite = Number(personalBite) || 0;
    const ratio = bite !== 0 ? (pBite / bite) : 0;
    setPersonalRatio(ratio);

    setEstimatedBonus(pool * ratio);

  }, [teamBite, teamCashFlow, teamPromo, fixedCost, lastMonthNegative, personalBite]);

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mt-6 shadow-sm">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded text-white">
            <Calculator size={20} />
          </div>
          <span className="text-[18px] font-bold text-gray-900 leading-normal">開啟試算工具</span>
        </div>
        {isOpen ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
      </button>

      {isOpen && (
        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Step 1: Team Data */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-gray-900 text-white text-sm px-2 py-1 rounded">Step 1</span>
                <h4 className="text-[18px] font-bold text-gray-900 leading-normal">團隊數據 (計算獎金池)</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Inputs... */}
                {['團隊總輸贏 (咬度)', '團隊金流費用', '團隊活動/優惠成本', '固定營運成本', '上月累計負值'].map((label, idx) => {
                  const setters = [setTeamBite, setTeamCashFlow, setTeamPromo, setFixedCost, setLastMonthNegative];
                  const values = [teamBite, teamCashFlow, teamPromo, fixedCost, lastMonthNegative];
                  return (
                    <div key={idx}>
                      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                      <input 
                        type="number" 
                        value={values[idx]}
                        onChange={(e) => setters[idx](Number(e.target.value))}
                        placeholder="0"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none h-10"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-5 grid grid-cols-2 gap-4 mt-2">
                <div>
                  <div className="text-sm text-gray-500 mb-1">團隊最終淨利</div>
                  <div className="font-bold text-gray-900 text-[20px] leading-normal">{formatCurrency(teamNetProfit)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">獎金池總額 ({bonusPoolRate * 100}%)</div>
                  <div className="font-bold text-blue-600 text-[20px] leading-normal">{formatCurrency(bonusPool)}</div>
                </div>
              </div>
            </div>

            {/* Step 2: Personal Data */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-gray-900 text-white text-sm px-2 py-1 rounded">Step 2</span>
                <h4 className="text-[18px] font-bold text-gray-900 leading-normal">我可分到的獎金</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">個人總輸贏 (咬度)</label>
                <input 
                  type="number" 
                  value={personalBite}
                  onChange={(e) => setPersonalBite(Number(e.target.value))}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 outline-none h-10"
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 space-y-4 mt-4">
                <div className="flex justify-between items-center border-b border-blue-200 pb-3">
                  <span className="text-base text-blue-800">個人佔比</span>
                  <span className="font-mono text-base font-medium text-blue-900">
                     {formatCurrency(Number(personalBite) || 0)} / {formatCurrency(Number(teamBite) || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="font-bold text-blue-900 text-[18px]">預估個人獎金</span>
                  <span className="font-bold text-3xl text-blue-600">{formatCurrency(estimatedBonus)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500">
            註：固定成本包含房租、水電、全體薪資（含底薪/全勤）、硬體維護、辦公雜支等實報實銷成本。
          </div>
        </div>
      )}
    </div>
  );
};

export default function EmployeeHandbook() {
  const styles = {
    h1: "text-[24px] font-bold text-gray-900 leading-normal",
    h2: "text-[20px] font-bold text-gray-900 leading-normal",
    h3: "text-[18px] font-bold text-gray-900 leading-normal",
    body: "text-base leading-relaxed text-gray-700",
    paragraph: "mb-4",
    section: "mb-12", // Increased section spacing for better separation
    chapterNum: "text-[24px] font-bold text-gray-300 mr-3",
    chapterHeader: "flex items-center mb-6",
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 bg-white shadow-sm min-h-screen my-8 rounded-xl">
      {/* Header */}
      <div className="text-center border-b-2 border-gray-100 pb-8 mb-12">
        <h1 className={styles.h1}>
          員工守則規章
        </h1>
      </div>

      <div className="space-y-16">
        {/* Chapter 1 */}
        <section>
          <div className={styles.chapterHeader}>
            <span className={styles.chapterNum}>01</span>
            <h2 className={styles.h2}>
              員工職場紀律守則
            </h2>
          </div>
          <div className="pl-4 border-l-4 border-blue-500 space-y-4">
            <p className={styles.body}><strong className="text-gray-900">出勤規範：</strong>員工須依公司規定準時上下班。每日工作任務完成後，須經主管審核確認方可離開。</p>
            <p className={styles.body}><strong className="text-gray-900">工作專注度：</strong>上班時間禁用私人手機處理私人事務，嚴禁從事與工作無關之活動。</p>
            <p className={styles.body}><strong className="text-gray-900">指揮鏈結：</strong>應服從主管之工作指示，如有意見或困難，應第一時間向主管主動說明溝通。</p>
            <p className={styles.body}><strong className="text-gray-900">誠實申報：</strong>嚴禁虛報工作內容。經查屬實者，計重大違規 1 點，並視情節記過或立即開除。</p>
            <p className={styles.body}><strong className="text-gray-900">保密義務：</strong>對公司業務、客戶資料及技術負有絕對保密義務，未經授權不得對外揭露。</p>
            <p className={styles.body}><strong className="text-gray-900">形象維護：</strong>應維護公司信譽，不得從事任何損害公司名譽或利益之行為。</p>
          </div>
        </section>

        {/* Chapter 2 */}
        <section>
          <div className={styles.chapterHeader}>
            <span className={styles.chapterNum}>02</span>
            <h2 className={styles.h2}>試用期制度與考核規範</h2>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <p className={styles.body}>
              <strong className="text-gray-900 font-bold">試用時程：</strong>試用期為期 三個月（90 天）。
            </p>

            <div>
              <strong className={`text-gray-900 font-bold block mb-2 ${styles.body}`}>薪資與休假：</strong>
              <ul className={`list-disc pl-5 space-y-2 marker:text-gray-400 ${styles.body}`}>
                <li>
                  <span className="font-bold text-gray-900">試用薪資：</span>
                  月薪新台幣 <span className="bg-orange-100 text-orange-700 font-bold px-1 rounded">38,000 元</span>。
                </li>
                <li>
                  <span className="font-bold text-gray-900">休假制度：</span>
                  月休 7 日，由公司排班，到職前 7 日內不得請假。
                </li>
                <li>
                  <span className="font-bold text-gray-900">分紅限制：</span>
                  試用期間人員 <span className="text-red-600 font-bold">不享有</span> 任何獎金、分紅、抽成與介紹人獎金。
                </li>
              </ul>
            </div>

            <p className={styles.body}>
              <strong className="text-gray-900 font-bold">考核重點：</strong>
              第 1-30 天（生存期）、第 31-60 天（磨合期）、第 61-90 天（產值期），具體依
              <a href="/assessment-form" target="_blank" className="text-blue-600 hover:underline mx-1 font-medium">《試用期考核評分表》</a>
              執行。
            </p>

            <p className={styles.body}>
              <strong className="text-gray-900 font-bold">不適任淘汰：</strong>
              到職一週內經評估不適任者，由公司終止關係，發給每日 <span className="font-bold">500 元</span> 車馬費補貼。
            </p>
          </div>
        </section>

        {/* Chapter 3 */}
        <section>
          <div className={styles.chapterHeader}>
            <span className={styles.chapterNum}>03</span>
            <h2 className={styles.h2}>正式人員薪資結構</h2>
          </div>
          <ul className={`list-disc pl-6 space-y-3 marker:text-blue-500 ${styles.body}`}>
            <li><strong className="text-gray-900">正式薪資：</strong>轉正後底薪調升至 40,000 元，另設全勤獎金 5,000 元。</li>
            <li><strong className="text-gray-900">全勤標準：</strong>當月無遲到、早退、曠職紀錄者方可支領。</li>
            <li><strong className="text-gray-900">晉升制度：</strong>表現優異者可晉升管理職享有津貼，基礎底薪不隨年資自動調整，以保障獎金池淨利。</li>
            <li><strong className="text-gray-900">休假制度：</strong>正式人員月休 8 日。</li>
          </ul>
        </section>

        {/* Chapter 4 */}
        <section>
          <div className={styles.chapterHeader}>
            <span className={styles.chapterNum}>04</span>
            <h2 className={styles.h2}>
              LEGO999 績效分紅制度 
              <span className="text-base font-normal text-gray-500 ml-2">(70/30 滾動發放)</span>
            </h2>
          </div>
          
          <div className="space-y-6">
            <p className={styles.body}>正式人員之分紅獎金統一於 <strong className="text-blue-600">次月 10 號</strong> 發放。</p>

            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
              <h3 className={`${styles.h3} text-blue-900 mb-3`}>1. 最終淨利計算公式</h3>
              <div className="bg-white p-4 rounded-lg border border-blue-200 font-mono text-sm text-gray-700 shadow-sm overflow-x-auto">
                最終淨利 = ((總輸贏(咬度) - 金流費用 - 活動優惠成本) x 40%) - 固定營運成本 - 上月累計負值
              </div>
              <p className="text-sm text-blue-600 mt-2">* 固定成本包含房租、水電、全體薪資、硬體維護、辦公雜支等。</p>
            </div>

            <BonusCalculator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className={`${styles.h3} mb-3 border-b pb-2`}>2. 階梯分紅比例與個人分配方式</h3>
                <p className={`${styles.body} text-sm mb-3`}>
                  公司每月結算出「獎金池總額」後，根據「個人咬度貢獻佔比」進行精確發放。
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className={`${styles.h3} text-blue-900 text-sm mb-2`}>A. 獎金池提撥比例 (階梯制)</h4>
                    <ul className="space-y-2 text-gray-700 text-sm">
                      <li className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                        <span>淨利 0 ~ 20 萬</span>
                        <span className="font-bold text-blue-600">提撥 20%</span>
                      </li>
                      <li className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                        <span>淨利 21 ~ 50 萬</span>
                        <span className="font-bold text-blue-600">提撥 35%</span>
                      </li>
                      <li className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                        <span>淨利 51 萬以上</span>
                        <span className="font-bold text-blue-600">提撥 50%</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className={`${styles.h3} text-blue-900 text-sm mb-2`}>B. 個人獎金分配公式</h4>
                    <div className="bg-gray-50 p-3 rounded border border-gray-100 space-y-2">
                      <p className="font-bold text-gray-800 text-sm">個人獎金 = 獎金池總額 × (個人咬度 ÷ 團隊咬度)</p>
                      <div className="text-xs text-gray-500 space-y-1 pl-2 border-l-2 border-gray-300">
                        <p>個人咬度：個人當月咬度淨利 (總輸贏 - 金流 - 營銷) × 40%。</p>
                        <p>團隊咬度：全體正式員工「個人咬度」之加總。</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className={`${styles.h3} mb-3 border-b pb-2`}>3. 合夥人分紅池與滾動提撥制度規則</h3>
                <div className="space-y-4">
                  <div className="bg-orange-50 p-3 rounded border border-orange-100">
                    <p className="text-sm text-gray-800 mb-1"><span className="font-bold text-orange-800">前三個月 (累積期)：</span></p>
                    <p className="text-sm text-gray-600">每月僅發放該月獎金之 70%，剩餘 30% 存入個人忠誠帳戶。</p>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded border border-green-100">
                    <p className="text-sm text-gray-800 mb-1"><span className="font-bold text-green-800">第四個月 (開啟滾動)：</span></p>
                    <p className="text-sm text-gray-600">自轉正後第四個月發薪日（次月 10 號）起，開始滾動發放「三個月前之 30%」。</p>
                  </div>

                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
                    <strong>重要規則：</strong>所有獎金領取時需在職，若中途離職或因違規開除，視同自動放棄個人忠誠帳戶內所有尚未領取之遞延獎金。
                  </div>

                  <div>
                    <h4 className={`${styles.h3} text-sm mb-2`}>發放範例（以 1 月 1 日轉正為例）：</h4>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
                      <li><strong>4/10：</strong>領 3 月獎金 70% + 1 月存下的 30%。</li>
                      <li><strong>5/10：</strong>領 4 月獎金 70% + 2 月存下的 30%。</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className={`${styles.h3} text-sm mb-2`}>離職結算：</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      若員工 5/31 依規離職並完整交接，將於 6/10 領取「5 月獎金 70%」+「3月份存下的 30%。」。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Chapter 5 */}
        <section>
          <div className={styles.chapterHeader}>
            <span className={styles.chapterNum}>05</span>
            <h2 className={styles.h2}>人才引薦獎勵計畫（介紹人獎金）</h2>
          </div>
          
          <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100">
            <p className={`${styles.body} mb-6 text-lg`}>
              為鼓勵同仁為團隊引進優秀戰友，特設立人才引薦獎勵金，發放原則如下：
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex flex-col sm:flex-row gap-2">
                <span className="font-bold text-gray-900 min-w-24">獎勵總額：</span>
                <span className="text-gray-800">
                  每成功引薦一名新人，介紹人可獲得總額 <span className="text-pink-500 font-bold">12,000 元</span> 之獎金。
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <span className="font-bold text-gray-900 min-w-24">發放方式：</span>
                <span className="text-gray-800">
                  為確保團隊穩定，獎金採分期制，於被介紹人轉正後分三個月發放，每期 <span className="font-bold text-gray-900">4,000 元</span>。
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <span className="font-bold text-gray-900 min-w-24">發放條件：</span>
                <span className="text-gray-800">
                  領取時介紹人需在職，且被介紹人須已「正式轉正」並持續穩定任職。
                </span>
              </div>
            </div>

            <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100 max-w-2xl">
              <h4 className={`text-base font-bold text-blue-600 mb-3 leading-normal`}>
                發放時程詳細範例（若被介紹人於 1/1 正式轉正）：
              </h4>
              
              <div className="space-y-3 mb-4 text-sm">
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center text-gray-800">
                  <span className="font-bold text-blue-600 w-16">第一期</span>
                  <span className="font-bold text-gray-900">（4,000 元）</span>
                  <span>：被介紹人做滿 1 月份 → 介紹人於 2/10 領取。</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center text-gray-800">
                  <span className="font-bold text-blue-600 w-16">第二期</span>
                  <span className="font-bold text-gray-900">（4,000 元）</span>
                  <span>：被介紹人做滿 2 月份 → 介紹人於 3/10 領取。</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center text-gray-800">
                  <span className="font-bold text-blue-600 w-16">第三期</span>
                  <span className="font-bold text-gray-900">（4,000 元）</span>
                  <span>：被介紹人做滿 3 月份 → 介紹人於 4/10 領取。</span>
                </div>
              </div>

              <div className="pt-2 border-t border-blue-200/50">
                <h5 className="font-bold text-blue-600 mb-1 text-xs">終止發放條款：</h5>
                <ul className="list-none space-y-1 text-gray-600 text-xs">
                  <li>若被介紹人於領取期間內離職，則自離職當月起，公司即停止發放剩餘之介紹獎金。</li>
                  <li>若介紹人先於公司離職，則尚未領取之介紹獎金視同放棄。</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Chapter 6 */}
        <section>
          <div className={styles.chapterHeader}>
            <span className={styles.chapterNum}>06</span>
            <h2 className={`${styles.h2} text-red-600 flex items-center gap-2`}>
              <AlertTriangle className="w-6 h-6" />
              職場行為紅線
            </h2>
          </div>
          <div className="border-2 border-red-100 rounded-xl p-6 bg-red-50/50">
             <p className="text-center text-red-800 font-bold mb-6">⚠️ 違反以下事項將立即開除並沒收獎金</p>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-red-600">
                    <Scale size={20} />
                  </div>
                  <h3 className={styles.h3}>重大違規</h3>
                  <p className="text-sm text-gray-600 mt-2">與玩家合謀套利、洗碼，或利用技術手段損害公司利益者。</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-red-600">
                    <Shield size={20} />
                  </div>
                  <h3 className={styles.h3}>洩密</h3>
                  <p className="text-sm text-gray-600 mt-2">私自備份、外流公司客戶資訊、金流管道及營運細節者。</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-red-600">
                    <DollarSign size={20} />
                  </div>
                  <h3 className={styles.h3}>利益輸送</h3>
                  <p className="text-sm text-gray-600 mt-2">與客戶有私下金錢往來、資金借貸或利益輸送者。</p>
                </div>
             </div>
          </div>
        </section>

      </div>

      <div className="mt-16 pt-8 border-t border-gray-200 text-center text-gray-400 text-sm">
        <p>本規章為公司內部重要文件，請務必詳閱並遵守。</p>
        <p>最後修訂日期：{new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}
