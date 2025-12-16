"use client"

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExecutePlanResponse, LaborIn, flattenTree } from "@/lib/mrp-service";
import { useMemo } from "react";

interface LaborSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ExecutePlanResponse | null;
}

interface LaborSummaryRow {
  laborClass: string;
  processStage: string;
  recoveryRate: number;
  totalHours: number;
  totalDirectRecovery: number;
  ohRecoveryRate: number; // Assuming this maps to recoveryRate for OH
  totalOhRecovery: number;
}

export default function LaborSummaryDialog({ open, onOpenChange, data }: LaborSummaryDialogProps) {

  const summaryData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const allParts = flattenTree(data);
    const allLaborIns = allParts.flatMap(node => node.labIns || []);

    const grouped = allLaborIns.reduce<Record<string, LaborSummaryRow>>((acc, labor) => {
      const key = `${labor.laborClass}-${labor.processStage}`;
      if (!acc[key]) {
        acc[key] = {
          laborClass: labor.laborClass,
          processStage: labor.processStage,
          recoveryRate: labor.recoveryRate, // This might need adjustment if rates differ
          totalHours: 0,
          totalDirectRecovery: 0,
          ohRecoveryRate: labor.recoveryRate, // Placeholder, might need a real OH rate field
          totalOhRecovery: 0,
        };
      }
      acc[key].totalHours += labor.setupHours + labor.runtimeHours;
      acc[key].totalDirectRecovery += labor.directCost;
      acc[key].totalOhRecovery += labor.ohCost;
      return acc;
    }, {});

    return Object.values(grouped);
  }, [data]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[70vw] xl:max-w-[50vw]">
        <DialogHeader>
          <DialogTitle>Labor Summary</DialogTitle>
          <p className="text-sm text-muted-foreground">Labor Summary for the Current Plan</p>
        </DialogHeader>
        <div className="overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Labor Class</TableHead>
                <TableHead>Process Stage</TableHead>
                <TableHead>Recovery Rate (Per Hr)</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Total Direct Recovery</TableHead>
                <TableHead>OH Recovery Rate</TableHead>
                <TableHead>Total OH Recovery</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaryData.length > 0 ? (
                summaryData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.laborClass}</TableCell>
                    <TableCell>{row.processStage}</TableCell>
                    <TableCell>{row.recoveryRate.toFixed(4)}</TableCell>
                    <TableCell>{row.totalHours.toFixed(2)}</TableCell>
                    <TableCell>{row.totalDirectRecovery.toFixed(4)}</TableCell>
                    <TableCell>{row.ohRecoveryRate.toFixed(4)}</TableCell>
                    <TableCell>{row.totalOhRecovery.toFixed(4)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No labor data available in the current plan.
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
            <Button variant="outline">Drill Summary</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
