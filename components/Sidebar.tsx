import React from 'react';
import { LayoutDashboard, PenTool, History, Settings, Zap } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const menuItems = [
    { id: 'generate', label: 'Idea Generator', icon: Zap },
    { id: 'writer', label: 'Content Writer', icon: PenTool },
    { id: 'history', label: 'History & Archive', icon: History },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl z-10 hidden md:flex">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          ContentForge
        </h1>
        <p className="text-xs text-slate-400 mt-1">AdSense Ready AI</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === item.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-300 mb-2">
            <Settings size={16} />
            <span className="text-sm font-semibold">Pro Model Active</span>
          </div>
          <p className="text-xs text-slate-500">
            Powered by Gemini 1.5 Pro with Search Grounding
          </p>
        </div>
      </div>
    </div>
  );
};