import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DatabaseService } from '../services/dbAdapter';
import { Customer } from '../services/mockDb';
import { X, Search, UserPlus, AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';

export const NewRepairDrawer: React.FC = () => {
  const { refreshData, customers } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [repairType, setRepairType] = useState<'CS' | 'DS'>('CS');

  const [qcName, setQcName] = useState('');
  const [qcPhone, setQcPhone] = useState('');
  const [qcCity, setQcCity] = useState('Raipur, Chhattisgarh');

  // Device specs
  const [brand, setBrand] = useState('Samsung');
  const [model, setModel] = useState('');
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
  const [paymentMethod, setPaymentMethod] = useState('UPI');

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
      setModel('');
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
      setPaymentMethod('UPI');
      setErrorMsg('');
      setSuccessMsg('');
      setIsOpen(true);
    };

    window.addEventListener('open-new-repair', handleOpen);
    return () => window.removeEventListener('open-new-repair', handleOpen);
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          city: qcCity,
          isVip: false
        });
      }

      await DatabaseService.addRepair({
        type: repairType,
        customerId: customerObj.id,
        customerName: customerObj.name,
        customerPhone: customerObj.phone,
        device: {
          brand,
          model,
          color,
          imei,
          serial
        },
        complaint: complaintStr,
        status: repairType === 'CS' ? 'Received' : 'In Repair',
        technician,
        expectedDelivery: expectedDeliveryStr,
        estimatedCost,
        advancePaid,
        accessories,
        condition: {
          scratches,
          dents,
          display: displayCond,
          backGlass: backGlassCond,
          photos: []
        }
      });

      setSuccessMsg('Repair Job Card created successfully!');
      refreshData();
      
      // Auto close after 1.5 seconds
      setTimeout(() => {
        setIsOpen(false);
      }, 1500);
    } catch (err) {
      setErrorMsg('Error creating job card.');
    }
  };

  if (!isOpen) return null;

  return (
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">Customer Name *</label>
                <input 
                  type="text" 
                  value={qcName}
                  onChange={(e) => setQcName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">Phone Number *</label>
                <input 
                  type="text" 
                  value={qcPhone}
                  onChange={(e) => setQcPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">City / Area</label>
                <input 
                  type="text" 
                  value={qcCity}
                  onChange={(e) => setQcCity(e.target.value)}
                  placeholder="e.g. Raipur"
                  className="w-full bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Device details */}
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-4.5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">2. Device Specifications</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Brand *</label>
                <select 
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none"
                >
                  <option value="Samsung">Samsung</option>
                  <option value="Apple">Apple</option>
                  <option value="OnePlus">OnePlus</option>
                  <option value="Google">Google</option>
                  <option value="Xiaomi">Xiaomi</option>
                  <option value="Realme">Realme</option>
                  <option value="Redmi">Redmi</option>
                  <option value="Vivo">Vivo</option>
                  <option value="Oppo">Oppo</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Model *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. S24 Ultra, iPhone 13" 
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Color</label>
                <input 
                  type="text" 
                  placeholder="e.g. Space Gray" 
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">IMEI Number (Optional)</label>
                <input 
                  type="text" 
                  placeholder="15-digit IMEI" 
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Serial Number (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Device Serial Number" 
                  value={serial}
                  onChange={(e) => setSerial(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none"
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
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
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
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="Describe any specific issues..."
                className="w-full bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Section 4: Device Visual Condition */}
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-4.5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">4. Intake Device Condition</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Screen Condition</label>
                <input type="text" value={displayCond} onChange={e => setDisplayCond(e.target.value)} className="w-full bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Scratches / Scuffs</label>
                <input type="text" value={scratches} onChange={e => setScratches(e.target.value)} className="w-full bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Dents / Frames</label>
                <input type="text" value={dents} onChange={e => setDents(e.target.value)} className="w-full bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Back Glass</label>
                <input type="text" value={backGlassCond} onChange={e => setBackGlassCond(e.target.value)} className="w-full bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none" />
              </div>
            </div>

            {/* Accessories checklist */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">Accessories Received with Device</label>
              <div className="grid grid-cols-3 gap-2">
                {accessoryOptions.map(item => {
                  const isChecked = accessories.includes(item);
                  return (
                    <button
                      type="button"
                      key={item}
                      onClick={() => toggleAccessory(item)}
                      className={`px-3 py-2 text-left rounded-xl text-[11px] font-semibold border transition flex items-center gap-2 cursor-pointer ${
                        isChecked 
                          ? 'bg-blue-50 border-blue-200 text-blue-600' 
                          : 'bg-white border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <input type="checkbox" checked={isChecked} readOnly className="rounded border-slate-300" />
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 5: Assignment & Estimates */}
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-4.5 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">5. Work Routing & Estimates</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Assign Technician</label>
                <select 
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none"
                >
                  {techniciansList.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Priority Level</label>
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none font-semibold text-slate-700 dark:text-slate-200"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Expected Delivery (Days)</label>
                <input 
                  type="number" 
                  min={1}
                  value={expectedDays}
                  onChange={(e) => setExpectedDays(parseInt(e.target.value) || 1)}
                  className="w-full bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Estimated Cost (₹)</label>
                <input 
                  type="number" 
                  value={estimatedCost === 0 ? '' : estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value === '' ? 0 : (parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none font-bold text-slate-700 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Advance Paid (₹)</label>
                <input 
                  type="number" 
                  value={advancePaid === 0 ? '' : advancePaid}
                  onChange={(e) => setAdvancePaid(e.target.value === '' ? 0 : (parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none font-bold text-green-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">Payment Method</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-700 px-3 py-2 rounded-xl text-xs focus:outline-none"
                >
                  <option value="UPI">UPI (PhonePe/GPay)</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit/Debit Card</option>
                </select>
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
  );
};
