import { Shield, ShieldAlert, ShieldCheck, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ReadinessAssessment } from "@/types/consignment.types";

interface ReadinessHeroProps {
  caseNumber: string;
  currentState: string;
  blockingCount: number;
  warningCount: number;
  lastComputedAt: string | null;
  importAssessment: ReadinessAssessment;
  financingAssessment: ReadinessAssessment;
}

const ReadinessHero = ({
  caseNumber,
  currentState,
  blockingCount,
  warningCount,
  lastComputedAt,
  importAssessment,
  financingAssessment,
}: ReadinessHeroProps) => {
  const overallStatus = blockingCount > 0
    ? "blocked"
    : (importAssessment.ready && financingAssessment.ready)
      ? "ready"
      : "partial";

  const statusConfig = {
    ready: { label: "Defensible", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: ShieldCheck },
    partial: { label: "Incomplete", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: Shield },
    blocked: { label: "Blocked", bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: ShieldAlert },
  };

  const config = statusConfig[overallStatus];
  const StatusIcon = config.icon;

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} p-6`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.bg} border ${config.border}`}>
            <StatusIcon className={`h-5 w-5 ${config.text}`} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{caseNumber}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={`text-xs font-medium ${config.text} border-current`}>
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                State: {currentState.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {blockingCount > 0 && (
            <div className="flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-medium">
              <ShieldAlert className="h-3.5 w-3.5" />
              {blockingCount} blocking
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-2.5 py-1.5 rounded-lg text-xs font-medium">
              {warningCount} warning{warningCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Decision Contexts with Reasons */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ContextCard assessment={importAssessment} label="Import Readiness" />
        <ContextCard assessment={financingAssessment} label="Financing Readiness" />
      </div>

      {lastComputedAt && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Last computed: {new Date(lastComputedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
};

const ContextCard = ({ assessment, label }: { assessment: ReadinessAssessment; label: string }) => (
  <div className={`rounded-lg border p-3 ${
    assessment.ready
      ? "bg-white/60 border-emerald-200"
      : "bg-white/60 border-gray-200"
  }`}>
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-2 h-2 rounded-full ${assessment.ready ? "bg-emerald-500" : "bg-red-400"}`} />
      <span className={`text-xs font-semibold ${assessment.ready ? "text-emerald-700" : "text-foreground"}`}>
        {label}: {assessment.ready ? "Ready" : "Not Ready"}
      </span>
    </div>

    {/* Reasons for */}
    {assessment.reasons_for.length > 0 && (
      <div className="space-y-0.5 mb-1">
        {assessment.reasons_for.map((r, i) => (
          <div key={i} className="flex items-start gap-1.5 text-[11px]">
            <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
            <span className="text-emerald-700">{r.label}</span>
          </div>
        ))}
      </div>
    )}

    {/* Reasons against */}
    {assessment.reasons_against.length > 0 && (
      <div className="space-y-0.5">
        {assessment.reasons_against.map((r, i) => (
          <div key={i} className="flex items-start gap-1.5 text-[11px]">
            <XCircle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
            <span className="text-red-600">{r.label}{r.detail ? ` — ${r.detail}` : ""}</span>
          </div>
        ))}
      </div>
    )}

    {/* Missing evidence */}
    {assessment.missing_evidence.length > 0 && (
      <p className="text-[10px] text-red-500 mt-1">
        Missing: {assessment.missing_evidence.map(s => s.replace(/_/g, " ")).join(", ")}
      </p>
    )}
  </div>
);

export default ReadinessHero;
