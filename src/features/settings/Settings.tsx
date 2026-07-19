import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Shield, 
  Database, 
  BellRing, 
  Save, 
  Download, 
  Upload, 
  Check, 
  Lock,
  Smartphone,
  ChevronRight,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Settings: React.FC = () => {
  const { refreshData } = useApp();
  const [activeTab, setActiveTab] = useState<'general' | 'roles' | 'supabase' | 'whatsapp'>('general');

  // General configuration state
  const [shopName, setShopName] = useState('RepairOS Headquarters');
  const [supportPhone, setSupportPhone] = useState('+91 9988776655');
  const [shopAddress, setShopAddress] = useState('VIP Road, Near Magneto Mall, Raipur, Chhattisgarh');
  const [gstin, setGstin] = useState('22AAAAA0000A1Z5');

  // Roles & Permissions state
  const [techEditPrice, setTechEditPrice] = useState(false);
  const [requireAdminDiscount, setRequireAdminDiscount] = useState(true);
  const [enableShiftLogs, setEnableShiftLogs] = useState(false);

  // Supabase state
  const [supabaseUrl, setSupabaseUrl] = useState(import.meta.env.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co');
  const [supabaseKey, setSupabaseKey] = useState(import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-placeholder');

  // WhatsApp Alert state
  const [whatsappIntakeAlert, setWhatsappIntakeAlert] = useState(true);
  const [whatsappDeliveryAlert, setWhatsappDeliveryAlert] = useState(true);
  const [whatsappGateway, setWhatsappGateway] = useState('Twilio API');
  const [whatsappTemplate, setWhatsappTemplate] = useState('Hello {customer_name}, your device {device_model} has been received for diagnostics under Job ID #{job_id}. Track it here: http://localhost:5173/');

  // Load configured settings from localStorage if present
  useEffect(() => {
    const savedShopName = localStorage.getItem('cfg_shop_name');
    const savedPhone = localStorage.getItem('cfg_support_phone');
    const savedAddress = localStorage.getItem('cfg_shop_address');
    const savedGstin = localStorage.getItem('cfg_gstin');

    if (savedShopName) setShopName(savedShopName);
    if (savedPhone) setSupportPhone(savedPhone);
    if (savedAddress) setShopAddress(savedAddress);
    if (savedGstin) setGstin(savedGstin);

    setTechEditPrice(localStorage.getItem('cfg_tech_edit_price') === 'true');
    setRequireAdminDiscount(localStorage.getItem('cfg_require_admin_discount') !== 'false');
    setEnableShiftLogs(localStorage.getItem('cfg_enable_shift_logs') === 'true');
  }, []);

  const handleSaveGeneral = () => {
    localStorage.setItem('cfg_shop_name', shopName);
    localStorage.setItem('cfg_support_phone', supportPhone);
    localStorage.setItem('cfg_shop_address', shopAddress);
    localStorage.setItem('cfg_gstin', gstin);
    alert('General Store Configuration saved successfully!');
  };

  const handleSavePermissions = () => {
    localStorage.setItem('cfg_tech_edit_price', String(techEditPrice));
    localStorage.setItem('cfg_require_admin_discount', String(requireAdminDiscount));
    localStorage.setItem('cfg_enable_shift_logs', String(enableShiftLogs));
    alert('User Roles & Permissions saved successfully!');
  };

  const handleSaveWhatsApp = () => {
    alert('WhatsApp notification alerts and message templates updated!');
  };

  const handleExportBackup = () => {
    const backupData = {
      customers: localStorage.getItem('r_customers') ? JSON.parse(localStorage.getItem('r_customers')!) : [],
      repairs: localStorage.getItem('r_repairs') ? JSON.parse(localStorage.getItem('r_repairs')!) : [],
      inventory: localStorage.getItem('r_inventory') ? JSON.parse(localStorage.getItem('r_inventory')!) : [],
      activities: localStorage.getItem('r_activities') ? JSON.parse(localStorage.getItem('r_activities')!) : [],
      movements: localStorage.getItem('r_inventory_movements') ? JSON.parse(localStorage.getItem('r_inventory_movements')!) : [],
      suppliers: localStorage.getItem('r_suppliers') ? JSON.parse(localStorage.getItem('r_suppliers')!) : [],
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `repair_os_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    alert('Database Backup JSON exported successfully!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.customers) localStorage.setItem('r_customers', JSON.stringify(parsed.customers));
          if (parsed.repairs) localStorage.setItem('r_repairs', JSON.stringify(parsed.repairs));
          if (parsed.inventory) localStorage.setItem('r_inventory', JSON.stringify(parsed.inventory));
          if (parsed.activities) localStorage.setItem('r_activities', JSON.stringify(parsed.activities));
          if (parsed.movements) localStorage.setItem('r_inventory_movements', JSON.stringify(parsed.movements));
          if (parsed.suppliers) localStorage.setItem('r_suppliers', JSON.stringify(parsed.suppliers));
          
          alert('Database restored successfully! Reloading...');
          window.location.reload();
        } catch (err) {
          alert('Failed to parse backup JSON. Please check file formatting.');
        }
      };
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10 text-left animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-400 font-medium mt-1">Configure RepairOS system options and branch configs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Navigation Tabs list */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-1 font-semibold text-xs text-slate-600 self-start">
          <button 
            onClick={() => setActiveTab('general')}
            className={`w-full text-left p-3 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'general' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>General Store Configuration</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('roles')}
            className={`w-full text-left p-3 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'roles' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>User Roles & Permissions</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('supabase')}
            className={`w-full text-left p-3 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'supabase' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Supabase Sync & Backups</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('whatsapp')}
            className={`w-full text-left p-3 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'whatsapp' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            <BellRing className="w-4 h-4" />
            <span>WhatsApp Notifications Alert</span>
          </button>
        </div>

        {/* Right Settings panel details */}
        <div className="md:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6 text-xs text-slate-700">
          
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="border-b border-slate-50 pb-4">
                <h3 className="text-sm font-bold text-slate-800">General Shop Profile</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">Global receipt headers and shop name specifications</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Shop/Store Name *</label>
                  <input 
                    type="text" 
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Support Helpline Phone *</label>
                  <input 
                    type="text" 
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Shop Address</label>
                  <input 
                    type="text" 
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                    className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Currency Indicator</label>
                  <input 
                    type="text" 
                    defaultValue="INR (₹)" 
                    disabled 
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-450 focus:outline-none cursor-not-allowed" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">GST Identification Number</label>
                  <input 
                    type="text" 
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none" 
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 flex justify-end">
                <button 
                  onClick={handleSaveGeneral}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-blue-200 cursor-pointer transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-50 pb-4">
                <h3 className="text-sm font-bold text-slate-800">User Roles & Permissions</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">Configure dashboard features and technician permissions controls</p>
              </div>

              {/* Roles listing */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Defined System Roles</h4>
                <div className="divide-y divide-slate-50 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                  <div className="p-3.5 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-extrabold text-slate-800">Administrator</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Full access to billing, inventory, settings and user management.</p>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded-md uppercase">Owner</span>
                  </div>
                  <div className="p-3.5 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-extrabold text-slate-800">Shop Manager</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Lookup invoices, view billing/payments, add parts to stock.</p>
                    </div>
                    <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-bold rounded-md uppercase">Staff</span>
                  </div>
                  <div className="p-3.5 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-extrabold text-slate-800">Repair Technician</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Access tracking board, log diagnosis notes and consume repair parts.</p>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-bold rounded-md uppercase">Tech</span>
                  </div>
                </div>
              </div>

              {/* Permission toggles */}
              <div className="space-y-4 pt-3.5 border-t border-slate-50">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workspace Permissions Rules</h4>
                <div className="space-y-3.5">
                  <label className="flex items-start gap-3.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={techEditPrice}
                      onChange={(e) => setTechEditPrice(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <p className="font-bold text-slate-700">Allow Technicians to edit parts pricing</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Technicians can override spare part costs directly inside workspace drawers.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={requireAdminDiscount}
                      onChange={(e) => setRequireAdminDiscount(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <p className="font-bold text-slate-700">Require Administrator approval for major discounts</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Prompts billing desk to input admin override key if total discount exceeds 10%.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={enableShiftLogs}
                      onChange={(e) => setEnableShiftLogs(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <p className="font-bold text-slate-700">Enable shift logging and check-in console</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Forces staff to check-in/out to log technician hours in telemetry records.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 flex justify-end">
                <button 
                  onClick={handleSavePermissions}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-blue-200 cursor-pointer transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Permissions</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'supabase' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-50 pb-4">
                <h3 className="text-sm font-bold text-slate-800">Supabase Sync & Backups</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">Configure cloud database endpoints or manage local backup imports</p>
              </div>

              {/* API Configuration */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cloud Sync Environment</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Supabase Project URL</label>
                    <input 
                      type="text" 
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Anon API Key</label>
                    <input 
                      type="password" 
                      value={supabaseKey}
                      onChange={(e) => setSupabaseKey(e.target.value)}
                      className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none" 
                    />
                  </div>
                </div>
              </div>

              {/* Database Backups Export/Import */}
              <div className="space-y-4 pt-3.5 border-t border-slate-50">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Local Database Backups</h4>
                <p className="text-[10px] text-slate-400 font-medium">Export all repairs, customers, inventory records, and movements to a local `.json` file for backup/restoration.</p>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button 
                    onClick={handleExportBackup}
                    className="p-4 border border-slate-200 hover:border-slate-350 bg-slate-50/50 hover:bg-slate-50 rounded-xl flex items-center justify-between text-left cursor-pointer transition-all"
                  >
                    <div>
                      <p className="font-extrabold text-slate-800">Export Backup JSON</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">Download full snapshot file</p>
                    </div>
                    <Download className="w-5 h-5 text-blue-500" />
                  </button>

                  <label 
                    className="p-4 border border-slate-200 hover:border-slate-350 bg-slate-50/50 hover:bg-slate-50 rounded-xl flex items-center justify-between text-left cursor-pointer transition-all"
                  >
                    <div>
                      <p className="font-extrabold text-slate-800">Import Backup JSON</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">Restore database from file</p>
                    </div>
                    <Upload className="w-5 h-5 text-green-500" />
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 flex justify-end">
                <button 
                  onClick={() => alert('Supabase environment configs saved!')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-blue-200 cursor-pointer transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Database Key</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-slate-50 pb-4">
                <h3 className="text-sm font-bold text-slate-800">WhatsApp Notifications Alert</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">Configure automated text alerts to notify customers about repair milestones</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Automations Rules</h4>
                <div className="space-y-3.5">
                  <label className="flex items-start gap-3.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={whatsappIntakeAlert}
                      onChange={(e) => setWhatsappIntakeAlert(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <p className="font-bold text-slate-700">Send WhatsApp confirmation on Job Intake</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Triggers SMS confirmation message to client as soon as a new repair is initialized.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={whatsappDeliveryAlert}
                      onChange={(e) => setWhatsappDeliveryAlert(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <p className="font-bold text-slate-700">Send WhatsApp alert on Ready for Delivery</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">Sends notification with total invoice amount as soon as status becomes Ready or Completed.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-4 pt-3.5 border-t border-slate-50">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gateway Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">WhatsApp API Gateway Provider</label>
                    <select 
                      value={whatsappGateway}
                      onChange={(e) => setWhatsappGateway(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                    >
                      <option value="Twilio API">Twilio API Gateway</option>
                      <option value="Interakt API">Interakt API Console</option>
                      <option value="Custom HTTP API">Custom Webhook Integration</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Client Notification Message Template</label>
                    <textarea 
                      rows={3}
                      value={whatsappTemplate}
                      onChange={(e) => setWhatsappTemplate(e.target.value)}
                      className="w-full border border-slate-200 p-3 rounded-xl focus:outline-none resize-none font-semibold text-slate-700 leading-normal" 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 flex justify-end">
                <button 
                  onClick={handleSaveWhatsApp}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-blue-200 cursor-pointer transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Message Settings</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
