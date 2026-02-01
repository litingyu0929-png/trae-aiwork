import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Save, Check, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui';

interface RssFeed {
  id: string;
  name: string;
  url: string;
  category: string;
  is_active: boolean;
  last_fetched_at: string | null;
}

interface RssManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RssManagerModal: React.FC<RssManagerModalProps> = ({ isOpen, onClose }) => {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // New Feed State
  const [newFeed, setNewFeed] = useState({ name: '', url: '', category: 'news' });
  const [isAdding, setIsAdding] = useState(false);

  // Edit State
  const [editForm, setEditForm] = useState<Partial<RssFeed>>({});

  useEffect(() => {
    if (isOpen) {
      loadFeeds();
    }
  }, [isOpen]);

  const loadFeeds = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crawler/status');
      const data = await res.json();
      setFeeds(data.feeds || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newFeed.name || !newFeed.url) return alert('請填寫名稱與網址');
    try {
      const res = await fetch('/api/crawler/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFeed)
      });
      if (res.ok) {
        setNewFeed({ name: '', url: '', category: 'news' });
        setIsAdding(false);
        loadFeeds();
      } else {
        const data = await res.json();
        alert('新增失敗: ' + (data.error || '未知錯誤'));
      }
    } catch (error) {
      alert('發生錯誤');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('確定要刪除此訂閱源嗎？')) return;
    try {
      const res = await fetch(`/api/crawler/feeds/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setFeeds(feeds.filter(f => f.id !== id));
      } else {
        alert('刪除失敗');
      }
    } catch (error) {
      alert('發生錯誤');
    }
  };

  const startEditing = (feed: RssFeed) => {
    setEditingId(feed.id);
    setEditForm({ ...feed });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEditing = async () => {
    if (!editingId) return;
    try {
      const res = await fetch(`/api/crawler/feeds/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setEditingId(null);
        loadFeeds();
      } else {
        alert('更新失敗');
      }
    } catch (error) {
      alert('發生錯誤');
    }
  };

  const toggleActive = async (feed: RssFeed) => {
    try {
      const res = await fetch(`/api/crawler/feeds/${feed.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !feed.is_active })
      });
      if (res.ok) {
        loadFeeds();
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">RSS 訂閱源管理</h2>
            <p className="text-sm text-gray-500">管理您的新聞與內容來源</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add New Section */}
          {!isAdding ? (
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 mb-6"
            >
              <Plus className="w-5 h-5" /> 新增訂閱源
            </button>
          ) : (
            <div className="bg-indigo-50 p-4 rounded-lg mb-6 border border-indigo-100 animate-in fade-in slide-in-from-top-2">
              <h3 className="text-sm font-bold text-indigo-900 mb-3">新增訂閱源</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <input 
                  placeholder="名稱 (例如: NBA News)" 
                  className="px-3 py-2 rounded border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newFeed.name}
                  onChange={e => setNewFeed({...newFeed, name: e.target.value})}
                />
                <input 
                  placeholder="RSS URL" 
                  className="px-3 py-2 rounded border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none md:col-span-2"
                  value={newFeed.url}
                  onChange={e => setNewFeed({...newFeed, url: e.target.value})}
                />
                <select 
                  className="px-3 py-2 rounded border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newFeed.category}
                  onChange={e => setNewFeed({...newFeed, category: e.target.value})}
                >
                  <option value="news">新聞</option>
                  <option value="nba">NBA</option>
                  <option value="mlb">MLB</option>
                  <option value="tech">科技</option>
                  <option value="finance">財經</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded">取消</button>
                <button onClick={handleAdd} className="px-3 py-1.5 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded shadow-sm">確認新增</button>
              </div>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="text-center py-10 text-gray-400">載入中...</div>
          ) : (
            <div className="space-y-3">
              {feeds.map(feed => (
                <div key={feed.id} className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-lg border transition-all ${feed.is_active ? 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-sm' : 'bg-gray-50 border-gray-100 opacity-70'}`}>
                  
                  {editingId === feed.id ? (
                    // Edit Mode
                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-3 mr-4">
                      <input 
                        className="px-3 py-2 border rounded text-sm" 
                        value={editForm.name} 
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                      />
                      <input 
                        className="px-3 py-2 border rounded text-sm md:col-span-2" 
                        value={editForm.url} 
                        onChange={e => setEditForm({...editForm, url: e.target.value})}
                      />
                      <div className="flex items-center gap-2 md:col-span-3 mt-2">
                        <select 
                          className="px-3 py-2 border rounded text-sm w-32"
                          value={editForm.category}
                          onChange={e => setEditForm({...editForm, category: e.target.value})}
                        >
                           <option value="news">新聞</option>
                           <option value="nba">NBA</option>
                           <option value="mlb">MLB</option>
                           <option value="tech">科技</option>
                           <option value="finance">財經</option>
                        </select>
                        <div className="flex-1"></div>
                        <button onClick={saveEditing} className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200"><Check size={16} /></button>
                        <button onClick={cancelEditing} className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"><X size={16} /></button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 truncate">{feed.name}</h3>
                          <Badge variant={feed.is_active ? 'green' : 'gray'} className="text-[10px] px-1.5 py-0.5">
                            {feed.is_active ? '啟用' : '停用'}
                          </Badge>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{feed.category}</span>
                        </div>
                        <p className="text-xs text-gray-400 truncate font-mono">{feed.url}</p>
                        <div className="text-[10px] text-gray-400 mt-1">
                          上次抓取: {feed.last_fetched_at ? new Date(feed.last_fetched_at).toLocaleString() : '尚未抓取'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3 md:mt-0 w-full md:w-auto justify-end">
                         <button 
                          onClick={() => toggleActive(feed)}
                          className={`p-2 rounded-lg transition-colors ${feed.is_active ? 'text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                          title={feed.is_active ? "停用" : "啟用"}
                        >
                          <RotateCcw size={16} className={feed.is_active ? "rotate-0" : "-rotate-180"} />
                        </button>
                        <button 
                          onClick={() => startEditing(feed)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          title="編輯"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(feed.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          title="刪除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              
              {feeds.length === 0 && (
                <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                  目前沒有訂閱源，請點擊上方按鈕新增。
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
