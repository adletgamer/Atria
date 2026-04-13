import { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Loader2,
  Leaf,
  FileCheck,
  Package,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { hederaService } from "@/services/hederaService";
import { getHashScanUrl } from "@/config/hedera";
import { logger } from "@/utils/logger";
import type { TrustProof } from "@/types/hedera.types";

interface AnchorTimelineProps {
  consignmentId: string;
}

interface TimelineEvent {
  id: string;
  type: "local" | "hedera";
  icon: any;
  label: string;
  sublabel: string;
  timestamp: string | null;
  status: "done" | "pending" | "missing";
  hederaProof?: TrustProof;
  hashScanUrl?: string;
}

const AnchorTimeline = ({ consignmentId }: AnchorTimelineProps) => {
  const [proofs, setProofs] = useState<TrustProof[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProofs();
  }, [consignmentId]);

  const loadProofs = async () => {
    setLoading(true);
    const result = await hederaService.getConsignmentProofs(consignmentId);
    if (result.success && result.data) {
      setProofs(result.data);
    }
    setLoading(false);
  };

  // Build timeline events from proofs
  const buildTimeline = (): TimelineEvent[] => {
    const latestProof = proofs.length > 0 ? proofs[0] : null;
    const isAnchored = latestProof?.status === "anchored" || latestProof?.status === "verified";

    const events: TimelineEvent[] = [
      {
        id: "harvest",
        type: "local",
        icon: Leaf,
        label: "Harvest registered",
        sublabel: "Local timestamp",
        timestamp: latestProof?.created_at || null,
        status: latestProof ? "done" : "missing",
      },
      {
        id: "evidence",
        type: "local",
        icon: FileCheck,
        label: "Evidence collected",
        sublabel: `${latestProof?.evidence_count || 0} objects, ${latestProof?.attestation_count || 0} attestations`,
        timestamp: latestProof?.hash_computed_at || null,
        status: latestProof ? "done" : "missing",
      },
      {
        id: "pack_hash",
        type: "local",
        icon: Package,
        label: "Pack hash computed",
        sublabel: latestProof ? `SHA-256: ${latestProof.pack_hash.slice(0, 16)}...` : "Awaiting evidence",
        timestamp: latestProof?.hash_computed_at || null,
        status: latestProof ? "done" : "missing",
      },
      {
        id: "anchor",
        type: "hedera",
        icon: isAnchored ? ShieldCheck : ShieldAlert,
        label: isAnchored ? "Anchored on Hedera" : "Pending anchor",
        sublabel: isAnchored
          ? `Seq #${latestProof?.sequence_number} — Consensus confirmed`
          : latestProof?.status === "pending_anchor"
            ? "Submission in progress..."
            : "Not yet submitted to Hedera",
        timestamp: latestProof?.anchored_at || null,
        status: isAnchored ? "done" : latestProof?.status === "pending_anchor" ? "pending" : "missing",
        hederaProof: latestProof || undefined,
        hashScanUrl: latestProof?.transaction_id ? getHashScanUrl(latestProof.transaction_id) : undefined,
      },
      {
        id: "pack_closed",
        type: "hedera",
        icon: ShieldCheck,
        label: "Evidence Pack sealed",
        sublabel: latestProof?.status === "verified"
          ? "Externally verified via Mirror Node"
          : isAnchored
            ? "Anchored — awaiting external verification"
            : "Pack not yet sealed",
        timestamp: latestProof?.verified_at || null,
        status: latestProof?.status === "verified" ? "done" : "missing",
      },
    ];

    return events;
  };

  if (loading) {
    return (
      <Card className="border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  const timeline = buildTimeline();

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Audit Trail
          </CardTitle>
          {proofs.length > 0 && (
            <Badge variant="outline" className="text-[10px]">
              v{proofs[0].pack_version}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border" />

          <div className="space-y-4">
            {timeline.map((event, idx) => {
              const Icon = event.icon;
              const isHedera = event.type === "hedera";
              const isDone = event.status === "done";
              const isPending = event.status === "pending";

              return (
                <div key={event.id} className="relative flex items-start gap-3">
                  {/* Icon dot */}
                  <div
                    className={`relative z-10 w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0
                      ${isDone
                        ? isHedera
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-primary/10 text-primary"
                        : isPending
                          ? "bg-blue-100 text-blue-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                  >
                    {isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Icon className="h-3 w-3" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-xs font-medium ${isDone ? "text-foreground" : "text-muted-foreground"}`}>
                        {event.label}
                      </p>
                      {isHedera && isDone && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 text-emerald-600 border-emerald-300"
                        >
                          🟢
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {event.sublabel}
                    </p>
                    {event.timestamp && (
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {isHedera ? "Consensus: " : ""}
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    )}
                    {event.hashScanUrl && (
                      <a
                        href={event.hashScanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-0.5"
                      >
                        View on HashScan
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnchorTimeline;
