import React, { useState, useRef, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface TagOption {
  id: string;
  label: string;
  color: string;
}

interface TagSelectorProps {
  selectedTags: string[]; // Array of labels or IDs
  options: TagOption[];
  onChange: (newTags: string[]) => void;
  readOnly?: boolean;
}

export const TagSelector: React.FC<TagSelectorProps> = ({ selectedTags, options, onChange, readOnly = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTag = (label: string) => {
    if (selectedTags.includes(label)) {
      onChange(selectedTags.filter(t => t !== label));
    } else {
      onChange([...selectedTags, label]);
    }
  };

  const removeTag = (label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedTags.filter(t => t !== label));
  };

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Area */}
      <div 
        className={cn(
          "min-h-[36px] flex flex-wrap gap-1.5 items-center p-1.5 rounded border border-transparent hover:border-gray-300 transition-colors cursor-pointer",
          isOpen && "border-blue-500 ring-1 ring-blue-500 bg-white"
        )}
        onClick={() => !readOnly && setIsOpen(!isOpen)}
      >
        {selectedTags.length > 0 ? (
          selectedTags.map(tag => {
            const opt = options.find(o => o.label === tag) || { color: 'bg-gray-100 text-gray-700' };
            return (
              <span key={tag} className={cn("px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1", opt.color)}>
                {tag}
                {!readOnly && (
                  <button onClick={(e) => removeTag(tag, e)} className="hover:opacity-70">
                    <X size={10} />
                  </button>
                )}
              </span>
            );
          })
        ) : (
          <span className="text-gray-400 text-xs px-1">選擇任務...</span>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 w-[240px] mt-1 bg-white rounded-lg shadow-xl border border-gray-200 animate-in fade-in zoom-in-95 duration-100">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              className="w-full px-2 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-blue-500"
              placeholder="尋找或建立選項"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div className="max-h-[240px] overflow-y-auto p-1.5 space-y-0.5">
            {filteredOptions.map(option => {
              const isSelected = selectedTags.includes(option.label);
              return (
                <div
                  key={option.id}
                  className={cn(
                    "flex items-center justify-between px-2 py-1.5 rounded cursor-pointer text-sm hover:bg-gray-100 transition-colors",
                    isSelected && "bg-blue-50"
                  )}
                  onClick={() => toggleTag(option.label)}
                >
                  <span className={cn("px-2 py-0.5 rounded text-xs font-medium", option.color)}>
                    {option.label}
                  </span>
                  {isSelected && <Check size={14} className="text-blue-600" />}
                </div>
              );
            })}
            
            {filteredOptions.length === 0 && (
              <div className="px-2 py-3 text-center text-xs text-gray-400">
                無相符選項
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
