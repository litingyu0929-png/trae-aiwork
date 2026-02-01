
import React, { useState, useMemo } from 'react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult, 
  DroppableProvided, 
  DraggableProvided, 
  DraggableStateSnapshot
} from '@hello-pangea/dnd';
import { 
  ChevronDown, ChevronUp,
  Download, Plus, Trash2, GripVertical
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Define the Phrase type locally if not exported, or import it.
// Assuming it matches the one in KnowledgeBase.tsx
export interface Phrase {
  id: string;
  category: string;
  content: string;
  tags: string[];
  created_at: string;
}

interface KnowledgeBaseTableProps {
  data: Phrase[];
  onUpdate: (id: string, data: Partial<Phrase>) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  categories: { value: string; label: string }[];
}

// Column Definition
interface Column {
  id: keyof Phrase | 'actions';
  label: string;
  width: number;
  minWidth: number;
}

export const KnowledgeBaseTable: React.FC<KnowledgeBaseTableProps> = ({
  data,
  onUpdate,
  onDelete,
  onAdd,
  categories
}) => {
  // --- State ---
  const [columns, setColumns] = useState<Column[]>([
    { id: 'content', label: '內容', width: 400, minWidth: 200 },
    { id: 'category', label: '分類', width: 150, minWidth: 120 },
    { id: 'tags', label: '標籤', width: 200, minWidth: 150 },
    { id: 'created_at', label: '建立時間', width: 150, minWidth: 120 },
    { id: 'actions', label: '操作', width: 100, minWidth: 80 },
  ]);

  const [localData, setLocalData] = useState<Phrase[]>(data);
  const [editingId, setEditingId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editValue, setEditValue] = useState<any>(undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: keyof Phrase; direction: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Sync props data to local state when props change (simple version)
  React.useEffect(() => {
    setLocalData(data);
  }, [data]);

  // --- Helpers ---
  const handleSort = (key: keyof Phrase) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    const sortableItems = [...localData];
    if (sortConfig) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [localData, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // --- Drag & Drop ---
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    if (result.type === 'COLUMN') {
      const newColumns = Array.from(columns);
      const [reorderedItem] = newColumns.splice(result.source.index, 1);
      newColumns.splice(result.destination.index, 0, reorderedItem);
      setColumns(newColumns);
    } else if (result.type === 'ROW') {
      const newData = Array.from(localData);
      const [reorderedItem] = newData.splice(result.source.index, 1);
      newData.splice(result.destination.index, 0, reorderedItem);
      setLocalData(newData);
      // Ideally trigger an API update for order here
    }
  };

  // --- Editing ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startEditing = (id: string, field: keyof Phrase, value: any) => {
    setEditingId(`${id}-${field}`);
    setEditValue(value);
  };

  const saveEdit = (id: string, field: keyof Phrase) => {
    if (editValue !== undefined) {
      onUpdate(id, { [field]: editValue });
    }
    setEditingId(null);
    setEditValue(null);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedData.map(d => d.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const exportCSV = () => {
    const headers = columns.map(c => c.label).join(',');
    const rows = sortedData.map(row => 
      columns.map(col => {
        if (col.id === 'actions') return '';
        const val = row[col.id as keyof Phrase];
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(',')
    ).join('\n');
    
    const blob = new Blob([`\ufeff${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `knowledge_base_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  // --- Renderers ---
  const renderCell = (item: Phrase, column: Column) => {
    const isEditing = editingId === `${item.id}-${column.id}`;

    if (column.id === 'actions') {
      return (
        <div className="flex items-center gap-2">
          <button onClick={() => onDelete(item.id)} className="text-gray-400 hover:text-red-600 p-1">
            <Trash2 size={14} />
          </button>
        </div>
      );
    }

    if (isEditing) {
      if (column.id === 'category') {
        return (
          <select 
            value={editValue} 
            onChange={e => setEditValue(e.target.value)}
            onBlur={() => saveEdit(item.id, 'category')}
            className="w-full h-full p-1 border-none focus:ring-2 focus:ring-indigo-500 bg-white"
            autoFocus
          >
            {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        );
      }
      return (
        <input 
          type="text" 
          value={editValue} 
          onChange={e => setEditValue(e.target.value)}
          onBlur={() => saveEdit(item.id, column.id as keyof Phrase)}
          onKeyDown={e => e.key === 'Enter' && saveEdit(item.id, column.id as keyof Phrase)}
          className="w-full h-full p-1 border-none focus:ring-2 focus:ring-indigo-500 bg-white"
          autoFocus
        />
      );
    }

    // Display
    if (column.id === 'category') {
      const cat = categories.find(c => c.value === item.category);
      return (
        <span 
          className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 truncate block w-fit"
          onDoubleClick={() => startEditing(item.id, 'category', item.category)}
        >
          {cat?.label || item.category}
        </span>
      );
    }

    if (column.id === 'created_at') {
      return <span className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</span>;
    }

    if (column.id === 'tags') {
      return (
        <div className="flex flex-wrap gap-1">
          {item.tags?.map((tag, idx) => (
            <span key={idx} className="text-xs bg-gray-50 px-1 rounded border border-gray-200">#{tag}</span>
          ))}
        </div>
      );
    }

    return (
      <div 
        className="truncate w-full h-full flex items-center" 
        title={String(item[column.id as keyof Phrase])}
        onDoubleClick={() => startEditing(item.id, column.id as keyof Phrase, item[column.id as keyof Phrase])}
      >
        {String(item[column.id as keyof Phrase])}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border rounded-lg shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">
            已選 {selectedIds.size} 項目
          </span>
          {selectedIds.size > 0 && (
            <button className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">
              <Trash2 size={12} /> 批量刪除
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700">
            <Download size={12} /> 導出 CSV
          </button>
          <button onClick={onAdd} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
            <Plus size={12} /> 新增記錄
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-auto relative">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="min-w-full inline-block align-middle">
            {/* Header */}
            <div className="sticky top-0 z-10 flex border-b border-gray-200 bg-gray-50">
               <div className="w-10 flex-none border-r border-gray-200 flex items-center justify-center">
                 <input 
                   type="checkbox" 
                   className="rounded border-gray-300"
                   onChange={handleSelectAll}
                   checked={paginatedData.length > 0 && selectedIds.size === paginatedData.length}
                 />
               </div>
               <Droppable droppableId="columns" direction="horizontal" type="COLUMN">
                 {(provided: DroppableProvided) => (
                   <div 
                     ref={provided.innerRef} 
                     {...provided.droppableProps}
                     className="flex flex-1"
                   >
                     {columns.map((col, index) => (
                       <Draggable key={col.id} draggableId={col.id} index={index}>
                         {(dragProvided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                           <div
                             ref={dragProvided.innerRef}
                             {...dragProvided.draggableProps}
                             {...dragProvided.dragHandleProps}
                             className={cn(
                               "flex-none h-10 px-3 flex items-center justify-between border-r border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 hover:bg-gray-100 transition-colors select-none",
                               snapshot.isDragging && "opacity-80 shadow-lg z-50 bg-white"
                             )}
                             style={{ 
                               width: col.width, 
                               minWidth: col.minWidth,
                               ...dragProvided.draggableProps.style 
                             }}
                           >
                             <div className="flex items-center gap-1 truncate" onClick={() => col.id !== 'actions' && handleSort(col.id as keyof Phrase)}>
                               {col.label}
                               {sortConfig?.key === col.id && (
                                 sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                               )}
                             </div>
                             <div className="cursor-col-resize opacity-0 group-hover:opacity-100 hover:bg-blue-500 w-1 h-full absolute right-0 top-0" />
                           </div>
                         )}
                       </Draggable>
                     ))}
                     {provided.placeholder}
                   </div>
                 )}
               </Droppable>
            </div>

            {/* Body */}
            <Droppable droppableId="rows" type="ROW">
              {(provided: DroppableProvided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {paginatedData.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(dragProvided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={cn(
                            "flex border-b border-gray-200 bg-white hover:bg-gray-50 transition-colors group",
                            snapshot.isDragging && "shadow-lg z-20"
                          )}
                          style={{ ...dragProvided.draggableProps.style }}
                        >
                          <div className="w-10 flex-none border-r border-gray-200 flex items-center justify-center bg-gray-50 group-hover:bg-gray-100">
                             <div {...dragProvided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-500">
                               <GripVertical size={12} />
                             </div>
                             <input 
                               type="checkbox" 
                               className="rounded border-gray-300 ml-1"
                               checked={selectedIds.has(item.id)}
                               onChange={() => handleSelectRow(item.id)}
                             />
                          </div>
                          
                          <div className="flex flex-1">
                            {columns.map(col => (
                              <div 
                                key={col.id}
                                className="flex-none px-3 py-2 border-r border-gray-200 text-sm text-gray-900 truncate flex items-center"
                                style={{ width: col.width, minWidth: col.minWidth }}
                              >
                                {renderCell(item, col)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </DragDropContext>
      </div>

      {/* Footer / Pagination */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
        <div>
          顯示 {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, sortedData.length)} 共 {sortedData.length} 條
        </div>
        <div className="flex items-center gap-2">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
            className="px-2 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            上一頁
          </button>
          <span>{page} / {totalPages}</span>
          <button 
            disabled={page === totalPages} 
            onClick={() => setPage(p => p + 1)}
            className="px-2 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            下一頁
          </button>
        </div>
      </div>
    </div>
  );
};
