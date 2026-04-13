import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  PackageOpen,
  Plus,
  Loader2,
  MapPin,
  ShieldAlert,
  Calendar,
  ChevronRight,
  Anchor,
  Clock
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/utils/logger";
import type { ConsignmentCase } from "@/types/consignment.types";
import CreateConsignmentSheet from "@/components/consignment/CreateConsignmentSheet";

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  draft: { label: "Draft", bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" },
  pending_docs: { label: "Pending Docs", bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  pending_inspection: { label: "Pending Inspection", bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  ready_to_ship: { label: "Ready to Ship", bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500" },
  in_transit: { label: "In Transit", bg: "bg-indigo-100", text: "text-indigo-800", dot: "bg-indigo-500" },
  arrived: { label: "Arrived", bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
  customs_hold: { label: "Customs Hold", bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
  cleared: { label: "Cleared", bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
  exception: { label: "Exception", bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
  rejected: { label: "Rejected", bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
};

const Consignments = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<ConsignmentCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("consignment_cases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) {
        logger.error("consignments.list_failed", {}, error);
      } else {
        setCases((data || []) as unknown as ConsignmentCase[]);
      }
    } catch (err: any) {
      logger.error("consignments.list_exception", {}, err);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      
      {/* Hero Header Area */}
      <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-50 blur-3xl opacity-60 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">Core Logistics</span>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Consignments
              </h1>
              <p className="text-sm text-gray-500 mt-2 max-w-lg leading-relaxed">
                Oversee the global movement of mango shipments. Monitor evidence completeness, clear exceptions, and secure immutable readiness proofs.
              </p>
            </div>
            <Button 
              onClick={() => setIsCreateOpen(true)}
              className="h-10 px-5 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold tracking-wide shadow-md hover:shadow-lg transition-all group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <Plus className="h-4 w-4 mr-2 relative z-10" />
              <span className="relative z-10">Initialize New Dossier</span>
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-32 space-x-3">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <span className="text-sm font-medium text-gray-500 tracking-wide">Syncing Blockchain Data...</span>
          </div>
        ) : cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-32 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 shadow-inner">
              <PackageOpen className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No active shipments</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
              You haven't initialized any consignment cases yet. Create your first dossier to start tracking evidence and compliance.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
              <Plus className="h-4 w-4 mr-2" /> Start First Consignment
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
             {/* Header Row for Data List */}
             <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                <div className="col-span-3">Identifier & Date</div>
                <div className="col-span-3">Destination</div>
                <div className="col-span-2">Specs</div>
                <div className="col-span-3">Status Matrix</div>
                <div className="col-span-1 text-right">Action</div>
             </div>

             {/* Case Rows */}
            {cases.map((c) => {
              const config = statusConfig[c.status] || statusConfig.draft;
              const hasBlockers = (c.blocking_exception_count || 0) > 0;
              const packStatus = c.pack_status || "not_generated";
              
              return (
                <Link key={c.id} to={`/consignments/${c.id}`} className="block group">
                  <div className={`bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 transform group-hover:-translate-y-[1px] relative
                    ${hasBlockers ? "border-red-200 hover:border-red-300" : "border-gray-200 hover:border-indigo-200"}`}>
                    
                    {/* Left Accent Bar */}
                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${hasBlockers ? "bg-red-500" : config.dot}`} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-5 pl-7">
                      
                      {/* Column 1: ID & Date */}
                      <div className="col-span-1 md:col-span-3 flex flex-col">
                         <span className="font-bold text-gray-900 text-base flex items-center gap-2">
                           {c.case_number}
                           {hasBlockers && <ShieldAlert className="h-4 w-4 text-red-500" />}
                         </span>
                         <span className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 font-medium">
                           <Clock className="h-3 w-3" />
                           Created {new Date(c.created_at).toLocaleDateString()}
                         </span>
                      </div>
                      
                      {/* Column 2: Destination */}
                      <div className="col-span-1 md:col-span-3 flex flex-col">
                         <span className="font-semibold text-gray-700 text-sm flex items-center gap-1.5">
                           <MapPin className="h-3.5 w-3.5 text-gray-400" />
                           {c.destination_country}
                         </span>
                         <span className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 pl-5">
                           Route: {c.destination_port || "TBD"}
                         </span>
                      </div>

                      {/* Column 3: Logistics Specs */}
                      <div className="col-span-1 md:col-span-2 flex flex-col">
                         <span className="font-mono text-sm text-gray-800">
                           {c.total_kg > 0 ? `${c.total_kg.toLocaleString()} kg` : "--"}
                         </span>
                         <span className="text-xs text-gray-500 mt-1">
                           {c.total_pallets > 0 ? `${c.total_pallets} pallets` : "No capacity defined"}
                         </span>
                      </div>

                      {/* Column 4: Status Badges */}
                      <div className="col-span-1 md:col-span-3 flex flex-col gap-2 items-start">
                         <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.dot}`} />
                            {config.label}
                         </span>
                         
                         {packStatus !== "not_generated" && (
                           <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-tight bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                             <Anchor className="h-3 w-3" />
                             Chain: {packStatus}
                           </div>
                         )}
                      </div>

                      {/* Column 5: Action Arrow */}
                      <div className="col-span-1 hidden md:flex justify-end items-center text-gray-400 group-hover:text-indigo-600 transition-colors">
                         <ChevronRight className="h-5 w-5" />
                      </div>
                      
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <CreateConsignmentSheet 
         open={isCreateOpen} 
         onOpenChange={setIsCreateOpen} 
         onSuccess={load}
      />
    </div>
  );
};

export default Consignments;
