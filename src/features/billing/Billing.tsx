import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DatabaseService } from '../../services/dbAdapter';
import { RepairJob, Customer } from '../../services/mockDb';
import { 
  Search, 
  FileText, 
  CreditCard, 
  History, 
  Printer, 
  CheckCircle2, 
  Info,
  ChevronRight,
  X,
  Smartphone
} from 'lucide-react';

export const Billing: React.FC = () => {
  const { repairs, customers, refreshData, selectedRepairId, setSelectedRepairId } = useApp();
  
  // Search phone state
  const [phoneSearch, setPhoneSearch] = useState('');
  const [activeRepair, setActiveRepair] = useState<RepairJob | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  // Receive Payment Modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>('UPI (PhonePe)');

  // Receipt modal state for preview
  const [showReceipt, setShowReceipt] = useState(false);

  // New Invoice modal selector state
  const [showSelectRepairModal, setShowSelectRepairModal] = useState(false);

  // Search trigger
  const handleSearch = () => {
    const query = phoneSearch.trim();
    if (!query) {
      setActiveCustomer(null);
      setActiveRepair(null);
      return;
    }
    
    // Normalize query for Job ID search (e.g. remove leading # or match with/without R-)
    const cleanQuery = query.replace(/^#/, '').toLowerCase();
    
    // 1. Try to find by Job ID
    const repairMatch = repairs.find(r => 
      r.id.toLowerCase() === cleanQuery || 
      r.id.toLowerCase() === `r-${cleanQuery}`
    );
    
    if (repairMatch) {
      const cust = customers.find(c => c.id === repairMatch.customerId);
      if (cust) {
        setActiveCustomer(cust);
        setActiveRepair(repairMatch);
        setPayAmount(repairMatch.remainingBalance);
        return;
      }
    }
    
    // 2. Fallback to Phone search
    const cust = customers.find(c => c.phone.replace(/\s/g, '').endsWith(query.replace(/\s/g, '')));
    if (cust) {
      setActiveCustomer(cust);
      // Find latest repair for this customer (newest first)
      const custRepairs = repairs
        .filter(r => r.customerId === cust.id)
        .sort((a, b) => {
          const aNum = parseInt(a.id.replace('R-', '')) || 0;
          const bNum = parseInt(b.id.replace('R-', '')) || 0;
          return bNum - aNum;
        });
      if (custRepairs.length > 0) {
        setActiveRepair(custRepairs[0]);
        setPayAmount(custRepairs[0].remainingBalance);
      } else {
        setActiveRepair(null);
      }
    } else {
      setActiveCustomer(null);
      setActiveRepair(null);
    }
  };

  // Perform search on mount or when global selectedRepairId changes
  useEffect(() => {
    if (selectedRepairId) {
      const rep = repairs.find(r => r.id === selectedRepairId);
      if (rep) {
        setActiveRepair(rep);
        const cust = customers.find(c => c.id === rep.customerId);
        if (cust) {
          setActiveCustomer(cust);
          setPhoneSearch(cust.phone);
          setPayAmount(rep.remainingBalance);
        }
      }
    } else {
      handleSearch();
    }
  }, [selectedRepairId, repairs, customers]);

  // Listen for "+ New Invoice" event from global Header
  useEffect(() => {
    const handleOpenInvoice = () => {
      setShowSelectRepairModal(true);
    };
    window.addEventListener('open-new-invoice', handleOpenInvoice);
    return () => window.removeEventListener('open-new-invoice', handleOpenInvoice);
  }, []);

  const getCustomerName = (customerId: string) => {
    const cust = customers.find(c => c.id === customerId);
    return cust ? cust.name : 'Unknown Customer';
  };

  const handleSelectRepairForInvoice = (rep: RepairJob) => {
    const cust = customers.find(c => c.id === rep.customerId);
    if (cust) {
      setActiveCustomer(cust);
      setActiveRepair(rep);
      setPhoneSearch(cust.phone);
      setPayAmount(rep.remainingBalance);
    }
    setShowSelectRepairModal(false);
  };




  const handleReceivePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRepair) return;

    await DatabaseService.addPayment(activeRepair.id, {
      amount: payAmount,
      method: payMethod
    });
    refreshData();
    setShowPayModal(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-10 text-left">
      <div className="space-y-6 print:hidden">
        {/* Page Title & Breadcrumbs */}
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Billing</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">Home &gt; Billing &gt; Customer Lookup</p>
        </div>

      {/* Customer Lookup Search Card */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Lookup Customer / Job ID</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Enter customer phone number or Job ID to view recent repair and payment details</p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <input 
              type="text" 
              value={phoneSearch}
              onChange={(e) => {
                const val = e.target.value;
                setPhoneSearch(val);
                if (!val.trim()) {
                  setActiveCustomer(null);
                  setActiveRepair(null);
                }
              }}
              placeholder="Enter Phone or Job ID (e.g. R-93119)" 
              className="border border-slate-200 focus:border-blue-500 px-4 py-2 rounded-xl text-xs font-semibold focus:outline-none w-64 transition"
            />
          </div>
          <button 
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-sm shadow-blue-200 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </div>
      </div>

      {activeCustomer ? (
        <>
          {/* Customer Overview Info Panel */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                {getInitials(activeCustomer.name)}
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  {activeCustomer.name}
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded-md uppercase">Existing Customer</span>
                </p>
                <p className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <span>📱 +91 {activeCustomer.phone}</span>
                  <span className="text-slate-200">•</span>
                  <span>Last visit: {activeCustomer.lastVisit}</span>
                </p>
              </div>
            </div>

            {activeRepair ? (
              <div className="flex flex-wrap gap-4.5 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                <div className="text-xs">
                  <span className="text-[10px] text-slate-400 font-bold block">Recent Repair</span>
                  <span className="font-bold text-slate-700 block mt-0.5">#{activeRepair.id}</span>
                  <span className="text-[9px] text-slate-400 font-medium block">{activeRepair.device.brand} {activeRepair.device.model}</span>
                </div>
                <div className="text-xs">
                  <span className="text-[10px] text-slate-400 font-bold block">Status</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded mt-1.5 inline-block">{activeRepair.status}</span>
                </div>
                <div className="text-xs">
                  <span className="text-[10px] text-slate-400 font-bold block">Total Amount</span>
                  <span className="font-extrabold text-slate-800 block mt-0.5">₹{activeRepair.estimatedCost.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-xs">
                  <span className="text-[10px] text-slate-400 font-bold block">Paid Amount</span>
                  <span className="font-bold text-green-600 block mt-0.5">₹{activeRepair.advancePaid.toLocaleString('en-IN')}</span>
                </div>
                <div className="text-xs">
                  <span className="text-[10px] text-slate-400 font-bold block">Pending Amount</span>
                  <span className="font-bold text-red-500 block mt-0.5">₹{activeRepair.remainingBalance.toLocaleString('en-IN')}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No recent repair found for this customer.</p>
            )}

            {/* Selection Options inside profile banner */}
            <div className="flex gap-2">
              <button 
                onClick={() => setShowReceipt(true)}
                className="px-3.5 py-2 border border-blue-200 text-blue-600 font-bold text-xs rounded-xl hover:bg-blue-50 transition cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Bill / Invoice</span>
              </button>
              <button 
                onClick={() => {
                  if (activeRepair) {
                    setPayAmount(activeRepair.remainingBalance || 0);
                  }
                  setShowPayModal(true);
                }}
                disabled={!activeRepair}
                className={`px-3.5 py-2 border text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  !activeRepair 
                    ? 'border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Payment</span>
              </button>
            </div>
          </div>

          {activeRepair && (
            /* Split Panel details */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Billing Details Table */}
              <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-5">
                <div className="pb-3 border-b border-slate-50 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-blue-500" />
                      <span>Recent Repair Details</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Most recent repair job by this customer</p>
                  </div>
                  <button 
                    onClick={() => setShowReceipt(true)}
                    className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Invoice</span>
                  </button>
                </div>

                {/* Device Spec Sub-Card */}
                <div className="bg-slate-50 p-4 rounded-xl flex flex-col sm:flex-row justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-400">Job ID: <span className="text-blue-600">#{activeRepair.id}</span></p>
                    <p className="font-bold text-slate-700 text-sm mt-1">{activeRepair.device.brand} {activeRepair.device.model}</p>
                    <p className="text-[10px] text-slate-400 mt-1">IMEI: {activeRepair.device.imei || 'N/A'} • Serial: {activeRepair.device.serial || 'N/A'}</p>
                  </div>
                  <div className="space-y-1 sm:text-right">
                    <p className="text-slate-400">Received: <span className="font-bold text-slate-600">{activeRepair.receivedAt}</span></p>
                    <p className="text-slate-400 mt-0.5">Expected Delivery: <span className="font-bold text-slate-600">{activeRepair.expectedDelivery}</span></p>
                    <p className="text-slate-400 mt-0.5">Technician: <span className="font-bold text-slate-600">{activeRepair.technician}</span></p>
                  </div>
                </div>

                {/* Problem Statement */}
                <div className="text-xs">
                  <span className="font-bold text-slate-400 block uppercase tracking-wide text-[9px]">Problem Reported</span>
                  <p className="font-bold text-slate-700 mt-1">{activeRepair.complaint}</p>
                </div>

                {/* Billing Items Table */}
                <div className="space-y-3.5">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Itemised Invoice Breakdown</h4>
                  
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                          <th className="px-4 py-2.5">Item / Service</th>
                          <th className="px-4 py-2.5">Description</th>
                          <th className="px-4 py-2.5 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                        {activeRepair.billingItems.length > 0 ? (
                          activeRepair.billingItems.map(item => (
                            <tr key={item.id}>
                              <td className="px-4 py-3 font-bold text-slate-800">{item.name}</td>
                              <td className="px-4 py-3 text-slate-400 font-medium">{item.description}</td>
                              <td className="px-4 py-3 text-right font-bold">₹{item.amount.toLocaleString('en-IN')}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="text-center py-6 text-slate-400 font-normal">
                              No billing items added yet. Edit status in Technician Workspace.
                            </td>
                          </tr>
                        )}
                        <tr className="bg-slate-50/50 font-bold border-t border-slate-150">
                          <td colSpan={2} className="px-4 py-3 text-right text-slate-500">Total Amount</td>
                          <td className="px-4 py-3 text-right text-slate-800 text-sm">₹{activeRepair.estimatedCost.toLocaleString('en-IN')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: Payment Summaries & History */}
              <div className="space-y-6">
                {/* Panel 1: Payment Summary Card */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-50 pb-2">Payment Summary (This Repair)</h3>
                  <div className="space-y-3 text-xs font-semibold">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Amount</span>
                      <span className="text-slate-700 font-bold">₹{activeRepair.estimatedCost.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Paid Amount</span>
                      <span className="text-green-600 font-bold">₹{activeRepair.advancePaid.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-50 pt-3">
                      <span className="text-slate-500 font-bold">Pending Amount</span>
                      <span className="text-red-500 font-extrabold text-sm">₹{activeRepair.remainingBalance.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Panel 2: Payment History Card */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-50 pb-2">Payment History (This Repair)</h3>
                  <div className="space-y-3">
                    {activeRepair.paymentHistory.length > 0 ? (
                      activeRepair.paymentHistory.map((pm, i) => (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <div className="flex gap-2.5 items-start">
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-slate-700">{pm.date}, {pm.time}</p>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{pm.method}</p>
                            </div>
                          </div>
                          <span className="font-extrabold text-slate-800">₹{pm.amount.toLocaleString('en-IN')}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No payments recorded.</p>
                    )}
                  </div>
                </div>



              </div>

            </div>
          )}

          {/* Bottom Banner Alert Info */}
          <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-2xl flex items-center gap-3">
            <Info className="w-4.5 h-4.5 text-blue-500 shrink-0" />
            <p className="text-[11px] font-semibold text-blue-700">
              Showing details for the most recent repair job. Click "Bill / Invoice" to download or preview the final invoice.
            </p>
          </div>
        </>
      ) : (
        <div className="bg-white border border-slate-100 py-16 text-center rounded-2xl shadow-sm space-y-3">
          <p className="text-sm font-semibold text-slate-400">Search customer number to preview billing dashboard.</p>
        </div>
      )}

      {/* Receive Payment Modal */}
      {showPayModal && activeRepair && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden text-left animate-scale-up">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800">Add Payment Receipt</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleReceivePaymentSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Amount to Pay (₹) *</label>
                <input 
                  type="number" 
                  max={activeRepair.remainingBalance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseInt(e.target.value) || 0)}
                  className="w-full border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Maximum allowed: ₹{activeRepair.remainingBalance}</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Payment Method *</label>
                <select 
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none font-semibold text-slate-700"
                >
                  <option value="UPI (PhonePe)">UPI (PhonePe)</option>
                  <option value="UPI (GPay)">UPI (GPay)</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button 
                  type="button" 
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-sm shadow-green-200 cursor-pointer"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>

      {/* Bill / Invoice Print Preview Drawer/Modal */}
      {showReceipt && activeRepair && activeCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 print:static print:bg-white print:p-0">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-100 shadow-2xl p-8 max-h-[90vh] overflow-y-auto animate-scale-up text-xs print:p-0 print:border-none print:shadow-none print:max-w-full print:max-h-none print:overflow-visible">
            <div className="flex justify-between items-start border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-xl font-extrabold text-blue-600 tracking-tight">RepairOS RMS</h3>
                <p className="text-slate-400 mt-1 font-semibold">Regd: Raipur, Chhattisgarh</p>
                <p className="text-slate-400 font-semibold">Phone: +91 9988776655</p>
              </div>
              <div className="text-right">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Invoice / Receipt</h4>
                <p className="text-slate-400 font-bold mt-1">Invoice: <span className="text-slate-700">#INV-23910</span></p>
                <p className="text-slate-400 font-bold">Date: <span className="text-slate-700">{activeRepair.receivedAt}</span></p>
                <p className="text-slate-400 font-bold">Job ID: <span className="text-slate-700">#{activeRepair.id}</span></p>
              </div>
            </div>

            {/* Billing addresses */}
            <div className="grid grid-cols-2 gap-4 py-5 font-semibold">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Customer Details</span>
                <p className="font-bold text-slate-700 mt-1">{activeCustomer.name}</p>
                <p className="text-slate-400 mt-0.5">+91 {activeCustomer.phone}</p>
                <p className="text-slate-400">{activeCustomer.city}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Device Specifications</span>
                <p className="font-bold text-slate-700 mt-1">{activeRepair.device.brand} {activeRepair.device.model}</p>
                <p className="text-slate-400 mt-0.5">IMEI: {activeRepair.device.imei || 'N/A'}</p>
                <p className="text-slate-400">Serial: {activeRepair.device.serial || 'N/A'}</p>
              </div>
            </div>

            {/* Items table */}
            <div className="border border-slate-100 rounded-xl overflow-hidden my-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <th className="px-4 py-2.5">Item / Service</th>
                    <th className="px-4 py-2.5">Description</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                  {activeRepair.billingItems.map(item => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-bold text-slate-800">{item.name}</td>
                      <td className="px-4 py-3 text-slate-400 font-medium">{item.description}</td>
                      <td className="px-4 py-3 text-right font-bold">₹{item.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50/50 font-bold border-t border-slate-150">
                    <td colSpan={2} className="px-4 py-3 text-right text-slate-500">Total Invoice Amount</td>
                    <td className="px-4 py-3 text-right text-slate-800 text-sm">₹{activeRepair.estimatedCost.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="bg-slate-50/50 font-bold">
                    <td colSpan={2} className="px-4 py-3 text-right text-green-600">Total Paid</td>
                    <td className="px-4 py-3 text-right text-green-600">₹{activeRepair.advancePaid.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="bg-slate-50/50 font-bold">
                    <td colSpan={2} className="px-4 py-3 text-right text-red-500">Balance Pending</td>
                    <td className="px-4 py-3 text-right text-red-500 text-sm">₹{activeRepair.remainingBalance.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Disclaimers & Signatures */}
            <div className="mt-8 border-t border-slate-100 pt-5 flex justify-between items-end text-slate-400 font-medium">
              <div className="space-y-1">
                <p className="font-bold text-[10px] text-slate-500 uppercase tracking-wide">Terms & Conditions</p>
                <p>1. 30-day warranty applies to screen and battery spares only.</p>
                <p>2. Physical damages and liquid exposure void warranty terms.</p>
              </div>
              <div className="text-right space-y-6">
                <div className="w-40 border-b border-slate-200 mt-8"></div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Authorized Signatory</span>
              </div>
            </div>

            {/* Print action controls */}
            <div className="mt-8 flex justify-end gap-2 text-xs print:hidden">
              <button 
                onClick={() => setShowReceipt(false)}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition cursor-pointer"
              >
                Close Preview
              </button>
              <button 
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select Repair for Billing Modal Overlay */}
      {showSelectRepairModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-left animate-scale-up">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Select Repair for Billing</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Select a customer's active repair job to generate an invoice or record payments</p>
              </div>
              <button 
                onClick={() => setShowSelectRepairModal(false)} 
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 max-h-[450px] overflow-y-auto space-y-3">
              {repairs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-semibold">
                  No repair jobs registered. Create a repair job first.
                </div>
              ) : (
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs font-semibold text-slate-700">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                        <th className="px-4 py-3">Job ID</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Device</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Balance</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {repairs.map(rep => (
                        <tr key={rep.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-4 py-3 font-mono font-bold text-blue-600">#{rep.id}</td>
                          <td className="px-4 py-3 text-slate-800 font-bold">{getCustomerName(rep.customerId)}</td>
                          <td className="px-4 py-3 text-slate-500">{rep.device.brand} {rep.device.model}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded uppercase">
                              {rep.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-red-500">₹{rep.remainingBalance.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleSelectRepairForInvoice(rep)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10px] cursor-pointer transition shadow-sm shadow-blue-200"
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setShowSelectRepairModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-600 font-bold text-xs rounded-xl cursor-pointer transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
