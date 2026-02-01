import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search, BookOpen, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { KnowledgeBaseTable, Phrase } from '../components/knowledge/KnowledgeBaseTable';

export function KnowledgeBase() {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState<Partial<Phrase>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table'); // Default to table as requested

  const categories = [
    { value: 'arrival_status', label: '💰 領錢快感' },
    { value: 'lifestyle_link', label: '🏖️ 生活爽感' },
    { value: 'emotional_hook', label: '🎣 情緒鉤子' },
    { value: 'sales_pitch', label: '🗣️ 銷售話術' },
    { value: 'product_info', label: '📦 產品優勢' },
    { value: 'glossary', label: '📚 專有名詞' },
    { value: 'faq', label: '❓ 常見問答' },
    { value: 'other', label: '📝 其他' }
  ];

  useEffect(() => {
    fetchPhrases();
  }, []);

  const fetchPhrases = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/knowledge');
      const data = await res.json();
      if (data.success) {
        setPhrases(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch phrases', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!currentPhrase.id;
    const url = isEdit 
      ? `/api/knowledge/${currentPhrase.id}`
      : '/api/knowledge';
    
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPhrase)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchPhrases();
        setCurrentPhrase({});
      }
    } catch (error) {
      console.error('Failed to save phrase', error);
    }
  };

  const handleUpdate = async (id: string, data: Partial<Phrase>) => {
    try {
      const res = await fetch(`/api/knowledge/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        // Optimistic update
        setPhrases(phrases.map(p => p.id === id ? { ...p, ...data } : p));
      }
    } catch (error) {
      console.error('Failed to update phrase', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這條語料嗎？')) return;
    
    try {
      await fetch(`/api/knowledge/${id}`, {
        method: 'DELETE'
      });
      fetchPhrases();
    } catch (error) {
      console.error('Failed to delete phrase', error);
    }
  };

  const filteredPhrases = phrases.filter(p => {
    const matchesSearch = p.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6 flex-none">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            語料庫管理
          </h1>
          <p className="text-gray-500 mt-1">管理 AI 生成時使用的專屬語料，提升文案品質與一致性。</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button 
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="表格視圖"
            >
              <TableIcon size={18} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              title="卡片視圖"
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          <button
            onClick={() => { setCurrentPhrase({ category: 'sales_pitch' }); setIsModalOpen(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            新增語料
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex-none">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="搜尋語料內容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">所有分類</option>
            {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-500">載入中...</div>
        ) : filteredPhrases.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">尚無語料，請新增第一筆資料。</div>
        ) : viewMode === 'table' ? (
          <KnowledgeBaseTable 
            data={filteredPhrases}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onAdd={() => { setCurrentPhrase({ category: 'sales_pitch' }); setIsModalOpen(true); }}
            categories={categories}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto h-full pr-2 pb-20">
            {filteredPhrases.map(phrase => (
              <div key={phrase.id} className="bg-white p-4 rounded-xl border hover:shadow-md transition-shadow relative group h-fit">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setCurrentPhrase(phrase); setIsModalOpen(true); }}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(phrase.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium 
                    ${phrase.category === 'sales_pitch' ? 'bg-purple-100 text-purple-700' : 
                      phrase.category === 'faq' ? 'bg-orange-100 text-orange-700' : 
                      phrase.category === 'arrival_status' ? 'bg-green-100 text-green-700' :
                      phrase.category === 'lifestyle_link' ? 'bg-blue-100 text-blue-700' :
                      phrase.category === 'glossary' ? 'bg-teal-100 text-teal-700' :
                      phrase.category === 'emotional_hook' ? 'bg-pink-100 text-pink-700' :
                      'bg-gray-100 text-gray-700'}`}>
                    {categories.find(c => c.value === phrase.category)?.label || phrase.category}
                  </span>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap">{phrase.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">
              {currentPhrase.id ? '編輯語料' : '新增語料'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分類</label>
                <select
                  value={currentPhrase.category || 'sales_pitch'}
                  onChange={e => setCurrentPhrase({...currentPhrase, category: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">內容</label>
                <textarea
                  value={currentPhrase.content || ''}
                  onChange={e => setCurrentPhrase({...currentPhrase, content: e.target.value})}
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="輸入金句、產品介紹或常用語..."
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  儲存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
