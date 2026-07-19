import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DatabaseService } from '../services/dbAdapter';
import { Search, Bell, Calendar, ChevronDown, CheckCircle2, AlertTriangle, Info, RefreshCw, Moon, Sun } from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    searchQuery, 
    setSearchQuery, 
    notificationsCount, 
    clearNotifications,
    activeTab,
    setActiveTab,
    setSelectedRepairId,
    setSelectedCustomerId,
    customers,
    repairs,
    inventory,
    session,
    darkMode,
    toggleDarkMode
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const [offline, setOffline] = useState(DatabaseService.offline);
  const [pendingCount, setPendingCount] = useState(DatabaseService.syncQueue.length);

  useEffect(() => {
    const handleSyncStatus = (e: any) => {
      setOffline(e.detail.offline);
      setPendingCount(e.detail.pending);
    };

    window.addEventListener('db-sync-status', handleSyncStatus);
    return () => window.removeEventListener('db-sync-status', handleSyncStatus);
  }, []);

  // Dynamic Page Title
  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'repairs': return 'Repairs Queue & Workspace';
      case 'customers': return 'Customers Directory';
      case 'inventory': return 'Inventory & Stock Management';
      case 'billing': return 'Billing & Invoices';
      case 'reports': return 'Business Reports & Insights';
      case 'tracking': return 'Live Monitoring Wallboard';
      case 'settings': return 'System Settings';
      default: return 'Reconnect Mobile';
    }
  };

  // Dynamic Primary CTA Button
  const renderPrimaryAction = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <button 
            onClick={() => {
              // We'll open a "New CS Repair" drawer or switch tab/state
              // For simplicity, we can set state or scroll/trigger a modal
              const event = new CustomEvent('open-new-repair', { detail: 'CS' });
              window.dispatchEvent(event);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4.5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm shadow-blue-200 transition-all cursor-pointer"
          >
            <span>+ New Repair</span>
          </button>
        );
      case 'customers':
        return (
          <button 
            onClick={() => {
              const event = new CustomEvent('open-new-customer');
              window.dispatchEvent(event);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4.5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm shadow-blue-200 transition-all cursor-pointer"
          >
            <span>Add Customer</span>
          </button>
        );
      case 'inventory':
        return (
          <div className="flex gap-2">
            <button 
              onClick={() => {
                const event = new CustomEvent('open-add-item');
                window.dispatchEvent(event);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4.5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm shadow-blue-200 transition-all cursor-pointer"
            >
              <span>Add Item</span>
            </button>
            <button 
              onClick={() => {
                const event = new CustomEvent('open-stock-adjustment');
                window.dispatchEvent(event);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4.5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm shadow-blue-200 transition-all cursor-pointer"
            >
              <span>Stock Adjustment</span>
            </button>
          </div>
        );
      case 'billing':
        return (
          <button 
            onClick={() => {
              const event = new CustomEvent('open-new-invoice');
              window.dispatchEvent(event);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4.5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm shadow-blue-200 transition-all cursor-pointer"
          >
            <span>+ New Invoice</span>
          </button>
        );
      default:
        return null;
    }
  };

  // Filter results for header search dropdown
  const getSearchResults = () => {
    if (searchQuery.trim().length < 2) return null;
    const q = searchQuery.toLowerCase();
    
    const matchedRepairs = repairs.filter(r => 
      r.id.toLowerCase().includes(q) || 
      r.device.model.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q)
    ).slice(0, 3);

    const matchedCustomers = customers.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.phone.includes(q)
    ).slice(0, 3);

    const matchedInventory = inventory.filter(i => 
      i.name.toLowerCase().includes(q) || 
      i.partNumber.toLowerCase().includes(q)
    ).slice(0, 3);

    const totalResults = matchedRepairs.length + matchedCustomers.length + matchedInventory.length;
    if (totalResults === 0) return null;

    return {
      repairs: matchedRepairs,
      customers: matchedCustomers,
      inventory: matchedInventory,
      count: totalResults
    };
  };

  const searchResults = getSearchResults();

  // Generate notifications based on real database state
  const getDynamicNotifications = () => {
    const list: { id: string; type: 'warning' | 'success' | 'info'; title: string; text: string; time: string }[] = [];
    
    // Low stock warnings
    inventory.forEach(item => {
      if (item.available <= 5) {
        list.push({
          id: `notif-stock-${item.id}`,
          type: 'warning',
          title: 'Low Stock Alert',
          text: `${item.name} (${item.available} left)`,
          time: 'Active'
        });
      }
    });

    // Waiting approvals
    repairs.forEach(rep => {
      if (rep.status === 'Waiting Approval') {
        list.push({
          id: `notif-appr-${rep.id}`,
          type: 'info',
          title: 'Approval Pending',
          text: `Estimate shared for job #${rep.id}`,
          time: 'Active'
        });
      }
    });

    return list;
  };

  const activeNotifications = getDynamicNotifications();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40 print:hidden transition-colors duration-300">
      {/* Left Search Bar */}
      <div 
        className="flex-1 max-w-md relative"
        onFocus={() => setShowSearchDropdown(true)}
        onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
      >
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search jobs, invoices, customers, IMEI..." 
          className="w-full bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 dark:bg-slate-800 pl-10 pr-12 py-2 rounded-xl text-sm transition-all focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-slate-200/50 rounded text-[10px] font-bold text-slate-400 uppercase select-none">
          ⌘ K
        </div>

        {/* Suggestion Dropdown panel */}
        {showSearchDropdown && searchResults && (
          <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden z-50 text-xs font-semibold divide-y divide-slate-100 dark:divide-slate-800 dark:divide-slate-800 max-h-[350px] overflow-y-auto">
            {searchResults.repairs.length > 0 && (
              <div className="p-3 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block px-1">Repair Jobs</span>
                {searchResults.repairs.map(r => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedCustomerId(r.customerId);
                      setActiveTab('customers');
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex justify-between items-center transition cursor-pointer"
                  >
                    <div>
                      <p className="text-slate-800 dark:text-slate-100 font-bold">#{r.id} • {r.device.brand} {r.device.model}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Cust: {r.customerName} • Tech: {r.technician}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 text-[9px] font-bold rounded">{r.status}</span>
                  </button>
                ))}
              </div>
            )}

            {searchResults.customers.length > 0 && (
              <div className="p-3 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block px-1">Customers</span>
                {searchResults.customers.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCustomerId(c.id);
                      setActiveTab('customers');
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex justify-between items-center transition cursor-pointer"
                  >
                    <div>
                      <p className="text-slate-800 dark:text-slate-100 font-bold">{c.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Phone: +91 {c.phone} • {c.city}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">Details →</span>
                  </button>
                ))}
              </div>
            )}

            {searchResults.inventory.length > 0 && (
              <div className="p-3 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block px-1">Inventory Spare Parts</span>
                {searchResults.inventory.map(i => (
                  <button
                    key={i.id}
                    onClick={() => {
                      setActiveTab('inventory');
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex justify-between items-center transition cursor-pointer"
                  >
                    <div>
                      <p className="text-slate-800 dark:text-slate-100 font-bold">{i.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Part: {i.partNumber} • Model: {i.brand} {i.model}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-bold rounded">{i.status}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right User Bar */}
      <div className="flex items-center gap-4.5">
        {/* Cloud Sync Status Badge */}
        {DatabaseService.isUsingCloud() && (
          offline ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-600 rounded-xl text-xs font-bold transition-all">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Offline Mode ({pendingCount} pending)</span>
              {pendingCount > 0 && (
                <button 
                  onClick={() => {
                    DatabaseService.syncOfflineChanges();
                  }}
                  className="ml-1.5 px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[9px] font-extrabold shadow-sm transition cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  <span>Sync</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 text-green-600 rounded-xl text-xs font-bold transition-all">
              <span className="w-2 h-2 rounded-full bg-green-505 bg-green-500"></span>
              <span>Cloud Synced</span>
            </div>
          )
        )}

        {/* Dynamic CTA */}
        {renderPrimaryAction()}

        {/* Date Display */}
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 dark:text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Today, {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 dark:text-slate-300 transition-all cursor-pointer"
        >
          {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
        </button>

        {/* Notifications Icon */}
        <div className="relative">
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (notificationsCount > 0) clearNotifications();
            }}
            className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-all cursor-pointer relative"
          >
            <Bell className="w-5 h-5" />
            {activeNotifications.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                {activeNotifications.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Recent Notifications</span>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="text-[10px] font-semibold text-blue-600 hover:text-blue-700"
                >
                  Close
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 dark:divide-slate-800 max-h-80 overflow-y-auto">
                {activeNotifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs font-semibold">
                    No new alerts or notifications.
                  </div>
                ) : (
                  activeNotifications.map((notif) => (
                    <div key={notif.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 dark:bg-slate-800/30 flex gap-3 text-left">
                      {notif.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                      {notif.type === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />}
                      {notif.type === 'info' && <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight mb-0.5">{notif.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-tight">{notif.text}</p>
                        <span className="text-[10px] text-slate-400 font-medium mt-1 inline-block">{notif.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="w-px h-6 bg-slate-100"></div>

        {/* User Badge */}
        <div className="flex items-center gap-2">
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
            alt="User avatar" 
            className="w-9 h-9 rounded-full object-cover border border-slate-100 dark:border-slate-800"
          />
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {session?.user?.user_metadata?.display_name || session?.user?.email?.split('@')[0] || 'Vishal Sharma'}
            </span>
            <span className="text-[10px] text-slate-450 font-semibold truncate max-w-[120px]">
              {session?.user?.email || 'Owner'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
