import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, RepairJob, InventoryItem, ActivityLog } from '../services/mockDb';
import { DatabaseService } from '../services/dbAdapter';
import { supabase } from '../services/supabaseClient';

export type TabType = 'dashboard' | 'repairs' | 'customers' | 'inventory' | 'billing' | 'reports' | 'tracking' | 'settings';

interface AppContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  selectedRepairId: string | null;
  setSelectedRepairId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  customers: Customer[];
  repairs: RepairJob[];
  inventory: InventoryItem[];
  activities: ActivityLog[];
  refreshData: () => Promise<void>;
  notificationsCount: number;
  clearNotifications: () => void;
  session: any;
  setSession: (session: any) => void;
  logout: () => Promise<void>;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedRepairId, setSelectedRepairId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [repairs, setRepairs] = useState<RepairJob[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [notificationsCount, setNotificationsCount] = useState<number>(0);
  const [session, setSession] = useState<any>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('cfg_dark_mode');
    return saved === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('cfg_dark_mode', String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const refreshData = async () => {
    try {
      const [cust, rep, inv, act] = await Promise.all([
        DatabaseService.getCustomers(),
        DatabaseService.getRepairs(),
        DatabaseService.getInventory(),
        DatabaseService.getActivities()
      ]);
      setCustomers(cust);
      setRepairs(rep);
      setInventory(inv);
      setActivities(act);
    } catch (e) {
      console.error('Error refreshing data from DatabaseService:', e);
    }
  };

  useEffect(() => {
    // Initial fetch
    refreshData();

    // Listen to Supabase Auth state changes if keys exist
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      refreshData();
    });

    // Set up a periodic check for active timers or simulated realtime events
    const interval = setInterval(async () => {
      try {
        const reps = await DatabaseService.getRepairs();
        setRepairs(reps);
      } catch (err) {
        // Suppress print during sandbox modes
      }
    }, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const clearNotifications = () => {
    setNotificationsCount(0);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedCustomerId,
        setSelectedCustomerId,
        selectedRepairId,
        setSelectedRepairId,
        searchQuery,
        setSearchQuery,
        customers,
        repairs,
        inventory,
        activities,
        refreshData,
        notificationsCount,
        clearNotifications,
        session,
        setSession,
        logout,
        darkMode,
        toggleDarkMode
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
