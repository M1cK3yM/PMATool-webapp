// new code file created
"use client";

import type { TemplateField, TemplateForm } from "@/lib/template-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FieldInfoPanelProps {
  field: TemplateField | null; // The currently selected field object.
  forms: TemplateForm[]; // List of available forms for the dropdown.
  onUpdateField: (field: TemplateField) => void; // Handler to commit updates to the parent state.
}

export default function FieldInfoPanel({
  field,
  forms,
  onUpdateField,
}: FieldInfoPanelProps) {
  
  /**
   * Helper function to update a specific property on the selected field.
   * @param key The field property to update (e.g., 'comments').
   * @param value The new value for the property.
   */
  const handleUpdate = (key: keyof TemplateField, value: any) => {
    if (field) {
      onUpdateField({ ...field, [key]: value });
    }
  };

  /**
   * Handles changing the selected form in the dropdown.
   * Also updates the corresponding formOrder based on the selected form's sequence.
   * @param formID The unique ID of the newly selected form.
   */
  const handleFormChange = (formID: string) => {
    if (field) {
      const form = forms.find(f => f.formID === formID);
      onUpdateField({ 
        ...field, 
        formID: formID,
        // Inherit the form's sequence number as the field's order.
        formOrder: form ? form.formSeq : 0,
      });
    }
  };

  return (
    <Card className="h-full flex flex-col flex-1">
      <CardHeader>
        <CardTitle>Field Information</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {!field ? (
          // Message displayed when no field is selected.
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a field from the list to see its details.
          </div>
        ) : (
          <>
            {/* Top Row: Parent Form and Sequence */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentForm">Parent Form ID</Label>
                <Select
                  value={field.formID}
                  onValueChange={handleFormChange}
                >
                  <SelectTrigger id="parentForm">
                    <SelectValue placeholder="Select a form..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">(No Form)</SelectItem>
                    {forms.map((form) => (
                      <SelectItem key={form.ID || form.formID} value={form.formID}>
                        {form.formName} ({form.formID})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="formSeq">Sequence in Form</Label>
                <Input
                  id="formSeq"
                  type="number"
                  // This value is editable, although typically used with the Renum button.
                  value={field.formOrder}
                  onChange={(e) => handleUpdate('formOrder', Number(e.target.value))}
                />
              </div>
            </div>
            
            {/* Middle Row: Read-Only Database Metadata */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Field Data Type</Label>
                <Input value={field.dataType} readOnly disabled className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>Field Length</Label>
                <Input value={field.fieldLength} readOnly disabled className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>Default Value</Label>
                <Input value={field.defaultValue} readOnly disabled className="bg-muted/50" />
              </div>
            </div>
            
            {/* Bottom Row: Field Help (Read-Only) */}
            <div className="space-y-2">
              <Label>Field Help</Label>
              <Textarea
                // Using fieldPrompt as a proxy for the database 'Field Help' text.
                value={field.fieldPrompt}
                readOnly
                disabled
                className="h-24 bg-muted/50"
              />
            </div>
            
            {/* Installation Comments (Editable) */}
            <div className="space-y-2">
              <Label>Installation Comments</Label>
              <Textarea
                value={field.comments || ""}
                onChange={(e) => handleUpdate('comments', e.target.value)}
                className="h-24"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}