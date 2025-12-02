'use client'
import type { TemplateField } from '@/lib/template-service' 
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2 } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface FieldListProps {
  fields: TemplateField[] // The array of fields to display (may be filtered by parent).
  onDeleteField: (field: TemplateField) => void // Handler for deleting a field.
  onUpdateField: (updatedField: TemplateField) => void // Handler for inline editing/updating a field.
  onSelectField: (field: TemplateField) => void // Handler for when a user clicks a row.
  selectedField: TemplateField | null // The currently selected field object.
}

export default function FieldList({ 
  fields, 
  onDeleteField, 
  onUpdateField,
  onSelectField,
  selectedField 
}: FieldListProps) {
  
  /**
   * Handles updating a specific property of a field and passes the complete updated object up to the parent state.
   * @param field The original field object being modified.
   * @param key The property name (e.g., 'fieldPrompt').
   * @param value The new value.
   */
  const handleChange = (field: TemplateField, key: keyof TemplateField, value: any) => {
    onUpdateField({ ...field, [key]: value });
  };
  
  return (
    // Changed: h-full allows the scroll area to fit exactly into the bottom panel defined in page.tsx
    <ScrollArea className="h-full border rounded-md">
      <Table>
        <TableHeader>
            <TableRow>
              <TableHead>Field Name</TableHead>
              <TableHead>Prompt</TableHead>
              <TableHead>Value (if 'C')</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Form ID</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
        <TableBody>
          {fields.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center h-24">
                No fields defined. Click "Add Fields" to get started.
              </TableCell>
            </TableRow>
          ) : (
            fields.map((field) => (
              <TableRow 
                key={field.ID || field.fieldName}
                // Sets the currently selected field when the row is clicked.
                onClick={() => onSelectField(field)}
                // Highlights the row if it is the currently selected field.
                className={cn("cursor-pointer", 
                  selectedField?.fieldName === field.fieldName && 'bg-accent'
                )}
              >
                <TableCell className="font-medium">{field.fieldName}</TableCell>
                <TableCell>
                  {/* Editable prompt for the field */}
                  <Input
                    value={field.fieldPrompt}
                    onChange={(e) => handleChange(field, 'fieldPrompt', e.target.value)}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  {/* Editable constant value, disabled if not a 'C' type */}
                  <Input
                    value={field.fieldValue}
                    onChange={(e) => handleChange(field, 'fieldValue', e.target.value)}
                    className="h-8"
                    disabled={field.fieldType !== 'C'}
                  />
                </TableCell>
                <TableCell>
                  {/* Dropdown to select field type (Constant/Variable) */}
                  <Select
                    value={field.fieldType}
                    onValueChange={(v) => handleChange(field, 'fieldType', v)}
                  >
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="V">V</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {/* Checkbox to mark as Primary Key */}
                  <Checkbox
                    checked={field.isKey}
                    onCheckedChange={(c) => handleChange(field, 'isKey', !!c)}
                  />
                </TableCell>
                <TableCell>
                  {/* Text input for the associated Form ID */}
                  <Input
                    value={field.formID}
                    onChange={(e) => handleChange(field, 'formID', e.target.value)}
                    className="h-8 w-24"
                  />
                </TableCell>
                <TableCell>
                   {/* Input for manual Field Order/Sequence */}
                   <Input
                    type="number"
                    value={field.fieldOrder}
                    onChange={(e) => handleChange(field, 'fieldOrder', Number(e.target.value))}
                    className="h-8 w-20"
                  />
                </TableCell>
                <TableCell>
                  {/* Delete button (Trash Icon) */}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    onClick={() => onDeleteField(field)}
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
  )
}