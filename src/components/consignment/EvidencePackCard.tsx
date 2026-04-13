import { Package, Download, Hash, Anchor, Clock, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EvidencePackCardProps {
  packGenerated: boolean;
  lastGeneratedAt: string | null;
  packHash: string | null;
  anchorStatus: "anchored" | "pending" | "none";
  anchorTxHash: string | null;
  onGenerate?: () => void;
  onDownload?: () => void;
  onVerify?: () => void;
  generating?: boolean;
}

const anchorConfig = {
  anchored: { label: "Anchored", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending: { label: "Pending", className: "bg-amber-50 text-amber-600 border-amber-200" },
  none: { label: "Not Anchored", className: "bg-gray-50 text-gray-500 border-gray-200" },
};

const EvidencePackCard = ({
  packGenerated,
  lastGeneratedAt,
  packHash,
  anchorStatus,
  anchorTxHash,
  onGenerate,
  onDownload,
  onVerify,
  generating = false,
}: EvidencePackCardProps) => {
  const ac = anchorConfig[anchorStatus];

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-900 uppercase tracking-tight">
            <Package className="h-4 w-4 text-indigo-700" />
            Official Dossier
          </CardTitle>
          {packGenerated && (
            <Badge variant="outline" className={`text-xs ${ac.className}`}>
              {ac.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {!packGenerated ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3 font-medium">
              No official dossier generated yet.
            </p>
            <Button
              size="sm"
              className="h-9 text-xs w-full bg-indigo-700 hover:bg-indigo-800 text-white"
              onClick={onGenerate}
              disabled={generating}
            >
              {generating ? (
                <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
              ) : (
                <Package className="h-3 w-3 mr-1.5" />
              )}
              {generating ? "Generating..." : "Generate Pack"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {lastGeneratedAt && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Generated
                </span>
                <span className="text-foreground font-medium">
                  {new Date(lastGeneratedAt).toLocaleString()}
                </span>
              </div>
            )}

            {packHash && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Hash className="h-3 w-3" />
                  Pack Hash
                </span>
                <code className="text-[10px] bg-muted px-2 py-0.5 rounded font-mono text-foreground max-w-[180px] truncate">
                  {packHash}
                </code>
              </div>
            )}

            {anchorTxHash && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Anchor className="h-3 w-3" />
                  Anchor TX
                </span>
                <code className="text-[10px] bg-muted px-2 py-0.5 rounded font-mono text-foreground max-w-[180px] truncate">
                  {anchorTxHash}
                </code>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={onDownload}
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={onGenerate}
                disabled={generating}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${generating ? "animate-spin" : ""}`} />
                Regenerate
              </Button>
              {onVerify && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs flex-1"
                  onClick={onVerify}
                >
                  <Hash className="h-3 w-3 mr-1" />
                  Verify
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EvidencePackCard;
