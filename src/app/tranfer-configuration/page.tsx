"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EllipsisVertical, PlusCircle, CheckCircle2, Play, Square, Eye, Save, FolderOpen, MoreVertical } from "lucide-react"
import { createConfig, getConfig, testConnection as testConnectionApi } from "@/lib/config-service"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
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
import { Checkbox } from "@/components/ui/checkbox"
import { SelectFieldDialog } from "./components/selectfields-dialog"
import { SaveXmlDialog } from "./components/saveXml-dialog"
import { getRecords, transferData, stopTransfer, type TransferError } from "@/lib/table-service"
import { UpdateAlertDialog } from "./components/updateConfirmation-adialog"
import { toast } from "sonner"
import { CreateConnectionDialog } from "./components/createConnection-dialog"
import { Spinner } from "@/components/ui/spinner"
import ConfigTable from "./sections/ConfigTable"

export type DbConfig = {
  finance: string
  manufacturing: string
}

type TaskTableRow = {
  moduleName: string
  physicalName: string
  tableType: string
  databaseName: string
  includeInUpdate: boolean
  updateResults: string
  selectFields?: string[],
  excludeFields?: string[],
  sqlBefore?: string
  sqlAfter?: string
  updateMode?: string
  conditions?: string
  tableDesc?: string
  tablePrefix?: string
  cTableName?: string
}

