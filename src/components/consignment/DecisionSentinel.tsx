import { Shield, ShieldAlert, ShieldCheck, Clock, XCircle } from "lucide-react";
import type { ReadinessAssessment } from "@/types/consignment.types";
import { useConsignmentReadiness } from "@/hooks/useConsignmentReadiness";

interface DecisionSentinelProps {
  caseNumber: string;
  currentState: string;
  blockingCount: number;
  lastComputedAt: string | null;
  importAssessment: ReadinessAssessment;
  financingAssessment: ReadinessAssessment;
}

const DecisionSentinel = ({
  caseNumber,
  currentState,
  blockingCount,
  lastComputedAt,
  importAssessment,
  financingAssessment,
}: DecisionSentinelProps) => {
  const { activeLens } = useConsignmentReadiness();
  const assessment = activeLens === 'import' ? importAssessment : financingAssessment;
  
  // Decisión binaria y austera
  const isReady = assessment.ready;
  const overallStatus = blockingCount > 0 
    ? "blocked" 
    : isReady 
      ? "ready" 
      : "action_required";

  // Diseño B2B serio: Sin gradientes innecesarios, neutros y alertas claras
  const statusConfig = {
    ready: { label: "CLEARED", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: ShieldCheck },
    action_required: { label: "ACTION REQUIRED", bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-800", icon: Shield },
    blocked: { label: "BLOCKED", bg: "bg-red-50", border: "border-red-200", text: "text-red-800", icon: ShieldAlert },
  };

  const config = statusConfig[overallStatus];
  const StatusIcon = config.icon;

  return (
    <div className={`rounded-sm border-l-4 ${config.border} bg-white shadow-sm font-sans p-5`} style={{ borderLeftColor: overallStatus === 'ready' ? '#10b981' : overallStatus === 'blocked' ? '#ef4444' : '#6b7280' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className={`p-2 rounded-full ${config.bg}`}>
             <StatusIcon className={`h-6 w-6 ${config.text}`} />
           </div>
           <div>
             <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
               {activeLens === 'import' ? 'Import Readiness Decision' : 'Financing Readiness Decision'}
             </div>
             <div className={`text-2xl font-bold tracking-tight ${config.text}`}>{config.label}</div>
           </div>
        </div>
        {lastComputedAt && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
            <Clock className="h-3.5 w-3.5" />
            {new Date(lastComputedAt).toISOString().split('T')[0]} {new Date(lastComputedAt).toISOString().split('T')[1].substring(0,5)}Z
          </div>
        )}
      </div>

      {(assessment.reasons_against.length > 0 || assessment.missing_evidence.length > 0) && (
        <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-2">
          {assessment.reasons_against.map((r, i) => (
             <div key={i} className="flex items-start gap-2 text-sm text-red-700 font-medium bg-red-50/50 p-2 rounded">
               <XCircle className="h-4 w-4 mt-0.5 shrink-0" /> 
               <span>{r.label} {r.detail && <span className="text-red-500/80 font-normal">({r.detail})</span>}</span>
             </div>
          ))}
          {assessment.missing_evidence.map((me, i) => (
             <div key={`me-${i}`} className="flex items-start gap-2 text-sm text-red-700 font-medium bg-red-50/50 p-2 rounded">
               <XCircle className="h-4 w-4 mt-0.5 shrink-0" /> 
               <span>Missing Evidence: {me.replace(/_/g, " ")}</span>
             </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DecisionSentinel;
