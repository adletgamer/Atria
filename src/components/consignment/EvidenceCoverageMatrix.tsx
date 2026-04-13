import { FileCheck, AlertCircle, Clock, Link2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useConsignmentReadiness } from "@/hooks/useConsignmentReadiness";

interface EvidenceRow {
  id: string;
  type: string;
  title: string;
  status: "active" | "superseded" | "rejected" | "missing";
  source: string;
  capturedAt: string | null;
  hasAttestation: boolean;
  isGap: boolean;
}

interface EvidenceCoverageMatrixProps {
  evidence: EvidenceRow[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  superseded: { label: "Superseded", className: "bg-gray-50 text-gray-500 border-gray-200" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-600 border-red-200" },
  missing: { label: "Missing", className: "bg-red-50 text-red-600 border-red-200" },
};

const EvidenceCoverageMatrix = ({ evidence }: EvidenceCoverageMatrixProps) => {
  const { isFinancingLens } = useConsignmentReadiness();
  const gaps = evidence.filter((e) => e.isGap || e.status === "missing");

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-muted-foreground" />
            Evidence Coverage
          </CardTitle>
          {gaps.length > 0 && (
            <Badge variant="outline" className="text-xs text-red-600 border-red-300">
              {gaps.length} gap{gaps.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {evidence.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            No evidence attached yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Type</th>
                  <th className="pb-2 pr-3 font-medium">Title</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 pr-3 font-medium">Source</th>
                  <th className="pb-2 pr-3 font-medium">Freshness</th>
                  <th className="pb-2 pr-3 font-medium">Attested</th>
                  <th className="pb-2 font-medium">Gap</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {evidence.map((row) => {
                  const sc = statusConfig[row.status] || statusConfig.active;
                  const daysSince = row.capturedAt
                    ? Math.floor((Date.now() - new Date(row.capturedAt).getTime()) / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <tr key={row.id} className={row.isGap ? "bg-red-50/50" : ""}>
                      <td className="py-2 pr-3">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                          {row.type.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3 font-medium text-foreground truncate max-w-[160px]">
                        {row.title}
                      </td>
                      <td className="py-2 pr-3">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${sc.className}`}>
                          {sc.label}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">{row.source}</td>
                      <td className="py-2 pr-3">
                        {daysSince !== null ? (
                          <span className={`flex items-center gap-1 font-mono ${isFinancingLens && daysSince > 90 ? "text-red-600 font-bold bg-red-50 px-1 py-0.5 rounded" : (daysSince > 30 ? "text-amber-600" : "text-muted-foreground")}`}>
                            <Clock className="h-3 w-3" />
                            {daysSince}d old
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        {row.hasAttestation ? (
                          <Link2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-2">
                        {row.isGap ? (
                          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export type { EvidenceRow };
export default EvidenceCoverageMatrix;
