"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SaveXmlDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (filename: string) => void
  defaultName?: string
}

export function SaveXmlDialog({
  open,
  onOpenChange,
  onSave,
  defaultName = "ERPTables",
}: SaveXmlDialogProps) {
  const [filename, setFilename] = useState(defaultName)

  const handleSave = () => {
    let name = filename.trim()
    if (!name) name = defaultName
    if (!name.endsWith(".xml")) name += ".xml"
    onSave(name)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as XML</DialogTitle>
          <DialogDescription>
            Enter a name for your exported XML file.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-2">
          <Label htmlFor="filename">File name</Label>
          <Input
            id="filename"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="ERPTables.xml"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
