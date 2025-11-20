"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { getFeilds, TableField as ApiTableField } from "@/lib/table-service";
import type { Template } from "@/lib/template-service";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddFieldsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
  onAddFields: (newFields: ApiTableField[]) => void;
}

export function AddFieldsDialog({
  open,
  onOpenChange,
  template,
  onAddFields,
}: AddFieldsDialogProps) {
  // State to hold all available fields retrieved from the database schema.
  const [availableFields, setAvailableFields] = useState<ApiTableField[]>([]);
  // State to track which fields the user has selected to add.
  const [selectedFieldNames, setSelectedFieldNames] = useState<Set<string>>(
    new Set()
  );
  // UI loading state.
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Fetches the schema from the database when the dialog opens.
   * Filters out any fields already present in the current template.
   */
  useEffect(() => {
    // Only run if the dialog is open and a template is selected.
    if (open && template) {
      setIsLoading(true);
      const username = "Administrator"; // Use a default user for schema access.
      getFeilds({
        username,
        tableName: template.tableName,
        dbType: template.databaseName,
        connType: "SRC", // Fetch schema from the Source Database.
      })
        .then((allFields) => {
          // Identify fields already in the template to avoid duplicates.
          const existingFieldNames = new Set(
            template.fields.map((f) => f.fieldName)
          );
          // Filter the list to only show fields that are not yet in the template.
          const newFields = allFields.filter(
            (f) => !existingFieldNames.has(f.name)
          );
          setAvailableFields(newFields);
          setSelectedFieldNames(new Set());
        })
        .catch((error) => {
          toast.error("Failed to fetch table fields: " + error.message);
          setAvailableFields([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, template]);

  /**
   * Adds or removes a field name from the set of selected fields.
   * @param fieldName The name of the field to toggle.
   */
  const toggleSelection = (fieldName: string) => {
    setSelectedFieldNames((prev) => {
      const next = new Set(prev);
      if (next.has(fieldName)) {
        next.delete(fieldName);
      } else {
        next.add(fieldName);
      }
      return next;
    });
  };

  /**
   * Handles the 'Add Fields' button click.
   * Filters the available fields down to the selected ones and calls the parent handler.
   */
  const handleSave = () => {
    // Get the full data object for the selected field names.
    const fieldsToAdd = availableFields.filter((f) =>
      selectedFieldNames.has(f.name)
    );
    onAddFields(fieldsToAdd);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Fields to {template?.tableName}</DialogTitle>
          <DialogDescription>
            Select fields from the database to add to your template.
          </DialogDescription>
        </DialogHeader>
        {/* Table area displays the available fields with metadata */}
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Add</TableHead>
                <TableHead>Field Name</TableHead>
                <TableHead>Data Type</TableHead>
                <TableHead>Length</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Loading fields...
                  </TableCell>
                </TableRow>
              ) : availableFields.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No new fields found or table schema is empty.
                  </TableCell>
                </TableRow>
              ) : (
                availableFields.map((field) => (
                  <TableRow key={field.name}>
                    <TableCell>
                      <Checkbox
                        checked={selectedFieldNames.has(field.name)}
                        onCheckedChange={() => toggleSelection(field.name)}
                      />
                    </TableCell>
                    <TableCell>{field.name}</TableCell>
                    <TableCell>{field.type}</TableCell>
                    <TableCell>{field.length}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={selectedFieldNames.size === 0}>
            Add {selectedFieldNames.size} Fields
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}