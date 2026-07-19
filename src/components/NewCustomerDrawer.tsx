import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DatabaseService } from '../services/dbAdapter';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';

export const NewCustomerDrawer: React.FC = () => {
  const { refreshData, customers } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Raipur, Chhattisgarh');
  const [isVip, setIsVip] = useState(false);

  // Duplicate Check State
  const [duplicateCustomer, setDuplicateCustomer] = useState<any | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleOpen = () => {
      setName('');
      setPhone('');
      setEmail('');
      setCity('Raipur, Chhattisgarh');
      setIsVip(false);
      setDuplicateCustomer(null);
      setSuccessMsg('');
      setErrorMsg('');
      setIsOpen(true);
    };

    window.addEventListener('open-new-customer', handleOpen);
    return () => window.removeEventListener('open-new-customer', handleOpen);
  }, []);

  // Handle phone changes to trigger instant duplicate detection
  const handlePhoneChange = (val: string) => {
    const cleanVal = val.replace(/\D/g, ''); // Digits only
    setPhone(cleanVal);

    if (cleanVal.length >= 10) {
      const existing = customers.find(c => c.phone.endsWith(cleanVal) || cleanVal.endsWith(c.phone));
      if (existing) {
        setDuplicateCustomer(existing);
      } else {
        setDuplicateCustomer(null);
      }
    } else {
      setDuplicateCustomer(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setErrorMsg('Full Name and Phone Number are required.');
      return;
    }

    if (duplicateCustomer) {
      setErrorMsg('Cannot register: A customer with this phone number already exists.');
      return;
    }

    try {
      await DatabaseService.addCustomer({
        name,
        phone,
        email,
        city,
        isVip
      });
      setSuccessMsg('Customer created successfully!');
      refreshData();
      
      // Auto close after 1.5 seconds
      setTimeout(() => {
        setIsOpen(false);
      }, 1500);
    } catch (err) {
      setErrorMsg('Failed to save customer. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50 transition-all duration-300">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Add New Customer</h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {successMsg && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Phone Field */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Phone Number *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">+91</span>
              <input 
                type="text" 
                maxLength={10}
                required
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="Enter 10-digit mobile number"
                className="w-full border border-slate-200 dark:border-slate-700 focus:border-blue-500 pl-12 pr-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none transition"
              />
            </div>
          </div>

          {/* Duplicate Customer Card */}
          {duplicateCustomer && (
            <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex flex-col gap-3">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-800">Duplicate Customer Detected</h4>
                  <p className="text-[11px] text-amber-700">A customer is already registered with this phone number.</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-amber-100/50 rounded-xl p-3 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-200">{duplicateCustomer.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{duplicateCustomer.city} • Visit: {duplicateCustomer.lastVisit}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 text-[10px] font-bold rounded-md">Existing</span>
                </div>
              </div>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Full Name *</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full border border-slate-200 dark:border-slate-700 focus:border-blue-500 px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none transition"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rahul@example.com"
              className="w-full border border-slate-200 dark:border-slate-700 focus:border-blue-500 px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none transition"
            />
          </div>

          {/* City / State */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Location/City</label>
            <input 
              type="text" 
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Raipur, Chhattisgarh"
              className="w-full border border-slate-200 dark:border-slate-700 focus:border-blue-500 px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none transition"
            />
          </div>

          {/* VIP Customer */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-4.5 rounded-2xl">
            <input 
              type="checkbox" 
              id="vip"
              checked={isVip}
              onChange={(e) => setIsVip(e.target.checked)}
              className="w-4.5 h-4.5 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="vip" className="select-none cursor-pointer">
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">VIP Customer Designation</span>
              <span className="block text-[10px] text-slate-400 mt-0.5">Flags customer profiles to prioritize queue assignment.</span>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <button 
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4.5 py-2.5 bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!!duplicateCustomer || !name || !phone}
            className={`px-6 py-2.5 font-semibold text-xs rounded-xl transition cursor-pointer text-white ${
              duplicateCustomer || !name || !phone
                ? 'bg-slate-300 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200'
            }`}
          >
            Create Customer
          </button>
        </div>
      </div>
    </div>
  );
};
