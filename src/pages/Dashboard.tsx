import React from 'react';
import { Card } from '../components/ui';

export const Dashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">戰情室</h1>
        <p className="text-gray-600 mt-2">
          {new Date().toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder Cards for future metrics */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-700">總體發文量</h3>
          <p className="text-3xl font-bold mt-2 text-indigo-600">--</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-700">互動成效</h3>
          <p className="text-3xl font-bold mt-2 text-green-600">--</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-700">任務完成率</h3>
          <p className="text-3xl font-bold mt-2 text-blue-600">--</p>
        </Card>
      </div>

      <div className="mt-8 p-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
        <p className="text-gray-400 text-lg">
          此區域預留作為高階數據戰情室使用
          <br />
          <span className="text-sm">（開發中）</span>
        </p>
      </div>
    </div>
  );
};