export default function TransferConfiguration() {
  const [source, setSource] = useState<DbConfig>({ finance: "", manufacturing: "", })
  const [dest, setDest] = useState<DbConfig>({ finance: "", manufacturing: "", })
  const [loadedRows, setLoadedRows] = useState<TaskTableRow[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const tableBodyRef = useRef<HTMLTableSectionElement | null>(null)
  const [activeTab, setActiveTab] = useState("maintenance");

  const [saveDialogOpen, setSaveDialogOpen] = useState(false)

  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogFor, setDialogFor] = useState<
    | { scope: "source" | "dest"; field: keyof DbConfig }
    | null
  >(null)

  // select fiel dialog state
  const [selectDialogOpen, setSelectDialogOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<TaskTableRow | undefined>(undefined)
  const [selectFieldsText, setSelectFieldsText] = useState("")
  const [excludeFieldsText, setExcludeFieldsText] = useState("")
  const [bulkUpdateMode, setBulkUpdateMode] = useState("")
  const [bulkTablePrefix, setBulkTablePrefix] = useState("")
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false)
  const [bulkPrefixDialogOpen, setBulkPrefixDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingCell, setEditingCell] = useState<{
    row: number;
    field: keyof TaskTableRow;
  } | null>(null)
  const [transferErrors, setTransferErrors] = useState<Record<string, TransferError>>({})

  // Form state inside dialog
  const [dbHost, setDbHost] = useState("")
  const [dbPort, setDbPort] = useState("")
  const [dbName, setDbName] = useState("")
  const [dbUser, setDbUser] = useState("")
  const [dbPass, setDbPass] = useState("")
  const [dbType, setDbType] = useState("")

  function openCreateDialog(scope: "source" | "dest", field: keyof DbConfig, currentValue: string) {
    setDialogFor({ scope, field })
    setIsEditing(Boolean(currentValue && currentValue.trim().length > 0))
    // Attempt to parse both semicolon-delimited (ODBC) and space-delimited (DSN) formats
    const parseConnection = (value: string) => {
      const delimiter = value.includes(";") ? ";" : ","
      const entries = value
        .split(delimiter)
        .map(s => s.trim())
        .filter(Boolean)
        .map(part => {
          const eqIdx = part.indexOf("=")
          if (eqIdx === -1) return [part.toLowerCase(), ""] as [string, string]
          const key = part.slice(0, eqIdx).trim().toLowerCase()
          const val = part.slice(eqIdx + 1).trim()
          return [key, val] as [string, string]
        })
      const map = new Map<string, string>(entries)
      const host = map.get("server") || map.get("host") || ""
      const db = map.get("database") || map.get("dbname") || ""
      const user = map.get("user id") || map.get("uid") || map.get("user") || ""
      const pass = map.get("password") || map.get("pwd") || ""
      const port = map.get("port") || ""
      const dbType = map.get("type") || ""
      return { host, db, user, pass, port, dbType }
    }
    if (currentValue && currentValue.trim().length > 0) {
      const parsed = parseConnection(currentValue)
      setDbHost(parsed.host)
      setDbName(parsed.db)
      setDbUser(parsed.user)
      setDbPass(parsed.pass)
      setDbPort(parsed.port)
      setDbType(parsed.dbType)
    } else {
      setDbHost("")
      setDbName("")
      setDbUser("")
      setDbPass("")
      setDbPort("")
      setDbType("")
    }
    setDialogOpen(true)
  }

  async function testConnection(value: string) {
    if (!value || !value.trim()) {
      toast.warning("Please enter a connection string to test")
      return
    }

    try {
      const result = await testConnectionApi(value.trim())

      if (result.success) {
        toast.success(result.message || "Connection successful")
      } else {
        toast.error(result.error || "Connection failed")
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || "Failed to test connection"
      toast.error(errorMessage)
    }
  }

  function focusNextCell(row: number, field: keyof TaskTableRow) {
    const fields: (keyof TaskTableRow)[] = [
      "moduleName",
      "physicalName",
      "tableType",
      "databaseName",
      "updateResults",
      "updateMode",
      "sqlAfter",
      "conditions",
      "tablePrefix",
      "cTableName"
    ];

    const rowCount = document.querySelectorAll('tbody tr').length;
    console.log(rowCount, field, fields.indexOf(field), row, fields.length);
    const currentFieldIndex = fields.indexOf(field);
    let nextRow = row;
    let nextFieldIndex = currentFieldIndex + 1;

    if (nextFieldIndex >= fields.length) {
      nextFieldIndex = 0;
      nextRow = row + 1;
    }

    if (nextRow >= rowCount) return;

    setEditingCell({ row: nextRow, field: fields[nextFieldIndex] });
  }

  function applyBulkUpdateModeValue(value: string) {
    setLoadedRows(prev => prev.map(r => ({ ...r, updateMode: value })))
    setSelectedRow(prev => (prev ? { ...prev, updateMode: value } : prev))
  }

  function applyBulkTablePrefixValue(value: string) {
    setLoadedRows(prev => prev.map(r => ({ ...r, tablePrefix: value })))
    setSelectedRow(prev => (prev ? { ...prev, tablePrefix: value } : prev))
  }

  function handleBulkApplyUpdateMode() {
    applyBulkUpdateModeValue(bulkUpdateMode)
    toast.success("UpdateMode applied to all tables")
    setBulkUpdateDialogOpen(false)
  }

  function handleBulkApplyTablePrefix() {
    applyBulkTablePrefixValue(bulkTablePrefix)
    toast.success("Table prefix applied to all tables")
    setBulkPrefixDialogOpen(false)
  }

  function handleClearUpdateMode() {
    setBulkUpdateMode("")
    applyBulkUpdateModeValue("")
    toast.success("Cleared UpdateMode for all tables")
  }

  function handleClearTablePrefix() {
    setBulkTablePrefix("")
    applyBulkTablePrefixValue("")
    toast.success("Cleared table prefix for all tables")
  }

  const handleUpdate = async () => {
    try {
      setIsUpdating(true)
      const username = "Administrator"
      const rowsToTransfer = loadedRows
        .filter(r => r.includeInUpdate)
        .map(r => ({
          physicalName: r.physicalName,
          databaseName: r.databaseName,
          selectFields: (r.selectFields || []).join(","),
          excludeFields: (r.excludeFields || []).join(","),
          updateMode: r.updateMode || "",
          sqlBefore: r.sqlBefore || "",
          sqlAfter: r.sqlAfter || "",
          conditions: r.conditions || "",
          tableDesc: r.tableDesc || "",
          tablePrefix: r.tablePrefix || "",
          cTablename: r.cTableName || "",
        }))

      if (rowsToTransfer.length === 0) {
        toast.warning("No rows selected for update")
        return
      }

      const result = await transferData(username, rowsToTransfer)

      // Update error state
      if (result.errors && Object.keys(result.errors).length > 0) {
        setTransferErrors(result.errors)
      } else {
        setTransferErrors({})
      }

      // Show toast with summary
      if (result.failedTables > 0) {
        toast.warning(`${result.message} - ${result.successTables} succeeded, ${result.failedTables} failed`)
      } else {
        toast.success(`${result.message} - All ${result.successTables} tables transferred successfully`)
      }

      // Update rows with success/failure status
      setLoadedRows(prev =>
        prev.map(r => {
          if (!r.includeInUpdate) return r

          const tableError = result.errors?.[r.physicalName]
          setIsUpdating(false)
          if (tableError) {
            return { ...r, updateResults: `Failed: ${tableError.error}` }
          } else {
            return { ...r, updateResults: "Transferred successfully" }
          }
        })
      )
    } catch (err: any) {
      setIsUpdating(false)
      console.error(err)
      toast.error(err?.message || "Transfer failed")
    }
  }

  const handleStop = async () => {
    try {
      const username = "Administrator"
      const result = await stopTransfer(username)

      // Update error state if there are errors
      if (result.errors && Object.keys(result.errors).length > 0) {
        setTransferErrors(result.errors)
      } else {
        setTransferErrors({})
      }

      // Update rows with cancellation status
      setLoadedRows(prev =>
        prev.map(r => {
          if (!r.includeInUpdate) return r

          const tableError = result.errors?.[r.physicalName]
          if (tableError) {
            return { ...r, updateResults: `Cancelled: ${tableError.error}` }
          } else if (result.cancelled) {
            return { ...r, updateResults: "Transfer cancelled" }
          }
          return r
        })
      )

      // Show toast with summary
      if (result.failedTables > 0) {
        toast.warning(`${result.message} - ${result.successTables} succeeded, ${result.failedTables} cancelled/failed`)
      } else {
        toast.success(result.message || 'Transfer stopped successfully')
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Failed to stop transfer'
      toast.error(message)
    }
  }
  const handleLoad = () => fileInputRef.current?.click()
  const handleSave = async () => {
    try {
      const username = 'Administrator'
      await createConfig({
        username,
        src_fin_con_str: source.finance,
        src_man_con_str: source.manufacturing,
        des_fin_con_str: dest.finance,
        des_man_con_str: dest.manufacturing,
      })
      toast.success('Configuration saved')
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to save configuration'
      toast.error(message)
    }
  }

  const handleExportXml = (filename: string) => {
    try {
      const xmlContent = generateErpTablesXml(loadedRows)
      const blob = new Blob([xmlContent], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('XML file exported successfully')
    } catch (err: any) {
      toast.error('Failed to export XML file')
    }
  }

  const updateSelectedRow = (updates: Partial<TaskTableRow>) => {
    if (!selectedRow) return

    // Find the row index using the current physicalName before any updates
    const rowIndex = loadedRows.findIndex(r => r.physicalName === selectedRow.physicalName)
    if (rowIndex === -1) return

    // Create updated row with proper merging
    const updatedRow = { ...selectedRow, ...updates }

    // Update selectedRow first to ensure immediate UI update
    setSelectedRow(updatedRow)

    // Then update loadedRows to keep data in sync
    setLoadedRows(prev => {
      const next = [...prev]
      if (next[rowIndex]) {
        next[rowIndex] = updatedRow
      }
      return next
    })
  }

  const handleViewSource = async () => {
    try {
      const username = 'Administrator';
      loadedRows.filter(r => r.includeInUpdate).map(async r => {
        const result = await getRecords({
          username,
          connType: 'SRC',
          dbType: r.databaseName,
          tableName: r.physicalName,
        })
        setLoadedRows(prev =>
          prev.map(p =>
            p.physicalName == r.physicalName
              ? { ...p, updateResults: `${result} records` }
              : p
          )
        )
      })
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to get records'
      window.alert(message)
    }
  }

  const handleViewDest = () => {
    try {
      const username = 'Administrator';
      loadedRows.filter(r => r.includeInUpdate).map(async r => {
        const result = await getRecords({
          username,
          connType: 'DES',
          dbType: r.databaseName,
          tableName: r.physicalName,
        })
        setLoadedRows(prev =>
          prev.map(p =>
            p.physicalName == r.physicalName
              ? { ...p, updateResults: `${result} records` }
              : p
          )
        )
      })
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to get records'
      window.alert(message)
    }
  }
  const handleSelectFeilds = (fields: string[]) => {
    if (!selectedRow) return;
    const updatedRow = { ...selectedRow, selectFields: fields }
    setSelectedRow(updatedRow)
    setLoadedRows((prev) =>
      prev.map((r) =>
        r.physicalName === selectedRow.physicalName
          ? updatedRow
          : r
      )
    )
  }

  // Sync text fields when selectedRow changes
  useEffect(() => {
    if (selectedRow) {
      setSelectFieldsText(selectedRow.selectFields?.join(", ") || "")
      setExcludeFieldsText(selectedRow.excludeFields?.join(", ") || "")
    } else {
      setSelectFieldsText("")
      setExcludeFieldsText("")
    }
  }, [selectedRow])

  // Load configuration on mount
  useEffect(() => {
    const username = 'Administrator'
    getConfig(username)
      .then(cfg => {
        setSource({
          finance: cfg.src_fin_con_str || "",
          manufacturing: cfg.src_man_con_str || "",
        })
        setDest({
          finance: cfg.des_fin_con_str || "",
          manufacturing: cfg.des_man_con_str || "",
        })
      })
      .catch(() => {
        // no config yet or error — stay with defaults
      })
  }, [])

  function addRow() {
    const newRow: TaskTableRow = {
      moduleName: "",
      physicalName: "",
      tableType: "",
      databaseName: "",
      includeInUpdate: false,
      updateResults: "",
      conditions: "",
      tablePrefix: "",
      cTableName: "",
    }
    const newIndex = loadedRows.length
    setLoadedRows(prev => [...prev, newRow])

    // Scroll to the new row after it's rendered
    setTimeout(() => {
      // Find the last row (the newly added one) and scroll to it
      const rows = tableBodyRef.current?.querySelectorAll('tr')
      if (rows && rows.length > 0) {
        const lastRow = rows[rows.length - 1]
        lastRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        // Auto-focus the first editable field (moduleName)
        setEditingCell({ row: newIndex, field: 'moduleName' })
      }
    }, 0)
  }

  return (
    <div className="mx-auto max-w-[85vw] space-y-4">
      {/* Controls toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={handleLoad} className="gap-2"><FolderOpen className="h-4 w-4" /> Load</Button>
        <Button variant="secondary" onClick={() => setSaveDialogOpen(true)} className="gap-2"><Save className="h-4 w-4" /> Save</Button>
        <Button variant="default" onClick={() => setUpdateDialogOpen(true)} className="gap-2" disabled={isUpdating}>
          {isUpdating ? <Spinner /> : <Play className="h-4 w-4" />} Update
        </Button>
        <Button variant="outline" onClick={handleStop} className="gap-2"><Square className="h-4 w-4" /> Stop</Button>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" onClick={handleViewSource} className="gap-2"><Eye className="h-4 w-4" /> Source Records</Button>
          <Button variant="ghost" onClick={handleViewDest} className="gap-2"><Eye className="h-4 w-4" /> Dest Records</Button>
        </div>
      </div>
      {/* Hidden file input for XML load */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml, text/xml, application/xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          const reader = new FileReader()
          reader.onload = () => {
            try {
              const text = String(reader.result || "")
              const parsed = parseErpTablesXml(text)
              setLoadedRows(parsed)
            } catch (err) {
              window.alert('Failed to parse XML file.')
            } finally {
              // e.currentTarget.value = ""
            }
          }
          reader.readAsText(file)
        }}
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="maintenance" className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="maintenance">Tables Maintenance</TabsTrigger>
          <TabsTrigger value="details">Table Details</TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Databases</CardTitle>
              <Button variant="secondary" size="sm" onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" /> Save Config
              </Button>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Source Databases</h3>
                <div className="grid gap-3">
                  <FieldRow
                    id="src-fin"
                    label="Finance"
                    value={source.finance}
                    onChange={(v) => setSource((s) => ({ ...s, finance: v }))}
                    onCreate={() => openCreateDialog("source", "finance", source.finance)}
                    onTest={() => testConnection(source.finance)}
                  />
                  <FieldRow
                    id="src-man"
                    label="Manufacturing"
                    value={source.manufacturing}
                    onChange={(v) => setSource((s) => ({ ...s, manufacturing: v }))}
                    onCreate={() => openCreateDialog("source", "manufacturing", source.manufacturing)}
                    onTest={() => testConnection(source.manufacturing)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Destination Databases</h3>
                <div className="grid gap-3">
                  <FieldRow
                    id="dst-fin"
                    label="Finance"
                    value={dest.finance}
                    onChange={(v) => setDest((d) => ({ ...d, finance: v }))}
                    onCreate={() => openCreateDialog("dest", "finance", dest.finance)}
                    onTest={() => testConnection(dest.finance)}
                  />
                  <FieldRow
                    id="dst-man"
                    label="Manufacturing"
                    value={dest.manufacturing}
                    onChange={(v) => setDest((d) => ({ ...d, manufacturing: v }))}
                    onCreate={() => openCreateDialog("dest", "manufacturing", dest.manufacturing)}
                    onTest={() => testConnection(dest.manufacturing)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <ConfigTable
            setBulkUpdateDialogOpen={setBulkUpdateDialogOpen}
            setBulkPrefixDialogOpen={setBulkPrefixDialogOpen}
            setSelectedRow={setSelectedRow}
            setSelectDialogOpen={setSelectDialogOpen}
            setActiveTab={setActiveTab}
            setLoadedRows={setLoadedRows}
            handleClearUpdateMode={handleClearUpdateMode}
            handleClearTablePrefix={handleClearTablePrefix}
            tableBodyRef={tableBodyRef}
            loadedRows={loadedRows}
          />

          <Card>
            <CardHeader>
              <CardTitle>Error Records</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[280px]">Table Name</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead className="w-[140px]">When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.keys(transferErrors).length === 0 ? (
                    <TableRow>
                      <TableCell className="font-medium">—</TableCell>
                      <TableCell>No errors yet</TableCell>
                      <TableCell>—</TableCell>
                    </TableRow>
                  ) : (
                    Object.entries(transferErrors).map(([tableName, error]) => (
                      <TableRow key={tableName}>
                        <TableCell className="font-medium">{tableName}</TableCell>
                        <TableCell className="text-red-600">{error.error}</TableCell>
                        <TableCell>{new Date(error.timestamp).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Table Details</CardTitle>
            </CardHeader>

            <CardContent>
              {selectedRow ? (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    {/* Left side */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 items-center gap-2">
                        <label className="text-sm text-muted-foreground">Module:</label>
                        <input
                          type="text"
                          value={selectedRow.moduleName || ""}
                          onChange={(e) => updateSelectedRow({ moduleName: e.target.value })}
                          className="border rounded px-2 py-1 text-sm bg-background"
                        />
                      </div>

                      <div className="grid grid-cols-2 items-center gap-2">
                        <label className="text-sm text-muted-foreground">Table Name:</label>
                        <input
                          type="text"
                          value={selectedRow.physicalName || ""}
                          onChange={(e) => updateSelectedRow({ physicalName: e.target.value })}
                          className="border rounded px-2 py-1 text-sm bg-background"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">
                          Select Fields:
                        </label>
                        <textarea
                          value={selectFieldsText}
                          onChange={(e) => {
                            const value = e.target.value
                            setSelectFieldsText(value)
                            // Parse and update the actual fields
                            const fields = value
                              .split(",")
                              .map(f => f.trim())
                              .filter(Boolean)
                            updateSelectedRow({ selectFields: fields.length > 0 ? fields : [] })
                          }}
                          onBlur={(e) => {
                            // On blur, clean up and normalize
                            const value = e.target.value.trim()
                            const fields = value
                              .split(",")
                              .map(f => f.trim())
                              .filter(Boolean)
                            const normalizedText = fields.join(", ")
                            setSelectFieldsText(normalizedText)
                            updateSelectedRow({ selectFields: fields })
                          }}
                          rows={4}
                          className="w-full border rounded px-2 py-1 text-sm bg-background resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">
                          SQL Before:
                        </label>
                        <textarea
                          value={selectedRow.sqlBefore || ""}
                          onChange={(e) => updateSelectedRow({ sqlBefore: e.target.value })}
                          rows={4}
                          className="w-full border rounded px-2 py-1 text-sm bg-background resize-none"
                        />
                      </div>

                    </div>

                    {/* Right side */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 items-center gap-2">
                        <label className="text-sm text-muted-foreground">Database:</label>
                        <input
                          type="text"
                          value={selectedRow.databaseName || ""}
                          onChange={(e) => updateSelectedRow({ databaseName: e.target.value })}
                          className="border rounded px-2 py-1 text-sm bg-background"
                        />
                      </div>

                      <div className="grid grid-cols-2 items-center gap-2">
                        <label className="text-sm text-muted-foreground">Table Type:</label>
                        <input
                          type="text"
                          value={selectedRow.tableType || ""}
                          onChange={(e) => updateSelectedRow({ tableType: e.target.value })}
                          className="border rounded px-2 py-1 text-sm bg-background"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">
                          Excluded Fields:
                        </label>
                        <textarea
                          value={excludeFieldsText}
                          onChange={(e) => {
                            const value = e.target.value
                            setExcludeFieldsText(value)
                            // Parse and update the actual fields
                            const fields = value
                              .split(",")
                              .map(f => f.trim())
                              .filter(Boolean)
                            updateSelectedRow({ excludeFields: fields.length > 0 ? fields : [] })
                          }}
                          onBlur={(e) => {
                            // On blur, clean up and normalize
                            const value = e.target.value.trim()
                            const fields = value
                              .split(",")
                              .map(f => f.trim())
                              .filter(Boolean)
                            const normalizedText = fields.join(", ")
                            setExcludeFieldsText(normalizedText)
                            updateSelectedRow({ excludeFields: fields })
                          }}
                          rows={4}
                          className="w-full border rounded px-2 py-1 text-sm bg-background resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">
                          SQL After:
                        </label>
                        <textarea
                          value={selectedRow.sqlAfter || ""}
                          onChange={(e) => updateSelectedRow({ sqlAfter: e.target.value })}
                          rows={4}
                          className="w-full border rounded px-2 py-1 text-sm bg-background resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 items-center gap-2">
                        <label className="text-sm text-muted-foreground">Update Mode:</label>
                        <input
                          type="text"
                          value={selectedRow.updateMode || ""}
                          onChange={(e) => updateSelectedRow({ updateMode: e.target.value })}
                          className="border rounded px-2 py-1 text-sm bg-background"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">
                          Conditions:
                        </label>
                        <textarea
                          value={selectedRow.conditions || ""}
                          onChange={(e) => updateSelectedRow({ conditions: e.target.value })}
                          rows={3}
                          className="w-full border rounded px-2 py-1 text-sm bg-background resize-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Table Description:
                    </label>
                    <textarea
                      value={selectedRow.tableDesc || ""}
                      onChange={(e) => updateSelectedRow({ tableDesc: e.target.value })}
                      rows={3}
                      className="w-full border rounded px-2 py-1 text-sm bg-background resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Table Prefix:
                    </label>
                    <input
                      type="text"
                      value={selectedRow.tablePrefix || ""}
                      onChange={(e) => updateSelectedRow({ tablePrefix: e.target.value })}
                      className="w-full border rounded px-2 py-1 text-sm bg-background"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Custom Table Name:
                    </label>
                    <input
                      type="text"
                      value={selectedRow.cTableName || ""}
                      onChange={(e) => updateSelectedRow({ cTableName: e.target.value })}
                      className="w-full border rounded px-2 py-1 text-sm bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Update Results:
                    </label>
                    <textarea
                      value={selectedRow.updateResults || ""}
                      onChange={(e) => updateSelectedRow({ updateResults: e.target.value })}
                      rows={3}
                      className="w-full border rounded px-2 py-1 text-sm bg-background resize-none"
                    />
                  </div>

                </>

              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a table from the maintenance tab to view its details
                </div>
              )}
            </CardContent>

            <CardFooter className="justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRow(undefined)}
                disabled={!selectedRow}
              >
                Clear Selection
              </Button>
              <Button
                size="sm"
                onClick={() => selectedRow && setSelectDialogOpen(true)}
                disabled={!selectedRow}
              >
                Edit Fields
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Create Connection Dialog */}
      <SelectFieldDialog dbType={selectedRow?.databaseName ?? ""} tableName={selectedRow?.physicalName ?? ""} defaultFields={selectedRow?.selectFields ?? []} onSave={handleSelectFeilds} onOpenChange={setSelectDialogOpen} open={selectDialogOpen}></SelectFieldDialog>
      <AlertDialog open={bulkUpdateDialogOpen} onOpenChange={setBulkUpdateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update all UpdateMode values</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the UpdateMode value that should be applied to every table.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dialog-bulk-update-mode">UpdateMode</Label>
              <Input
                id="dialog-bulk-update-mode"
                value={bulkUpdateMode}
                onChange={(e) => setBulkUpdateMode(e.target.value)}
                placeholder="Enter UpdateMode value"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkApplyUpdateMode}>Apply to all</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={bulkPrefixDialogOpen} onOpenChange={setBulkPrefixDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update all Table Prefix values</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the table prefix that should be applied to every table.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dialog-bulk-prefix">Table Prefix</Label>
              <Input
                id="dialog-bulk-prefix"
                value={bulkTablePrefix}
                onChange={(e) => setBulkTablePrefix(e.target.value)}
                placeholder="Enter table prefix value"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkApplyTablePrefix}>Apply to all</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <SaveXmlDialog open={saveDialogOpen} onSave={handleExportXml} onOpenChange={setSaveDialogOpen} />
      <UpdateAlertDialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen} onContinue={handleUpdate} />
      <CreateConnectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isEditing={isEditing}
        dialogFor={dialogFor}
        setSource={setSource}
        setDest={setDest}
        dbConnection={{
          dbHost,
          dbPort,
          dbName,
          dbUser,
          dbPass,
          dbType
        }}
      />
    </div >
  )
}

function parseErpTablesXml(xmlText: string): TaskTableRow[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'application/xml')
  const parseError = doc.querySelector('parsererror')
  if (parseError) throw new Error('XML parse error')

  // Handle default namespace by localName checks
  const items: TaskTableRow[] = []
  const all = Array.from(doc.getElementsByTagName('*'))
  const taskTables = all.filter(el => el.localName === 'taskTable')
  for (const tt of taskTables) {
    const find = (name: string) => {
      const child = Array.from(tt.children).find(c => c.localName === name)
      return child?.textContent?.trim() ?? ''
    }
    const parseFields = (s: string): string[] =>
      s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

    const includeRaw = find('IncludeInUpdate')

    const selectFields = parseFields(find("SelectFields"));
    const excludeFields = parseFields(find("ExcludeFields"));

    items.push({
      moduleName: find('ModuleName'),
      physicalName: find('PhysicalName'),
      tableType: find('TableType'),
      databaseName: find('DatabaseName'),
      includeInUpdate: includeRaw ? includeRaw.toLowerCase() === 'true' : false,
      updateResults: find('UpdateResults'),
      sqlBefore: find('SqlBefore') || undefined,
      sqlAfter: find('SqlAfter') || undefined,
      updateMode: find('UpdateMode') || undefined,
      conditions: find('Conditions'),
      selectFields,
      excludeFields,
      tableDesc: find('TableDesc') || undefined,
      tablePrefix: find('TablePrefix') || undefined,
      cTableName: find('CTableName') || undefined,
    })
  }
  return items
}

function generateErpTablesXml(rows: TaskTableRow[]): string {
  const escapeXml = (str: string | undefined): string => {
    if (!str) return ''
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  const xmlRows = rows.map(row => {
    const selectFieldsStr = row.selectFields?.join(', ') || ''
    const excludeFieldsStr = row.excludeFields?.join(', ') || ''

    return `    <taskTable>
      <ModuleName>${escapeXml(row.moduleName)}</ModuleName>
      <PhysicalName>${escapeXml(row.physicalName)}</PhysicalName>
      <TableType>${escapeXml(row.tableType)}</TableType>
      <DatabaseName>${escapeXml(row.databaseName)}</DatabaseName>
      <IncludeInUpdate>${row.includeInUpdate ? 'true' : 'false'}</IncludeInUpdate>
      <UpdateResults>${escapeXml(row.updateResults)}</UpdateResults>
      <SelectFields>${escapeXml(selectFieldsStr)}</SelectFields>
      <ExcludeFields>${escapeXml(excludeFieldsStr)}</ExcludeFields>
      ${row.sqlBefore ? `<SqlBefore>${escapeXml(row.sqlBefore)}</SqlBefore>` : ''}
      ${row.sqlAfter ? `<SqlAfter>${escapeXml(row.sqlAfter)}</SqlAfter>` : ''}
      ${row.updateMode ? `<UpdateMode>${escapeXml(row.updateMode)}</UpdateMode>` : ''}
      ${row.conditions ? `<Conditions>${escapeXml(row.conditions)}</Conditions>` : ''}
      ${row.tableDesc ? `<TableDesc>${escapeXml(row.tableDesc)}</TableDesc>` : ''}
      ${row.tablePrefix ? `<TablePrefix>${escapeXml(row.tablePrefix)}</TablePrefix>` : ''}
      ${row.cTableName ? `<CTableName>${escapeXml(row.cTableName)}</CTableName>` : ''}
    </taskTable>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<ERPTables>
${xmlRows}
</ERPTables>`
}

function maskPasswordInConnectionString(connStr: string): string {
  if (!connStr) return connStr

  // Handle both semicolon and comma delimiters
  const delimiter = connStr.includes(";") ? ";" : ","
  const parts = connStr.split(delimiter)

  return parts.map(part => {
    const trimmed = part.trim()
    const lowerTrimmed = trimmed.toLowerCase()

    // Check for various password key formats
    if (lowerTrimmed.startsWith("password=") ||
      lowerTrimmed.startsWith("pwd=") ||
      lowerTrimmed.startsWith("pass=")) {
      const eqIdx = trimmed.indexOf("=")
      if (eqIdx !== -1) {
        const key = trimmed.substring(0, eqIdx + 1)
        const passwordValue = trimmed.substring(eqIdx + 1)
        // Mask the password value with asterisks
        return `${key}${passwordValue ? "****" : ""}`
      }
    }
    return part
  }).join(delimiter)
}

function FieldRow({ id, label, value, onChange, onCreate, onTest }: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onCreate: () => void;
  onTest: () => void;
}) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className="grid grid-cols-12 items-center gap-2">
      <Label htmlFor={id} className="col-span-3 text-sm">{label}:</Label>
      <Input
        id={id}
        value={isFocused ? value : maskPasswordInConnectionString(value)}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="col-span-7"
        placeholder="Connection string"
        type="text"
      />
      <div className="col-span-1 flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <EllipsisVertical className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onCreate} className="gap-2">
              <PlusCircle className="h-4 w-4" /> {value ? 'Edit Connection' : 'Create Connection'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onTest} className="gap-2">
              <CheckCircle2 className="h-4 w-4" /> Test Connection
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
