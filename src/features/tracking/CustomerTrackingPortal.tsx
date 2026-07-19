import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, 
  Wrench, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  FileText,
  DollarSign,
  User,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface CustomerTrackingPortalProps {
  onBack: () => void;
}

export const CustomerTrackingPortal: React.FC<CustomerTrackingPortalProps> = ({ onBack }) => {
  const { repairs, customers } = useApp();
  const [jobIdInput, setJobIdInput] = useState('');
  const [searchedJob, setSearchedJob] = useState<any | null>(null);
  const [searchError, setSearchError] = useState('');

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setSearchedJob(null);

    const cleanId = jobIdInput.trim().toUpperCase().replace(/^#/, '');
    if (!cleanId) {
      setSearchError('Please input a valid Job ID.');
      return;
    }

    // Try finding exact match or matched with R- prefix
    const found = repairs.find(r => 
      r.id.toUpperCase() === cleanId || 
      r.id.toUpperCase() === `R-${cleanId}`
    );

    if (found) {
      setSearchedJob(found);
    } else {
      setSearchError('No active repair job found with this ID. Please double check the ID printed on your intake receipt.');
    }
  };

  // Mask name for client privacy (e.g. Prajwal Murkewar -> Pr***al Mu***war)
  const maskCustomerName = (fullName: string) => {
    if (!fullName) return '';
    return fullName.split(' ').map(part => {
      if (part.length <= 2) return part;
      return part[0] + '*'.repeat(part.length - 2) + part[part.length - 1];
    }).join(' ');
  };

  // Maps DB statuses to user-friendly tracker steps
  const steps = [
    { key: 'Received', title: 'Device Checked-In', desc: 'Received at intake counter and registered' },
    { key: 'Diagnosis', title: 'Technical Diagnostics', desc: 'Motherboard inspection and issue detection' },
    { key: 'Waiting Approval', title: 'Approval Pending', desc: 'Awaiting customer cost confirmation' },
    { key: 'In Repair', title: 'Repair Underway', desc: 'Micro-soldering/parts replacement ongoing' },
    { key: 'Testing', title: 'Quality QA testing', desc: 'Post-repair functionality and stress testing' },
    { key: 'Completed', title: 'Ready for Collection', desc: 'Repair finished! Ready for delivery' },
    { key: 'Delivered', title: 'Delivered', desc: 'Handed over to customer' }
  ];

  const getActiveStepIndex = (status: string) => {
    if (status === 'Cancelled') return -1;
    // Map Ready to Completed
    const cleanStatus = status === 'Ready' ? 'Completed' : status;
    return steps.findIndex(s => s.key === cleanStatus);
  };

  const activeIndex = searchedJob ? getActiveStepIndex(searchedJob.status) : -1;

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-start p-6 overflow-y-auto select-none text-left">
      {/* Background radial glowing grid lights */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none"></div>

      {/* Header toolbar */}
      <div className="w-full max-w-3xl flex justify-between items-center py-4 relative z-10 shrink-0">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Staff Console</span>
        </button>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          <span>Secure Client Portal</span>
        </span>
      </div>

      {/* Main glass card */}
      <div className="bg-slate-900/40 border border-slate-800/80 p-6 md:p-8 rounded-3xl max-w-3xl w-full shadow-2xl flex flex-col space-y-6 relative z-10 backdrop-blur-xl animate-scale-up mt-4 mb-10">
        
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/20">
            <Wrench className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight mt-3">Live Repair Tracker</h1>
          <p className="text-xs text-slate-400 font-medium">Enter your Job ID to view real-time technical progress details</p>
        </div>

        {/* Tracker Search Form */}
        <form onSubmit={handleTrack} className="flex gap-2.5">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">#</span>
            <input 
              type="text" 
              value={jobIdInput}
              onChange={e => setJobIdInput(e.target.value)}
              placeholder="Enter Job ID (e.g. R-88935)"
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pl-8 pr-4 py-3 rounded-xl text-xs font-semibold text-white focus:outline-none transition"
            />
          </div>
          <button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-blue-600/10 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Track status</span>
          </button>
        </form>

        {/* Error Alert */}
        {searchError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{searchError}</span>
          </div>
        )}

        {/* Tracking Details view */}
        {searchedJob && (
          <div className="space-y-6 pt-2 animate-fade-in text-xs text-slate-350">
            <hr className="border-slate-800" />
            
            {/* Device header & mask profile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/40 p-4.5 rounded-2xl border border-slate-900/50">
              <div className="space-y-1.5">
                <span className="text-[9px] font-extrabold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded">
                  {searchedJob.type === 'CS' ? 'Check & Service' : 'Direct Service'}
                </span>
                <h3 className="font-extrabold text-sm text-white pt-1">
                  {searchedJob.device.brand} {searchedJob.device.model}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold">Job ID: #{searchedJob.id}</p>
              </div>
              <div className="space-y-1 md:text-right">
                <p className="font-bold text-slate-300">Customer: {maskCustomerName(searchedJob.customerName)}</p>
                <p className="text-[10px] text-slate-450 font-medium">Received: {searchedJob.receivedAt} • Expected: {searchedJob.expectedDelivery}</p>
                <p className="text-[10px] text-slate-450 font-medium">Assigned Tech: {searchedJob.technician}</p>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="space-y-5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Workflow Checklist</h4>
              <div className="relative pl-6.5 border-l border-slate-800/80 space-y-5 ml-2.5">
                {steps.map((step, idx) => {
                  const isDone = idx < activeIndex;
                  const isCurrent = idx === activeIndex;
                  const isFuture = idx > activeIndex;
                  
                  return (
                    <div key={step.key} className="relative">
                      {/* Step bullet */}
                      <div className={`absolute -left-9 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        isDone 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : isCurrent 
                          ? 'bg-slate-950 border-blue-500 text-blue-500 ring-4 ring-blue-500/10' 
                          : 'bg-slate-950 border-slate-800 text-slate-600'
                      }`}>
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <span className="text-[9px] font-extrabold">{idx + 1}</span>
                        )}
                      </div>

                      {/* Step details */}
                      <div className="space-y-0.5">
                        <p className={`font-extrabold ${isCurrent ? 'text-blue-400' : isFuture ? 'text-slate-500' : 'text-white'}`}>
                          {step.title}
                          {isCurrent && (
                            <span className="ml-2.5 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[8px] font-bold rounded-md uppercase animate-pulse">
                              Active Stage
                            </span>
                          )}
                        </p>
                        <p className={`text-[10px] ${isFuture ? 'text-slate-600' : 'text-slate-400'} font-medium`}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Price breakdown & comments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 pt-2">
              {/* Technical Updates */}
              <div className="bg-slate-950/30 border border-slate-900 p-4.5 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Technician Diagnostics Notes</span>
                {searchedJob.diagnosis?.observedIssue ? (
                  <div className="space-y-1 font-medium leading-relaxed">
                    <p className="text-white"><span className="text-slate-450 font-bold">Observed Issue:</span> {searchedJob.diagnosis.observedIssue}</p>
                    {searchedJob.diagnosis.rootCause && (
                      <p className="text-slate-300 mt-1"><span className="text-slate-450 font-bold">Root Cause:</span> {searchedJob.diagnosis.rootCause}</p>
                    )}
                  </div>
                ) : (
                  <p className="italic text-slate-500 text-[11px]">Diagnostics in progress. Technical findings will be logged here.</p>
                )}
              </div>

              {/* Costing card */}
              <div className="bg-slate-950/30 border border-slate-900 p-4.5 rounded-2xl space-y-3 font-semibold">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billing Summary</span>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-450">Estimated / Final Cost</span>
                    <span className="text-white font-bold">₹{searchedJob.estimatedCost.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-455">Advance Paid</span>
                    <span className="text-green-400">₹{searchedJob.advancePaid.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2 text-xs">
                    <span className="text-slate-300 font-bold">Balance to Pay</span>
                    <span className="text-red-400 font-extrabold">₹{searchedJob.remainingBalance.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
