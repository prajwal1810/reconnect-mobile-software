import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DatabaseService } from '../services/dbAdapter';
import { Customer, RepairJob } from '../services/mockDb';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { X, Search, UserPlus, AlertCircle, Calendar, CheckCircle2, Printer } from 'lucide-react';

export const NewRepairDrawer: React.FC = () => {
  const { refreshData, customers } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [repairType, setRepairType] = useState<'CS' | 'DS'>('CS');

  const [createdRepair, setCreatedRepair] = useState<RepairJob | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const [qcName, setQcName] = useState('');
  const [qcPhone, setQcPhone] = useState('');
  const [qcCity, setQcCity] = useState('Raipur, Chhattisgarh');

  // Device specs
  // Device specs
  const brandOptions = ['Samsung', 'Apple', 'OnePlus', 'Google', 'Xiaomi', 'Realme', 'Redmi', 'Vivo', 'Oppo', 'Others'];
  const [brand, setBrand] = useState('');
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [highlightedBrandIndex, setHighlightedBrandIndex] = useState(0);

  const matchingBrands = brandOptions.filter(b => b.toLowerCase().includes((brand || '').toLowerCase()));

  // Mobile Models Dataset mapped by Brand
  const modelsByBrand: Record<string, string[]> = {
    Apple: [
      'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16',
      'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
      'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
      'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 mini',
      'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 mini',
      'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11', 'iPhone SE (3rd Gen)',
      'iPhone XR', 'iPhone XS Max', 'iPhone XS', 'iPhone X', 'iPhone 8 Plus', 'iPhone 8'
    ],
    Samsung: [
      'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24',
      'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23', 'Galaxy S23 FE',
      'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22',
      'Galaxy S21 Ultra', 'Galaxy S21+', 'Galaxy S21 FE',
      'Galaxy Z Fold 6', 'Galaxy Z Flip 6', 'Galaxy Z Fold 5', 'Galaxy Z Flip 5',
      'Galaxy A55 5G', 'Galaxy A35 5G', 'Galaxy A54 5G', 'Galaxy A34 5G', 'Galaxy A15 5G',
      'Galaxy M54', 'Galaxy M34', 'Galaxy M14', 'Galaxy F54', 'Galaxy F34',
      'Galaxy Note 20 Ultra', 'Galaxy Note 10+'
    ],
    OnePlus: [
      'OnePlus 12', 'OnePlus 12R',
      'OnePlus 11', 'OnePlus 11R',
      'OnePlus 10 Pro', 'OnePlus 10T', 'OnePlus 10R',
      'OnePlus 9 Pro', 'OnePlus 9', 'OnePlus 9R', 'OnePlus 9RT',
      'OnePlus Nord 4', 'OnePlus Nord CE 4', 'OnePlus Nord 3', 'OnePlus Nord CE 3',
      'OnePlus Nord CE 3 Lite', 'OnePlus Nord 2T', 'OnePlus Open'
    ],
    Google: [
      'Pixel 9 Pro XL', 'Pixel 9 Pro', 'Pixel 9', 'Pixel 9 Fold',
      'Pixel 8 Pro', 'Pixel 8', 'Pixel 8a',
      'Pixel 7 Pro', 'Pixel 7', 'Pixel 7a',
      'Pixel 6 Pro', 'Pixel 6', 'Pixel 6a',
      'Pixel 5', 'Pixel 4a'
    ],
    Xiaomi: [
      'Xiaomi 14 Ultra', 'Xiaomi 14', 'Xiaomi 14 Civi',
      'Xiaomi 13 Pro', 'Xiaomi 13T Pro',
      'Xiaomi 12 Pro', 'Xiaomi 11T Pro', 'Xiaomi Mi 11X'
    ],
    Redmi: [
      'Redmi Note 13 Pro+', 'Redmi Note 13 Pro', 'Redmi Note 13',
      'Redmi Note 12 Pro+', 'Redmi Note 12 Pro', 'Redmi Note 12',
      'Redmi 13 5G', 'Redmi 12 5G', 'Redmi 13C', 'Redmi 12C',
      'Redmi K50i'
    ],
    Realme: [
      'Realme GT 6', 'Realme GT 6T', 'Realme GT Neo 3',
      'Realme 13 Pro+', 'Realme 13 Pro', 'Realme 12 Pro+', 'Realme 12 Pro',
      'Realme 11 Pro+', 'Realme 11 Pro', 'Realme 10 Pro+',
      'Realme C65', 'Realme C55', 'Realme P1 Pro', 'Realme P1'
    ],
    Vivo: [
      'Vivo X100 Pro', 'Vivo X100', 'Vivo X90 Pro', 'Vivo X90',
      'Vivo V30 Pro', 'Vivo V30', 'Vivo V29 Pro', 'Vivo V29', 'Vivo V27 Pro',
      'Vivo T3 Pro', 'Vivo T3 5G', 'Vivo T2 Pro',
      'Vivo Y200e', 'Vivo Y200', 'Vivo Y56'
    ],
    Oppo: [
      'Oppo Find N3 Flip', 'Oppo Find X6 Pro',
      'Oppo Reno 12 Pro', 'Oppo Reno 12', 'Oppo Reno 11 Pro', 'Oppo Reno 11', 'Oppo Reno 10 Pro+',
      'Oppo F27 Pro+', 'Oppo F25 Pro', 'Oppo F23 5G',
      'Oppo A79 5G', 'Oppo A59 5G', 'Oppo A3 Pro'
    ],
    Others: [
      'Motorola Edge 50 Ultra', 'Motorola Edge 50 Pro', 'Motorola Edge 50 Fusion', 'Moto G85 5G',
      'Nothing Phone (2a)', 'Nothing Phone (2)', 'Nothing Phone (1)',
      'iQOO 12', 'iQOO Neo 9 Pro', 'iQOO Z9s Pro', 'iQOO Z9 5G',
      'POCO F6', 'POCO X6 Pro', 'POCO M6 Pro'
    ]
  };

  const currentModelOptions = brand && modelsByBrand[brand] 
    ? modelsByBrand[brand] 
    : Object.values(modelsByBrand).flat();

  const [model, setModel] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [highlightedModelIndex, setHighlightedModelIndex] = useState(0);

  const matchingModels = currentModelOptions.filter(m => m.toLowerCase().includes((model || '').toLowerCase()));

  const [color, setColor] = useState('');
  const [imei, setImei] = useState('');
  const [serial, setSerial] = useState('');

  // Complaint
  const [complaintText, setComplaintText] = useState('');
  const [selectedComplaints, setSelectedComplaints] = useState<string[]>([]);
  const commonComplaints = [
    'Display Broken', 'Battery Drain', 'Heating', 'No Network', 
    'Camera Issue', 'Dead Phone', 'Charging Problem', 'Water Damage'
  ];

  // Repair options
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [expectedDays, setExpectedDays] = useState(2);
  const [technician, setTechnician] = useState('Vikram S.');
  const techniciansList = ['Vikram S.', 'Imran Khan', 'Amit Kumar', 'Pooja Mehta', 'Rahul V.', 'Deepak S.', 'Ravi Kumar'];

  // Condition
  const [scratches, setScratches] = useState('Minor scratches on screen');
  const [dents, setDents] = useState('None');
  const [displayCond, setDisplayCond] = useState('Working');
  const [backGlassCond, setBackGlassCond] = useState('Clean');

  // Accessories Received
  const [accessories, setAccessories] = useState<string[]>([]);
  const accessoryOptions = ['SIM Card', 'Memory Card', 'Back Cover', 'Charger', 'Cable', 'Adapter', 'Screen Guard'];

  // Financials
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [advancePaid, setAdvancePaid] = useState<number>(0);

  // Custom Searchable Dropdown state for Payment Method
  const paymentOptions = ['UPI', 'Cash', 'Card'];
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const [highlightedPaymentIndex, setHighlightedPaymentIndex] = useState(0);

  const matchingPayments = paymentOptions.filter(p => p.toLowerCase().includes((paymentMethod || '').toLowerCase()));

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const handleOpen = (e: any) => {
      setRepairType(e.detail === 'DS' || e.detail?.detail === 'DS' ? 'DS' : 'CS');
      if (e.detail && e.detail.customer) {
        setQcName(e.detail.customer.name);
        setQcPhone(e.detail.customer.phone);
        setQcCity(e.detail.customer.city || 'Raipur, Chhattisgarh');
      } else {
        setQcName('');
        setQcPhone('');
        setQcCity('Raipur, Chhattisgarh');
      }
      setBrand('');
      setShowBrandDropdown(false);
      setHighlightedBrandIndex(0);
      setModel('');
      setShowModelDropdown(false);
      setHighlightedModelIndex(0);
      setColor('');
      setImei('');
      setSerial('');
      setComplaintText('');
      setSelectedComplaints([]);
      setPriority('Medium');
      setExpectedDays(2);
      setTechnician('Vikram S.');
      setScratches('None');
      setDents('None');
      setDisplayCond('Working');
      setBackGlassCond('Clean');
      setAccessories([]);
      setEstimatedCost(0);
      setAdvancePaid(0);
      setPaymentMethod('');
      setShowPaymentDropdown(false);
      setHighlightedPaymentIndex(0);
      setErrorMsg('');
      setSuccessMsg('');
      setIsOpen(true);
      
      // Auto-focus and select first field
      setTimeout(() => {
        const inputEl = document.getElementById('input-customer-name') as HTMLInputElement;
        if (inputEl) {
          inputEl.focus();
          inputEl.select();
        }
      }, 50);
    };

    window.addEventListener('open-new-repair', handleOpen);
    return () => window.removeEventListener('open-new-repair', handleOpen);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.tagName === 'SELECT'
      );

      if (!isOpen) {
        if (e.key === 'F1') {
          e.preventDefault();
          const event = new CustomEvent('open-new-repair', { detail: 'CS' });
          window.dispatchEvent(event);
        } else if (e.key === 'F3') {
          e.preventDefault();
          const event = new CustomEvent('open-new-repair', { detail: 'DS' });
          window.dispatchEvent(event);
        }
      } else {
        if (e.key === 'F1') {
          e.preventDefault();
          setRepairType('CS');
        } else if (e.key === 'F3') {
          e.preventDefault();
          setRepairType('DS');
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          if (activeEl?.id === 'select-device-brand') {
            e.preventDefault();
            setShowBrandDropdown(true);
            if (e.key === 'ArrowDown') {
              setHighlightedBrandIndex(prev => Math.min(prev + 1, matchingBrands.length - 1));
            } else {
              setHighlightedBrandIndex(prev => Math.max(prev - 1, 0));
            }
          } else if (activeEl?.id === 'input-device-model') {
            e.preventDefault();
            setShowModelDropdown(true);
            if (e.key === 'ArrowDown') {
              setHighlightedModelIndex(prev => Math.min(prev + 1, matchingModels.length - 1));
            } else {
              setHighlightedModelIndex(prev => Math.max(prev - 1, 0));
            }
          } else if (activeEl?.id === 'select-payment-method') {
            e.preventDefault();
            setShowPaymentDropdown(true);
            if (e.key === 'ArrowDown') {
              setHighlightedPaymentIndex(prev => Math.min(prev + 1, matchingPayments.length - 1));
            } else {
              setHighlightedPaymentIndex(prev => Math.max(prev - 1, 0));
            }
          } else if (!isTyping) {
            e.preventDefault();
            setRepairType(prev => prev === 'CS' ? 'DS' : 'CS');
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setIsOpen(false);
          setShowBrandDropdown(false);
          setShowModelDropdown(false);
          setShowPaymentDropdown(false);
        } else if (e.key === 'F2') {
          e.preventDefault();
          handleSubmit();
        } else if (e.key === 'Backspace') {
          if (activeEl) {
            const val = (activeEl as HTMLInputElement).value;
            if (val === '' || val === undefined || val === null || val === '0') {
              if (activeEl.id === 'input-customer-phone') {
                e.preventDefault();
                document.getElementById('input-customer-name')?.focus();
              } else if (activeEl.id === 'select-device-brand') {
                e.preventDefault();
                document.getElementById('input-customer-phone')?.focus();
              } else if (activeEl.id === 'input-device-model') {
                e.preventDefault();
                document.getElementById('select-device-brand')?.focus();
              } else if (activeEl.id === 'input-device-imei') {
                e.preventDefault();
                document.getElementById('input-device-model')?.focus();
              } else if (activeEl.id === 'textarea-complaint-notes') {
                e.preventDefault();
                document.getElementById('input-device-imei')?.focus();
              } else if (activeEl.id === 'input-advance-paid') {
                e.preventDefault();
                document.getElementById('textarea-complaint-notes')?.focus();
              } else if (activeEl.id === 'select-payment-method') {
                e.preventDefault();
                document.getElementById('input-advance-paid')?.focus();
              }
            }
          }
        } else if (e.key === 'Enter') {
          if (activeEl) {
            if (activeEl.id === 'input-customer-name') {
              e.preventDefault();
              document.getElementById('input-customer-phone')?.focus();
            } else if (activeEl.id === 'input-customer-phone') {
              e.preventDefault();
              document.getElementById('select-device-brand')?.focus();
            } else if (activeEl.id === 'select-device-brand') {
              e.preventDefault();
              if (matchingBrands.length > 0) {
                const selected = matchingBrands[highlightedBrandIndex] || matchingBrands[0];
                setBrand(selected);
              }
              setShowBrandDropdown(false);
              document.getElementById('input-device-model')?.focus();
            } else if (activeEl.id === 'input-device-model') {
              e.preventDefault();
              if (matchingModels.length > 0) {
                const selected = matchingModels[highlightedModelIndex] || matchingModels[0];
                setModel(selected);
              }
              setShowModelDropdown(false);
              document.getElementById('input-device-imei')?.focus();
            } else if (activeEl.id === 'input-device-imei') {
              e.preventDefault();
              document.getElementById('textarea-complaint-notes')?.focus();
            } else if (activeEl.id === 'textarea-complaint-notes') {
              e.preventDefault();
              document.getElementById('input-advance-paid')?.focus();
            } else if (activeEl.id === 'input-advance-paid') {
              e.preventDefault();
              document.getElementById('select-payment-method')?.focus();
            } else if (activeEl.id === 'select-payment-method') {
              e.preventDefault();
              if (matchingPayments.length > 0) {
                const selected = matchingPayments[highlightedPaymentIndex] || matchingPayments[0];
                setPaymentMethod(selected);
              }
              setShowPaymentDropdown(false);
              handleSubmit();
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen, repairType, qcName, qcPhone, brand, model, imei, selectedComplaints, complaintText, advancePaid, paymentMethod,
    showBrandDropdown, highlightedBrandIndex, matchingBrands, showModelDropdown, highlightedModelIndex, matchingModels, showPaymentDropdown, highlightedPaymentIndex, matchingPayments
  ]);

  const toggleComplaint = (item: string) => {
    if (selectedComplaints.includes(item)) {
      setSelectedComplaints(selectedComplaints.filter(c => c !== item));
    } else {
      setSelectedComplaints([...selectedComplaints, item]);
    }
  };

  const toggleAccessory = (item: string) => {
    if (accessories.includes(item)) {
      setAccessories(accessories.filter(a => a !== item));
    } else {
      setAccessories([...accessories, item]);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!qcName.trim()) {
      setErrorMsg('Customer name is required.');
      return;
    }
    if (!qcPhone.trim()) {
      setErrorMsg('Customer phone is required.');
      return;
    }
    if (!model.trim()) {
      setErrorMsg('Device model is required.');
      return;
    }
    if (!imei.trim()) {
      setErrorMsg('IMEI Number is required.');
      return;
    }

    const complaintStr = [
      ...selectedComplaints,
      ...(complaintText ? [complaintText] : [])
    ].join(', ') || 'General diagnostics requested';

    // Calculate dates
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + expectedDays);
    const expectedDeliveryStr = deliveryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    try {
      // Find if customer already exists by phone to prevent duplicates
      let customerObj = customers.find(c => c.phone.replace(/\s/g, '') === qcPhone.replace(/\s/g, ''));
      if (!customerObj) {
        // Register new customer dynamically
        customerObj = await DatabaseService.addCustomer({
          name: qcName,
          phone: qcPhone,
          email: '',
          city: 'Raipur, Chhattisgarh', // Default City
          isVip: false
        });
      }

      const newJob = await DatabaseService.addRepair({
        type: repairType,
        customerId: customerObj.id,
        customerName: customerObj.name,
        customerPhone: customerObj.phone,
        device: {
          brand: brand.trim() || 'Samsung',
          model,
          color: '', // Removed from UI
          imei,
          serial: '' // Removed from UI
        },
        complaint: complaintStr,
        status: repairType === 'CS' ? 'Received' : 'In Repair',
        technician: 'Vikram S.', // Default technician
        expectedDelivery: expectedDeliveryStr,
        estimatedCost: advancePaid, // set estimatedCost to advance paid or 0
        advancePaid,
        accessories: [], // Removed from UI
        condition: {
          scratches: 'None',
          dents: 'None',
          display: 'Working',
          backGlass: 'Clean',
          photos: []
        }
      });

      setSuccessMsg('Repair Job Card created successfully!');
      refreshData();
      setCreatedRepair(newJob);
      
      // Immediately close drawer and show thermal receipt print preview
      setIsOpen(false);
      setShowPrintModal(true);
    } catch (err) {
      setErrorMsg('Error creating job card.');
    }
  };

  return (
    <>
      <ThermalReceiptModal 
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        repair={createdRepair}
      />

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50 transition-all duration-300">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Create New Job Card: {repairType === 'CS' ? 'Check & Service' : 'Direct Service'}
            </h2>
            <p className="text-xs text-slate-400 font-medium">Standardized repair intake wizard</p>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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

          {/* Repair Type Selector */}
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-4.5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Repair Job Type</h3>
            <div className="grid grid-cols-2 gap-2 bg-slate-200/50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setRepairType('CS')}
                className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  repairType === 'CS'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'
                }`}
              >
                Check & Service (CS)
              </button>
              <button
                type="button"
                onClick={() => setRepairType('DS')}
                className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  repairType === 'DS'
                    ? 'bg-green-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'
                }`}
              >
                Direct Service (DS)
              </button>
            </div>
          </div>

          {/* Section 1: Customer Information */}
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-4.5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">1. Customer Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">Customer Name *</label>
                <input 
                  type="text" 
                  id="input-customer-name"
                  autoFocus
                  value={qcName}
                  onChange={(e) => setQcName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">Phone Number *</label>
                <input 
                  type="text" 
                  id="input-customer-phone"
                  value={qcPhone}
                  onChange={(e) => setQcPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Device details */}
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-4.5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">2. Device Specifications</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Brand *</label>
                <input 
                  type="text"
                  id="select-device-brand"
                  autoComplete="off"
                  value={brand}
                  onChange={(e) => {
                    setBrand(e.target.value);
                    setHighlightedBrandIndex(0);
                    setShowBrandDropdown(true);
                  }}
                  onFocus={() => setShowBrandDropdown(true)}
                  onBlur={() => setTimeout(() => setShowBrandDropdown(false), 200)}
                  placeholder="Search or select Brand..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                />

                {showBrandDropdown && matchingBrands.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto py-1">
                    {matchingBrands.map((item, idx) => (
                      <div
                        key={item}
                        onMouseDown={() => {
                          setBrand(item);
                          setShowBrandDropdown(false);
                          document.getElementById('input-device-model')?.focus();
                        }}
                        onMouseEnter={() => setHighlightedBrandIndex(idx)}
                        className={`px-3 py-2 text-xs font-semibold cursor-pointer transition flex items-center justify-between ${
                          idx === highlightedBrandIndex
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{item}</span>
                        {idx === highlightedBrandIndex && (
                          <span className="text-[10px] opacity-75 font-normal">Press ↵</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Model *</label>
                <input 
                  type="text" 
                  id="input-device-model"
                  autoComplete="off"
                  required
                  placeholder={brand ? `Search ${brand} models...` : "Search or type Model..."} 
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value);
                    setHighlightedModelIndex(0);
                    setShowModelDropdown(true);
                  }}
                  onFocus={() => setShowModelDropdown(true)}
                  onBlur={() => setTimeout(() => setShowModelDropdown(false), 200)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                />

                {showModelDropdown && matchingModels.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto py-1">
                    {matchingModels.map((item, idx) => (
                      <div
                        key={item}
                        onMouseDown={() => {
                          setModel(item);
                          setShowModelDropdown(false);
                          document.getElementById('input-device-imei')?.focus();
                        }}
                        onMouseEnter={() => setHighlightedModelIndex(idx)}
                        className={`px-3 py-2 text-xs font-semibold cursor-pointer transition flex items-center justify-between ${
                          idx === highlightedModelIndex
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{item}</span>
                        {idx === highlightedModelIndex && (
                          <span className="text-[10px] opacity-75 font-normal">Press ↵</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">IMEI Number *</label>
                <input 
                  type="text" 
                  id="input-device-imei"
                  placeholder="15-digit IMEI" 
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Complaint */}
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-4.5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">3. Problem Reported</h3>
            
            <div className="flex flex-wrap gap-2">
              {commonComplaints.map(item => {
                const isSelected = selectedComplaints.includes(item);
                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => toggleComplaint(item)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isSelected 
                        ? 'bg-blue-50 border-blue-200 text-blue-600' 
                        : 'bg-white border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Additional Observations / Notes</label>
              <textarea 
                rows={2}
                id="textarea-complaint-notes"
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="Describe any specific issues..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Section 5: Assignment & Estimates */}
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-4.5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">5. Work Routing & Estimates</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Advance Paid (₹)</label>
                <input 
                  type="number" 
                  id="input-advance-paid"
                  value={advancePaid === 0 ? '' : advancePaid}
                  onChange={(e) => setAdvancePaid(e.target.value === '' ? 0 : (parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-green-600"
                />
              </div>
              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Payment Method</label>
                <input 
                  type="text"
                  id="select-payment-method"
                  autoComplete="off"
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    setHighlightedPaymentIndex(0);
                    setShowPaymentDropdown(true);
                  }}
                  onFocus={() => setShowPaymentDropdown(true)}
                  onBlur={() => setTimeout(() => setShowPaymentDropdown(false), 200)}
                  placeholder="Search or select Payment Method..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                />

                {showPaymentDropdown && matchingPayments.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto py-1">
                    {matchingPayments.map((item, idx) => (
                      <div
                        key={item}
                        onMouseDown={() => {
                          setPaymentMethod(item);
                          setShowPaymentDropdown(false);
                          handleSubmit();
                        }}
                        onMouseEnter={() => setHighlightedPaymentIndex(idx)}
                        className={`px-3 py-2 text-xs font-semibold cursor-pointer transition flex items-center justify-between ${
                          idx === highlightedPaymentIndex
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{item}</span>
                        {idx === highlightedPaymentIndex && (
                          <span className="text-[10px] opacity-75 font-normal">Press ↵</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

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
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition cursor-pointer shadow-md shadow-blue-200"
          >
            Create Job Card
          </button>
        </div>
      </div>
    </div>
  )}
</>
  );
};
