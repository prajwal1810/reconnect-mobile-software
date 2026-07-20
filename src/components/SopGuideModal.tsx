import React, { useState } from 'react';
import { 
  Wrench, 
  CheckSquare, 
  Flame, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Camera, 
  X, 
  CheckCircle2,
  Zap
} from 'lucide-react';

interface SopGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobComplaint?: string;
  deviceModel?: string;
}

export const SopGuideModal: React.FC<SopGuideModalProps> = ({
  isOpen,
  onClose,
  jobComplaint = '',
  deviceModel = 'Handset'
}) => {
  if (!isOpen) return null;

  const complaintUpper = jobComplaint.toUpperCase();
  
  // Determine suggested active tab based on complaint
  let initialCategory = 'combo';
  if (complaintUpper.includes('CAMERA')) {
    initialCategory = 'camera';
  } else if (complaintUpper.includes('BATTERY') || complaintUpper.includes('CHARG')) {
    initialCategory = 'battery';
  }

  const [activeTab, setActiveTab] = useState<'combo' | 'camera' | 'critical' | 'prep'>(
    initialCategory === 'camera' ? 'camera' : 'combo'
  );

  // Interactive Checklist states
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const toggleStep = (key: string) => {
    setCompletedSteps(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-left">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                  TLB Station — Point Observation Checklist & SOP
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  Official Standard Operating Procedure
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Technician repair guidelines for <span className="text-slate-700 dark:text-slate-200 font-bold">{deviceModel}</span> {jobComplaint ? `(${jobComplaint})` : ''}
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 bg-slate-50/40 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex gap-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('combo')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'combo'
                ? 'border-blue-600 text-blue-600 bg-white dark:bg-slate-800 shadow-xs'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-blue-500" />
            <span>Combo / Display Replacement</span>
            {initialCategory === 'combo' && (
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'camera'
                ? 'border-blue-600 text-blue-600 bg-white dark:bg-slate-800 shadow-xs'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4 text-purple-500" />
            <span>Camera Glass Repair</span>
            {initialCategory === 'camera' && (
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('critical')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'critical'
                ? 'border-blue-600 text-blue-600 bg-white dark:bg-slate-800 shadow-xs'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Critical Standards (Accuracy & Speed)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prep')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'prep'
                ? 'border-blue-600 text-blue-600 bg-white dark:bg-slate-800 shadow-xs'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Area Preparation & H.A.G Settings</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: COMBO DISPLAY REPLACEMENT PROCEDURE */}
          {activeTab === 'combo' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 text-white rounded-xl font-bold">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                      Hot Air Gun (H.A.G.) Standard Mode: 350°C / Air 2
                    </h4>
                    <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium mt-0.5">
                      Target Replacement Speed: <span className="font-bold">15 Minutes</span> • Check new combo FIRST before applying glue.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs">
                  Speed Goal: 15 Mins
                </span>
              </div>

              <div>
                <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <span>Working Procedure — Combo Replacement</span>
                </h3>

                <div className="space-y-2.5">
                  {[
                    { id: 'c1', title: 'Handset Disassembly', desc: 'Disassemble the handset (H/S) as per model specifications.' },
                    { id: 'c2', title: 'Entry Point Decision', desc: 'Decide where to start injecting sheet/blade carefully.' },
                    { id: 'c3', title: 'Initial Heating & Space', desc: 'Apply shaking heat 10 sec, then start injecting blade to make initial space.' },
                    { id: 'c4', title: 'Perimeter Heating & Rotation', desc: 'Apply shaking heat 10 sec around edge space and rotate blade.' },
                    { id: 'c5', title: 'Sheet Injection', desc: 'Inject plastic combo sheet into space to create additional room.' },
                    { id: 'c6', title: 'LCD Backing Sheet', desc: 'Apply shaking heat 10 sec and push another sheet behind LCD.' },
                    { id: 'c7', title: 'Rotational Cut Procedure', desc: 'Apply shaking heat 10 sec and put sheet forward (repeat this step around all edges until round is done).' },
                    { id: 'c8', title: 'MUST: Test New Combo First', desc: 'CRITICAL: Remove old combo and test the NEW replacement combo FIRST before applying glue!', highlight: true },
                    { id: 'c9', title: 'Corner Cleaning', desc: 'Clean all frame corners thoroughly using tweezers.' },
                    { id: 'c10', title: 'Precise Glue Placement', desc: 'Place glue evenly along all frame corners.' },
                    { id: 'c11', title: 'Combo Installation', desc: 'Place new combo screen carefully into position.' },
                    { id: 'c12', title: 'Rubber Packing', desc: 'Assemble handset and pack with 4 to 8 rubber bands evenly.' }
                  ].map((step, idx) => {
                    const isDone = !!completedSteps[step.id];
                    return (
                      <div 
                        key={step.id} 
                        onClick={() => toggleStep(step.id)}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 ${
                          isDone 
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-900' 
                            : step.highlight
                            ? 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900'
                            : 'bg-white dark:bg-slate-800/60 border-slate-150 dark:border-slate-700/60 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                          isDone ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div className="flex-1">
                          <h5 className={`text-xs font-bold ${isDone ? 'line-through text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-100'}`}>
                            {step.title}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CAMERA GLASS REPAIR PROCEDURE */}
          {activeTab === 'camera' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-purple-50/60 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-600 text-white rounded-xl font-bold">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-purple-900 dark:text-purple-200 uppercase tracking-wider">
                      Hot Air Gun (H.A.G.) Standard Mode: 350°C / Air 2
                    </h4>
                    <p className="text-[11px] text-purple-700 dark:text-purple-300 font-medium mt-0.5">
                      Heat vertically for 3 seconds • Clean lens with cloth • Check camera quality BEFORE gluing.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-xl shadow-xs">
                  Lens Quality Check
                </span>
              </div>

              <div>
                <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-purple-600" />
                  <span>Working Procedure — Camera Glass Replacement</span>
                </h3>

                <div className="space-y-2.5">
                  {[
                    { id: 'cg1', title: 'Verify H.A.G Settings', desc: 'Check Hot Air Gun heat and air flow is in standard range (350°C / Air 2).' },
                    { id: 'cg2', title: 'Vertical Heat Application (3 Sec)', desc: 'Heat vertically on camera glass for 3 seconds.' },
                    { id: 'cg3', title: 'Corner Blade Injection', desc: 'Start injecting blade carefully on camera glass corner.' },
                    { id: 'cg4', title: 'Secondary Heat Application (3 Sec)', desc: 'Heat again vertically for 3 seconds.' },
                    { id: 'cg5', title: 'Opposite Side Injection', desc: 'Inject blade on other side of camera glass.' },
                    { id: 'cg6', title: 'Lever Glass Removal', desc: 'Use lever up tool to remove camera glass.' },
                    { id: 'cg7', title: 'Clean Glass & Microfiber Lens Clean', desc: 'Clean glass surface with blade and wipe camera lens thoroughly with microfiber cloth.' },
                    { id: 'cg8', title: 'MUST: Camera Quality Inspection', desc: 'CRITICAL: Open camera app & check camera quality/focus is 100% OK or not!', highlight: true },
                    { id: 'cg9', title: 'Corner Glue Placement', desc: 'If OK, place glue precisely on surface corners.' },
                    { id: 'cg10', title: 'New Glass & Tape Packing', desc: 'Place the new camera glass and pack securely with tape.' }
                  ].map((step, idx) => {
                    const isDone = !!completedSteps[step.id];
                    return (
                      <div 
                        key={step.id} 
                        onClick={() => toggleStep(step.id)}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 ${
                          isDone 
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-900' 
                            : step.highlight
                            ? 'bg-purple-50/70 border-purple-200 dark:bg-purple-950/30 dark:border-purple-900'
                            : 'bg-white dark:bg-slate-800/60 border-slate-150 dark:border-slate-700/60 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                          isDone ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div className="flex-1">
                          <h5 className={`text-xs font-bold ${isDone ? 'line-through text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-100'}`}>
                            {step.title}
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CRITICAL STANDARDS */}
          {activeTab === 'critical' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 p-4.5 rounded-2xl space-y-2">
                  <h4 className="text-xs font-extrabold text-blue-900 dark:text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>1. Accurate Standard</span>
                  </h4>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 font-medium list-disc list-inside">
                    <li>Keep tools organized at station.</li>
                    <li>Read job sheet carefully BEFORE starting work.</li>
                    <li>Use back bodies as a shadow.</li>
                    <li><strong className="text-blue-700 dark:text-blue-300">Check the new replacement part FIRST is MUST.</strong></li>
                  </ul>
                </div>

                <div className="bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 p-4.5 rounded-2xl space-y-2">
                  <h4 className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>2. Quality Standard</span>
                  </h4>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 font-medium list-disc list-inside">
                    <li>Clean surface completely.</li>
                    <li>Place glue precisely on the lines.</li>
                    <li>Complete packed from all angles.</li>
                    <li><strong className="text-emerald-700 dark:text-emerald-300">Display and corners must be 100% clean.</strong></li>
                  </ul>
                </div>

                <div className="bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 p-4.5 rounded-2xl space-y-2">
                  <h4 className="text-xs font-extrabold text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>3. Fast Standard</span>
                  </h4>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 font-medium list-disc list-inside">
                    <li>Handset (H/S) must be taken in order.</li>
                    <li><strong className="text-amber-700 dark:text-amber-300">Meet speed target: 15 minutes to replace.</strong></li>
                  </ul>
                </div>

                <div className="bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 p-4.5 rounded-2xl space-y-2">
                  <h4 className="text-xs font-extrabold text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <span>4. Service Impact</span>
                  </h4>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 font-medium list-disc list-inside">
                    <li>Ensure spare parts are stocked up.</li>
                    <li>Keep workstation organized.</li>
                    <li>Meet speed target: 15 minutes per repair.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AREA PREPARATION */}
          {activeTab === 'prep' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Equipment & Station Setup</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 rounded-xl">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide block">Equipment Setup</span>
                    <ul className="mt-1.5 space-y-1 font-semibold text-slate-700 dark:text-slate-200 list-disc list-inside">
                      <li>H.A.G mode: <span className="font-extrabold text-amber-600">350°C / Air 2</span></li>
                      <li>All tools on hangers always</li>
                      <li>Combo sheet sliced 4 corners</li>
                      <li>Falcon glue rubber available</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 rounded-xl">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide block">People & Coordination</span>
                    <ul className="mt-1.5 space-y-1 font-semibold text-slate-700 dark:text-slate-200 list-disc list-inside">
                      <li>Aware for Software/Inventory person to bring parts</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 rounded-xl">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide block">Product & Stock</span>
                    <ul className="mt-1.5 space-y-1 font-semibold text-slate-700 dark:text-slate-200 list-disc list-inside">
                      <li>Check all parts stock level before starting disassembly</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-400 font-semibold">
            Point Observation Checklist • TLB Repair Station Standard
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            Got it, Proceed to Repair
          </button>
        </div>
      </div>
    </div>
  );
};
