import React, { useState } from 'react';
import { useApp, TabType } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Wrench, 
  Users, 
  Package, 
  FileText, 
  BarChart3, 
  Settings, 
  Tv,
  ChevronLeft, 
  ChevronRight,
  ChevronDown
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, session, logout } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'repairs', label: 'Repairs', icon: Wrench },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'billing', label: 'Billing', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'tracking', label: 'Live Tracking', icon: Tv },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside 
      className={`bg-white border-r border-slate-100 flex flex-col transition-all duration-300 print:hidden ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-200 shrink-0">
          R
        </div>
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 tracking-tight text-lg">RepairOS</span>
            <span className="text-xs text-slate-400 font-medium -mt-1">Repair Management System</span>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive 
                  ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-50/20' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Control Footer */}
      <div className="p-4 border-t border-slate-100 space-y-4">
        {/* Toggle Collapse */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all font-medium text-sm"
        >
          {isCollapsed ? (
            <>
              <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
            </>
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 text-slate-400 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>

        {/* User Card */}
        <div className="flex flex-col gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
                  alt="User Profile" 
                  className="w-9 h-9 rounded-full object-cover border border-white ring-1 ring-slate-200"
                />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex flex-col">
                  <span className="text-xs font-bold text-slate-700 truncate leading-none mb-1">
                    {session?.user?.user_metadata?.display_name || session?.user?.email?.split('@')[0] || 'Vishal Sharma'}
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold truncate leading-none">
                    {session?.user?.email || 'owner@repairos.com'}
                  </span>
                </div>
              )}
            </div>
          </div>
          {!isCollapsed && (
            <button 
              onClick={logout}
              className="text-[10px] font-bold text-red-500 hover:text-red-600 hover:bg-red-50 py-1.5 rounded-lg border border-red-100/50 transition cursor-pointer text-center"
            >
              Sign Out Session
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
