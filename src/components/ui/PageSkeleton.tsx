/**
 * PageSkeleton — reusable loading skeleton components.
 * Use these instead of spinners; perceived performance is better.
 */

import { cn } from "@/lib/utils";

// ── Base pulse bar ────────────────────────────────────────────────────────────
function Bone({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded bg-gray-100", className)} />
  );
}

// ── Card skeleton ─────────────────────────────────────────────────────────────
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border border-gray-100 bg-white p-5 space-y-3", className)}>
      <Bone className="h-4 w-1/3" />
      <Bone className="h-8 w-2/3" />
      <Bone className="h-3 w-full" />
      <Bone className="h-3 w-4/5" />
    </div>
  );
}

// ── Table skeleton ────────────────────────────────────────────────────────────
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <Bone className="h-4 w-32" />
      </div>
      <div className="divide-y divide-gray-50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5">
            <Bone className="h-3 w-3 rounded-full shrink-0" />
            <Bone className="h-3 flex-1" />
            <Bone className="h-3 w-24" />
            <Bone className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── KPI grid skeleton ─────────────────────────────────────────────────────────
export function KpiGridSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className={`grid gap-4 grid-cols-2 md:grid-cols-${cols}`}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-100 bg-white p-5 space-y-2">
          <Bone className="h-3 w-20" />
          <Bone className="h-8 w-16" />
          <Bone className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

// ── Workbench skeleton ────────────────────────────────────────────────────────
export function WorkbenchSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="flex items-center gap-4">
          <Bone className="h-8 w-8 rounded-lg shrink-0" />
          <div className="space-y-2 flex-1">
            <Bone className="h-5 w-40" />
            <Bone className="h-3 w-64" />
          </div>
          <Bone className="h-8 w-28 rounded" />
          <Bone className="h-8 w-28 rounded" />
        </div>
      </div>
      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Sentinel placeholder */}
        <Bone className="h-24 w-full rounded-lg" />
        {/* Scorecard */}
        <KpiGridSkeleton cols={4} />
        {/* Main panels */}
        <div className="space-y-4">
          <TableSkeleton rows={4} />
          <TableSkeleton rows={3} />
        </div>
      </div>
    </div>
  );
}

// ── Generic page skeleton (used on Analytics, Readiness, Evidence) ────────────
export function GenericPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Bone className="h-6 w-48" />
          <Bone className="h-4 w-80" />
        </div>
        {/* KPIs */}
        <KpiGridSkeleton cols={4} />
        {/* Charts / tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Bone className="h-64 rounded-lg" />
          <Bone className="h-64 rounded-lg" />
        </div>
        <TableSkeleton rows={6} />
      </div>
    </div>
  );
}
