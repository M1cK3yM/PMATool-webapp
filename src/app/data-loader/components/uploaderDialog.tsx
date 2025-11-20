// new code file created
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

  /**
   * Placeholder function for the actual data load process.
   * This would typically call the backend to read the uploaded file and execute the import.
   */
  const handleLoad = () => {
    toast.info("Data loading... (Not Implemented)");
    onOpenChange(false);
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
            <Input id="dataFile" type="file" />
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
          <Button onClick={handleLoad}>Load Data</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}