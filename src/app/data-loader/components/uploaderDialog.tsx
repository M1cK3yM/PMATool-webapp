"use client";

import { useState } from "react";
import type { Template } from "@/lib/template-service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { apiClient } from "@/lib/api-client";

interface UploaderDialogProps {
  open: boolean; // Controls the visibility of the dialog.
  onOpenChange: (open: boolean) => void; // Handler to close the dialog.
  template: Template | null; // The template that defines the upload.
}

export function UploaderDialog({
  open,
  onOpenChange,
  template,
}: UploaderDialogProps) {
  // State for the text file column separator (defaults to comma).
  const [separator, setSeparator] = useState(",");
  // State for the upload action mode (append, update, merge).
  const [uploadMode, setUploadMode] = useState("append");
  // State for the selected file
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Handles the file input change event.
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  /**
   * Reads the file and sends its content to the backend for processing.
   */
  const handleLoad = async () => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }
    if (!template) {
      toast.error("No template selected.");
      return;
    }

    setIsUploading(true);

    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("username", "Administrator"); // Using default user for now
      formData.append("tableName", template.tableName);
      formData.append("databaseName", template.databaseName); // 'FIN' or 'MAN'
      formData.append("separator", separator === "tab" ? "\t" : separator);
      formData.append("mode", uploadMode); // 'append', 'update', 'merge'

      // Send POST request to backend
      // Note: We use apiClient but let the browser set the Content-Type for FormData
      const response = await apiClient.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        toast.success(`Data loaded successfully: ${response.data.message}`);
        onOpenChange(false);
        setFile(null); // Reset file input
      }
    } catch (error: any) {
      console.error("Upload failed", error);
      const msg = error.response?.data?.error || error.message || "Unknown error";
      toast.error(`Upload failed: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Data for {template?.tableName}</DialogTitle>
          <DialogDescription>
            Select a text file and configure upload options.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="dataFile">Data Load File</Label>
            <Input 
              id="dataFile" 
              type="file" 
              accept=".txt,.csv,.tsv" 
              onChange={handleFileChange}
            />
          </div>
          
          {/* Separator Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="separator">Text File Separator</Label>
              <Select
                value={separator}
                onValueChange={setSeparator}
              >
                <SelectTrigger id="separator">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=",">Comma (,)</SelectItem>
                  <SelectItem value=";">Semicolon (;)</SelectItem>
                  <SelectItem value="tab">Tab</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sepChar">Separator Char</Label>
              {/* Allows custom input only if "Other" is selected */}
              <Input
                id="sepChar"
                value={separator}
                onChange={(e) => setSeparator(e.target.value)}
                disabled={separator !== "other"}
              />
            </div>
          </div>
          
          {/* Upload Options (Replicates C# Radio Buttons) */}
          <div className="space-y-2">
            <Label>Upload Options</Label>
            <div className="space-y-2 rounded-md border p-4">
              {/* Append Only */}
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="opAppend" 
                  checked={uploadMode === 'append'} 
                  onCheckedChange={() => setUploadMode('append')}
                />
                <Label htmlFor="opAppend">Append Only (don't update)</Label>
              </div>
              {/* Update Only */}
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="opUpdate" 
                  checked={uploadMode === 'update'} 
                  onCheckedChange={() => setUploadMode('update')}
                />
                <Label htmlFor="opUpdate">Update Only (don't add)</Label>
              </div>
              {/* Merge */}
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="opMerge" 
                  checked={uploadMode === 'merge'} 
                  onCheckedChange={() => setUploadMode('merge')}
                />
                <Label htmlFor="opMerge">Merge (Add new, Update existing)</Label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleLoad} disabled={isUploading || !file}>
            {isUploading ? "Uploading..." : "Load Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}