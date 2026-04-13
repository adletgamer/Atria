import { Plus, UserCheck, RefreshCw, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  onAddEvidence?: () => void;
  onRequestAttestation?: () => void;
  onRecomputeState?: () => void;
  onExportPack?: () => void;
  recomputing?: boolean;
}

const QuickActions = ({
  onAddEvidence,
  onRequestAttestation,
  onRecomputeState,
  onExportPack,
  recomputing = false,
}: QuickActionsProps) => {
  const actions = [
    { label: "Add Evidence", icon: Plus, onClick: onAddEvidence, variant: "default" as const },
    { label: "Request Attestation", icon: UserCheck, onClick: onRequestAttestation, variant: "outline" as const },
    { label: "Recompute State", icon: RefreshCw, onClick: onRecomputeState, variant: "outline" as const, loading: recomputing },
    { label: "Export Pack", icon: Download, onClick: onExportPack, variant: "outline" as const },
  ];

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant}
            size="sm"
            className="w-full justify-start h-9 text-xs"
            onClick={action.onClick}
            disabled={action.loading}
          >
            <action.icon className={`h-3.5 w-3.5 mr-2 ${action.loading ? "animate-spin" : ""}`} />
            {action.loading ? "Computing..." : action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default QuickActions;
