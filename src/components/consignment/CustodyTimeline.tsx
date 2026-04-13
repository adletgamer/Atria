import { ArrowRight, AlertCircle, CheckCircle2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ConsignmentHandoff } from "@/types/consignment.types";

interface CustodyTimelineProps {
  handoffs: ConsignmentHandoff[];
  gapCount: number;
}

const signingLevelLabel: Record<string, string> = {
  unsigned: "Unsigned",
  sender_signed: "Sender Signed",
  receiver_acknowledged: "Receiver Ack",
  dual_signed: "Dual Signed",
  third_party_witnessed: "Witnessed",
};

const CustodyTimeline = ({ handoffs, gapCount }: CustodyTimelineProps) => {
  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            Custody Chain
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{handoffs.length} handoff{handoffs.length !== 1 ? "s" : ""}</span>
            {gapCount > 0 && (
              <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                {gapCount} gap{gapCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {handoffs.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            No custody handoffs recorded yet.
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[15px] top-0 bottom-0 w-px bg-gray-200" />
            <div className="space-y-0">
              {handoffs.map((handoff, idx) => {
                const isAcked = handoff.receiver_ack;
                const hasEvidence = handoff.evidence_refs.length > 0;

                return (
                  <div key={handoff.id} className="relative flex items-start gap-3 py-2.5">
                    <div className={`relative z-10 w-[30px] h-[30px] rounded-full flex items-center justify-center border-2 shrink-0 ${
                      isAcked
                        ? "bg-emerald-50 border-emerald-300"
                        : "bg-white border-gray-200"
                    }`}>
                      {isAcked ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-medium text-foreground">
                          {handoff.ho_type.replace(/_/g, " ")}
                        </span>
                        {handoff.location && (
                          <span className="text-muted-foreground truncate">{handoff.location}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span>{new Date(handoff.occurred_at).toLocaleDateString()}</span>
                        {hasEvidence && (
                          <span className="flex items-center gap-0.5">
                            <FileText className="h-2.5 w-2.5" />
                            {handoff.evidence_refs.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustodyTimeline;
