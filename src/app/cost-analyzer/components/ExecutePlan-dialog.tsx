"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useState } from "react"
import { toast } from "sonner"
import { executePlan, executeSingleProduct, ExecutePlanResponse } from "@/lib/mrp-service"

interface ExecutePlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPlanExecuted: (data: ExecutePlanResponse) => void
}

const USERNAME = "Administrator"

export default function ExecutePlanDialog({ open, onOpenChange, onPlanExecuted }: ExecutePlanDialogProps) {
  const [planId, setPlanId] = useState("1")
  const [resultName, setResultName] = useState("")
  const [userUom, setUserUom] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState("");
  const [executionMode, setExecutionMode] = useState("by-plan-id");
  const [partCode, setPartCode] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [plannedQty, setPlannedQty] = useState(0);
  const [uom, setUom] = useState("");

  async function handleExecute() {
    setIsLoading(true);
    setError(null);
    setStatus("Processing plan...");

    try {
      let result: ExecutePlanResponse;
      if (executionMode === 'by-plan-id') {
        if (!planId.trim()) {
          setError("Plan ID is required.");
          setIsLoading(false);
          return;
        }
        result = await executePlan({
          planId,
          resultName,
          userUom,
          username: USERNAME,
        });
      } else {
        if (!partCode.trim() || !warehouse.trim() || !uom.trim()) {
          setError("Part Code, Warehouse, and UOM are required for single product execution.");
          setIsLoading(false);
          return;
        }
        result = await executeSingleProduct({
          partCode,
          warehouse,
          uom,
          plannedVolume: plannedQty,
          userUom,
          username: USERNAME,
        });
      }
      onPlanExecuted(result);
      toast.success(`Plan executed successfully.`);
      setStatus(`Execution successful. Root Part Code: ${result.Root.partCode}`);
      setIsLoading(false);
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred.";
      setError(errorMessage);
      toast.error(errorMessage);
      setStatus("Execution failed.");
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[60vw]">
        <DialogHeader>
          <DialogTitle>Execute Plan</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <fieldset className="grid gap-4 rounded-lg border p-4">
            <legend className="-ml-1 px-1 text-sm font-medium">Plan Options</legend>
            <RadioGroup value={executionMode} onValueChange={setExecutionMode} className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="by-plan-id" id="by-plan-id" />
                <Label htmlFor="by-plan-id">Create requirements using a Stored Plan:</Label>
              </div>
              <div className="flex items-center gap-2 pl-6">
                <Label htmlFor="plan-id" className="whitespace-nowrap">
                  Plan ID:
                </Label>
                <Input
                  id="plan-id"
                  className="w-full"
                  value={planId}
                  onChange={e => setPlanId(e.target.value)}
                  disabled={executionMode !== 'by-plan-id'}
                />
                <Button variant="outline">...</Button>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single-product" id="single-product" />
                <Label htmlFor="single-product">Create requirements for a single Product:</Label>
              </div>
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div className="flex items-center gap-2">
                  <Label htmlFor="part-code">Part Code:</Label>
                  <Input id="part-code" value={partCode} onChange={e => setPartCode(e.target.value)} disabled={executionMode !== 'single-product'} />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="warehouse">Warehouse:</Label>
                  <Input id="warehouse" value={warehouse} onChange={e => setWarehouse(e.target.value)} disabled={executionMode !== 'single-product'} />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="planned-qty">Planned Qty:</Label>
                  <Input id="planned-qty" type="number" value={plannedQty} onChange={e => setPlannedQty(parseFloat(e.target.value))} disabled={executionMode !== 'single-product'} />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="uom">Unit of Measure:</Label>
                  <Input id="uom" value={uom} onChange={e => setUom(e.target.value)} disabled={executionMode !== 'single-product'} />
                </div>
              </div>
            </RadioGroup>
            <div className="flex items-center gap-2">
              <Label htmlFor="result-name">Result Name (for Save)</Label>
              <Input
                id="result-name"
                value={resultName}
                onChange={e => setResultName(e.target.value)}
              />
            </div>
          </fieldset>

          <fieldset className="grid gap-4 rounded-lg border p-4">
            <legend className="-ml-1 px-1 text-sm font-medium">Options</legend>
            <p className="text-sm text-muted-foreground">
              In addition to the Unit of Measure(s) defined in Recipe Lines, you can add a user defined UOM to
              calculate qtys. All input and output qtys will be converted to this UOM.
            </p>
            <div className="flex items-center gap-2">
              <Label htmlFor="user-uom">User UOM:</Label>
              <Input id="user-uom" value={userUom} onChange={e => setUserUom(e.target.value)} />
            </div>
          </fieldset>

          <p className="text-sm">
            When you click Go, PM Advanced Analyzer will start processing the current plan. This might take few
            minutes.
          </p>

          <div>
            <Label htmlFor="status">Status:</Label>
            <div className="mt-1 flex h-10 w-full items-center rounded-md border bg-muted px-3 py-2 text-sm">
              {status}
            </div>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleExecute} disabled={isLoading}>
            {isLoading ? "Executing..." : "Go"}
          </Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
