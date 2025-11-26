"use client"

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExecutePlanResponse } from "@/lib/mrp-service";
import { useMemo } from "react";

interface MachineSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ExecutePlanResponse | null;
}

interface MachineSummaryRow {
  machineCode: string;
  processStage: string;
  recoveryRate: number;
  totalHours: number;
  totalDirectRecovery: number;
  ohRecoveryRate: number;
  totalOhRecovery: number;
}

export default function MachineSummaryDialog({ open, onOpenChange, data }: MachineSummaryDialogProps) {

  const summaryData = useMemo(() => {
    if (!data) return [];

    const allMachineIns = [data.Root, ...data.Children].flatMap(node => node.machineIns || []);

    const grouped = allMachineIns.reduce<Record<string, MachineSummaryRow>>((acc, machine) => {
      const key = `${machine.machineCode}-${machine.processStage}`;
      if (!acc[key]) {
        acc[key] = {
          machineCode: machine.machineCode,
          processStage: machine.processStage,
          recoveryRate: machine.recoveryRate,
          totalHours: 0,
          totalDirectRecovery: 0,
          ohRecoveryRate: machine.recoveryRate, // Assuming OH rate is the same as the main recovery rate
          totalOhRecovery: 0,
        };
      }
      acc[key].totalHours += machine.setupHours + machine.runtimeHours;
      acc[key].totalDirectRecovery += machine.directCost;
      acc[key].totalOhRecovery += machine.ohCost;
      return acc;
    }, {});

    return Object.values(grouped);
  }, [data]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[70vw] xl:max-w-[50vw]">
        <DialogHeader>
          <DialogTitle>Machine Summary</DialogTitle>
          <p className="text-sm text-muted-foreground">Machine Summary for the Current Plan</p>
        </DialogHeader>
        <div className="overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Machine Code</TableHead>
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
                    <TableCell>{row.machineCode}</TableCell>
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
                    No machine data available in the current plan.
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
