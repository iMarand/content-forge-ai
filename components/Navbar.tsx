import React from 'react';
import { Sparkles, PenTool, History, Search, Command } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  setView: (view: string) => void;
  queueCount: number;
  onSearchClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView, queueCount, onSearchClick }) => {
  const navItems = [
    { id: 'generate', label: 'Idea Generator', icon: Sparkles },
    { id: 'writer', label: 'Content Writer', icon: PenTool, badge: queueCount },
    { id: 'history', label: 'Archive', icon: History },
  ];

  return (
    <div className="flex justify-center w-full pt-8 pb-4 px-4 sticky top-0 z-50">
      <div className="liquid-glass shadow-xl shadow-blue-900/5 rounded-full px-2 py-2 flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`
                relative flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300
                ${isActive
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/25 transform scale-105'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                }
              `}
            >
              <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span className="hidden sm:inline">{item.label}</span>

              {item.badge ? (
                <span className={`
                  ml-1 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold
                  ${isActive ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-600'}
                `}>
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 mx-1"></div>

        {/* Search Button */}
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-white/50 transition-all duration-300"
          title="Search content (Ctrl+K)"
        >
          <Search size={18} />
          <span className="hidden lg:flex items-center gap-1 text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
            <Command size={10} />
            K
          </span>
        </button>
      </div>
    </div>
  );
};