"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"
import { Dialog, DialogHeader, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { getPlans, getPlanById, getAllPlanIDs, createPlan, deletePlan, type PlanRecord } from "@/lib/plan-service"

interface ViewPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const USERNAME = "Administrator"

export default function ViewPlanDialog({ open, onOpenChange }: ViewPlanDialogProps) {
  const [id, setId] = useState("")
  const [planOptions, setPlanOptions] = useState<{ value: string; label: string }[]>([])
  const [plans, setPlans] = useState<PlanRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const emptyPlan: PlanRecord = {
    planId: "",
    partCode: "",
    warehouse: "",
    partDesc1: "",
    plannedVolume: 0.0,
    addVolume: 0.0,
    uom: "",
  }

  const syncPlanOptions = (rows: PlanRecord[]) => {
    const uniquePlanIds = Array.from(
      new Set(rows.map((row) => row.planId).filter((value) => value && value.trim())),
    )
    setPlanOptions(uniquePlanIds.map((planId) => ({ value: planId, label: planId })))
  }

  // Load all plan IDs when dialog opens
  useEffect(() => {
    if (open) {
      const loadPlanIDs = async () => {
        try {
          const planIds = await getAllPlanIDs(USERNAME)
          setPlanOptions(planIds.map((planId) => ({ value: planId, label: planId })))
        } catch (err: any) {
          console.error("Failed to load plan IDs:", err)
          // Don't show error toast here, just log it
        }
      }
      loadPlanIDs()
    }
  }, [open])

  async function handleLoad() {
    setIsLoading(true)
    setError(null)
    const trimmedId = id.trim()
    try {
      if (trimmedId) {
        const planRows = await getPlanById(USERNAME, trimmedId)
        setPlans(planRows)
        // Refresh plan IDs list to ensure it's up to date
        try {
          const planIds = await getAllPlanIDs(USERNAME)
          setPlanOptions(planIds.map((planId) => ({ value: planId, label: planId })))
        } catch (err) {
          // If refresh fails, at least keep the current plan ID in options
          setPlanOptions([{ value: trimmedId, label: trimmedId }])
        }
      } else {
        await handleLoadAll()
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to load plans")
      setPlans([])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLoadAll() {
    setIsLoading(true)
    setError(null)
    try {
      const fetchedPlans = await getPlans(USERNAME)
      setPlans(fetchedPlans)
      syncPlanOptions(fetchedPlans)
      // Also refresh from API to get all plan IDs
      try {
        const planIds = await getAllPlanIDs(USERNAME)
        setPlanOptions(planIds.map((planId) => ({ value: planId, label: planId })))
      } catch (err) {
        // Fallback to syncing from loaded plans
        syncPlanOptions(fetchedPlans)
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Failed to load all plans")
      setPlans([])
    } finally {
      setIsLoading(false)
    }
  }

  const isRowEmpty = (plan: PlanRecord) =>
    !plan.planId.trim() &&
    !plan.partCode.trim() &&
    !plan.warehouse.trim() &&
    !plan.partDesc1.trim() &&
    !plan.plannedVolume &&
    !plan.addVolume &&
    !plan.uom.trim()

  function handlePlanFieldChange(index: number, field: keyof PlanRecord, value: string) {
    setPlans((prev) => {
      if (field === "plannedVolume" || field === "addVolume") {
        return prev.map((plan, idx) => (idx === index ? { ...plan, [field]: parseFloat(value) } : plan))
      }
      return prev.map((plan, idx) => (idx === index ? { ...plan, [field]: value } : plan))
    }
    )
  }

  function handleAddRow() {
    setPlans((prev) => [...prev, { ...emptyPlan }])
  }

  function removePlanRow(index: number) {
    setPlans((prev) => prev.filter((_, idx) => idx !== index))
  }

  async function handleDeletePlan(index: number) {
    const plan = plans[index]
    
    if (!plan.planId.trim() || !plan.warehouse.trim() || !plan.partCode.trim()) {
      toast.error("Plan ID, Warehouse, and Part Code are required to delete a plan.")
      return
    }

    setIsDeleting(index)
    setError(null)
    
    try {
      await deletePlan({
        planId: plan.planId,
        warehouse: plan.warehouse,
        partCode: plan.partCode,
        username: USERNAME,
      })
      toast.success("Plan deleted successfully")
      // Remove the plan from the list
      removePlanRow(index)
      // Refresh plan IDs after deletion
      try {
        const planIds = await getAllPlanIDs(USERNAME)
        setPlanOptions(planIds.map((planId) => ({ value: planId, label: planId })))
      } catch (err) {
        // Silently fail, plan IDs will refresh on next load
      }
      // If we have a plan ID filter, reload the plans to refresh the list
      if (id.trim()) {
        await handleLoad()
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || "Failed to delete plan"
      setError(message)
      toast.error(message)
    } finally {
      setIsDeleting(null)
    }
  }

  async function handleSavePlans() {
    const rowsToSave = plans.filter((plan) => !isRowEmpty(plan))

    if (rowsToSave.length === 0) {
      setError("No plan rows to save. Add data before saving.")
      return
    }

    const invalidRow = rowsToSave.find(
      (plan) =>
        !plan.planId.trim() ||
        !plan.partCode.trim() ||
        !plan.warehouse.trim(),
    )

    if (invalidRow) {
      setError("Plan ID, Part Code, and Warehouse are required for each row before saving.")
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      await createPlan(rowsToSave, USERNAME)
      toast.success("Plans saved successfully")
      // Refresh plan IDs after saving
      try {
        const planIds = await getAllPlanIDs(USERNAME)
        setPlanOptions(planIds.map((planId) => ({ value: planId, label: planId })))
      } catch (err) {
        // Silently fail, plan IDs will refresh on next load
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || "Failed to save plans"
      setError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[70vw] xl:max-w-[60vw]">
        <DialogHeader>
          <DialogTitle>View Planned Volume</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm">Enter or select the PlanId</span>
          <Combobox
            choices={planOptions}
            value={id}
            setValue={setId}
            placeHolder="Select planId .."
            emptyMessage="No plan IDs found"
          />
          <Button onClick={handleLoad} disabled={isLoading}>
            {isLoading ? "Loading..." : id.trim() ? "Load Plan" : "Load Plan"}
          </Button>
          <Button onClick={handleLoadAll} disabled={isLoading} variant="outline">
            {isLoading ? "Loading..." : "Load All Plans"}
          </Button>
          <Button variant="secondary" onClick={handleAddRow} disabled={isLoading || isSaving}>
            Add Row
          </Button>
          <Button variant="default" onClick={handleSavePlans} disabled={isSaving || isLoading}>
            {isSaving ? "Saving..." : "Save Plans"}
          </Button>
          <Button variant="outline">Export to excel</Button>
          <Button variant="outline">Import from file</Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div>
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead className="w-[120px]">Plan ID</TableHead>
                <TableHead className="w-[140px]">Part Code</TableHead>
                <TableHead className="w-[120px]">Warehouse</TableHead>
                <TableHead className="w-[200px]">Part Description</TableHead>
                <TableHead className="w-[140px]">Planned Volume</TableHead>
                <TableHead className="w-[120px]">Add Qty</TableHead>
                <TableHead className="w-20">UOM</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    {isLoading ? "Loading plans..." : "No plan data available"}
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan, index) => (
                  <TableRow key={`${index}`}>
                    <TableCell>
                      <Input
                        value={plan.planId}
                        onChange={(e) => handlePlanFieldChange(index, "planId", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape" && isRowEmpty(plan)) {
                            e.preventDefault()
                            removePlanRow(index)
                          }
                        }}
                        placeholder="Plan ID"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={plan.partCode}
                        onChange={(e) => handlePlanFieldChange(index, "partCode", e.target.value)}
                        placeholder="Part code"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={plan.warehouse}
                        onChange={(e) => handlePlanFieldChange(index, "warehouse", e.target.value)}
                        placeholder="Warehouse"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={plan.partDesc1}
                        onChange={(e) => handlePlanFieldChange(index, "partDesc1", e.target.value)}
                        placeholder="Part description"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={plan.plannedVolume}
                        onChange={(e) => handlePlanFieldChange(index, "plannedVolume", e.target.value)}
                        placeholder="Planned volume"
                        type="number"
                        step={0.01}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={plan.addVolume}
                        onChange={(e) => handlePlanFieldChange(index, "addVolume", e.target.value)}
                        placeholder="Add qty"
                        type="number"
                        step={0.01}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={plan.uom}
                        onChange={(e) => handlePlanFieldChange(index, "uom", e.target.value)}
                        placeholder="UOM"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePlan(index)}
                        disabled={isDeleting === index || isLoading || isSaving || !plan.planId.trim() || !plan.warehouse.trim() || !plan.partCode.trim()}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {isDeleting === index ? (
                          <span className="text-xs">...</span>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
