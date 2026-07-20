import React from 'react';
import { Printer, X } from 'lucide-react';
import { RepairJob } from '../services/mockDb';

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  repair: RepairJob | null;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  repair
}) => {
  if (!isOpen || !repair) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto select-none">
      
      {/* Print-Only Container (hidden on screen, visible during window.print()) */}
      <div className="hidden print:block print:w-[75mm] print:p-2 print:text-[10pt] print:font-mono print:text-black print:bg-white print:leading-tight">
        
        {/* Job & Queue Header */}
        <div className="text-center pb-2 border-b-2 border-dashed border-black">
          <p className="font-bold text-[10pt] uppercase tracking-widest">
            *** {repair.type === 'CS' ? 'CHECK & SERVICE' : 'DIRECT SERVICE'} ***
          </p>
          <h1 className="font-black text-[14pt] mt-0.5">JOB ID: #{repair.id}</h1>
          <p className="text-[8.5pt] font-semibold mt-0.5">
            DATE: {repair.receivedAt || new Date().toLocaleDateString('en-GB')} {repair.time || ''}
          </p>
        </div>

        {/* Device & IMEI Specs */}
        <div className="py-2 border-b border-dashed border-black text-[9.5pt] space-y-1">
          <p><span className="font-bold">MODEL:</span> {repair.device.brand} {repair.device.model}</p>
          <p><span className="font-bold">IMEI:</span> {repair.device.imei || 'N/A'}</p>
        </div>

        {/* Problem Complaint */}
        <div className="py-2 text-[9.5pt]">
          <p className="font-bold uppercase">COMPLAINT:</p>
          <p className="font-medium text-[9pt] mt-0.5">{repair.complaint}</p>
        </div>

      </div>

      {/* On-Screen Preview Modal */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden text-left animate-fade-in print:hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                Minimal Job Slip Preview
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold">
                Compact Thermal Receipt Ticket
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Box Preview */}
        <div className="p-6 bg-slate-100 dark:bg-slate-950 flex justify-center max-h-[60vh] overflow-y-auto">
          <div className="bg-white text-slate-900 p-4 rounded-xl shadow-lg w-[240px] font-mono text-[11px] leading-tight space-y-2.5 border border-slate-200 select-text">
            
            {/* Header */}
            <div className="text-center pb-2 border-b-2 border-dashed border-slate-400">
              <p className="font-bold text-[10px] uppercase tracking-wider text-blue-700">
                *** {repair.type === 'CS' ? 'CHECK & SERVICE' : 'DIRECT SERVICE'} ***
              </p>
              <h4 className="font-black text-sm text-black mt-0.5">JOB ID: #{repair.id}</h4>
              <p className="text-[9px] text-slate-600 mt-0.5">
                Date: {repair.receivedAt || new Date().toLocaleDateString('en-GB')} {repair.time || ''}
              </p>
            </div>

            {/* Specs */}
            <div className="py-1 border-b border-dashed border-slate-300 space-y-1 text-[10px]">
              <p><strong className="text-slate-700">MODEL:</strong> {repair.device.brand} {repair.device.model}</p>
              <p><strong className="text-slate-700">IMEI:</strong> {repair.device.imei || 'N/A'}</p>
            </div>

            {/* Problem */}
            <div className="pt-0.5 text-[10px]">
              <p className="font-bold uppercase text-[9px] text-slate-700">COMPLAINT:</p>
              <p className="text-slate-800 text-[10px] mt-0.5 font-medium">{repair.complaint}</p>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition cursor-pointer"
          >
            Close
          </button>
          
          <button 
            type="button" 
            onClick={handlePrint}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-blue-500/20 flex items-center gap-2 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Minimal Ticket</span>
          </button>
        </div>
      </div>
    </div>
  );
};
