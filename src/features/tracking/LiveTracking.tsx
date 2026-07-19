import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DatabaseService } from '../../services/dbAdapter';
import { RepairJob } from '../../services/mockDb';
import { 
  Tv, 
  Clock, 
  CheckCircle2, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  Maximize2,
  Minimize2,
  Wrench,
  User,
  Play,
  Pause,
  X,
  CheckCircle
} from 'lucide-react';

export const LiveTracking: React.FC = () => {
  const { repairs, inventory, refreshData } = useApp();
  const [time, setTime] = useState(new Date());
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Local state for sidebar workspace drawer
  const [activeRepairId, setActiveRepairId] = useState<string | null>(null);

  // Timer state inside drawer
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
  const activeRepair = repairs.find(r => r.id === activeRepairId) || null;

  // Load inputs when activeRepairId / activeRepair changes
  useEffect(() => {
    if (activeRepair) {
      setObservedIssue(activeRepair.diagnosis?.observedIssue || '');
      setRootCause(activeRepair.diagnosis?.rootCause || '');
      setDiagNotes(activeRepair.diagnosis?.notes || '');
      
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
      setObservedIssue('');
      setRootCause('');
      setDiagNotes('');
      setTests([]);
      setTimerSeconds(0);
    }
  }, [activeRepairId, repairs]);

  // Live Timer ticker
  useEffect(() => {
    let interval: any = null;
    if (timerActive && activeRepairId) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive, activeRepairId]);

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStatusChange = async (status: any) => {
    if (!activeRepair) return;
    await DatabaseService.updateRepairStatus(activeRepair.id, status, `Stage updated to: ${status}`);
    
    // If moved to completed/ready, close drawer since it leaves active tracking queue
    if (status === 'Completed' || status === 'Ready') {
      setActiveRepairId(null);
    }
    refreshData();
  };

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRepair || !selectedPartId) return;

    const item = inventory.find(i => i.id === selectedPartId);
    if (!item || item.available < partQty) return;

    await DatabaseService.consumeInventory(selectedPartId, partQty);
    await DatabaseService.addBillingItem(activeRepair.id, {
      name: item.name,
      description: `${item.brand} ${item.model} spare parts replacement`,
      amount: item.salePrice * partQty
    });

    refreshData();
    setSelectedPartId('');
    setPartQty(1);
  };

  const handleTestChange = async (testName: string, status: 'pass' | 'fail' | 'na') => {
    if (!activeRepair) return;

    const updatedTests = tests.map(t => t.name === testName ? { ...t, status } : t);
    setTests(updatedTests);

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
      if (activeRepair.status === 'Received') {
        await DatabaseService.updateRepairStatus(activeRepair.id, 'Diagnosis', 'Technical diagnosis logs recorded by technician.');
      }
      refreshData();
      alert('Technical diagnosis saved!');
    } else {
      alert('Failed to save diagnosis.');
    }
  };

  // Filter queues - exclude Completed, Ready, Delivered, Cancelled
  const csQueue = repairs.filter(r => 
    r.type === 'CS' && 
    r.status !== 'Delivered' && 
    r.status !== 'Cancelled' && 
    r.status !== 'Completed' && 
    r.status !== 'Ready'
  );
  const dsQueue = repairs.filter(r => 
    r.type === 'DS' && 
    r.status !== 'Delivered' && 
    r.status !== 'Cancelled' && 
    r.status !== 'Completed' && 
    r.status !== 'Ready'
  );

  // Dynamic stats calculation for CS metrics
  const csRecdCount = repairs.filter(r => r.type === 'CS' && r.status === 'Received').length;
  const csDiagCount = repairs.filter(r => r.type === 'CS' && r.status === 'Diagnosis').length;
  const csApprCount = repairs.filter(r => r.type === 'CS' && r.status === 'Waiting Approval').length;
  const csReprCount = repairs.filter(r => r.type === 'CS' && r.status === 'In Repair').length;
  const csCompCount = repairs.filter(r => r.type === 'CS' && (r.status === 'Completed' || r.status === 'Ready')).length;

  // Dynamic stats calculation for DS metrics
  const dsWaitCount = repairs.filter(r => r.type === 'DS' && (r.status === 'Received' || r.status === 'Diagnosis' || r.status === 'Waiting Approval')).length;
  const dsReprCount = repairs.filter(r => r.type === 'DS' && r.status === 'In Repair').length;
  const dsTestCount = repairs.filter(r => r.type === 'DS' && r.status === 'Testing').length;
  const dsCompCount = repairs.filter(r => r.type === 'DS' && (r.status === 'Completed' || r.status === 'Ready')).length;

  // Custom styling generator for responsive cards
  const getCardBgStyle = (status: string, isFull: boolean) => {
    if (isFull) {
      // Dark Mode card backgrounds
      switch (status) {
        case 'In Repair': return 'bg-indigo-950/40 border-l-4 border-l-indigo-500 border border-slate-800 shadow-sm shadow-indigo-950/20';
        case 'Waiting Approval': return 'bg-amber-950/40 border-l-4 border-l-amber-500 border border-slate-800 shadow-sm shadow-amber-950/20 animate-pulse';
        case 'Testing': return 'bg-purple-950/40 border-l-4 border-l-purple-500 border border-slate-800 shadow-sm shadow-purple-950/20';
        case 'Completed': 
        case 'Ready': return 'bg-green-950/40 border-l-4 border-l-green-500 border border-slate-800 shadow-sm shadow-green-950/20';
        default: return 'bg-slate-850/60 border-l-4 border-l-slate-650 border border-slate-800 shadow-sm';
      }
    } else {
      // Light Mode card backgrounds (Embedded)
      switch (status) {
        case 'In Repair': return 'bg-white border-l-4 border-l-indigo-500 border-y border-r border-slate-100 dark:border-slate-800 shadow-xs';
        case 'Waiting Approval': return 'bg-white border-l-4 border-l-amber-500 border-y border-r border-slate-100 dark:border-slate-800 shadow-xs animate-pulse';
        case 'Testing': return 'bg-white border-l-4 border-l-purple-500 border-y border-r border-slate-100 dark:border-slate-800 shadow-xs';
        case 'Completed': 
        case 'Ready': return 'bg-green-50/20 border-l-4 border-l-green-500 border-y border-r border-slate-100 dark:border-slate-800 shadow-xs';
        default: return 'bg-white border-l-4 border-l-slate-300 border-y border-r border-slate-100 dark:border-slate-800 shadow-xs';
      }
    }
  };

  const getStatusTextBadge = (status: string) => {
    switch (status) {
      case 'Received': return <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 text-[9px] font-bold rounded-md uppercase tracking-wider">Received</span>;
      case 'Diagnosis': return <span className="px-2.5 py-0.5 bg-sky-50 text-sky-600 text-[9px] font-bold rounded-md uppercase tracking-wider">Diagnosis</span>;
      case 'Waiting Approval': return <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-bold rounded-md uppercase tracking-wider">Waiting Approval</span>;
      case 'In Repair': return <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-bold rounded-md uppercase tracking-wider">In Repair</span>;
      case 'Testing': return <span className="px-2.5 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-bold rounded-md uppercase tracking-wider">Testing</span>;
      case 'Completed': 
      case 'Ready': return <span className="px-2.5 py-0.5 bg-green-50 text-green-600 text-[9px] font-bold rounded-md uppercase tracking-wider">Ready</span>;
      default: return <span className="px-2.5 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-bold rounded-md uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div 
      className={`flex flex-col text-left transition-all duration-300 select-none ${
        isFullScreen 
          ? 'fixed inset-0 bg-slate-900 text-white z-50 p-8 h-screen overflow-hidden' 
          : 'h-[calc(100vh-6rem)] pb-6 overflow-hidden'
      }`}
    >
      {/* Wallboard Header */}
      <div className={`flex items-center justify-between border-b pb-4 shrink-0 ${isFullScreen ? 'border-slate-800' : 'border-slate-100 dark:border-slate-800'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-200 shrink-0">
            TV
          </div>
          <div>
            <h1 className={`text-xl font-bold tracking-tight ${isFullScreen ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
              Reconnect Mobile Live Tracking Board
            </h1>
            <p className="text-xs font-semibold text-slate-450 mt-0.5">
              Realtime visual monitoring command console
            </p>
          </div>
        </div>

        {/* Live Clock & Fullscreen Switcher */}
        <div className="flex items-center gap-3.5 relative">

          <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold ${isFullScreen ? 'bg-slate-800 text-slate-300' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
            <Clock className="w-4 h-4 text-blue-500 animate-pulse" />
            <span className="font-mono text-xs">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>

          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${isFullScreen ? 'bg-slate-800/50 text-green-400' : 'bg-green-50 text-green-600'}`}>
            <Wifi className="w-4 h-4 text-green-500 animate-bounce" />
            <span>CONNECTED</span>
          </div>

          <button 
            onClick={toggleFullScreen}
            className={`p-2.5 rounded-xl border transition cursor-pointer ${
              isFullScreen 
                ? 'bg-slate-850 border-slate-800 hover:bg-slate-800 text-white hover:border-slate-700' 
                : 'bg-white border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {isFullScreen ? <Minimize2 className="w-4.5 h-4.5" /> : <Maximize2 className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      {/* Main Dual Columns Queue View - flex-1 min-h-0 to lock heights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 py-6">
        
        {/* Column Left: CS Queue */}
        <div className={`rounded-2xl p-5 border flex flex-col min-h-0 ${isFullScreen ? 'bg-slate-850/50 border-slate-800' : 'bg-white border-slate-100 dark:border-slate-800 shadow-sm'}`}>
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800/10 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-6.5 h-6.5 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">CS</span>
              <h2 className={`font-extrabold text-sm ${isFullScreen ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>Check & Service Queue</h2>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isFullScreen ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500 dark:text-slate-400'}`}>
              {csQueue.length} Active Jobs
            </span>
          </div>

          {/* Counts metrics */}
          <div className={`grid grid-cols-5 gap-2 p-2 rounded-xl text-center shrink-0 mt-3 ${isFullScreen ? 'bg-slate-900/60 border border-slate-800 text-slate-400' : 'bg-slate-50 text-slate-550'}`}>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide">Recd</p>
              <p className={`text-xs font-extrabold mt-0.5 ${isFullScreen ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{csRecdCount}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide">Diag</p>
              <p className={`text-xs font-extrabold mt-0.5 ${isFullScreen ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{csDiagCount}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide">Appr</p>
              <p className={`text-xs font-extrabold mt-0.5 ${isFullScreen ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{csApprCount}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide">Repr</p>
              <p className={`text-xs font-extrabold mt-0.5 ${isFullScreen ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{csReprCount}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide">Comp</p>
              <p className={`text-xs font-extrabold mt-0.5 ${isFullScreen ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{csCompCount}</p>
            </div>
          </div>

          {/* Card list container - flex-1 overflow-y-auto to handle scrollbar locally */}
          <div className="space-y-3.5 overflow-y-auto flex-1 min-h-0 pr-1 mt-4">
            {csQueue.map(job => (
              <div 
                key={job.id} 
                onClick={() => {
                  setActiveRepairId(job.id);
                }}
                className={`p-4.5 rounded-2xl flex justify-between gap-4 transition hover:scale-[1.01] cursor-pointer ${getCardBgStyle(job.status, isFullScreen)}`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-extrabold text-xs ${isFullScreen ? 'text-blue-400' : 'text-blue-600'}`}>#{job.id}</span>
                    <span className={`text-[10px] font-bold ${isFullScreen ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>{job.device.brand} {job.device.model}</span>
                  </div>
                  <p className={`font-bold text-xs truncate ${isFullScreen ? 'text-slate-205' : 'text-slate-800 dark:text-slate-100'}`}>Cust: {job.customerName}</p>
                  <p className="text-[10px] text-slate-400 truncate">Complaint: {job.complaint}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span>Tech: {job.technician}</span>
                  </div>
                </div>

                <div className="text-right flex flex-col justify-between items-end shrink-0">
                  {getStatusTextBadge(job.status)}
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-2">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>T: {job.time}</span>
                  </div>
                </div>
              </div>
            ))}
            {csQueue.length === 0 && (
              <p className="text-center py-20 text-slate-400 text-xs font-semibold">No Check & Service repairs live.</p>
            )}
          </div>
        </div>

        {/* Column Right: DS Queue */}
        <div className={`rounded-2xl p-5 border flex flex-col min-h-0 ${isFullScreen ? 'bg-slate-850/50 border-slate-800' : 'bg-white border-slate-100 dark:border-slate-800 shadow-sm'}`}>
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800/10 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-6.5 h-6.5 rounded-lg bg-green-600 text-white font-bold text-xs flex items-center justify-center">DS</span>
              <h2 className={`font-extrabold text-sm ${isFullScreen ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>Direct Service Queue</h2>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isFullScreen ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500 dark:text-slate-400'}`}>
              {dsQueue.length} Active Jobs
            </span>
          </div>

          {/* Counts metrics */}
          <div className={`grid grid-cols-4 gap-2 p-2 rounded-xl text-center shrink-0 mt-3 ${isFullScreen ? 'bg-slate-900/60 border border-slate-800 text-slate-400' : 'bg-slate-50 text-slate-550'}`}>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide">Waiting</p>
              <p className={`text-xs font-extrabold mt-0.5 ${isFullScreen ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{dsWaitCount}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide">In Repair</p>
              <p className={`text-xs font-extrabold mt-0.5 ${isFullScreen ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{dsReprCount}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide">Testing</p>
              <p className={`text-xs font-extrabold mt-0.5 ${isFullScreen ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{dsTestCount}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide">Completed</p>
              <p className={`text-xs font-extrabold mt-0.5 ${isFullScreen ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{dsCompCount}</p>
            </div>
          </div>

          {/* Card list container - flex-1 overflow-y-auto */}
          <div className="space-y-3.5 overflow-y-auto flex-1 min-h-0 pr-1 mt-4">
            {dsQueue.map(job => (
              <div 
                key={job.id} 
                onClick={() => {
                  setActiveRepairId(job.id);
                }}
                className={`p-4.5 rounded-2xl flex justify-between gap-4 transition hover:scale-[1.01] cursor-pointer ${getCardBgStyle(job.status, isFullScreen)}`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-extrabold text-xs ${isFullScreen ? 'text-green-400' : 'text-green-600'}`}>#{job.id}</span>
                    <span className={`text-[10px] font-bold ${isFullScreen ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>{job.device.brand} {job.device.model}</span>
                  </div>
                  <p className={`font-bold text-xs truncate ${isFullScreen ? 'text-slate-205' : 'text-slate-800 dark:text-slate-100'}`}>Cust: {job.customerName}</p>
                  <p className="text-[10px] text-slate-400 truncate">Complaint: {job.complaint}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span>Tech: {job.technician}</span>
                  </div>
                </div>

                <div className="text-right flex flex-col justify-between items-end shrink-0">
                  {getStatusTextBadge(job.status)}
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-2">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>T: {job.time}</span>
                  </div>
                </div>
              </div>
            ))}
            {dsQueue.length === 0 && (
              <p className="text-center py-20 text-slate-400 text-xs font-semibold">No Direct Service repairs live.</p>
            )}
          </div>
        </div>

      </div>

      {/* Wallboard footer stats - shrink-0 to prevent overlapping */}
      <div className={`grid grid-cols-2 md:grid-cols-5 gap-4 p-4.5 rounded-2xl shrink-0 mt-auto ${isFullScreen ? 'bg-slate-850/50 text-slate-350 border border-slate-800' : 'bg-slate-50 border border-slate-100 dark:border-slate-800'}`}>
        <div className="text-center">
          <span className="text-[9px] font-bold uppercase tracking-wider block text-slate-400">Active Queue</span>
          <span className={`text-base font-extrabold mt-1 block ${isFullScreen ? 'text-white' : 'text-slate-850'}`}>
            {csQueue.length + dsQueue.length} Jobs
          </span>
        </div>
        <div className="text-center">
          <span className="text-[9px] font-bold uppercase tracking-wider block text-slate-400">CS In Diagnostics</span>
          <span className={`text-base font-extrabold mt-1 block ${isFullScreen ? 'text-white' : 'text-slate-850'}`}>
            {repairs.filter(r => r.type === 'CS' && r.status === 'Diagnosis').length}
          </span>
        </div>
        <div className="text-center">
          <span className="text-[9px] font-bold uppercase tracking-wider block text-slate-400">DS in Testing</span>
          <span className={`text-base font-extrabold mt-1 block ${isFullScreen ? 'text-white' : 'text-slate-850'}`}>
            {repairs.filter(r => r.type === 'DS' && r.status === 'Testing').length}
          </span>
        </div>
        <div className="text-center">
          <span className="text-[9px] font-bold uppercase tracking-wider block text-slate-400">Completed Today</span>
          <span className={`text-base font-extrabold mt-1 block ${isFullScreen ? 'text-white' : 'text-slate-850'}`}>
            {csCompCount + dsCompCount}
          </span>
        </div>
        <div className="text-center col-span-2 md:col-span-1">
          <span className="text-[9px] font-bold uppercase tracking-wider block text-slate-400">Telemetry Nodes</span>
          <span className="text-xs font-bold text-green-500 mt-2 block flex items-center justify-center gap-1 leading-none">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            <span>Normal</span>
          </span>
        </div>
      </div>

      {/* Side Workspace Drawer */}
      {activeRepair && (
        <>
          {/* Style Injector */}
          <style>{`
            @keyframes slideIn {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
            .animate-slide-in {
              animation: slideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>

          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-45 transition-opacity duration-300 cursor-pointer"
            onClick={() => setActiveRepairId(null)}
          />

          {/* Slide-out Panel */}
          <div className="fixed right-0 top-0 h-full w-[460px] max-w-full bg-slate-50 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-2xl z-50 flex flex-col animate-slide-in text-left text-xs text-slate-700 dark:text-slate-200">
            {/* Drawer Header */}
            <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Job: #{activeRepair.id}</h3>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    activeRepair.type === 'CS' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'bg-green-50 text-green-600'
                  }`}>
                    {activeRepair.type === 'CS' ? 'CS' : 'DS'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Technician: {activeRepair.technician}</p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Timer */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 px-2 py-1 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200">{formatTimer(timerSeconds)}</span>
                  <button 
                    onClick={() => setTimerActive(!timerActive)}
                    className="w-5 h-5 rounded bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-750 transition cursor-pointer"
                  >
                    {timerActive ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                  </button>
                </div>
                
                <button 
                  onClick={() => setActiveRepairId(null)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 transition cursor-pointer"
                  title="Deselect Repair"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              
              {/* Specs */}
              <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
                <span className="font-bold text-slate-705 uppercase tracking-wider text-[9px] block border-b border-slate-100 dark:border-slate-800 pb-1.5">Intake Specifications</span>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-650">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block">Brand Model</span>
                    <span className="font-bold text-slate-850 mt-0.5 block">{activeRepair.device.brand} {activeRepair.device.model} ({activeRepair.device.color || 'No Color'})</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block">IMEI / Serial</span>
                    <span className="font-bold text-slate-850 mt-0.5 block">{activeRepair.device.imei || 'N/A'}</span>
                  </div>
                  <div className="col-span-2 p-2 bg-red-50/20 border border-red-50 rounded-lg">
                    <span className="text-[8px] font-bold text-red-500 uppercase tracking-wider block">Complaint</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 mt-0.5 block leading-normal">{activeRepair.complaint}</span>
                  </div>
                </div>
              </div>

              {/* Status workflow */}
              <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
                <span className="font-bold text-slate-705 uppercase tracking-wider text-[9px] block border-b border-slate-100 dark:border-slate-800 pb-1.5">Repair Status Workflow</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {['Received', 'Diagnosis', 'Waiting Approval', 'In Repair', 'Testing'].map(stage => {
                    const isCurrent = activeRepair.status === stage;
                    return (
                      <button
                        key={stage}
                        onClick={() => handleStatusChange(stage as any)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-[10px] text-left transition flex items-center justify-between cursor-pointer border ${
                          isCurrent 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                            : 'bg-slate-50 border-slate-150/40 hover:bg-slate-105 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <span>{stage}</span>
                        {isCurrent && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handleStatusChange('Completed')}
                    className="col-span-2 px-3 py-1.5 rounded-lg font-bold text-[10px] text-center transition flex items-center justify-center gap-1.5 cursor-pointer border bg-green-600 hover:bg-green-700 border-green-600 text-white shadow-sm"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-white" />
                    <span>Mark as Done (Completed)</span>
                  </button>
                </div>
              </div>

              {/* Diagnosis Form */}
              <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 rounded-xl p-3.5 space-y-3 shadow-2xs">
                <span className="font-bold text-slate-705 uppercase tracking-wider text-[9px] block border-b border-slate-100 dark:border-slate-800 pb-1.5">Technical Diagnosis</span>
                <div className="space-y-2.5 text-xs font-semibold text-slate-650">
                  <div>
                    <label className="block text-[9px] text-slate-455 font-bold mb-1">Observed Issue *</label>
                    <input 
                      type="text" 
                      value={observedIssue}
                      onChange={e => setObservedIssue(e.target.value)}
                      placeholder="Observed issue description"
                      className="w-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-slate-750 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-455 font-bold mb-1">Root Cause *</label>
                    <input 
                      type="text" 
                      value={rootCause}
                      onChange={e => setRootCause(e.target.value)}
                      placeholder="Root cause description"
                      className="w-full border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-slate-755 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-455 font-bold mb-1">Diagnosis Notes</label>
                    <textarea 
                      rows={2}
                      value={diagNotes}
                      onChange={e => setDiagNotes(e.target.value)}
                      placeholder="Motherboard voltage patterns, reballing profiles..."
                      className="w-full border border-slate-200 dark:border-slate-700 p-2 rounded-lg text-slate-750 focus:outline-none resize-none font-medium text-[11px]"
                    />
                  </div>
                  <button 
                    onClick={handleSaveDiagnosis}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer shadow-xs transition"
                  >
                    Save Technical Diagnosis
                  </button>
                </div>
              </div>

              {/* QA Checklist */}
              <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
                <span className="font-bold text-slate-705 uppercase tracking-wider text-[9px] block border-b border-slate-100 dark:border-slate-800 pb-1.5">QA Testing Checklist</span>
                <div className="grid grid-cols-2 gap-2">
                  {tests.map(test => (
                    <div key={test.name} className="flex justify-between items-center text-xs font-bold text-slate-705">
                      <span>{test.name}</span>
                      
                      <div className="flex gap-1 p-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-md shrink-0">
                        <button 
                          onClick={() => handleTestChange(test.name, 'pass')}
                          className={`px-1.5 py-0.5 rounded text-[8px] transition cursor-pointer ${
                            test.status === 'pass' ? 'bg-green-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-650'
                          }`}
                        >
                          P
                        </button>
                        <button 
                          onClick={() => handleTestChange(test.name, 'fail')}
                          className={`px-1.5 py-0.5 rounded text-[8px] transition cursor-pointer ${
                            test.status === 'fail' ? 'bg-red-500 text-white shadow-xs' : 'text-slate-400 hover:text-slate-650'
                          }`}
                        >
                          F
                        </button>
                        <button 
                          onClick={() => handleTestChange(test.name, 'na')}
                          className={`px-1.5 py-0.5 rounded text-[8px] transition cursor-pointer ${
                            test.status === 'na' ? 'bg-slate-200 text-slate-650' : 'text-slate-450'
                          }`}
                        >
                          -
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spare Parts deduction */}
              <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
                <span className="font-bold text-slate-705 uppercase tracking-wider text-[9px] block border-b border-slate-100 dark:border-slate-800 pb-1.5">Spare Parts Consumption</span>
                <form onSubmit={handleAddPart} className="flex gap-1.5">
                  <div className="flex-1">
                    <select 
                      value={selectedPartId}
                      onChange={e => setSelectedPartId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1.5 rounded-lg text-[9px] font-bold text-slate-705 focus:outline-none"
                    >
                      <option value="">-- Choose Spare --</option>
                      {inventory.filter(item => (item.location || 'Main Stock') === 'Main Stock').map(item => (
                        <option 
                          key={item.id} 
                          value={item.id}
                          disabled={item.available <= 0}
                        >
                          {item.name} ({item.brand} {item.model})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="w-12">
                    <input 
                      type="number" 
                      min={1}
                      value={partQty}
                      onChange={e => setPartQty(parseInt(e.target.value) || 1)}
                      className="w-full border border-slate-200 dark:border-slate-700 px-1 py-1.5 rounded-lg text-[9px] font-bold text-center focus:outline-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={!selectedPartId}
                    className={`px-2.5 py-1.5 text-[9px] font-bold rounded-lg cursor-pointer transition ${
                      selectedPartId 
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-450 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Add
                  </button>
                </form>

                {/* List of currently consumed parts */}
                <div className="space-y-1 text-xs font-semibold text-slate-650 pt-1">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Consumed Spares</p>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 dark:divide-slate-800 max-h-32 overflow-y-auto pr-1">
                    {activeRepair.billingItems.filter(item => item.id.startsWith('BILL-') || item.name !== 'Labour Charges').map((item, i) => (
                      <div key={i} className="py-1 flex justify-between items-center text-[11px]">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{item.name}</p>
                          <p className="text-[8px] text-slate-400 mt-0.5">{item.description}</p>
                        </div>
                        <span className="font-extrabold text-slate-800 dark:text-slate-100 text-[10px]">₹{item.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
};
