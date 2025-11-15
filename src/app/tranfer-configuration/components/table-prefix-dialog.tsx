import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"

interface TablePrefixDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (prefix: string) => void
  databaseType: "finance" | "manufacturing"
}

export function TablePrefixDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  databaseType 
}: TablePrefixDialogProps) {
  const [prefix, setPrefix] = useState("")

  useEffect(() => {
    if (open) {
      setPrefix("")
    }
  }, [open])

  const handleConfirm = () => {
    if (prefix.trim()) {
      onConfirm(prefix.trim())
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Table Name Prefix Required</AlertDialogTitle>
          <AlertDialogDescription>
            The source and destination {databaseType} databases are the same. 
            To avoid name conflicts, please provide a prefix for the table names.
            This prefix will be added to all table names in the destination database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="prefix-input">Table Name Prefix:</Label>
          <Input
            id="prefix-input"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="e.g., temp_, staging_, etc."
            className="mt-2"
            onKeyDown={(e) => {
              if (e.key === "Enter" && prefix.trim()) {
                handleConfirm()
              }
            }}
            autoFocus
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={!prefix.trim()}
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

