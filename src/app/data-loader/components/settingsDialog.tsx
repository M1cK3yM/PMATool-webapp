// new code file created
"use client";

import { useState, useEffect } from "react";
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
import { toast } from "sonner";

interface SettingsDialogProps {
  open: boolean; // Controls the visibility of the dialog.
  onOpenChange: (open: boolean) => void; // Handler to close the dialog.
  finDb: string; // Current Finance DB connection string/file path.
  manDb: string; // Current Manufacturing DB connection string/file path.
  onSave: (finDb: string, manDb: string) => void; // Handler to commit changes to the parent component.
}

export function SettingsDialog({
  open,
  onOpenChange,
  finDb,
  manDb,
  onSave,
}: SettingsDialogProps) {
  // Local state initialized from props to allow editing before saving.
  const [currentFinDb, setCurrentFinDb] = useState(finDb);
  const [currentManDb, setCurrentManDb] = useState(manDb);

  // Sync local state with props whenever the dialog opens.
  useEffect(() => {
    if (open) {
      setCurrentFinDb(finDb);
      setCurrentManDb(manDb);
    }
  }, [open, finDb, manDb]);

  /**
   * Commits the changes and closes the dialog.
   */
  const handleSave = () => {
    onSave(currentFinDb, currentManDb);
    toast.success("Settings saved.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Data Loader Settings</DialogTitle>
          <DialogDescription>
            Configure database connection paths (e.g., UDL files). These are
            used to determine which external data sources to connect to.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="finDb">Finance DB Connection</Label>
            <Input
              id="finDb"
              value={currentFinDb}
              onChange={(e) => setCurrentFinDb(e.target.value)}
              placeholder="e.g., ross_fin.udl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manDb">Manufacturing DB Connection</Label>
            <Input
              id="manDb"
              value={currentManDb}
              onChange={(e) => setCurrentManDb(e.target.value)}
              placeholder="e.g., ross_man.udl"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}