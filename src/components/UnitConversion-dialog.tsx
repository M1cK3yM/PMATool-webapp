"use client"

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getConversions, createConversion, CustomUomConversionReq } from "@/lib/conversion-service";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface UnitConversionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
}

export default function UnitConversionDialog({ open, onOpenChange, username }: UnitConversionDialogProps) {
  const [conversions, setConversions] = useState<CustomUomConversionReq[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchConversions = async () => {
    if (!username) return;
    setIsLoading(true);
    try {
      const data = await getConversions(username);
      setConversions(data.map(conv => ({ ...conv, company_code: conv.company_code || "" })));
    } catch (error) {
      toast.error("Failed to load conversions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchConversions();
    }
  }, [open, username]);

  const handleInputChange = (index: number, field: keyof CustomUomConversionReq, value: any) => {
    const updatedConversions = [...conversions];
    updatedConversions[index] = { ...updatedConversions[index], [field]: value };
    setConversions(updatedConversions);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await createConversion(username, conversions);
      toast.success("All changes saved successfully!");
      fetchConversions();
    } catch (error) {
      toast.error("Failed to save changes.");
    } finally {
      setIsLoading(false);
    }
  };

  const emptyConversion: CustomUomConversionReq = {
    company_code: "",
    unit_from: "",
    unit_to: "",
    sys_conv_method: "",
    uom_conversion_factor: 0,
  }

  const handleAddRow = () => {
    setConversions([...conversions, emptyConversion]);
  };

  const handleDeleteRow = (index: number) => {
    const updatedConversions = conversions.filter((_, i) => i !== index);
    setConversions(updatedConversions);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl">
        <DialogHeader>
          <DialogTitle>Custom Unit of Measure Conversions</DialogTitle>
        </DialogHeader>
        <div className="overflow-auto border rounded-md h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part Code</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Factor</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conversions && conversions.map((conv, index) => (
                <TableRow key={conv.gem_dbkey || `new-${index}`}>
                  <TableCell><Input value={conv.part_code || ""} onChange={e => handleInputChange(index, 'part_code', e.target.value)} /></TableCell>
                  <TableCell><Input value={conv.unit_from || ""} onChange={e => handleInputChange(index, 'unit_from', e.target.value)} /></TableCell>
                  <TableCell><Input value={conv.unit_to || ""} onChange={e => handleInputChange(index, 'unit_to', e.target.value)} /></TableCell>
                  <TableCell><Input type="number" value={conv.uom_conversion_factor || 0} onChange={e => handleInputChange(index, 'uom_conversion_factor', parseFloat(e.target.value))} /></TableCell>
                  <TableCell><Input value={conv.sys_conv_method || ""} onChange={e => handleInputChange(index, 'sys_conv_method', e.target.value)} /></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteRow(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter className="justify-between">
          <div>
            <Button variant="outline" onClick={handleAddRow}>Add Row</Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isLoading}>{isLoading ? "Saving..." : "Save All Changes"}</Button>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
