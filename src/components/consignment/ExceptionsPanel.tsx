import { AlertTriangle, ShieldAlert, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ConsignmentException } from "@/types/consignment.types";

interface ExceptionsPanelProps {
  exceptions: ConsignmentException[];
  onResolve?: (exceptionId: string) => void;
}

const ExceptionsPanel = ({ exceptions, onResolve }: ExceptionsPanelProps) => {
  const blocking = exceptions.filter((e) => e.blocks_readiness && !e.resolved);
  const warnings = exceptions.filter((e) => !e.blocks_readiness && !e.resolved);
  const resolved = exceptions.filter((e) => e.resolved);

  const total = exceptions.length;
  const openCount = blocking.length + warnings.length;

  return (
    <Card className={blocking.length > 0 ? "border-red-300 border-t-4 border-t-red-600 shadow-sm" : "border-gray-200"}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            Exceptions
          </CardTitle>
          <div className="flex items-center gap-2">
            {blocking.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {blocking.length} blocking
              </Badge>
            )}
            {warnings.length > 0 && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                {warnings.length} warning{warnings.length !== 1 ? "s" : ""}
              </Badge>
            )}
            {openCount === 0 && total > 0 && (
              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                All resolved
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {total === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            No exceptions detected.
          </div>
        ) : (
          <div className="space-y-1">
            {blocking.map((exc) => (
              <ExceptionRow key={exc.id} exception={exc} onResolve={onResolve} />
            ))}
            {blocking.length > 0 && warnings.length > 0 && (
              <Separator className="my-2" />
            )}
            {warnings.map((exc) => (
              <ExceptionRow key={exc.id} exception={exc} onResolve={onResolve} />
            ))}
            {resolved.length > 0 && (
              <>
                <Separator className="my-2" />
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  Resolved ({resolved.length})
                </p>
                {resolved.map((exc) => (
                  <ExceptionRow key={exc.id} exception={exc} />
                ))}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ExceptionRow = ({
  exception,
  onResolve,
}: {
  exception: ConsignmentException;
  onResolve?: (id: string) => void;
}) => {
  const isBlocking = exception.blocks_readiness && !exception.resolved;
  const isResolved = exception.resolved;

  return (
    <div
      className={`flex items-start gap-3 px-3 py-2.5 rounded-lg text-sm ${
        isResolved
          ? "bg-gray-50 opacity-60"
          : isBlocking
          ? "bg-red-50 border-l-4 border-l-red-500 border-y border-y-red-100 border-r border-r-red-100"
          : "bg-amber-50 border border-amber-100"
      }`}
    >
      <div className="mt-0.5">
        {isResolved ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        ) : isBlocking ? (
          <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-xs ${isResolved ? "text-gray-500 line-through" : "text-foreground"}`}>
          {exception.title}
        </p>
        {exception.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {exception.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {exception.exc_type.replace(/_/g, " ")}
          </Badge>
          {exception.resolved_at && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              {new Date(exception.resolved_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      {!isResolved && onResolve && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs shrink-0"
          onClick={() => onResolve(exception.id)}
        >
          Resolve
        </Button>
      )}
    </div>
  );
};

export default ExceptionsPanel;
