import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MockDatabase, RepairJob } from '../../services/mockDb';
import { 
  FileText, 
  TrendingUp, 
  Wrench, 
  ClipboardCheck, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Search,
  DollarSign,
  UserPlus
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { repairs, activities, refreshData, setActiveTab, setSelectedRepairId, setSelectedCustomerId, session, customers } = useApp();

  const userName = session?.user?.user_metadata?.display_name || session?.user?.email?.split('@')[0] || 'User';

  // Dynamic At a Glance calculations
  const totalCollection = repairs.reduce((acc, curr) => acc + curr.advancePaid, 0);
  const totalPending = repairs.reduce((acc, curr) => acc + curr.remainingBalance, 0);
  const newCustomersCount = customers.length;
  const avgRepairTime = repairs.length > 0 ? "1h 30m" : "N/A";

  // Dynamic KPI counts
  const totalJobsCount = repairs.length;
  const completedCount = repairs.filter(r => r.status === 'Completed' || r.status === 'Ready' || r.status === 'Delivered').length;
  const inRepairCount = repairs.filter(r => r.status === 'In Repair').length;
  const waitingApprovalCount = repairs.filter(r => r.status === 'Waiting Approval').length;
  const readyCount = repairs.filter(r => (r.status === 'Completed' || r.status === 'Ready') && r.remainingBalance > 0).length;
  const criticalCount = repairs.filter(r => r.status === 'Diagnosis').length;

  // CS status counts
  const csReceived = repairs.filter(r => r.type === 'CS' && r.status === 'Received').length;
  const csDiagnosis = repairs.filter(r => r.type === 'CS' && r.status === 'Diagnosis').length;
  const csApproval = repairs.filter(r => r.type === 'CS' && r.status === 'Waiting Approval').length;
  const csInRepair = repairs.filter(r => r.type === 'CS' && r.status === 'In Repair').length;
  const csCompleted = repairs.filter(r => r.type === 'CS' && (r.status === 'Completed' || r.status === 'Ready')).length;

  // DS status counts
  const dsWaiting = repairs.filter(r => r.type === 'DS' && r.status === 'Received').length;
  const dsInRepair = repairs.filter(r => r.type === 'DS' && r.status === 'In Repair').length;
  const dsTesting = repairs.filter(r => r.type === 'DS' && r.status === 'Testing').length;
  const dsCompleted = repairs.filter(r => r.type === 'DS' && (r.status === 'Completed' || r.status === 'Ready')).length;

  // Filter local queue lists based on type (CS or DS) and active states (exclude Completed/Ready/Delivered/Cancelled for queue display)
  const csQueue = repairs.filter(r => r.type === 'CS' && r.status !== 'Delivered' && r.status !== 'Cancelled' && r.status !== 'Completed' && r.status !== 'Ready').slice(0, 5);
  const dsQueue = repairs.filter(r => r.type === 'DS' && r.status !== 'Delivered' && r.status !== 'Cancelled' && r.status !== 'Completed' && r.status !== 'Ready').slice(0, 5);

  // Ready for delivery list (Completed/Ready status, unpaid or pending collection)
  const readyForDelivery = repairs.filter(r => (r.status === 'Completed' || r.status === 'Ready') && r.remainingBalance > 0).slice(0, 5);

  // Sparkline data generator for visual perfection
  const renderSparkline = (stroke: string, type: 'up' | 'down' | 'flat') => {
    const points = type === 'up' 
      ? '0,25 15,20 30,22 45,10 60,15 75,5 90,8' 
      : type === 'down' 
      ? '0,5 15,12 30,10 45,18 60,12 75,22 90,25'
      : '0,15 15,15 30,17 45,12 60,18 75,14 90,15';
    return (
      <svg className="w-16 h-8 shrink-0 overflow-visible" viewBox="0 0 90 30">
        <polyline
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Received': return <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full">Received</span>;
      case 'Diagnosis': return <span className="px-2 py-0.5 bg-sky-50 text-sky-600 text-[10px] font-bold rounded-full">Diagnosis</span>;
      case 'Waiting Approval': return <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full">Waiting Approval</span>;
      case 'In Repair': return <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full">In Repair</span>;
      case 'Testing': return <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-bold rounded-full">Testing</span>;
      case 'Completed': return <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full">Completed</span>;
      default: return <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-full">{status}</span>;
    }
  };

  const handleRowClick = (repairId: string) => {
    setSelectedRepairId(repairId);
    setActiveTab('repairs');
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Greetings Header */}
      <div className="text-left">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Good morning, {userName} 👋</h1>
        <p className="text-sm text-slate-400 font-medium mt-1">Here's what's happening in your repair shop today.</p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* KPI 1 */}
        <div className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5 text-slate-400">
            <FileText className="w-4 h-4 text-blue-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Jobs Today</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-800 mt-3">{totalJobsCount}</p>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ClipboardCheck className="w-4 h-4 text-green-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-800 mt-3">{completedCount}</p>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Wrench className="w-4 h-4 text-indigo-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider">In Repair</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-800 mt-3">{inRepairCount}</p>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Waiting Approval</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-800 mt-3">{waitingApprovalCount}</p>
        </div>

        {/* KPI 5 */}
        <div className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Ready for Delivery</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-800 mt-3">{readyCount}</p>
        </div>

        {/* KPI 6 */}
        <div className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5 text-slate-400">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Critical Delays</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-800 mt-3">{criticalCount}</p>
        </div>
      </div>

      {/* Main Queues Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: CS Queue */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col text-left">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                CS
              </div>
              <span className="font-bold text-slate-800 text-sm">CS — Check & Service</span>
            </div>
            <button onClick={() => setActiveTab('repairs')} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer">
              View All →
            </button>
          </div>

          {/* Counts summary inside queue header */}
          <div className="grid grid-cols-5 gap-2 bg-slate-50 p-2.5 rounded-xl text-center">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Received</p>
              <p className="text-sm font-extrabold text-slate-700 mt-0.5">{csReceived}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Diagnosis</p>
              <p className="text-sm font-extrabold text-slate-700 mt-0.5">{csDiagnosis}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Approval</p>
              <p className="text-sm font-extrabold text-slate-700 mt-0.5">{csApproval}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">In Repair</p>
              <p className="text-sm font-extrabold text-slate-700 mt-0.5">{csInRepair}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Completed</p>
              <p className="text-sm font-extrabold text-slate-700 mt-0.5">{csCompleted}</p>
            </div>
          </div>

          {/* Live CS Jobs table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50">
                  <th className="py-2.5">Job ID</th>
                  <th className="py-2.5">Device</th>
                  <th className="py-2.5">Customer</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Technician</th>
                  <th className="py-2.5">Time</th>
                  <th className="py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                {csQueue.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs font-semibold">
                      No repairs in CS queue.
                    </td>
                  </tr>
                ) : (
                  csQueue.map((job) => (
                    <tr 
                      key={job.id} 
                      onClick={() => handleRowClick(job.id)}
                      className="hover:bg-slate-50/50 cursor-pointer transition"
                    >
                      <td className="py-3 font-bold text-slate-800">#{job.id}</td>
                      <td className="py-3">{job.device.brand} {job.device.model}</td>
                      <td className="py-3 text-slate-500">{job.customerName}</td>
                      <td className="py-3">{getStatusBadge(job.status)}</td>
                      <td className="py-3 text-slate-500">{job.technician}</td>
                      <td className="py-3 text-slate-400">{job.time}</td>
                      <td className="py-3 text-slate-300 text-right"><ArrowRight className="w-3.5 h-3.5 inline" /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: DS Queue */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col text-left">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-green-50 text-green-600 flex items-center justify-center font-bold text-xs shrink-0">
                DS
              </div>
              <span className="font-bold text-slate-800 text-sm">DS — Direct Service</span>
            </div>
            <button onClick={() => setActiveTab('repairs')} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer">
              View All →
            </button>
          </div>

          {/* Counts summary inside queue header */}
          <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl text-center">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Waiting</p>
              <p className="text-sm font-extrabold text-slate-700 mt-0.5">{dsWaiting}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">In Repair</p>
              <p className="text-sm font-extrabold text-slate-700 mt-0.5">{dsInRepair}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Testing</p>
              <p className="text-sm font-extrabold text-slate-700 mt-0.5">{dsTesting}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Completed</p>
              <p className="text-sm font-extrabold text-slate-700 mt-0.5">{dsCompleted}</p>
            </div>
          </div>

          {/* Live DS Jobs table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50">
                  <th className="py-2.5">Job ID</th>
                  <th className="py-2.5">Device</th>
                  <th className="py-2.5">Customer</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Technician</th>
                  <th className="py-2.5">Time</th>
                  <th className="py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                {dsQueue.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs font-semibold">
                      No repairs in DS queue.
                    </td>
                  </tr>
                ) : (
                  dsQueue.map((job) => (
                    <tr 
                      key={job.id} 
                      onClick={() => handleRowClick(job.id)}
                      className="hover:bg-slate-50/50 cursor-pointer transition"
                    >
                      <td className="py-3 font-bold text-slate-800">#{job.id}</td>
                      <td className="py-3">{job.device.brand} {job.device.model}</td>
                      <td className="py-3 text-slate-500">{job.customerName}</td>
                      <td className="py-3">{getStatusBadge(job.status)}</td>
                      <td className="py-3 text-slate-500">{job.technician}</td>
                      <td className="py-3 text-slate-400">{job.time}</td>
                      <td className="py-3 text-slate-300 text-right"><ArrowRight className="w-3.5 h-3.5 inline" /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Column 3: Ready for Delivery Queue */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col text-left">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0">
                RD
              </div>
              <span className="font-bold text-slate-800 text-sm">Ready for Delivery</span>
            </div>
          </div>

          {/* Counts summary inside queue header */}
          <div className="bg-slate-50 p-2.5 rounded-xl text-center flex items-center justify-between px-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Awaiting Pickup</span>
            <span className="text-xs font-extrabold text-slate-700">{readyForDelivery.length} devices</span>
          </div>

          {/* Live Ready for Delivery Jobs table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50">
                  <th className="py-2.5">Job ID</th>
                  <th className="py-2.5">Device</th>
                  <th className="py-2.5">Customer</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                {readyForDelivery.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs font-semibold">
                      No devices ready for collection.
                    </td>
                  </tr>
                ) : (
                  readyForDelivery.map((job) => (
                    <tr 
                      key={job.id} 
                      onClick={() => {
                        setSelectedRepairId(job.id);
                        setActiveTab('billing');
                      }}
                      className="hover:bg-slate-50/50 cursor-pointer transition"
                    >
                      <td className="py-3 font-bold text-slate-800">#{job.id}</td>
                      <td className="py-3">{job.device.brand} {job.device.model}</td>
                      <td className="py-3 text-slate-500">{job.customerName}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-600">
                          Ready
                        </span>
                      </td>
                      <td className="py-3 font-bold text-slate-700">
                        {job.remainingBalance === 0 ? (
                          <span className="text-green-600">Paid</span>
                        ) : (
                          <span className="text-slate-800">₹{job.remainingBalance}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Intake Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick CS Repair */}
        <button 
          onClick={() => {
            const event = new CustomEvent('open-new-repair', { detail: 'CS' });
            window.dispatchEvent(event);
          }}
          className="p-5 bg-blue-50/40 hover:bg-blue-50 border border-dashed border-blue-200 rounded-2xl flex items-center justify-between transition cursor-pointer text-left"
        >
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-200">
              CS
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">+ New CS Repair</h4>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Check & Service: diagnosis first, approval later</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-blue-500" />
        </button>

        {/* Quick DS Repair */}
        <button 
          onClick={() => {
            const event = new CustomEvent('open-new-repair', { detail: 'DS' });
            window.dispatchEvent(event);
          }}
          className="p-5 bg-green-50/30 hover:bg-green-50/50 border border-dashed border-green-200 rounded-2xl flex items-center justify-between transition cursor-pointer text-left"
        >
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-xl bg-green-600 text-white flex items-center justify-center font-bold shadow-md shadow-green-200">
              DS
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">+ New DS Repair</h4>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Direct Service: start work immediately on approved estimate</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-green-500" />
        </button>
      </div>

      {/* Under widgets: At a glance */}
      <div className="text-left">
        {/* Widget: Today at a Glance */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4.5">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-50 pb-2">Today at a Glance</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-3.5 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Collection</span>
              <span className="text-lg font-extrabold text-slate-800 mt-1">₹{totalCollection.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Advance Pending</span>
              <span className="text-lg font-extrabold text-slate-800 mt-1">₹{totalPending.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Repair Time</span>
              <span className="text-lg font-extrabold text-slate-800 mt-1">{avgRepairTime}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">New Customers</span>
              <span className="text-lg font-extrabold text-slate-800 mt-1">{newCustomersCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
