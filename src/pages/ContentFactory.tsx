
import React, { useState, useEffect } from 'react';
import { 
  Wand2, 
  RefreshCw, 
  Upload, 
  X, 
  LayoutGrid, 
  Trash2,
  Image as ImageIcon,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  FileText,
  Copy,
  Save // Added Save icon
} from 'lucide-react';
import { Textarea } from '../components/ui/Textarea';
import { Asset, WorkTask } from '../types';
import { supabase } from '../lib/supabase';
import { UploadAssetModal } from '../components/assets/UploadAssetModal';
import { AssetPickerModal } from '../components/assets/AssetPickerModal';
import { SaveToTaskModal } from '../components/content/SaveToTaskModal'; 
import { FolderOpen } from 'lucide-react';
import { useRole } from '../contexts/RoleContext';
import { useAuth } from '../contexts/AuthContext';

export const ContentFactory: React.FC = () => {
  const { currentRole, simulatedStaffId } = useRole();
  const { profile: authProfile } = useAuth();
  
  // --- State ---
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [contentInput, setContentInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  // Fetch personas/accounts logic updated
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        let currentStaffId = null;

        if (currentRole === 'admin' || currentRole === 'team_leader') {
             // Admin sees ALL accounts/personas OR based on simulatedStaffId if set (simulating user)
             if (simulatedStaffId) {
                 currentStaffId = simulatedStaffId;
             }
        } else {
             // Regular staff sees ONLY their assigned personas
             currentStaffId = simulatedStaffId || authProfile?.id;
        }

        let query = supabase.from('personas').select('*');

        // If we have a target staff ID, filter personas assigned to this staff
        if (currentStaffId && currentRole !== 'admin') {
             // First get assigned persona IDs from staff_persona_assignments
             const { data: assignments } = await supabase
                 .from('staff_persona_assignments' as any) // Type casting to avoid strict type check if table missing in types
                 .select('persona_id')
                 .eq('staff_id', currentStaffId);
             
             if (assignments && assignments.length > 0) {
                 const personaIds = assignments.map((a: any) => a.persona_id);
                 query = query.in('id', personaIds);
             } else {
                 // Staff has no assignments
                 setAccounts([]);
                 setSelectedAccountId('');
                 return;
             }
        }

        const { data: personas, error } = await query;
        
        if (!error && personas) {
          // Map DB personas to account structure
          const dbAccounts = personas.map((p, index) => ({
            id: `acc_${p.id.substring(0, 8)}`,
            name: p.name,
            persona_id: p.id,
            description: p.description
          }));
          
          if (dbAccounts.length > 0) {
            setAccounts(dbAccounts);
            // If current selected ID is not in new list, select the first one
             setSelectedAccountId(prev => {
                const exists = dbAccounts.find(a => a.id === prev);
                return exists ? prev : dbAccounts[0].id;
             });
          } else {
             setAccounts([]);
             setSelectedAccountId('');
          }
        }
      } catch (err) {
        console.error('Failed to fetch personas for factory:', err);
      }
    };
    
    fetchAccounts();
  }, [currentRole, simulatedStaffId, authProfile]);

  
  // Editable State
  const [threadsContent, setThreadsContent] = useState('');
  const [instagramContent, setInstagramContent] = useState('');
  const [originalThreadsContent, setOriginalThreadsContent] = useState('');
  const [originalInstagramContent, setOriginalInstagramContent] = useState('');

  // Asset Feed State
  const [showAssetSection, setShowAssetSection] = useState(false);
  const [uploadedAssets, setUploadedAssets] = useState<Asset[]>([]);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);

  // Save Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [contentToSave, setContentToSave] = useState<{ text: string, originalText: string, platform: string } | null>(null);

  // --- Handlers ---
  
  // ... existing handlers ...

  const handleGenerate = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    if (!contentInput.trim() && uploadedAssets.length === 0) {
      alert('請輸入內容或上傳素材！');
      return;
    }

    if (!selectedAccountId) {
      alert('請先選擇一個發文帳號！');
      return;
    }

    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      // Mock API call or Real API call
      // Constructing the payload
      const account = accounts.find(a => a.id === selectedAccountId);
      
      const payload = {
        account_name: account?.name,
        idea_input: contentInput,
        assets: uploadedAssets.map(a => a.id),
        platform: 'all'
      };

      console.log('Generating with payload:', payload);

      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Mapping to backend expected fields
          persona_id: account?.persona_id, // Pass ID for DB lookup
          persona: { name: account?.name }, // Minimal info for fallback
          assetDescription: contentInput, // Using input as description
          idea_input: contentInput, // Also pass as idea_input for better semantic
          assets: uploadedAssets.map(a => a.id), // Pass asset IDs
          platform: 'all'
        })
      });

      const data = await response.json();
      console.log('API Response:', data); // Debug Log

      if (data.success) {
        setGeneratedContent(data.data);
        const tContent = typeof data.data.threads === 'string' ? data.data.threads : (data.data.threads?.content || data.data.threads?.text || '');
        const iContent = typeof data.data.instagram === 'string' ? data.data.instagram : (data.data.instagram?.caption || data.data.instagram?.content || data.data.instagram?.text || '');
        setThreadsContent(tContent);
        setInstagramContent(iContent);
        setOriginalThreadsContent(tContent);
        setOriginalInstagramContent(iContent);
      } else {
        alert('生成失敗: ' + (data.error || '未知錯誤'));
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('生成發生錯誤，請檢查伺服器連線');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleOpenSaveModal = (text: string, originalText: string, platform: string) => {
    setContentToSave({ text, originalText, platform });
    setIsSaveModalOpen(true);
  };

  // ... rest of the component


  const handleClearContent = () => {
    if (window.confirm('確定要清除所有內容嗎？')) {
      setContentInput('');
    }
  };

  const handleRemoveAsset = (assetId: string) => {
    setUploadedAssets(prev => prev.filter(a => a.id !== assetId));
  };


  return (
    <div className="max-w-7xl mx-auto px-4 py-6 min-h-screen bg-gray-50">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <LayoutGrid className="w-7 h-7 text-indigo-600" />
          內容工廠 (Content Factory)
        </h1>
        <p className="text-gray-500 mt-1">
          選擇帳號，輸入靈感，一鍵生成高品質貼文
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input Area (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* 1. Account Selector */}
          <section className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm">1</span>
              選擇發文帳號
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {accounts.map((acc) => (
                <label 
                  key={acc.id}
                  className={`
                    cursor-pointer relative flex items-center justify-center p-2 rounded-lg border-2 transition-all text-sm font-medium
                    ${selectedAccountId === acc.id 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                      : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300'
                    }
                  `}
                  onClick={(e) => e.stopPropagation()} 
                >
                  <input 
                    type="radio" 
                    name="account" 
                    value={acc.id}
                    checked={selectedAccountId === acc.id}
                    onChange={() => setSelectedAccountId(acc.id)}
                    className="sr-only"
                  />
                  {acc.name}
                  {selectedAccountId === acc.id && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-indigo-600 rounded-full"></div>
                  )}
                </label>
              ))}
              {accounts.length === 0 && (
                <div className="col-span-full text-center py-4 text-gray-400 text-sm">
                  尚未建立任何發文人設，請先至人設管理中心新增。
                </div>
              )}
            </div>
          </section>

          {/* 2. Content Input */}
          <section className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex-1 flex flex-col min-h-[250px]">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm">2</span>
                內容輸入
              </h2>
              <button 
                type="button"
                onClick={handleClearContent}
                className="text-gray-400 hover:text-red-500 text-sm flex items-center gap-1 transition-colors"
                title="清除內容"
              >
                <Trash2 size={14} /> 清除
              </button>
            </div>
            
            <div className="relative flex-1">
              <Textarea
                value={contentInput}
                onChange={(e: any) => setContentInput(e.target.value)}
                placeholder="在這裡輸入您的想法、靈感、或是想要改寫的原文..."
                className="w-full h-full p-4 text-base leading-relaxed border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 resize-y rounded-lg"
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded-md border border-gray-100">
                字數: {contentInput.length}
              </div>
            </div>
          </section>

          {/* 3. Asset Feed (Optional) */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button 
              type="button"
              onClick={() => setShowAssetSection(!showAssetSection)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2 font-medium text-gray-700">
                <Upload size={18} />
                <span>餵入素材 (選填)</span>
                {uploadedAssets.length > 0 && (
                  <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {uploadedAssets.length}
                  </span>
                )}
              </div>
              {showAssetSection ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            
            {showAssetSection && (
              <div className="p-5 border-t border-gray-200 animate-in slide-in-from-top-2 duration-200">
                
                {uploadedAssets.length === 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      onClick={() => setIsAssetModalOpen(true)}
                      className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition-all gap-2 text-gray-500 hover:text-indigo-600"
                    >
                      <Upload size={24} />
                      <span className="text-sm font-medium">上傳新圖片</span>
                    </div>
                    
                    <div 
                      onClick={() => setIsAssetPickerOpen(true)}
                      className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition-all gap-2 text-gray-500 hover:text-indigo-600"
                    >
                      <FolderOpen size={24} />
                      <span className="text-sm font-medium">從素材庫選擇</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                       {uploadedAssets.map((asset) => (
                         <div key={asset.id} className="relative group border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                           <div className="aspect-video bg-gray-100 relative">
                             {asset.thumbnail_url || asset.content_url ? (
                               <img src={asset.thumbnail_url || asset.content_url || ''} alt="Asset" className="w-full h-full object-cover" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-gray-400">
                                 <FileText size={24} />
                               </div>
                             )}
                             <button 
                                type="button"
                                onClick={() => handleRemoveAsset(asset.id)}
                                className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                             >
                               <X size={12} />
                             </button>
                           </div>
                           <div className="p-2">
                             <p className="text-xs font-medium text-gray-900 truncate" title={asset.title}>{asset.title || '未命名素材'}</p>
                           </div>
                         </div>
                       ))}
                       
                       {/* Add More Buttons (Mini) */}
                       <div className="flex flex-col gap-2">
                         <button 
                           type="button"
                           onClick={() => setIsAssetModalOpen(true)}
                           className="flex-1 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center hover:border-indigo-400 hover:text-indigo-600 transition-colors text-gray-400 min-h-[40px]"
                           title="上傳新圖片"
                         >
                           <Upload size={16} />
                         </button>
                         <button 
                           type="button"
                           onClick={() => setIsAssetPickerOpen(true)}
                           className="flex-1 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center hover:border-indigo-400 hover:text-indigo-600 transition-colors text-gray-400 min-h-[40px]"
                           title="從素材庫選擇"
                         >
                           <FolderOpen size={16} />
                         </button>
                       </div>
                     </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* 4. Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || (!contentInput.trim() && uploadedAssets.length === 0) || accounts.length === 0}
            className={`
              w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-center gap-2
              ${isGenerating 
                ? 'bg-indigo-100 text-indigo-400 cursor-wait' 
                : ((!contentInput.trim() && uploadedAssets.length === 0) || accounts.length === 0)
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/30'
              }
            `}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="animate-spin" />
                <span>AI 正在生成內容...</span>
              </>
            ) : (
              <>
                <Wand2 />
                <span>立即生成</span>
              </>
            )}
          </button>

        </div>

        {/* Right Column: Preview Area (5 cols) */}
        <div className="lg:col-span-5 flex flex-col min-h-[500px]">
           <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
             <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
               <h3 className="font-bold text-gray-900 flex items-center gap-2">
                 <Wand2 size={16} className="text-indigo-600" />
                 生成結果預覽
               </h3>
               {generatedContent && (
                 <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                   完成
                 </span>
               )}
             </div>
             
             <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50">
               {!generatedContent ? (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400">
                   {isGenerating ? (
                     <div className="text-center">
                       <RefreshCw size={32} className="animate-spin text-indigo-400 mx-auto mb-3" />
                       <p>正在施展魔法...</p>
                     </div>
                   ) : (
                     <div className="text-center">
                       <LayoutGrid size={32} className="mx-auto mb-3 opacity-20" />
                       <p className="text-sm">尚未生成任何內容</p>
                     </div>
                   )}
                 </div>
               ) : (
                 <div className="space-y-6">
                    {/* Threads Result */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-900 bg-black text-white px-2 py-0.5 rounded">Threads</span>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => { navigator.clipboard.writeText(threadsContent); alert('已複製'); }}
                            className="text-gray-400 hover:text-indigo-600"
                            title="複製"
                          >
                            <Copy size={14} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleOpenSaveModal(threadsContent, originalThreadsContent, 'threads')}
                            className="text-gray-400 hover:text-green-600"
                            title="儲存到任務"
                          >
                            <Save size={14} />
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={threadsContent}
                        onChange={(e) => setThreadsContent(e.target.value)}
                        className="w-full min-h-[100px] text-sm text-gray-800 leading-relaxed border-none focus:ring-0 resize-y bg-transparent"
                      />
                    </div>

                    {/* Instagram Result */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-xs font-bold text-white bg-gradient-to-tr from-yellow-400 to-purple-600 px-2 py-0.5 rounded">Instagram</span>
                         <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => { navigator.clipboard.writeText(instagramContent); alert('已複製'); }}
                            className="text-gray-400 hover:text-indigo-600"
                            title="複製"
                          >
                            <Copy size={14} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleOpenSaveModal(instagramContent, originalInstagramContent, 'instagram')}
                            className="text-gray-400 hover:text-green-600"
                            title="儲存到任務"
                          >
                            <Save size={14} />
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={instagramContent}
                        onChange={(e) => setInstagramContent(e.target.value)}
                        className="w-full min-h-[100px] text-sm text-gray-800 leading-relaxed border-none focus:ring-0 resize-y bg-transparent"
                      />
                    </div>
                    {/* Meta Info (Developer Mode) */}
                    {generatedContent._meta && (
                      <div className="bg-gray-100 p-3 rounded-lg border border-gray-200 text-xs font-mono text-gray-600 mt-4">
                        <details>
                          <summary className="cursor-pointer font-bold hover:text-indigo-600 select-none">
                             🛠️ Developer Info (Persona Logic)
                          </summary>
                          <div className="mt-2 space-y-1 pl-2 border-l-2 border-indigo-200">
                             <div><span className="text-gray-400">Persona:</span> <span className="text-indigo-600 font-bold">{generatedContent._meta.persona}</span></div>
                             <div><span className="text-gray-400">Detected Domain:</span> <span className="text-indigo-600 font-bold">{generatedContent._meta.detected_domain}</span></div>
                             <div><span className="text-gray-400">Detected State:</span> <span className="text-indigo-600 font-bold">{generatedContent._meta.detected_state}</span></div>
                             <div><span className="text-gray-400">Domain Matches:</span> {JSON.stringify(generatedContent._meta.matched_terms)}</div>
                             <div><span className="text-gray-400">Risk Flags:</span> {JSON.stringify(generatedContent._meta.risk_flags)}</div>
                             <div><span className="text-gray-400">Asset Info:</span> {JSON.stringify(generatedContent._meta.asset_info)}</div>
                          </div>
                        </details>
                      </div>
                    )}
                 </div>
               )}
             </div>
           </div>
        </div>
      </div>

      {/* Asset Upload Modal */}
      <UploadAssetModal 
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        onSuccess={(asset) => {
          if (asset) {
            setUploadedAssets(prev => [asset, ...prev]);
            setIsAssetModalOpen(false);
            if (!showAssetSection) setShowAssetSection(true); // Auto expand to show result
          }
        }}
      />

      {/* Asset Picker Modal */}
      <AssetPickerModal
        isOpen={isAssetPickerOpen}
        onClose={() => setIsAssetPickerOpen(false)}
        selectedAssets={uploadedAssets}
        onSelect={(assets) => {
          setUploadedAssets(assets);
          setIsAssetPickerOpen(false);
          if (!showAssetSection && assets.length > 0) setShowAssetSection(true);
        }}
      />

      {/* Save Modal */}
      {contentToSave && (
        <SaveToTaskModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          content={contentToSave.text}
          originalContent={contentToSave.originalText}
          platform={contentToSave.platform}
          accountId={selectedAccountId}
          personaId={accounts.find(a => a.id === selectedAccountId)?.persona_id || ''}
        />
      )}

    </div>
  );
};
