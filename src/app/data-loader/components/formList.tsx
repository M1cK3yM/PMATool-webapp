"use client";

import { useState } from "react";
import type { TemplateForm } from "@/lib/template-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { FileScan } from "lucide-react";

interface FormListProps {
  forms: TemplateForm[]; // List of forms for the current template.
  onAddForm: (newForm: Omit<TemplateForm, "ID" | "TemplateID" | "formScreenFile">) => void; // Handler to add a new form.
  onDeleteForm: (form: TemplateForm) => void; // Handler to delete a selected form.
  onUpdateForm: (form: TemplateForm) => void; // Handler to update the details of a selected form.
  onSelectForm: (form: TemplateForm) => void; // Handler for selecting a form from the list.
  selectedForm: TemplateForm | null; // The currently selected form object.
}

export default function FormList({
  forms,
  onAddForm,
  onDeleteForm,
  onUpdateForm,
  onSelectForm,
  selectedForm,
}: FormListProps) {
  // State for the "Add Form" inputs.
  const [formID, setFormID] = useState("");
  const [formName, setFormName] = useState("");
  const [formSeq, setFormSeq] = useState(10);

  /**
   * Captures the input values and calls the parent handler to add a new form.
   */
  const handleAdd = () => {
    if (!formID || !formName) {
      alert("Form ID and Name are required.");
      return;
    }
    onAddForm({
      formID,
      formName,
      formSeq: Number(formSeq),
      formHelp: "",
    });
    // Reset inputs and increment sequence for convenience.
    setFormID("");
    setFormName("");
    setFormSeq((prev) => prev + 10);
  };
  
  /**
   * Updates a specific detail (help text, file path) of the currently selected form.
   * @param key The field name to update.
   * @param value The new value.
   */
  const handleUpdate = (key: keyof TemplateForm, value: any) => {
    if (selectedForm) {
      onUpdateForm({ ...selectedForm, [key]: value });
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="shrink-0">
        <CardTitle>Data Entry Forms</CardTitle>
      </CardHeader>
      
      {/* Changed: Added flex-1, overflow-y-auto, and min-h-0.
          This allows the content (Table + Inputs) to scroll internally if the screen height is small,
          preventing it from pushing the footer off-screen. */}
      <CardContent className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-4">
        {/* Table list of defined forms */}
        <div className="border rounded-md shrink-0">
            <ScrollArea className="h-48">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Form ID</TableHead>
                    <TableHead>Form Name</TableHead>
                    <TableHead>Seq</TableHead>
                    <TableHead className="w-12"></TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {forms.length === 0 ? (
                    <TableRow>
                    <TableCell colSpan={4} className="text-center">
                        No forms defined.
                    </TableCell>
                    </TableRow>
                ) : (
                    forms.map((form) => (
                    <TableRow 
                        key={form.ID || form.formID}
                        onClick={() => onSelectForm(form)}
                        // Highlight the selected row
                        className={cn("cursor-pointer", 
                        selectedForm?.formID === form.formID && 'bg-accent'
                        )}
                    >
                        <TableCell>{form.formID}</TableCell>
                        <TableCell>{form.formName}</TableCell>
                        <TableCell>{form.formSeq}</TableCell>
                        <TableCell>
                        {/* Button to delete the form */}
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive"
                            onClick={() => onDeleteForm(form)}
                        >
                            <Trash2 className="size-4" />
                        </Button>
                        </TableCell>
                    </TableRow>
                    ))
                )}
                </TableBody>
            </Table>
            </ScrollArea>
        </div>
        
        {/* Form Details: Help Text (Corresponds to old txtTableFormHelp) */}
        <div className="space-y-2 shrink-0">
          <Label htmlFor="formHelp">Form Help</Label>
          <Textarea 
            id="formHelp" 
            placeholder="Help text for the selected form..."
            className="h-20"
            value={selectedForm?.formHelp || ""}
            onChange={(e) => handleUpdate('formHelp', e.target.value)}
            disabled={!selectedForm}
          />
        </div>
        
        {/* Form Details: Screen File (Corresponds to old txtFormScreenFile) */}
        <div className="space-y-2 shrink-0">
          <Label htmlFor="formScreenFile">Form Screen File</Label>
          <div className="flex gap-2">
            <Input 
              id="formScreenFile" 
              placeholder="e.g., /screens/form.jpg"
              value={selectedForm?.formScreenFile || ""}
              onChange={(e) => handleUpdate('formScreenFile', e.target.value)}
              disabled={!selectedForm}
            />
            {/* Placeholder for the C# Browse button */}
            <Button variant="outline" size="icon" disabled={!selectedForm}>
              <FileScan className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
      
      {/* Footer: Inputs for adding a new form. 
          Changed: Added shrink-0 and border-t to keep it distinct and pinned at bottom. */}
      <CardFooter className="shrink-0 border-t pt-4">
        <div className="flex w-full items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="newFormId">Form ID</Label>
            <Input id="newFormId" value={formID} onChange={(e) => setFormID(e.target.value)} />
          </div>
          <div className="flex-1">
            <Label htmlFor="newFormName">Form Name</Label>
            <Input id="newFormName" value={formName} onChange={(e) => setFormName(e.target.value)} />
          </div>
          <div className="w-20">
            <Label htmlFor="newFormSeq">Seq</Label>
            <Input id="newFormSeq" type="number" value={formSeq} onChange={(e) => setFormSeq(Number(e.target.value))} />
          </div>
          <Button onClick={handleAdd}>Add Form</Button>
        </div>
      </CardFooter>
    </Card>
  );
}