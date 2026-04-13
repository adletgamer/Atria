import { useState } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";
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
import { evidenceService } from "@/services/evidenceService";
import { auditService } from "@/services/auditService";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import type { EvidenceType } from "@/types/consignment.types";

interface AddEvidenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consignmentId: string;
  onSuccess?: () => void;
}

const EVIDENCE_TYPES: { value: EvidenceType; label: string }[] = [
  { value: "document", label: "Document" },
  { value: "photo", label: "Photo" },
  { value: "certificate", label: "Certificate" },
  { value: "lab_result", label: "Lab Result" },
  { value: "inspection_report", label: "Inspection Report" },
  { value: "treatment_record", label: "Treatment Record" },
  { value: "transport_log", label: "Transport Log" },
  { value: "sensor_data", label: "Sensor Data" },
  { value: "seal_record", label: "Seal Record" },
  { value: "declaration", label: "Declaration" },
  { value: "acknowledgment", label: "Acknowledgment" },
  { value: "other", label: "Other" },
];

const AddEvidenceDialog = ({
  open,
  onOpenChange,
  consignmentId,
  onSuccess,
}: AddEvidenceDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [evidenceType, setEvidenceType] = useState<EvidenceType>("document");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || "system";

      const result = await evidenceService.uploadAndCreateEvidence({
        file,
        consignment_id: consignmentId,
        evidence_type: evidenceType,
        title: title || file.name,
        description: description || undefined,
        created_by: userId,
      });

      if (result.success && result.data) {
        logger.info("evidence.uploaded", { consignment_id: consignmentId, type: evidenceType });
        
        // Log to audit trail
        await auditService.logEvidenceUpload(
          consignmentId,
          result.data.id,
          file.name,
          file.size,
          evidenceType,
          userId
        );
        
        onSuccess?.();
        handleClose();
      } else {
        setError(result.error || "Upload failed");
      }
    } catch (err: any) {
      logger.error("evidence.upload_exception", { consignment_id: consignmentId }, err);
      setError(err.message || "An error occurred");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setEvidenceType("document");
    setTitle("");
    setDescription("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Add Evidence</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Upload a document, photo, or certificate to attach to this consignment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file" className="text-sm font-medium">
              File
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                disabled={uploading}
                className="text-sm"
              />
              {file && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  disabled={uploading}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {file && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                <span>{file.name}</span>
                <span>({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          {/* Evidence Type */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-medium">
              Evidence Type
            </Label>
            <Select
              value={evidenceType}
              onValueChange={(value) => setEvidenceType(value as EvidenceType)}
              disabled={uploading}
            >
              <SelectTrigger id="type" className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVIDENCE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-sm">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Phytosanitary Certificate"
              disabled={uploading}
              className="text-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description (optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes about this evidence..."
              rows={3}
              disabled={uploading}
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
          <Button variant="outline" onClick={handleClose} disabled={uploading} className="text-sm">
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploading || !file} className="text-sm">
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-3.5 w-3.5" />
                Upload Evidence
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddEvidenceDialog;
