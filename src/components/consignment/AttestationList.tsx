import { UserCheck, FileText, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ConsignmentAttestation } from "@/types/consignment.types";

interface AttestationListProps {
  attestations: ConsignmentAttestation[];
}

const AttestationList = ({ attestations }: AttestationListProps) => {
  const active = attestations.filter((a) => !a.revoked);
  const revoked = attestations.filter((a) => a.revoked);

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-muted-foreground" />
            Attestations
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {active.length} active{revoked.length > 0 ? `, ${revoked.length} revoked` : ""}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {attestations.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            No attestations recorded yet.
          </div>
        ) : (
          <div className="space-y-2">
            {active.map((att) => (
              <AttestationRow key={att.id} attestation={att} />
            ))}
            {revoked.map((att) => (
              <AttestationRow key={att.id} attestation={att} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AttestationRow = ({ attestation }: { attestation: ConsignmentAttestation }) => {
  const isRevoked = attestation.revoked;

  return (
    <div
      className={`flex items-start gap-3 px-3 py-2.5 rounded-lg text-sm border ${
        isRevoked ? "bg-gray-50 opacity-60 border-gray-100" : "bg-white border-gray-100"
      }`}
    >
      <div className="mt-0.5">
        {isRevoked ? (
          <XCircle className="h-3.5 w-3.5 text-gray-400" />
        ) : (
          <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium text-xs ${isRevoked ? "text-gray-400 line-through" : "text-foreground"}`}>
            {attestation.att_type.replace(/_/g, " ")}
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {attestation.role_at_time}
          </Badge>
        </div>
        {attestation.statement && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{attestation.statement}</p>
        )}
        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {new Date(attestation.attested_at).toLocaleDateString()}
          </span>
          {attestation.evidence_refs.length > 0 && (
            <span className="flex items-center gap-1">
              <FileText className="h-2.5 w-2.5" />
              {attestation.evidence_refs.length} evidence ref{attestation.evidence_refs.length !== 1 ? "s" : ""}
            </span>
          )}
          <span className="capitalize">{attestation.sig_method.replace(/_/g, " ")}</span>
        </div>
      </div>
    </div>
  );
};

export default AttestationList;
