import React from 'react';
import { Printer } from 'lucide-react';

export default function AssessmentForm() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white">
      {/* Print Button - Hidden when printing */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-end print:hidden">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition-colors"
        >
          <Printer size={20} />
          列印考核表
        </button>
      </div>

      {/* A4 Paper Container */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none print:w-full p-8 md:p-12 min-h-[297mm]">
        
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 tracking-wide">【LEGO999 營運團隊】試用期轉正考核評分表</h1>
        </div>

        {/* Basic Info */}
        <div className="mb-8 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div className="col-span-2">
            <span className="font-bold text-gray-900">考核期間：</span>
            <span className="ml-2">西元 2026 年 <input type="text" className="w-12 border-b border-gray-400 text-center outline-none" /> 月 <input type="text" className="w-12 border-b border-gray-400 text-center outline-none" /> 日 至 <input type="text" className="w-12 border-b border-gray-400 text-center outline-none" /> 月 <input type="text" className="w-12 border-b border-gray-400 text-center outline-none" /> 日</span>
          </div>
          <div>
            <span className="font-bold text-gray-900">受評人員：</span>
            <input type="text" className="ml-2 w-48 border-b border-gray-400 outline-none" />
          </div>
          <div>
            <span className="font-bold text-gray-900">入職日期：</span>
            <input type="text" className="ml-2 w-48 border-b border-gray-400 outline-none" />
          </div>
          <div>
            <span className="font-bold text-gray-900">考核日期：</span>
            <input type="text" className="ml-2 w-48 border-b border-gray-400 outline-none" />
          </div>
        </div>

        {/* Section 1 */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-2">一、 核心紀律考核 (佔 30%)</h2>
          <div className="bg-red-50 border border-red-200 p-2 mb-3 text-xs text-red-700 print:border-gray-300 print:bg-transparent print:text-gray-600">
            ⚠️ 此項目為基礎門檻，若有重大違規行為，本項得直接予以 0 分並淘汰。
          </div>
          <table className="w-full border-collapse border border-gray-400 text-sm">
            <thead>
              <tr className="bg-gray-100 print:bg-gray-50">
                <th className="border border-gray-400 p-2 w-1/4 text-left">考核項目</th>
                <th className="border border-gray-400 p-2 w-1/2 text-left">評分指標</th>
                <th className="border border-gray-400 p-2 w-16 text-center">權重</th>
                <th className="border border-gray-400 p-2 w-16 text-center">得分</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-400 p-2 font-bold">出勤表現</td>
                <td className="border border-gray-400 p-2">無遲到、早退、曠職紀錄，且到職前 7 日無請假。</td>
                <td className="border border-gray-400 p-2 text-center">10</td>
                <td className="border border-gray-400 p-2"></td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-bold">工作專注度</td>
                <td className="border border-gray-400 p-2">上班時間嚴格執行私人手機管制，無從事非工作相關活動。</td>
                <td className="border border-gray-400 p-2 text-center">10</td>
                <td className="border border-gray-400 p-2"></td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-bold">服從與溝通</td>
                <td className="border border-gray-400 p-2">確實執行主管交辦事項，不推諉，回報進度真實無虛報。</td>
                <td className="border border-gray-400 p-2 text-center">10</td>
                <td className="border border-gray-400 p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2 */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-2">二、 專業職能考核 (佔 30%)</h2>
          <p className="text-xs text-gray-600 mb-3">目的：確保員工對遊戲規則具備權威性，並具備優良的應變與風控警覺。</p>
          <table className="w-full border-collapse border border-gray-400 text-sm">
            <thead>
              <tr className="bg-gray-100 print:bg-gray-50">
                <th className="border border-gray-400 p-2 w-1/4 text-left">考核項目</th>
                <th className="border border-gray-400 p-2 w-1/2 text-left">考核標準 (細節說明)</th>
                <th className="border border-gray-400 p-2 w-16 text-center">權重</th>
                <th className="border border-gray-400 p-2 w-16 text-center">得分</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-400 p-2 font-bold">
                  各館別規則<br/>
                  <span className="font-normal text-xs text-gray-500">遊戲規則熟練度</span>
                </td>
                <td className="border border-gray-400 p-2">熟悉百家樂（補牌/點數）、運彩（盤口/結算）、彩票邏輯、老虎機線數等，能精確解說。</td>
                <td className="border border-gray-400 p-2 text-center">10</td>
                <td className="border border-gray-400 p-2"></td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-bold">
                  優惠控管<br/>
                  <span className="font-normal text-xs text-gray-500">優惠與洗碼計算</span>
                </td>
                <td className="border border-gray-400 p-2">熟知 LEGO999 優惠資格（首儲、返水）、洗碼量（流水）要求，能準確判定是否達領取標準。</td>
                <td className="border border-gray-400 p-2 text-center">10</td>
                <td className="border border-gray-400 p-2"></td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-bold">
                  應變回報<br/>
                  <span className="font-normal text-xs text-gray-500">突發狀況處置</span>
                </td>
                <td className="border border-gray-400 p-2">遇派彩錯誤、盤口變動、優惠爭議時，能冷靜安撫客戶並第一時間回報主管，絕不私自對客戶做出承諾。</td>
                <td className="border border-gray-400 p-2 text-center">10</td>
                <td className="border border-gray-400 p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3 */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-2">三、 產值貢獻考核 (佔 40%)</h2>
          <div className="bg-yellow-50 border border-yellow-200 p-2 mb-3 text-xs text-yellow-800 print:border-gray-300 print:bg-transparent print:text-gray-600">
            💡 此為決定員工是否具備「領取高額獎金」資格的核心關鍵。
          </div>
          <table className="w-full border-collapse border border-gray-400 text-sm">
            <thead>
              <tr className="bg-gray-100 print:bg-gray-50">
                <th className="border border-gray-400 p-2 w-1/4 text-left">考核項目</th>
                <th className="border border-gray-400 p-2 w-1/2 text-left">評分指標 & 建議</th>
                <th className="border border-gray-400 p-2 w-16 text-center">權重</th>
                <th className="border border-gray-400 p-2 w-16 text-center">得分</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-400 p-2 font-bold">開發引流</td>
                <td className="border border-gray-400 p-2">每日平均有效進線客戶數及活躍投注人數達標。</td>
                <td className="border border-gray-400 p-2 text-center">10</td>
                <td className="border border-gray-400 p-2"></td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-bold">毛利貢獻度</td>
                <td className="border border-gray-400 p-2">
                  <p className="mb-2">個人名下客戶初步毛利(40%)達 11.4 萬以上 (即總業績 28.5 萬)。</p>
                  <ul className="list-disc pl-4 text-xs space-y-1 text-gray-600">
                    <li>毛利達 11.4 萬以上：30 分 (滿分)</li>
                    <li>毛利 8 萬 - 11.4 萬：20 分 (需延長試用)</li>
                    <li>毛利 8 萬以下：0-10 分 (不予轉正)</li>
                  </ul>
                </td>
                <td className="border border-gray-400 p-2 text-center">30</td>
                <td className="border border-gray-400 p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 4 */}
        <div className="mb-8 border-2 border-gray-800 p-6 rounded print:border-gray-400">
          <h2 className="text-lg font-bold text-gray-900 mb-4">四、 綜合評估與考核結果</h2>
          
          <div className="flex items-center gap-2 mb-6 text-lg">
            <span className="font-bold">總分計算：</span>
            <div className="flex items-center gap-2">
              <span className="border-b border-gray-400 w-12 text-center inline-block">&nbsp;</span>
              <span className="text-sm text-gray-500">(第一項)</span>
            </div>
            <span>+</span>
            <div className="flex items-center gap-2">
              <span className="border-b border-gray-400 w-12 text-center inline-block">&nbsp;</span>
              <span className="text-sm text-gray-500">(第二項)</span>
            </div>
            <span>+</span>
            <div className="flex items-center gap-2">
              <span className="border-b border-gray-400 w-12 text-center inline-block">&nbsp;</span>
              <span className="text-sm text-gray-500">(第三項)</span>
            </div>
            <span>=</span>
            <span className="border-b-2 border-gray-900 w-16 text-center font-bold text-xl inline-block">&nbsp;</span>
            <span className="font-bold">分</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="border border-gray-300 p-3 rounded">
              <div className="font-bold text-green-700 mb-1">80 分以上</div>
              <div className="text-gray-700">准予轉正。次月起底薪調為 40,000 + 5,000 全勤，並進入 70/30 滾動分紅池。</div>
            </div>
            <div className="border border-gray-300 p-3 rounded">
              <div className="font-bold text-yellow-700 mb-1">70 - 79 分</div>
              <div className="text-gray-700">延長試用一個月。觀察重點在於「產值提升」或「紀律改善」。</div>
            </div>
            <div className="border border-gray-300 p-3 rounded">
              <div className="font-bold text-red-700 mb-1">70 分以下</div>
              <div className="text-gray-700">評估不適任。依規結算薪資後終止合作。</div>
            </div>
          </div>
        </div>

        {/* Section 5 */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">五、 主管核定</h2>
          
          <div className="mb-6">
            <div className="font-bold mb-2">主管綜合評語：</div>
            <div className="border border-gray-400 rounded p-4 h-32 text-gray-500 text-sm">
              請註記員工之優勢與未來分工建議...
            </div>
          </div>

          <div className="mb-8">
            <div className="font-bold mb-3">考核結果核定：</div>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" />
                <span className="font-bold">准予轉正</span>
                <span className="text-gray-600 border-b border-gray-400 px-2">(轉正生效日期：2026 / ___ / ___ )</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" />
                <span className="font-bold">延長試用</span>
                <span className="text-gray-600 border-b border-gray-400 px-2">(延長至日期：2026 / ___ / ___ )</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" />
                <span className="font-bold">終止合作</span>
                <span className="text-gray-600 border-b border-gray-400 px-2">(最後工作日期：2026 / ___ / ___ )</span>
              </label>
            </div>
          </div>

          <div className="flex justify-between items-end mt-12 px-8">
            <div className="text-lg">
              <span className="font-bold mr-4">主管簽名：</span>
              <span className="border-b border-gray-900 w-48 inline-block"></span>
            </div>
            <div className="text-lg">
              <span className="font-bold mr-4">負責人核准：</span>
              <span className="border-b border-gray-900 w-48 inline-block"></span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
