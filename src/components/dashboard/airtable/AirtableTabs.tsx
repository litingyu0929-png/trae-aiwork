import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface PersonaTab {
  id: string;
  name: string;
  hasNotification?: boolean;
}

interface AirtableTabsProps {
  personas: PersonaTab[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export const AirtableTabs: React.FC<AirtableTabsProps> = ({ personas, activeId, onSelect }) => {
  return (
    <div className="flex items-center w-full bg-[#F5F6F8] border-b border-gray-200 overflow-x-auto no-scrollbar">
      {/* Label for Staff's Personas */}
      <div className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 border-r border-gray-200 mr-2 h-8">
         <span className="whitespace-nowrap">我的人設</span>
      </div>

      {personas.map((persona) => (
        <button
          key={persona.id}
          onClick={() => onSelect(persona.id)}
          className={cn(
            "relative px-6 py-3 text-sm font-medium transition-all whitespace-nowrap min-w-[100px] flex items-center justify-center gap-2",
            activeId === persona.id
              ? "bg-white text-blue-600 shadow-[0_-1px_0_0_rgba(0,0,0,0.05)_inset]"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          {/* Active Bottom Border */}
          {activeId === persona.id && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-600 z-10" />
          )}
          
          <span className="relative">
            {persona.name}
            {/* Notification Dot */}
            {persona.hasNotification && (
              <span className="absolute -top-0.5 -right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </span>
        </button>
      ))}
      
      {/* Add Button */}
      <button className="px-4 py-3 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
        <Plus size={18} />
      </button>
    </div>
  );
};
