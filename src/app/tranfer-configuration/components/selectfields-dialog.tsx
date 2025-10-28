"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Checkbox } from "@/components/ui/checkbox"
import { ChevronRight, ChevronsRight } from "lucide-react"
import { getFeilds, TableField } from "@/lib/table-service"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"

interface SelectFieldProps {
  tableName: string
  dbType: string
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultFields: string[]
  onSave: (selectedFields: string[]) => void
}

export function SelectFieldDialog({ tableName, dbType, open, onOpenChange, defaultFields, onSave }: SelectFieldProps) {
  const [fields, setFields] = useState<TableField[]>([])
  const [selectedFields, setSelectedFields] = useState<TableField[]>([])

  const moveSelectedFields = () => {
    const toMove = fields.filter((f) => f.selected)
    if (toMove.length === 0) return
    setSelectedFields((prev) => [...prev, ...toMove.map((f) => ({ ...f, selected: false }))])
    setFields((prev) => prev.filter((f) => !f.selected))
  }

  const moveAllFields = () => {
    setSelectedFields((prev) => [...prev, ...fields.map((f) => ({ ...f, selected: false }))])
    setFields([])
  }

  const removeSelectedFields = () => {
    const toRemove = selectedFields.filter((f) => f.selected)
    if (toRemove.length === 0) return
    setFields((prev) => [...prev, ...toRemove.map((f) => ({ ...f, selected: false }))])
    setSelectedFields((prev) => prev.filter((f) => !f.selected))
  }

  const removeAllFields = () => {
    setFields((prev) => [...prev, ...selectedFields.map((f) => ({ ...f, selected: false }))])
    setSelectedFields([])
  }

  const toggleSelect = (list: "fields" | "selectedFields", index: number) => {
    if (list === "fields") {
      setFields((prev) =>
        prev.map((f, i) => (i === index ? { ...f, selected: !f.selected } : f))
      )
    } else {
      setSelectedFields((prev) =>
        prev.map((f, i) => (i === index ? { ...f, selected: !f.selected } : f))
      )
    }
  }

  const handleSave = () => {
    onSave(selectedFields.map((f) => f.name))
    onOpenChange(false)
  }
  useEffect(() => {
    if (!tableName) return

    const username = "Administrator"

    getFeilds({
      username,
      tableName,
      dbType,
      connType: "SRC",
    }).then((value) => {
      if (!value) return
      const allFields: (TableField & { selected?: boolean })[] = value.map((f: TableField) => ({
        ...f,
        selected: false,
      }))

      const selected = allFields.filter((f) => defaultFields.includes(f.name))
      const remaining = allFields.filter((f) => !defaultFields.includes(f.name))

      setSelectedFields(selected)
      setFields(remaining)
    }).catch((error) => {
      toast.error("Failed to fetch fields: " + error.message)
      setSelectedFields([])
      setFields([])
    })
  }, [tableName, dbType, defaultFields])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-5xl">
        <DialogHeader>
          <DialogTitle>Select Fields ({tableName})</DialogTitle>
          <DialogDescription>
            Choose fields from the tables to include in the transfer configuration
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4">
          <Card className="flex-1 gap-1">
            <CardHeader>
              <CardTitle>Table Field Names</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Nullable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Checkbox
                          checked={field.selected}
                          onCheckedChange={() => toggleSelect("fields", index)}
                        />
                      </TableCell>
                      <TableCell>{field.name}</TableCell>
                      <TableCell>{field.type}</TableCell>
                      <TableCell>{field.nullable}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
            </CardFooter>
          </Card>

          {/* Middle buttons */}
          <div className="flex flex-col justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={moveSelectedFields}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={moveAllFields}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
            <div className="h-px bg-gray-200 my-2"></div>
            <Button
              variant="outline"
              size="icon"
              onClick={removeSelectedFields}
            >
              <ChevronRight className="h-4 w-4 transform rotate-180" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={removeAllFields}
            >
              <ChevronsRight className="h-4 w-4 transform rotate-180" />
            </Button>
          </div>

          <Card className="flex-1 gap-1">
            <CardHeader>
              <CardTitle>Selected Field Names</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Nullable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedFields.map((field, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Checkbox
                          checked={field.selected}
                          onCheckedChange={() => toggleSelect("selectedFields", index)}
                        />
                      </TableCell>
                      <TableCell>{field.name}</TableCell>
                      <TableCell>{field.type}</TableCell>
                      <TableCell>{field.nullable}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
            </CardFooter>
          </Card>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSave}>Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
