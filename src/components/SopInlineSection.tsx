import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  CheckSquare, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Camera, 
  Battery, 
  Wrench,
  Clock,
  ShieldCheck
} from 'lucide-react';

interface SopInlineSectionProps {
  complaint?: string;
  deviceModel?: string;
}

export const SopInlineSection: React.FC<SopInlineSectionProps> = ({
  complaint = '',
  deviceModel = 'Handset'
}) => {
  const complaintUpper = (complaint || '').toUpperCase();

  // Determine repair category
  let category: 'combo' | 'camera' | 'battery' | 'general' = 'combo';
  if (complaintUpper.includes('CAMERA') || complaintUpper.includes('LENS')) {
    category = 'camera';
  } else if (complaintUpper.includes('BATTERY') || complaintUpper.includes('CHARG') || complaintUpper.includes('POWER')) {
    category = 'battery';
  } else if (
    complaintUpper.includes('DISPLAY') || 
    complaintUpper.includes('SCREEN') || 
    complaintUpper.includes('COMBO') || 
    complaintUpper.includes('TOUCH') ||
    complaintUpper.includes('FOLDER') ||
    complaintUpper.includes('BROKEN')
  ) {
    category = 'combo';
  } else {
    category = 'general';
  }

  // Interactive checklist state
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  // Reset checklist when complaint changes
  useEffect(() => {
    setCompletedSteps({});
  }, [complaint]);

  const toggleStep = (id: string) => {
    setCompletedSteps(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Steps configuration per category
  const getProcedureSteps = () => {
    switch (category) {
      case 'combo':
        return {
          title: 'Combo / Display Replacement Procedure',
          icon: <Layers className="w-4 h-4 text-blue-600" />,
          hagMode: '350°C / Air 2',
          speedGoal: '15 Minutes Target',
          steps: [
            { id: 'c1', title: 'Handset Disassembly', desc: 'Disassemble handset (H/S) as per model specifications.' },
            { id: 'c2', title: 'Entry Point Decision', desc: 'Decide where to start injecting sheet/blade.' },
            { id: 'c3', title: 'Initial Heat & Space', desc: 'Apply shaking heat 10 sec, inject blade to make initial space.' },
            { id: 'c4', title: 'Perimeter Heat & Blade Rotation', desc: 'Apply shaking heat 10 sec on space around, rotate blade.' },
            { id: 'c5', title: 'Sheet Injection', desc: 'Inject plastic combo sheet to create additional clearance.' },
            { id: 'c6', title: 'LCD Backing Sheet', desc: 'Apply shaking heat 10 sec, push another sheet behind LCD.' },
            { id: 'c7', title: 'Rotational Cut Procedure', desc: 'Shaking heat 10 sec, move sheet forward until round is complete.' },
            { id: 'c8', title: 'CRITICAL: Test New Combo FIRST', desc: 'Remove old combo and test NEW replacement combo FIRST before gluing!', highlight: true },
            { id: 'c9', title: 'Corner Tweezers Clean', desc: 'Clean all frame corners thoroughly using tweezers.' },
            { id: 'c10', title: 'Precise Glue Placement', desc: 'Place glue evenly along all frame lines and corners.' },
            { id: 'c11', title: 'Combo Installation', desc: 'Place new combo carefully into position.' },
            { id: 'c12', title: 'Rubber Packing (4-8)', desc: 'Assemble handset and pack with 4 to 8 rubber bands.' }
          ]
        };

      case 'camera':
        return {
          title: 'Camera Glass Repair Procedure',
          icon: <Camera className="w-4 h-4 text-purple-600" />,
          hagMode: '350°C / Air 2 (Vertical Heat)',
          speedGoal: '10 Minutes Target',
          steps: [
            { id: 'cg1', title: 'Verify H.A.G Settings', desc: 'Set Hot Air Gun to standard 350°C / Air 2.' },
            { id: 'cg2', title: 'Vertical Heat (3 Sec)', desc: 'Heat vertically on camera glass for 3 seconds.' },
            { id: 'cg3', title: 'Corner Blade Injection', desc: 'Inject blade carefully on camera glass corner.' },
            { id: 'cg4', title: 'Secondary Vertical Heat (3 Sec)', desc: 'Heat again vertically for 3 seconds.' },
            { id: 'cg5', title: 'Opposite Side Injection', desc: 'Inject blade on opposite side of camera glass.' },
            { id: 'cg6', title: 'Lever Glass Removal', desc: 'Use lever up tool to lift and remove camera glass.' },
            { id: 'cg7', title: 'Blade Surface & Microfiber Clean', desc: 'Clean glass surface with blade & wipe camera lens with microfiber cloth.' },
            { id: 'cg8', title: 'CRITICAL: Camera Quality Check', desc: 'Open camera app & check focus and clarity BEFORE applying glue!', highlight: true },
            { id: 'cg9', title: 'Corner Glue Placement', desc: 'Place glue precisely on surface corners.' },
            { id: 'cg10', title: 'New Glass & Tape Packing', desc: 'Place new camera glass and pack securely with tape.' }
          ]
        };

      case 'battery':
        return {
          title: 'Battery & Power System Procedure',
          icon: <Battery className="w-4 h-4 text-amber-600" />,
          hagMode: 'Heat Pad 80°C / H.A.G Low Heat',
          speedGoal: '12 Minutes Target',
          steps: [
            { id: 'b1', title: 'Handset Disassembly', desc: 'Carefully remove back cover using heat pad.' },
            { id: 'b2', title: 'Battery Disconnect', desc: 'Disconnect battery terminal using plastic spudger tool.' },
            { id: 'b3', title: 'Adhesive Pull & Removal', desc: 'Pull battery release tabs or apply IPA under battery.' },
            { id: 'b4', title: 'CRITICAL: Voltage & Charging Test', desc: 'Test new battery voltage & charge current FIRST before sealing!', highlight: true },
            { id: 'b5', title: 'Adhesive Installation', desc: 'Install new battery double-sided adhesive strips.' },
            { id: 'b6', title: 'Assembly & Final Test', desc: 'Assemble handset and verify 100% charging cycle.' }
          ]
        };

      default:
        return {
          title: 'Standard Handset Repair Procedure',
          icon: <Wrench className="w-4 h-4 text-blue-600" />,
          hagMode: '350°C / Air 2 Standard',
          speedGoal: '15 Minutes Target',
          steps: [
            { id: 'g1', title: 'Read Job Sheet & Organize Tools', desc: 'Review customer complaint carefully and keep tools organized.' },
            { id: 'g2', title: 'Initial Visual Inspection', desc: 'Check body condition, screws, and back cover.' },
            { id: 'g3', title: 'CRITICAL: Check New Part First', desc: 'Must check & test replacement part FIRST before installation!', highlight: true },
            { id: 'g4', title: 'Repair Execution', desc: 'Perform repair following standard station guidelines.' },
            { id: 'g5', title: 'Clean Surfaces & Corners', desc: 'Clean all surfaces, frame edges, and display glass completely.' },
            { id: 'g6', title: 'Final Assembly & Packing', desc: 'Assemble handset securely and pack with rubber bands/tape.' }
          ]
        };
    }
  };

  const proc = getProcedureSteps();
  const completedCount = proc.steps.filter(s => !!completedSteps[s.id]).length;
  const progressPercent = Math.round((completedCount / proc.steps.length) * 100);

  return (
    <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 space-y-3.5 text-left select-none">
      
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-2xs border border-slate-200 dark:border-slate-700">
            {proc.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                TLB Station Suggested SOP — {proc.title}
              </h4>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                Auto-Suggested
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Based on complaint: <span className="text-slate-700 dark:text-slate-200 font-bold">{complaint || 'General Repair'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* H.A.G Spec Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-[10px] font-bold text-amber-700 dark:text-amber-300">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>H.A.G: {proc.hagMode}</span>
          </div>

          {/* Speed Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span>{proc.speedGoal}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
          <span>Technician SOP Step Progress ({completedCount}/{proc.steps.length} Completed)</span>
          <span className={progressPercent === 100 ? 'text-emerald-600 font-extrabold' : 'text-slate-700 dark:text-slate-200'}>
            {progressPercent}% Done
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step by step interactive list */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {proc.steps.map((step, idx) => {
          const isDone = !!completedSteps[step.id];
          return (
            <div
              key={step.id}
              onClick={() => toggleStep(step.id)}
              className={`p-2.5 rounded-xl border transition cursor-pointer flex items-start gap-2.5 ${
                isDone 
                  ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900 text-emerald-900' 
                  : step.highlight
                  ? 'bg-amber-50/80 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600'
              }`}
            >
              <div className={`w-5 h-5 rounded-md text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5 ${
                isDone ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h5 className={`text-xs font-bold ${isDone ? 'line-through text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-100'}`}>
                    {step.title}
                  </h5>
                  {step.highlight && (
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase bg-amber-500 text-white animate-pulse">
                      MUST DO FIRST
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Critical Standard Footer Note */}
      <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl flex items-center justify-between text-[10px] text-blue-800 dark:text-blue-300 font-semibold">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span><strong>Critical Rule:</strong> Read job sheet carefully • Clean corners completely • Pack rubber bands 4-8</span>
        </div>
      </div>
    </div>
  );
};
