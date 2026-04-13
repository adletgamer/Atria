import { ArrowLeft, MapPin, ShieldAlert, Calendar, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import type { ConsignmentStatus, PackStatus } from "@/types/consignment.types";

interface ConsignmentHeaderProps {
  caseNumber: string;
  exporterName: string | null;
  destinationCountry: string;
  destinationPort: string | null;
  status: ConsignmentStatus;
  packStatus: PackStatus;
  blockingCount: number;
  estimatedDeparture: string | null;
  shipmentWindowStart: string | null;
  shipmentWindowEnd: string | null;
  importReady: boolean;
  financingReady: boolean;
  lastComputedAt: string | null;
}

const statusStyles: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-600 border-gray-200" },
  pending_docs: { label: "Pending Docs", className: "bg-amber-50 text-amber-700 border-amber-200" },
  pending_inspection: { label: "Pending Inspection", className: "bg-amber-50 text-amber-700 border-amber-200" },
  ready_to_ship: { label: "Ready to Ship", className: "bg-blue-50 text-blue-700 border-blue-200" },
  in_transit: { label: "In Transit", className: "bg-blue-50 text-blue-700 border-blue-200" },
  arrived: { label: "Arrived", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  customs_hold: { label: "Customs Hold", className: "bg-red-50 text-red-700 border-red-200" },
  cleared: { label: "Cleared", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  exception: { label: "Exception", className: "bg-red-50 text-red-700 border-red-200" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200" },
};

const packStyles: Record<string, { label: string; className: string }> = {
  not_generated: { label: "No Pack", className: "bg-gray-100 text-gray-500 border-gray-200" },
  stale: { label: "Pack Stale", className: "bg-amber-50 text-amber-700 border-amber-200" },
  fresh: { label: "Pack Fresh", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  anchored: { label: "Anchored", className: "bg-blue-50 text-blue-700 border-blue-200" },
  shared: { label: "Shared", className: "bg-blue-50 text-blue-700 border-blue-200" },
};

const ConsignmentHeader = ({
  caseNumber,
  exporterName,
  destinationCountry,
  destinationPort,
  status,
  packStatus,
  blockingCount,
  estimatedDeparture,
  shipmentWindowStart,
  shipmentWindowEnd,
  importReady,
  financingReady,
  lastComputedAt,
}: ConsignmentHeaderProps) => {
  const ss = statusStyles[status] || statusStyles.draft;
  const ps = packStyles[packStatus] || packStyles.not_generated;

  const operativeWindow = shipmentWindowStart && shipmentWindowEnd
    ? `${new Date(shipmentWindowStart).toLocaleDateString()} – ${new Date(shipmentWindowEnd).toLocaleDateString()}`
    : estimatedDeparture
      ? `ETD: ${new Date(estimatedDeparture).toLocaleDateString()}`
      : null;

  return (
    <div className="border-b bg-white sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <Link
          to="/consignments"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-3 w-3" />
          Consignments
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                {caseNumber}
              </h1>
              <Badge variant="outline" className={`text-xs font-medium ${ss.className}`}>
                {ss.label}
              </Badge>
              <Badge variant="outline" className={`text-[10px] font-medium ${ps.className}`}>
                <Package className="h-2.5 w-2.5 mr-1" />
                {ps.label}
              </Badge>
            </div>

            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {exporterName && (
                <span className="font-medium text-foreground">{exporterName}</span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {destinationCountry}{destinationPort ? ` — ${destinationPort}` : ""}
              </span>
              {operativeWindow && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {operativeWindow}
                </span>
              )}
            </div>

            {/* Readiness indicators inline */}
            <div className="flex items-center gap-3 mt-2">
              <ReadinessChip label="Import" ready={importReady} />
              <ReadinessChip label="Financing" ready={financingReady} />
              {lastComputedAt && (
                <span className="text-[10px] text-muted-foreground">
                  Computed: {new Date(lastComputedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {blockingCount > 0 && (
              <div className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-sm font-medium">
                <ShieldAlert className="h-3.5 w-3.5" />
                {blockingCount} blocking
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ReadinessChip = ({ label, ready }: { label: string; ready: boolean }) => (
  <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
    ready ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
  }`}>
    <div className={`w-1.5 h-1.5 rounded-full ${ready ? "bg-emerald-500" : "bg-gray-300"}`} />
    {label}
  </div>
);

export default ConsignmentHeader;
