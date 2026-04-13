import { useState, useEffect } from "react";
import { format } from "date-fns";
import { PackageOpen, X, Ship, CalendarIcon, Loader2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { consignmentService } from "@/services/consignmentService";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

interface CreateConsignmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const INCOTERMS = ["FOB", "CIF", "EXW", "CFR", "DAP", "DDP"];
const COUNTRIES = ["United States", "Netherlands", "Spain", "United Kingdom", "France", "China"];

const CreateConsignmentSheet = ({ open, onOpenChange, onSuccess }: CreateConsignmentSheetProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [caseNumber, setCaseNumber] = useState("");
  const [country, setCountry] = useState("");
  const [port, setPort] = useState("");
  const [incoterm, setIncoterm] = useState("");
  const [departureDate, setDepartureDate] = useState("");

  // Auto-generate case number on mount whenever the sheet is opened
  useEffect(() => {
    if (open) {
      setCaseNumber(consignmentService.generateNextCaseNumber());
      setCountry("");
      setPort("");
      setIncoterm("");
      setDepartureDate("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!country) {
      toast({ title: "Validation Error", description: "Destination country is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const exporter_id = userData?.user?.id;

      if (!exporter_id) throw new Error("Exporter Authentication Failed");

      const res = await consignmentService.createCase({
        case_number: caseNumber,
        exporter_id,
        destination_country: country,
        destination_port: port || undefined,
        incoterm: incoterm || undefined,
        estimated_departure: departureDate || undefined,
      });

      if (!res.success) throw new Error(res.error);

      toast({
        title: "Consignment Base Created",
        description: "Proceeding to Documentation Phase...",
      });

      onSuccess?.();
      // Redirect to the newly created workbench
      if (res.data?.case_uuid) {
        navigate(`/consignments/${res.data.case_uuid}?new=true`);
      }
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Creation Failed",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md border-l-0 shadow-2xl p-0 flex flex-col h-full bg-white/95 backdrop-blur-xl">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex flex-col justify-center">
          <SheetHeader className="text-left space-y-1">
            <div className="flex items-center gap-2 text-indigo-700">
               <PackageOpen className="h-5 w-5" />
               <SheetTitle className="text-xl font-bold tracking-tight text-gray-900">Initialize Consignment</SheetTitle>
            </div>
            <SheetDescription className="text-sm font-medium text-gray-500">
              Create the baseline case dossier before attaching evidence.
            </SheetDescription>
          </SheetHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
          {/* Section 1: Identification */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Tracking Identifier</h4>
            <div className="space-y-2">
              <Label htmlFor="case_number" className="text-gray-700">Case Number</Label>
              <div className="relative">
                <Input 
                  id="case_number" 
                  value={caseNumber} 
                  onChange={(e) => setCaseNumber(e.target.value)} 
                  className="font-mono text-indigo-700 font-medium bg-indigo-50 border-indigo-100 focus-visible:ring-indigo-300"
                  required 
                />
              </div>
            </div>
          </div>

          {/* Section 2: Logistics */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Logistics & Route</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="destination_country" className="text-gray-700">Destination Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="bg-white border-gray-200">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination_port" className="text-gray-700">Port of Entry</Label>
                  <Input 
                    id="destination_port" 
                    placeholder="e.g. Rotterdam" 
                    value={port} 
                    onChange={(e) => setPort(e.target.value)}
                    className="border-gray-200 bg-white"
                  />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label htmlFor="incoterm" className="text-gray-700">Incoterm</Label>
                  <Select value={incoterm} onValueChange={setIncoterm}>
                    <SelectTrigger className="bg-white border-gray-200">
                      <SelectValue placeholder="Ex: FOB" />
                    </SelectTrigger>
                    <SelectContent>
                      {INCOTERMS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="est_departure" className="text-gray-700 flex items-center gap-1.5">
                    <CalendarIcon className="h-3 w-3" /> Departure Date
                  </Label>
                  <Input 
                    id="est_departure" 
                    type="date"
                    value={departureDate} 
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="border-gray-200 bg-white text-gray-700"
                  />
                </div>
            </div>
          </div>

          <div className="bg-blue-50/50 p-4 border border-blue-100 rounded-md">
            <h5 className="text-sm font-semibold text-blue-900 mb-1 flex items-center gap-1.5"><Ship className="h-4 w-4" /> Next Steps</h5>
            <p className="text-xs text-blue-800/80 leading-relaxed">
              Once created, you will be redirected to the **Consignment Workbench** to attach lot details, upload compliance evidence, and check readiness scores.
            </p>
          </div>
        </form>

        <SheetFooter className="px-6 py-4 border-t border-gray-100 bg-gray-50/80">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200 text-gray-700 bg-white hover:bg-gray-50">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !country || !caseNumber} className="bg-indigo-700 hover:bg-indigo-800 text-white shadow-sm transition-all group">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Initialize Dossier"}
            {!loading && <ArrowRight className="ml-1.5 h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default CreateConsignmentSheet;
