import { Check, X } from "lucide-react";
import { useConsignmentReadiness } from "@/hooks/useConsignmentReadiness";

interface ReadinessChecklistProps {
  evidencePresent: number;
  evidenceRequired: number;
  missingCritical: string[];
  attestationsPresent: number;
  attestationsRequired: number;
  custodyGaps: number;
  totalHandoffs: number;
  blockingExceptions: number;
}

const ReadinessChecklist = ({
  evidencePresent,
  evidenceRequired,
  missingCritical,
  attestationsPresent,
  attestationsRequired,
  custodyGaps,
  totalHandoffs,
  blockingExceptions,
}: ReadinessChecklistProps) => {
  const { isFinancingLens } = useConsignmentReadiness();
  
  const checklist = [
    {
      label: "Evidence Completeness",
      description: `${evidencePresent} of ${evidenceRequired} crucial documents present.`,
      pass: evidencePresent >= evidenceRequired,
      failDetail: missingCritical.length > 0 ? `Missing: ${missingCritical.map(s => s.replace(/_/g, " ")).join(", ")}` : undefined
    },
    {
      label: "Attribution Strength",
      description: `${attestationsPresent} of ${attestationsRequired} verified attestations.`,
      pass: attestationsPresent >= attestationsRequired,
      failDetail: attestationsPresent < attestationsRequired ? "Required declarations are missing" : undefined
    },
    {
      label: "Custody Continuity",
      description: `${totalHandoffs} established handoffs recorded.`,
      pass: custodyGaps === 0,
      failDetail: custodyGaps > 0 ? `${custodyGaps} critical gaps in logistical custody` : undefined
    },
    {
      label: "Exceptions & Holds",
      description: "No severe blocks detected on consignment.",
      pass: blockingExceptions === 0,
      failDetail: blockingExceptions > 0 ? `${blockingExceptions} Unresolved Exception(s) Actively Blocking` : undefined
    }
  ];

  if (isFinancingLens) {
     checklist.push({
       label: "Underwriting Recency Criteria",
       description: "Checks if valuations and surveys are < 90 days old.",
       pass: true, // Placeholder for actual financing specific logic
       failDetail: undefined
     });
     checklist[0].label = "Underwriting Sufficiency";
  }

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-sm">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h3 className="font-medium text-sm text-gray-700 tracking-wide uppercase">Consignment Assessment Checklist</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {checklist.map((item, idx) => (
          <div key={idx} className={`flex items-start gap-4 p-4 ${!item.pass ? 'bg-red-50/20' : ''}`}>
             <div className="mt-0.5 shrink-0">
               {item.pass ? (
                 <div className="bg-emerald-100 p-1.5 rounded-full"><Check className="h-3 w-3 text-emerald-700 font-bold" /></div>
               ) : (
                 <div className="bg-red-100 p-1.5 rounded-full"><X className="h-3 w-3 text-red-700 font-bold" /></div>
               )}
             </div>
             <div>
               <div className={`text-sm font-semibold ${item.pass ? 'text-gray-900' : 'text-red-800'}`}>{item.label}</div>
               <div className="text-xs text-gray-500 mt-1">{item.description}</div>
               {!item.pass && item.failDetail && (
                 <div className="mt-2 text-xs font-mono font-medium text-red-700 bg-red-100/50 py-1.5 px-3 border border-red-200 rounded-sm inline-block">
                   {item.failDetail}
                 </div>
               )}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReadinessChecklist;
