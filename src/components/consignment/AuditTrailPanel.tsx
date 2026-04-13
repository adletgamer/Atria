import { useState, useEffect } from "react";
import { Clock, FileText, UserCheck, AlertCircle, Package, Anchor, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auditService, type AuditEvent, type AuditEventType } from "@/services/auditService";
import { logger } from "@/utils/logger";

interface AuditTrailPanelProps {
  consignmentId: string;
}

const EVENT_CONFIG: Record<AuditEventType, { icon: any; label: string; color: string }> = {
  evidence_uploaded: { icon: FileText, label: "Evidence Uploaded", color: "text-blue-600" },
  attestation_requested: { icon: UserCheck, label: "Attestation Requested", color: "text-purple-600" },
  exception_resolved: { icon: AlertCircle, label: "Exception Resolved", color: "text-emerald-600" },
  pack_generated: { icon: Package, label: "Pack Generated", color: "text-amber-600" },
  pack_anchored: { icon: Anchor, label: "Pack Anchored", color: "text-indigo-600" },
  consignment_created: { icon: FileText, label: "Consignment Created", color: "text-gray-600" },
  consignment_updated: { icon: RefreshCw, label: "Consignment Updated", color: "text-gray-600" },
  state_recomputed: { icon: RefreshCw, label: "State Recomputed", color: "text-gray-600" },
  handoff_recorded: { icon: UserCheck, label: "Handoff Recorded", color: "text-teal-600" },
};

const AuditTrailPanel = ({ consignmentId }: AuditTrailPanelProps) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAuditTrail();
  }, [consignmentId]);

  const loadAuditTrail = async () => {
    setLoading(true);
    setError(null);

    const result = await auditService.getAuditTrail(consignmentId);

    if (result.success && result.data) {
      setEvents(result.data);
    } else {
      setError(result.error || "Failed to load audit trail");
      logger.error("auditTrail.load_failed", { consignment_id: consignmentId });
    }

    setLoading(false);
  };

  const toggleExpand = (eventId: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
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
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Loading audit trail...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-red-600 py-4">{error}</div>
          <Button variant="outline" size="sm" onClick={loadAuditTrail}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No events recorded yet</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Actions like uploading evidence or generating packs will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Audit Trail
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {events.length} event{events.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {events.map((event) => {
            const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.consignment_updated;
            const Icon = config.icon;
            const isExpanded = expandedEvents.has(event.id);

            return (
              <div
                key={event.id}
                className="border-l-2 border-muted pl-3 pb-3 last:pb-0 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 ${config.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-medium text-foreground">{config.label}</p>
                      <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDate(event.created_at)}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-1">
                      by {event.created_by || "system"}
                    </p>

                    {/* Event Details */}
                    {event.event_data && Object.keys(event.event_data).length > 0 && (
                      <div className="mt-2">
                        <button
                          onClick={() => toggleExpand(event.id)}
                          className="text-[10px] text-primary hover:underline"
                        >
                          {isExpanded ? "Hide details" : "Show details"}
                        </button>
                        {isExpanded && (
                          <div className="mt-2 p-2 bg-muted rounded text-[10px] font-mono space-y-1">
                            {Object.entries(event.event_data).map(([key, value]) => (
                              <div key={key} className="flex gap-2">
                                <span className="text-muted-foreground">{key}:</span>
                                <span className="text-foreground break-all">
                                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditTrailPanel;
