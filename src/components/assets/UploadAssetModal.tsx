import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ASSET_CATEGORIES } from '../../lib/constants';
import { Asset } from '../../types';

interface UploadAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (asset?: Asset) => void;
}

export const UploadAssetModal: React.FC<UploadAssetModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'shared'>('private');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (newFiles: File[]) => {
    // Validate files
    const validFiles = newFiles.filter(file => {
      // Check type
      const isValidType = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type);
      // Check size (10MB)
      const isValidSize = file.size <= 10 * 1024 * 1024;
      
      if (!isValidType) alert(`檔案 ${file.name} 格式不支援`);
      if (!isValidSize) alert(`檔案 ${file.name} 超過 10MB`);
      
      return isValidType && isValidSize;
    });

    // Limit to 10 files total
    const totalFiles = [...files, ...validFiles].slice(0, 10);
    setFiles(totalFiles);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0) return alert('請選擇檔案');
    if (!category) return alert('請選擇分類');

    setIsUploading(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('visibility', visibility);
    // formData.append('owner_id', 'current-user-id'); // Handled by backend or auth context

    try {
      const res = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        alert(`成功上傳 ${data.count} 個素材！`);
        // Pass the first uploaded asset to the callback
        onSuccess(data.assets && data.assets.length > 0 ? data.assets[0] : undefined);
        // Reset form
        setFiles([]);
        setTitle('');
        setDescription('');
        setCategory('');
        setVisibility('private');
      } else {
        alert('上傳失敗: ' + data.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('上傳發生錯誤');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            上傳圖片素材
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Drag & Drop Area */}
          <div 
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
              files.length > 0 ? "bg-gray-50" : ""
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple 
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
            />
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="font-medium text-gray-900">
                拖曳圖片到這裡 或 <span className="text-blue-600">點擊選擇檔案</span>
              </p>
              <p className="text-xs text-gray-500">
                支援 JPG, PNG, WebP, GIF | 最大 10MB | 最多 10 張
              </p>
            </div>
          </div>

          {/* File Previews */}
          {files.length > 0 && (
            <div className="grid grid-cols-5 gap-3">
              {files.map((file, idx) => (
                <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt="preview" 
                    className="w-full h-full object-cover"
                  />
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <div className="col-span-full text-right text-xs text-gray-500">
                已選擇 {files.length} 張圖片
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">標題 (選填)</label>
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="例如：內湖夕陽"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述 (選填)</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="輸入圖片描述..."
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分類 <span className="text-red-500">*</span></label>
                <select 
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">請選擇分類</option>
                  {ASSET_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">可見性 <span className="text-red-500">*</span></label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="visibility" 
                      value="private" 
                      checked={visibility === 'private'}
                      onChange={() => setVisibility('private')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">🔒 僅自己可見</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="visibility" 
                      value="shared" 
                      checked={visibility === 'shared'}
                      onChange={() => setVisibility('shared')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">👥 團隊共享</span>
                  </label>
                </div>
              </div>
            </div>

            {visibility === 'shared' && (
              <div className="bg-yellow-50 text-yellow-800 text-sm p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-none" />
                ⚠️ 設為共享後，所有員工都能搜尋並使用此素材。
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleSubmit}
            disabled={files.length === 0 || !category || isUploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                上傳中...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                上傳 ({files.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
