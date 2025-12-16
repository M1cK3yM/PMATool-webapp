"use client"

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExecutePlanResponse, MiscIn, flattenTree } from "@/lib/mrp-service";
import { useMemo } from "react";

interface MiscSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ExecutePlanResponse | null;
}

interface MiscSummaryRow extends MiscIn {
  processSpec: string;
  batches: number;
}

export default function MiscSummaryDialog({ open, onOpenChange, data }: MiscSummaryDialogProps) {

  const summaryData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const allParts = flattenTree(data);
    const allMiscIns = allParts.flatMap(node =>
      (node.miscIns || []).map(misc => ({ ...misc, processSpec: node.costingSpec, batches: node.totalBatches }))
    );

    return allMiscIns;
  }, [data]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[70vw] xl:max-w-[50vw]">
        <DialogHeader>
          <DialogTitle>Miscellaneous Summary</DialogTitle>
          <p className="text-sm text-muted-foreground">Miscellaneous for the Current Plan</p>
        </DialogHeader>
        <div className="overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Process Spec</TableHead>
                <TableHead>Recipe</TableHead>
                <TableHead>Process Stage</TableHead>
                <TableHead>Input Product</TableHead>
                <TableHead>Fixed Cost</TableHead>
                <TableHead>Input Qty</TableHead>
                <TableHead>Input UOM</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Batch Cost</TableHead>
                <TableHead>Batches</TableHead>
                <TableHead>Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaryData.length > 0 ? (
                summaryData.map((row, index) => {
                  const batchCost = row.inputQty * row.unitCost;
                  const totalCost = batchCost * row.batches;
                  return (
                    <TableRow key={index}>
                      <TableCell>{row.processSpec}</TableCell>
                      <TableCell>{row.recipeCode}</TableCell>
                      <TableCell>{row.processStage}</TableCell>
                      <TableCell>{row.inputProduct}</TableCell>
                      <TableCell>{row.fixedCost.toFixed(4)}</TableCell>
                      <TableCell>{row.inputQty.toFixed(2)}</TableCell>
                      <TableCell>{row.inputUom}</TableCell>
                      <TableCell>{row.unitCost.toFixed(4)}</TableCell>
                      <TableCell>{batchCost.toFixed(4)}</TableCell>
                      <TableCell>{row.batches.toFixed(2)}</TableCell>
                      <TableCell>{totalCost.toFixed(4)}</TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                    No miscellaneous data available in the current plan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DialogFooter className="justify-between">
          <div>
            <Button variant="outline">Export</Button>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
