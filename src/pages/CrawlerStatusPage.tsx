import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@/components/ui';

export default function CrawlerStatusPage() {
  const [feeds, setFeeds] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await fetch('/api/crawler/status');
      const data = await res.json();
      setFeeds(data.feeds || []);
      setLogs(data.recent_logs || []);
    } catch (error) {
      console.error('載入失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCrawler = async () => {
    setCrawling(true);
    try {
      const res = await fetch('/api/crawler/run', { method: 'POST' });
      const result = await res.json();
      if (result.ok) {
        alert('爬蟲執行完成！');
        loadStatus();
      } else {
        alert('執行失敗: ' + result.error);
      }
    } catch (error) {
      alert('執行失敗');
    } finally {
      setCrawling(false);
    }
  };

  if (loading) return <div className="p-8 text-center">載入中...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🕷️ 爬蟲系統監控</h1>
        <Button 
          onClick={handleRunCrawler} 
          disabled={crawling}
          className={crawling ? 'opacity-50' : ''}
        >
          {crawling ? '執行中...' : '▶ 立即執行爬蟲'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側：訂閱源狀態 */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">RSS 訂閱源 ({feeds.length})</h2>
          <div className="space-y-4">
            {feeds.map(feed => (
              <div key={feed.id} className="border-b pb-4 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-lg">{feed.name}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{feed.url}</div>
                  </div>
                  <Badge variant={feed.is_active ? 'green' : 'gray'}>
                    {feed.is_active ? '啟用中' : '已停用'}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  分類: <span className="font-medium bg-gray-100 px-2 py-0.5 rounded">{feed.category}</span>
                  <span className="ml-4">
                    上次更新: {feed.last_fetched_at ? new Date(feed.last_fetched_at).toLocaleString() : '尚未執行'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 右側：執行日誌 */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">執行日誌 (最近 20 筆)</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {logs.map(log => (
              <div key={log.id} className="p-3 bg-gray-50 rounded border border-gray-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm">
                    {log.rss_feeds?.name || 'Unknown Feed'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <Badge variant={log.status === 'success' ? 'green' : 'red'}>
                    {log.status === 'success' ? '成功' : '失敗'}
                  </Badge>
                  {log.status === 'success' ? (
                    <span className="text-sm text-green-700">
                      新增 {log.items_fetched} 筆
                    </span>
                  ) : (
                    <span className="text-sm text-red-600 truncate max-w-[200px]" title={log.error_message}>
                      {log.error_message}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-center text-gray-400 py-8">暫無日誌</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
