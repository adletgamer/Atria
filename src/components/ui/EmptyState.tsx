/**
 * EmptyState — consistent empty state component used across all list views.
 *
 * Usage:
 *   <EmptyState
 *     icon={Package}
 *     title="No consignments yet"
 *     description="Create your first consignment case to get started."
 *     action={{ label: "New Consignment", onClick: () => {} }}
 *   />
 */

import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "search" | "error";
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "default",
  className = "",
}: EmptyStateProps) {
  const iconColors = {
    default: "text-muted-foreground",
    search: "text-blue-400",
    error: "text-red-400",
  };

  const bgColors = {
    default: "bg-gray-50",
    search: "bg-blue-50/30",
    error: "bg-red-50/30",
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-14 px-6 text-center
      rounded-lg border border-dashed border-gray-200 ${bgColors[variant]} ${className}`}>
      <div className={`p-3 rounded-full bg-white border border-gray-100 shadow-sm`}>
        <Icon className={`h-7 w-7 ${iconColors[variant]}`} />
      </div>
      <div className="space-y-1 max-w-xs">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>
      {action && (
        <Button
          size="sm"
          variant="outline"
          onClick={action.onClick}
          className="mt-1"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
