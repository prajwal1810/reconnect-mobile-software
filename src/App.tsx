import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { NewCustomerDrawer } from './components/NewCustomerDrawer';
import { NewRepairDrawer } from './components/NewRepairDrawer';
import { Dashboard } from './features/dashboard/Dashboard';
import { Customers } from './features/customers/Customers';
import { Inventory } from './features/inventory/Inventory';
import { Billing } from './features/billing/Billing';
import { Reports } from './features/reports/Reports';
import { TechnicianWorkspace } from './features/technician/TechnicianWorkspace';
import { LiveTracking } from './features/tracking/LiveTracking';
import { Settings } from './features/settings/Settings';
import { Login } from './features/auth/Login';
import { CustomerTrackingPortal } from './features/tracking/CustomerTrackingPortal';

const AppContent: React.FC = () => {
  const { activeTab, session, setSession } = useApp();
  const [showPublicTracker, setShowPublicTracker] = useState(false);

  if (!session) {
    if (showPublicTracker) {
      return <CustomerTrackingPortal onBack={() => setShowPublicTracker(false)} />;
    }
    return <Login onAuthSuccess={(s) => setSession(s)} onOpenTracker={() => setShowPublicTracker(true)} />;
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'repairs': return <TechnicianWorkspace />;
      case 'customers': return <Customers />;
      case 'inventory': return <Inventory />;
      case 'billing': return <Billing />;
      case 'reports': return <Reports />;
      case 'tracking': return <LiveTracking />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content body layout */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header toolbar */}
        <Header />

        {/* Scrollable views */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-800/30 dark:bg-slate-950">
          {renderActiveScreen()}
        </main>
      </div>

      {/* Slide-out drawers */}
      <NewCustomerDrawer />
      <NewRepairDrawer />
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
