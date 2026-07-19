import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DatabaseService } from '../../services/dbAdapter';
import { RepairJob, InventoryItem } from '../../services/mockDb';
import { 
  Play, 
  Pause, 
  Clock, 
  Phone, 
  User, 
  Smartphone, 
  AlertCircle, 
  Plus, 
  X, 
  CheckCircle,
  Activity,
  CheckCircle2
} from 'lucide-react';

export const TechnicianWorkspace: React.FC = () => {
  const { repairs, inventory, refreshData, selectedRepairId, setSelectedRepairId } = useApp();

  const [activeRepair, setActiveRepair] = useState<RepairJob | null>(null);

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(true);

  // Helper to convert receivedAt (e.g. "18 Jul 2026") and time (e.g. "14:30") to Date
  const getRepairStartTimestamp = (receivedAt: string, timeStr: string): Date => {
    try {
      const parts = (receivedAt || '').trim().split(' ');
      let day = new Date().getDate();
      let monthIndex = new Date().getMonth();
      let year = new Date().getFullYear();
      
      if (parts.length === 3) {
        day = parseInt(parts[0]);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        monthIndex = months.indexOf(parts[1]);
        year = parseInt(parts[2]);
      }

      let hours = 0;
      let minutes = 0;
      const cleanTime = (timeStr || '').trim().toUpperCase();
      const isPm = cleanTime.includes('PM');
      const isAm = cleanTime.includes('AM');
      
      const timeNumbers = cleanTime.replace('AM', '').replace('PM', '').trim().split(':');
      if (timeNumbers.length >= 2) {
        hours = parseInt(timeNumbers[0]);
        minutes = parseInt(timeNumbers[1]);
        if (isPm && hours < 12) hours += 12;
        if (isAm && hours === 12) hours = 0;
      }
      
      return new Date(year, monthIndex, day, hours, minutes, 0);
    } catch (e) {
      return new Date();
    }
  };

  // Diagnosis inputs
  const [observedIssue, setObservedIssue] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [diagNotes, setDiagNotes] = useState('');

  // Parts selector state
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQty, setPartQty] = useState(1);

  // Tests checklist local states
  const [tests, setTests] = useState<{ name: string; status: 'pass' | 'fail' | 'na' }[]>([]);

  const testsList = ['Power', 'Charging', 'Display', 'Touch', 'Speaker', 'Microphone', 'Camera', 'WiFi'];

  const activeStatuses = ['Received', 'Diagnosis', 'Waiting Approval', 'In Repair', 'Testing'];

  useEffect(() => {
    if (selectedRepairId) {
      const rep = repairs.find(r => r.id === selectedRepairId);
      // If the selected repair is no longer in an active state, deselect it
      if (rep && !activeStatuses.includes(rep.status)) {
        setActiveRepair(null);
        setSelectedRepairId(null as any);
        return;
      }
      if (rep) setActiveRepair(rep);
    } else {
      setActiveRepair(null);
    }
  }, [selectedRepairId, repairs]);

  // Load inputs when activeRepair changes
  useEffect(() => {
    if (activeRepair) {
      setObservedIssue(activeRepair.diagnosis?.observedIssue || '');
      setRootCause(activeRepair.diagnosis?.rootCause || '');
      setDiagNotes(activeRepair.diagnosis?.notes || '');
      
      // Load tests
      const tState = testsList.map(name => {
        const existing = activeRepair.tests?.find(t => t.name === name);
        return {
          name,
          status: existing ? existing.status : 'na' as 'pass' | 'fail' | 'na'
        };
      });
      setTests(tState);

      // Initialize elapsed timer from received time
      const start = getRepairStartTimestamp(activeRepair.receivedAt, activeRepair.time);
      const elapsed = Math.max(0, Math.floor((new Date().getTime() - start.getTime()) / 1000));
      setTimerSeconds(elapsed);
    } else {
      setTimerSeconds(0);
    }
  }, [activeRepair]);

  // Live Timer ticker
  useEffect(() => {
    let interval: any = null;
    if (timerActive) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStatusChange = async (status: RepairJob['status']) => {
    if (!activeRepair) return;
    await DatabaseService.updateRepairStatus(activeRepair.id, status, `Stage updated to: ${status}`);
    refreshData();
  };

  const handleAddPart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!activeRepair || !selectedPartId) return;

    const item = inventory.find(i => i.id === selectedPartId);
    if (!item || item.available < partQty) return;

    // Deduct stock
    await DatabaseService.consumeInventory(selectedPartId, partQty);
    
    // Add billing item
    await DatabaseService.addBillingItem(activeRepair.id, {
      name: item.name,
      description: `${item.brand} ${item.model} spare parts replacement`,
      amount: item.salePrice * partQty
    });

    refreshData();
    setSelectedPartId('');
  };

  const handleTestChange = async (testName: string, status: 'pass' | 'fail' | 'na') => {
    if (!activeRepair) return;

    const updatedTests = tests.map(t => t.name === testName ? { ...t, status } : t);
    setTests(updatedTests);

    // Save tests to repair object in cloud
    await DatabaseService.saveRepairTests(activeRepair.id, updatedTests);
    refreshData();
  };

  const handleSaveDiagnosis = async () => {
    if (!activeRepair) return;

    const success = await DatabaseService.saveRepairDiagnosis(activeRepair.id, {
      observedIssue,
      rootCause,
      notes: diagNotes
    });

    if (success) {
      // Auto move status to Diagnosis if it was in Received
      if (activeRepair.status === 'Received') {
        await DatabaseService.updateRepairStatus(activeRepair.id, 'Diagnosis', 'Technical diagnosis logs recorded by technician.');
      }
      refreshData();
      alert('Technical diagnosis saved!');
    } else {
      alert('Failed to save diagnosis.');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top: CS and DS Queue Tables side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CS Queue */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
            <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">CS</span>
            <span className="font-bold text-slate-800 text-sm">Check & Service</span>
            <span className="ml-auto text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {repairs.filter(r => r.type === 'CS' && r.status !== 'Delivered' && r.status !== 'Cancelled' && r.status !== 'Completed' && r.status !== 'Ready').length}
            </span>
          </div>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50">
                  <th className="py-2">Job ID</th>
                  <th className="py-2">Device</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Technician</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                {repairs.filter(r => r.type === 'CS' && r.status !== 'Delivered' && r.status !== 'Cancelled' && r.status !== 'Completed' && r.status !== 'Ready').length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-slate-400 text-xs font-semibold">No active CS jobs.</td></tr>
                ) : (
                  repairs.filter(r => r.type === 'CS' && r.status !== 'Delivered' && r.status !== 'Cancelled' && r.status !== 'Completed' && r.status !== 'Ready').map(r => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRepairId(r.id)}
                      className={`cursor-pointer transition ${activeRepair?.id === r.id ? 'bg-blue-50/50' : 'hover:bg-slate-50/50'}`}
                    >
                      <td className="py-2.5 font-bold text-slate-800">#{r.id}</td>
                      <td className="py-2.5">{r.device.brand} {r.device.model}</td>
                      <td className="py-2.5 text-slate-500">{r.customerName}</td>
                      <td className="py-2.5">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600">{r.status}</span>
                      </td>
                      <td className="py-2.5 text-slate-500">{r.technician}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DS Queue */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
            <span className="w-6 h-6 rounded-lg bg-green-600 text-white flex items-center justify-center text-[10px] font-bold">DS</span>
            <span className="font-bold text-slate-800 text-sm">Direct Service</span>
            <span className="ml-auto text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              {repairs.filter(r => r.type === 'DS' && r.status !== 'Delivered' && r.status !== 'Cancelled' && r.status !== 'Completed' && r.status !== 'Ready').length}
            </span>
          </div>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50">
                  <th className="py-2">Job ID</th>
                  <th className="py-2">Device</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Technician</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                {repairs.filter(r => r.type === 'DS' && r.status !== 'Delivered' && r.status !== 'Cancelled' && r.status !== 'Completed' && r.status !== 'Ready').length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-slate-400 text-xs font-semibold">No active DS jobs.</td></tr>
                ) : (
                  repairs.filter(r => r.type === 'DS' && r.status !== 'Delivered' && r.status !== 'Cancelled' && r.status !== 'Completed' && r.status !== 'Ready').map(r => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRepairId(r.id)}
                      className={`cursor-pointer transition ${activeRepair?.id === r.id ? 'bg-green-50/50' : 'hover:bg-slate-50/50'}`}
                    >
                      <td className="py-2.5 font-bold text-slate-800">#{r.id}</td>
                      <td className="py-2.5">{r.device.brand} {r.device.model}</td>
                      <td className="py-2.5 text-slate-500">{r.customerName}</td>
                      <td className="py-2.5">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600">{r.status}</span>
                      </td>
                      <td className="py-2.5 text-slate-500">{r.technician}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {activeRepair ? (
        /* Workspace Main Body */
        <div className="space-y-6">
          {/* Header Dashboard panel */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-extrabold text-slate-800">Job: #{activeRepair.id}</h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  activeRepair.type === 'CS' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                }`}>
                  {activeRepair.type === 'CS' ? 'Check & Service' : 'Direct Service'}
                </span>
                <span className="px-1.5 py-0.5 bg-red-50 text-red-500 text-[10px] font-bold rounded">
                  High Priority
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-1">Technician: {activeRepair.technician} • Expected: {activeRepair.expectedDelivery}</p>
            </div>

            {/* Timer Panel */}
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl">
              <Clock className="w-5 h-5 text-slate-400" />
              <div className="text-left">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Elapsed Repair Time</span>
                <span className="font-mono text-sm font-extrabold text-slate-800 tracking-tight">{formatTimer(timerSeconds)}</span>
              </div>
              <button 
                onClick={() => setTimerActive(!timerActive)}
                className="w-7.5 h-7.5 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition cursor-pointer shrink-0"
              >
                {timerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Details split grids */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Columns: Diagnosis inputs */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Box 1: Device specifications & complaints */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-50">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-blue-500" />
                    <span>Intake Specifications</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Reported Customer Complaints</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide">Brand & Model</span>
                    <p className="font-bold text-slate-800 mt-1">{activeRepair.device.brand} {activeRepair.device.model} ({activeRepair.device.color || 'No Color'})</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide">IMEI / Serial</span>
                    <p className="font-bold text-slate-850 mt-1">IMEI: {activeRepair.device.imei || 'N/A'}</p>
                  </div>
                  <div className="col-span-2 p-3 bg-red-50/30 border border-red-50 rounded-xl">
                    <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Customer Complaint</span>
                    <p className="font-bold text-slate-700 mt-1">{activeRepair.complaint}</p>
                  </div>
                </div>
              </div>

              {/* Box 2: Diagnosis Section */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="pb-2.5 border-b border-slate-50">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Technical Diagnosis</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Record exact observations and repair strategies</p>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-500 mb-1.5">Observed Issue / Symptom *</label>
                    <input 
                      type="text" 
                      value={observedIssue}
                      onChange={e => setObservedIssue(e.target.value)}
                      placeholder="e.g. Substantial current draw, power IC short"
                      className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-700 font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-500 mb-1.5">Root Cause Description *</label>
                    <input 
                      type="text" 
                      value={rootCause}
                      onChange={e => setRootCause(e.target.value)}
                      placeholder="e.g. PMIC short-circuited due to cheap charger adapter"
                      className="w-full border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-700 font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-500 mb-1.5">Internal Repair Strategy / Notes</label>
                    <textarea 
                      rows={3}
                      value={diagNotes}
                      onChange={e => setDiagNotes(e.target.value)}
                      placeholder="Enter reballing profiles, motherboard voltages or jumper details..."
                      className="w-full border border-slate-200 p-3 rounded-xl focus:outline-none resize-none"
                    />
                  </div>
                  
                  <button 
                    onClick={handleSaveDiagnosis}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl cursor-pointer shadow-xs transition"
                  >
                    Save Technical Diagnosis
                  </button>
                </div>
              </div>

              {/* Box 3: Parts consumed */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="pb-2.5 border-b border-slate-50">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Spare Parts Consumption</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Deduct spare parts directly from active inventory</p>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <select 
                      value={selectedPartId}
                      onChange={e => setSelectedPartId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                    >
                      <option value="">-- Choose inventory item --</option>
                      {inventory.filter(item => (item.location || 'Main Stock') === 'Main Stock').map(item => (
                        <option 
                          key={item.id} 
                          value={item.id}
                          disabled={item.available <= 0}
                        >
                          {item.name} ({item.brand} {item.model}) - {item.available} available
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="w-20">
                    <input 
                      type="number" 
                      min={1}
                      value={partQty}
                      onChange={e => setPartQty(parseInt(e.target.value) || 1)}
                      className="w-full border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-center focus:outline-none"
                    />
                  </div>

                  <button 
                    onClick={handleAddPart}
                    disabled={!selectedPartId}
                    className={`px-4.5 py-2.5 text-xs font-bold rounded-xl cursor-pointer transition ${
                      selectedPartId 
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    }`}
                  >
                    Add Part
                  </button>
                </div>

                {/* List of currently consumed parts */}
                <div className="space-y-2 text-xs">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Added Parts for this repair</h4>
                  <div className="divide-y divide-slate-50">
                    {activeRepair.billingItems.filter(item => item.id.startsWith('BILL-') || item.name !== 'Labour Charges').map((item, i) => (
                      <div key={i} className="py-2.5 flex justify-between items-center font-semibold text-slate-700">
                        <div>
                          <p>{item.name}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{item.description}</p>
                        </div>
                        <span className="font-bold text-slate-800">₹{item.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Workflow stages & Testing Checklists */}
            <div className="space-y-6">
              
              {/* Widget 1: Status stages */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-50 pb-2">Repair Status Workflow</h3>
                
                <div className="space-y-2 flex flex-col">
                  {['Received', 'Diagnosis', 'Waiting Approval', 'In Repair', 'Testing', 'Completed'].map(stage => {
                    const isCurrent = activeRepair.status === stage;
                    return (
                      <button
                        key={stage}
                        onClick={() => handleStatusChange(stage as any)}
                        className={`w-full px-4 py-2.5 rounded-xl font-bold text-xs text-left transition flex items-center justify-between cursor-pointer ${
                          isCurrent 
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-150' 
                            : 'bg-slate-50 hover:bg-slate-100 border border-slate-100/50 text-slate-600'
                        }`}
                      >
                        <span>{stage}</span>
                        {isCurrent && <CheckCircle className="w-4 h-4 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Widget 2: QA Testing checklist */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-50 pb-2">QA testing checklist</h3>
                
                <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                  {tests.map(test => (
                    <div key={test.name} className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>{test.name}</span>
                      
                      <div className="flex gap-1.5 p-0.5 bg-slate-50 border border-slate-100 rounded-lg shrink-0">
                        <button 
                          onClick={() => handleTestChange(test.name, 'pass')}
                          className={`px-2 py-1 rounded text-[9px] transition cursor-pointer ${
                            test.status === 'pass' ? 'bg-green-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Pass
                        </button>
                        <button 
                          onClick={() => handleTestChange(test.name, 'fail')}
                          className={`px-2 py-1 rounded text-[9px] transition cursor-pointer ${
                            test.status === 'fail' ? 'bg-red-500 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Fail
                        </button>
                        <button 
                          onClick={() => handleTestChange(test.name, 'na')}
                          className={`px-2 py-1 rounded text-[9px] transition cursor-pointer ${
                            test.status === 'na' ? 'bg-slate-200 text-slate-600' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          N/A
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Widget 3: Live Timeline logs */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-50 pb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span>Repair Timeline</span>
                </h3>
                
                <div className="space-y-4 max-h-56 overflow-y-auto pr-1 text-left relative pl-4 border-l border-slate-100">
                  {activeRepair.timeline.slice().reverse().map((evt, i) => (
                    <div key={i} className="text-xs relative space-y-0.5">
                      <div className="absolute -left-6.5 top-0.5 w-3 h-3 bg-blue-500 border-2 border-white rounded-full"></div>
                      <p className="font-bold text-slate-700">{evt.status}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{evt.date} at {evt.time} • {evt.user}</p>
                      <p className="text-slate-500 text-[11px] mt-1 leading-normal font-medium">{evt.notes}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl p-10 shadow-sm flex items-center justify-center">
          <p className="text-slate-400 text-sm font-semibold">Select a repair job from the tables above to view details.</p>
        </div>
      )}
    </div>
  );
};
