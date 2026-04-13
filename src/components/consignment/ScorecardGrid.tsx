import { FileCheck, Users, ArrowRightLeft, AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ScorecardGridProps {
  evidencePresent: number;
  evidenceRequired: number;
  missingCritical: string[];
  attestationsPresent: number;
  attestationsRequired: number;
  custodyGaps: number;
  totalHandoffs: number;
  blockingExceptions: number;
  importReady: boolean;
  financingReady: boolean;
}

const ScorecardGrid = ({
  evidencePresent,
  evidenceRequired,
  missingCritical,
  attestationsPresent,
  attestationsRequired,
  custodyGaps,
  totalHandoffs,
  blockingExceptions,
  importReady,
  financingReady,
}: ScorecardGridProps) => {
  const evidenceComplete = evidencePresent >= evidenceRequired;
  const custodyClear = custodyGaps === 0;
  const noBlockers = blockingExceptions === 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Evidence Completeness — count-based */}
      <Card className={`border ${evidenceComplete ? "border-emerald-200" : "border-amber-200"}`}>
        <CardContent className="pt-5 pb-4 px-5">
          <div className="flex items-center justify-between mb-2">
            <FileCheck className={`h-4 w-4 ${evidenceComplete ? "text-emerald-600" : "text-amber-600"}`} />
            <span className={`text-lg font-bold tabular-nums ${evidenceComplete ? "text-emerald-700" : "text-amber-600"}`}>
              {evidencePresent}/{evidenceRequired}
            </span>
          </div>
          <p className="text-xs font-medium text-foreground">Evidence Present</p>
          {missingCritical.length > 0 && (
            <p className="text-[10px] text-red-600 mt-1 truncate">
              Missing: {missingCritical.map(s => s.replace(/_/g, " ")).join(", ")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Attestation Coverage — count-based */}
      <Card className={`border ${attestationsPresent >= attestationsRequired ? "border-emerald-200" : "border-gray-200"}`}>
        <CardContent className="pt-5 pb-4 px-5">
          <div className="flex items-center justify-between mb-2">
            <Users className={`h-4 w-4 ${attestationsPresent >= attestationsRequired ? "text-emerald-600" : "text-muted-foreground"}`} />
            <span className={`text-lg font-bold tabular-nums ${attestationsPresent >= attestationsRequired ? "text-emerald-700" : "text-foreground"}`}>
              {attestationsPresent}/{attestationsRequired}
            </span>
          </div>
          <p className="text-xs font-medium text-foreground">Attestations</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {attestationsPresent >= attestationsRequired ? "All required types present" : `${attestationsRequired - attestationsPresent} type(s) pending`}
          </p>
        </CardContent>
      </Card>

      {/* Custody Continuity — gap-based */}
      <Card className={`border ${custodyClear ? "border-emerald-200" : "border-red-200"}`}>
        <CardContent className="pt-5 pb-4 px-5">
          <div className="flex items-center justify-between mb-2">
            {custodyClear
              ? <ArrowRightLeft className="h-4 w-4 text-emerald-600" />
              : <AlertTriangle className="h-4 w-4 text-red-600" />
            }
            <span className={`text-lg font-bold tabular-nums ${custodyClear ? "text-emerald-700" : "text-red-600"}`}>
              {custodyGaps === 0 ? "Clear" : `${custodyGaps} gap${custodyGaps !== 1 ? "s" : ""}`}
            </span>
          </div>
          <p className="text-xs font-medium text-foreground">Custody Chain</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {totalHandoffs} handoff{totalHandoffs !== 1 ? "s" : ""} recorded
          </p>
        </CardContent>
      </Card>

      {/* Decision Readiness — primary */}
      <Card className={`border ${noBlockers && importReady ? "border-emerald-200 bg-emerald-50/30" : blockingExceptions > 0 ? "border-red-200 bg-red-50/30" : "border-amber-200 bg-amber-50/30"}`}>
        <CardContent className="pt-5 pb-4 px-5">
          <div className="flex items-center justify-between mb-2">
            {noBlockers && importReady
              ? <ShieldCheck className="h-4 w-4 text-emerald-600" />
              : <ShieldAlert className={`h-4 w-4 ${blockingExceptions > 0 ? "text-red-600" : "text-amber-600"}`} />
            }
            {blockingExceptions > 0 && (
              <span className="text-xs font-bold text-red-600">
                {blockingExceptions} blocker{blockingExceptions !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5 mt-1">
            <DecisionRow label="Import" ready={importReady} />
            <DecisionRow label="Financing" ready={financingReady} />
          </div>
          <p className="text-xs font-medium text-foreground mt-2">Decision Readiness</p>
        </CardContent>
      </Card>
    </div>
  );
};

const DecisionRow = ({ label, ready }: { label: string; ready: boolean }) => (
  <div className="flex items-center gap-1.5 text-xs">
    <div className={`w-2 h-2 rounded-full ${ready ? "bg-emerald-500" : "bg-red-400"}`} />
    <span className={`font-medium ${ready ? "text-emerald-700" : "text-red-600"}`}>
      {label}: {ready ? "Ready" : "Not Ready"}
    </span>
  </div>
);

export default ScorecardGrid;
