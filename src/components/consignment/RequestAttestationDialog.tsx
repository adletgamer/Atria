import { useState } from "react";
import { UserCheck, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { logger } from "@/utils/logger";
import type { AttestationType } from "@/types/consignment.types";

interface RequestAttestationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consignmentId: string;
  onSuccess?: () => void;
}

const ATTESTATION_TYPES: { value: AttestationType; label: string; description: string }[] = [
  { value: "quality_confirmed", label: "Quality Confirmed", description: "Product quality meets export standards" },
  { value: "docs_complete", label: "Documents Complete", description: "All required documentation present" },
  { value: "inspection_passed", label: "Inspection Passed", description: "Passed regulatory inspection" },
  { value: "phyto_cleared", label: "Phytosanitary Cleared", description: "Phytosanitary requirements met" },
  { value: "export_cleared", label: "Export Cleared", description: "Cleared for export by authorities" },
  { value: "import_cleared", label: "Import Cleared", description: "Cleared for import by destination" },
  { value: "customs_released", label: "Customs Released", description: "Released by customs authorities" },
  { value: "payment_confirmed", label: "Payment Confirmed", description: "Payment received and confirmed" },
];

const RequestAttestationDialog = ({
  open,
  onOpenChange,
  consignmentId,
  onSuccess,
}: RequestAttestationDialogProps) => {
  const [attestationType, setAttestationType] = useState<AttestationType>("quality_confirmed");
  const [actorEmail, setActorEmail] = useState("");
  const [actorName, setActorName] = useState("");
  const [notes, setNotes] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async () => {
    if (!actorEmail || !actorName) {
      setError("Please provide actor name and email");
      return;
    }

    setRequesting(true);
    setError(null);

    try {
      // TODO: Implement attestationService.requestAttestation()
      // For now, just log and simulate success
      logger.info("attestation.requested", {
        consignment_id: consignmentId,
        type: attestationType,
        actor_email: actorEmail,
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onSuccess?.();
      handleClose();
    } catch (err: any) {
      logger.error("attestation.request_failed", { consignment_id: consignmentId }, err);
      setError(err.message || "Request failed");
    } finally {
      setRequesting(false);
    }
  };

  const handleClose = () => {
    setAttestationType("quality_confirmed");
    setActorEmail("");
    setActorName("");
    setNotes("");
    setError(null);
    onOpenChange(false);
  };

  const selectedType = ATTESTATION_TYPES.find((t) => t.value === attestationType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Request Attestation</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Request a third-party attestation for this consignment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Attestation Type */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-medium">
              Attestation Type
            </Label>
            <Select
              value={attestationType}
              onValueChange={(value) => setAttestationType(value as AttestationType)}
              disabled={requesting}
            >
              <SelectTrigger id="type" className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ATTESTATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedType && (
              <p className="text-xs text-muted-foreground">{selectedType.description}</p>
            )}
          </div>

          {/* Actor Name */}
          <div className="space-y-2">
            <Label htmlFor="actor-name" className="text-sm font-medium">
              Attestor Name
            </Label>
            <Input
              id="actor-name"
              value={actorName}
              onChange={(e) => setActorName(e.target.value)}
              placeholder="e.g., SENASA Inspector"
              disabled={requesting}
              className="text-sm"
            />
          </div>

          {/* Actor Email */}
          <div className="space-y-2">
            <Label htmlFor="actor-email" className="text-sm font-medium">
              Attestor Email
            </Label>
            <Input
              id="actor-email"
              type="email"
              value={actorEmail}
              onChange={(e) => setActorEmail(e.target.value)}
              placeholder="inspector@senasa.gob.pe"
              disabled={requesting}
              className="text-sm"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes (optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any specific requirements or context..."
              rows={3}
              disabled={requesting}
              className="text-sm resize-none"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={requesting} className="text-sm">
            Cancel
          </Button>
          <Button onClick={handleRequest} disabled={requesting || !actorEmail || !actorName} className="text-sm">
            {requesting ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <UserCheck className="mr-2 h-3.5 w-3.5" />
                Send Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RequestAttestationDialog;
