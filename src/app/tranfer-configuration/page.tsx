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
import { createConfig, getConfig } from "@/lib/config-service"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { SelectFieldDialog } from "./components/selectfields-dialog"
import { SaveXmlDialog } from "./components/saveXml-dialog"
import { getRecords, transferData } from "@/lib/table-service"
import { UpdateAlertDialog } from "./components/updateConfirmation-adialog"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@radix-ui/react-context-menu"
import { toast } from "sonner"

type DbConfig = {
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
}

export default function TransferConfiguration() {
  const [source, setSource] = useState<DbConfig>({ finance: "", manufacturing: "" })
  const [dest, setDest] = useState<DbConfig>({ finance: "", manufacturing: "" })
  const [loadedRows, setLoadedRows] = useState<TaskTableRow[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [activeTab, setActiveTab] = useState("maintenance");

  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [filename] = useState("ERPTables")

  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogFor, setDialogFor] = useState<
    | { scope: "source" | "dest"; field: keyof DbConfig }
    | null
  >(null)

  // select fiel dialog state
  const [selectDialogOpen, setSelectDialogOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<TaskTableRow | undefined>(undefined)
  const [isEditing, setIsEditing] = useState(false)
  const [editingCell, setEditingCell] = useState<{
    row: number;
    field: keyof TaskTableRow;
  } | null>(null)

  // Form state inside dialog
  const [dbHost, setDbHost] = useState("")
  const [dbPort, setDbPort] = useState("")
  const [dbName, setDbName] = useState("")
  const [dbUser, setDbUser] = useState("")
  const [dbPass, setDbPass] = useState("")

  function openCreateDialog(scope: "source" | "dest", field: keyof DbConfig, currentValue: string) {
    setDialogFor({ scope, field })
    console.log("scope:", scope, "field:", field, "currentValue:", currentValue)
    setIsEditing(Boolean(currentValue && currentValue.trim().length > 0))
    // Attempt to parse both semicolon-delimited (ODBC) and space-delimited (DSN) formats
    const parseConnection = (value: string) => {
      const lower = value.toLowerCase()
      const delimiter = value.includes(";") ? ";" : " "
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
      return { host, db, user, pass, port }
    }
    if (currentValue && currentValue.trim().length > 0) {
      const parsed = parseConnection(currentValue)
      setDbHost(parsed.host)
      setDbName(parsed.db)
      setDbUser(parsed.user)
      setDbPass(parsed.pass)
      setDbPort(parsed.port)
    } else {
      setDbHost("")
      setDbName("")
      setDbUser("")
      setDbPass("")
      setDbPort("")
    }
    setDialogOpen(true)
  }

  function saveConnectionFromDialog() {
    // Build a Postgres DSN-style string
    const segments = [
      dbHost && `host=${dbHost}`,
      dbUser && `user=${dbUser}`,
      dbPass && `password=${dbPass}`,
      dbName && `dbname=${dbName}`,
      dbPort && `port=${dbPort}`,
      // Defaults as requested
      `sslmode=disable`,
    ].filter(Boolean) as string[]
    const conn = segments.join(" ")
    if (dialogFor) {
      if (dialogFor.scope === "source") {
        setSource(prev => ({ ...prev, [dialogFor.field]: conn }))
      } else {
        setDest(prev => ({ ...prev, [dialogFor.field]: conn }))
      }
    }
    setDialogOpen(false)
  }

  async function testConnection(value: string) {
    await new Promise(r => setTimeout(r, 600))
    toast.info(value ? "Connection successful" : "Please enter a connection string to test")
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
      "conditions"
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

  const handleUpdate = async () => {
    try {
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
        }))

      if (rowsToTransfer.length === 0) {
        toast.warning("No rows selected for update")
        return
      }

      const result = await transferData(username, rowsToTransfer)
      toast.success(result)

      setLoadedRows(prev =>
        prev.map(r =>
          r.includeInUpdate
            ? { ...r, updateResults: "Transferred successfully" }
            : r
        )
      )
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || "Transfer failed")
    }
  }

  const handleStop = () => toast.info('Stop transfer')
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
    setLoadedRows((prev) =>
      prev.map((r) =>
        r.physicalName === selectedRow.physicalName
          ? { ...r, selectFields: fields }
          : r
      )
    )
  }

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

  function exportRowsAsXml(filename: string, rows: TaskTableRow[]) {
    const escapeXml = (s: string) => s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")

    const items = rows.map(r => {
      const selectFields = (r.selectFields || []).join(", ");
      const excludeFields = (r.excludeFields || []).join(", ");

      return (`    <taskTable>\n`
        + `      <ModuleName>${escapeXml(r.moduleName || '')}</ModuleName>\n`
        + `      <PhysicalName>${escapeXml(r.physicalName || '')}</PhysicalName>\n`
        + `      <TableType>${escapeXml(r.tableType || '')}</TableType>\n`
        + `      <SelectFields>${escapeXml(selectFields)}</SelectFields>\n`
        + `      <ExcludeFields>${escapeXml(excludeFields)}</ExcludeFields>\n`
        + `      <DatabaseName>${escapeXml(r.databaseName || '')}</DatabaseName>\n`
        + `      <IncludeInUpdate>${r.includeInUpdate ? 'true' : 'false'}</IncludeInUpdate>\n`
        + `      <UpdateResults>${escapeXml(r.updateResults || '')}</UpdateResults>\n`
        + (r.sqlBefore ? `      <SqlAfter>${escapeXml(r.sqlBefore)}</SqlAfter>\n` : '')
        + (r.sqlAfter ? `      <SqlAfter>${escapeXml(r.sqlAfter)}</SqlAfter>\n` : '')
        + (r.updateMode ? `      <UpdateMode>${escapeXml(r.updateMode)}</UpdateMode>\n` : '')
        + (r.conditions ? `      <Conditions>${escapeXml(r.conditions)}</Conditions>\n` : '')
        + `    </taskTable>`)
    }
    ).join("\n")

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<ERPTables>\n${items}\n</ERPTables>\n`
    const blob = new Blob([xml], { type: "application/xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename + '.xml'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function addRow() {
    const newRow: TaskTableRow = {
      moduleName: "",
      physicalName: "",
      tableType: "",
      databaseName: "",
      includeInUpdate: false,
      updateResults: "",
      conditions: "",
    }
    setLoadedRows(prev => [...prev, newRow])
  }

  return (
    <div className="mx-auto max-w-[1200px] p-4 space-y-4">
      {/* Controls toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={handleLoad} className="gap-2"><FolderOpen className="h-4 w-4" /> Load</Button>
        <Button variant="secondary" onClick={() => setSaveDialogOpen(true)} className="gap-2"><Save className="h-4 w-4" /> Save</Button>
        <Button variant="default" onClick={() => setUpdateDialogOpen(true)} className="gap-2"><Play className="h-4 w-4" /> Update</Button>
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
              e.currentTarget.value = ""
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

          <Card className="overflow-hidden gap-3">
            <CardHeader>
              <CardTitle>Tables</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <Table>
                <TableHeader className="sticky-header">
                  <TableRow>
                    <TableHead className="w-12">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={loadedRows.length > 0 && loadedRows.every(r => r.includeInUpdate)}
                          onCheckedChange={(checked) => {
                            if (loadedRows.length === 0) return
                            const value = Boolean(checked)
                            setLoadedRows(loadedRows.map(r => ({ ...r, includeInUpdate: value })))
                          }}
                          aria-label="Toggle include for all rows"
                        />
                      </div>
                    </TableHead>
                    <TableHead className="w-[110px]">Module</TableHead>
                    <TableHead className="w-[110px]">Physical Name</TableHead>
                    <TableHead className="w-[110px]">Type</TableHead>
                    <TableHead className="w-[90px]">DB</TableHead>
                    <TableHead>Results</TableHead>
                    <TableHead>UpdateMode</TableHead>
                    <TableHead>Sql After</TableHead>
                    <TableHead>Conditions</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadedRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground">No data loaded. Click Load to import an ERPTables XML.</TableCell>
                    </TableRow>
                  ) : (
                    loadedRows.map((r, idx) => (
                      <ContextMenu key={idx}>
                        <ContextMenuTrigger asChild>
                          <TableRow key={idx} className="text-left">
                            <TableCell>
                              <Checkbox
                                checked={!!r.includeInUpdate}
                                onCheckedChange={(checked) => {
                                  const next = [...loadedRows]
                                  next[idx] = { ...next[idx], includeInUpdate: Boolean(checked) }
                                  setLoadedRows(next)
                                }}
                                aria-label={`Include ${r.physicalName}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium" onDoubleClick={() => setEditingCell({ row: idx, field: 'moduleName' })}>
                              {editingCell?.row === idx && editingCell.field === 'moduleName' ? (
                                <Input
                                  autoFocus
                                  value={r.moduleName}
                                  onChange={(e) => {
                                    const next = [...loadedRows]
                                    next[idx] = { ...next[idx], moduleName: e.target.value }
                                    setLoadedRows(next)
                                  }}
                                  onBlur={() => setEditingCell(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === 'Escape') setEditingCell(null)
                                    if (e.key === "Tab") {
                                      e.preventDefault();
                                      focusNextCell(idx, "moduleName");
                                    }
                                  }}
                                  placeholder="Module"
                                />
                              ) : (
                                <span className="block cursor-text select-text">{r.moduleName || '—'}</span>
                              )}
                            </TableCell>
                            <TableCell onDoubleClick={() => setEditingCell({ row: idx, field: 'physicalName' })}>
                              {editingCell?.row === idx && editingCell.field === 'physicalName' ? (
                                <Input
                                  autoFocus
                                  value={r.physicalName}
                                  onChange={(e) => {
                                    const next = [...loadedRows]
                                    next[idx] = { ...next[idx], physicalName: e.target.value }
                                    setLoadedRows(next)
                                  }}
                                  onBlur={() => setEditingCell(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === 'Escape') setEditingCell(null)
                                    if (e.key === "Tab") {
                                      e.preventDefault();
                                      focusNextCell(idx, "physicalName");
                                    }
                                  }}
                                  placeholder="Physical name"
                                />
                              ) : (
                                <span className="block cursor-text select-text">{r.physicalName || '—'}</span>
                              )}
                            </TableCell>
                            <TableCell onDoubleClick={() => setEditingCell({ row: idx, field: 'tableType' })}>
                              {editingCell?.row === idx && editingCell.field === 'tableType' ? (
                                <Input
                                  autoFocus
                                  value={r.tableType}
                                  onChange={(e) => {
                                    const next = [...loadedRows]
                                    next[idx] = { ...next[idx], tableType: e.target.value }
                                    setLoadedRows(next)
                                  }}
                                  onBlur={() => setEditingCell(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === 'Escape') setEditingCell(null)
                                    if (e.key === "Tab") {
                                      e.preventDefault();
                                      focusNextCell(idx, "tableType");
                                    }
                                  }}
                                  placeholder="Type"
                                />
                              ) : (
                                <span className="block cursor-text select-text">{r.tableType || '—'}</span>
                              )}
                            </TableCell>
                            <TableCell onDoubleClick={() => setEditingCell({ row: idx, field: 'databaseName' })}>
                              {editingCell?.row === idx && editingCell.field === 'databaseName' ? (
                                <Input
                                  autoFocus
                                  value={r.databaseName}
                                  onChange={(e) => {
                                    const next = [...loadedRows]
                                    next[idx] = { ...next[idx], databaseName: e.target.value }
                                    setLoadedRows(next)
                                  }}
                                  onBlur={() => setEditingCell(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === 'Escape') setEditingCell(null)
                                    if (e.key === "Tab") {
                                      e.preventDefault();
                                      focusNextCell(idx, "databaseName");
                                    }
                                  }}
                                  placeholder="DB"
                                />
                              ) : (
                                <span className="block cursor-text select-text">{r.databaseName || '—'}</span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-[360px]" onDoubleClick={() => setEditingCell({ row: idx, field: 'updateResults' })}>
                              {editingCell?.row === idx && editingCell.field === 'updateResults' ? (
                                <Textarea
                                  autoFocus
                                  value={r.updateResults}
                                  onChange={(e) => {
                                    const next = [...loadedRows]
                                    next[idx] = { ...next[idx], updateResults: e.target.value }
                                    setLoadedRows(next)
                                  }}
                                  onBlur={() => setEditingCell(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') setEditingCell(null)
                                    if (e.key === "Tab") {
                                      e.preventDefault();
                                      focusNextCell(idx, "updateResults");
                                    }
                                  }}
                                  placeholder="Results"
                                  className="h-9"
                                />
                              ) : (
                                <span className="block truncate cursor-text select-text" title={r.updateResults}>{r.updateResults || '—'}</span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium" onDoubleClick={() => setEditingCell({ row: idx, field: 'updateMode' })}>
                              {editingCell?.row === idx && editingCell.field === 'updateMode' ? (
                                <Input
                                  autoFocus
                                  value={r.updateMode}
                                  onChange={(e) => {
                                    const next = [...loadedRows]
                                    next[idx] = { ...next[idx], updateMode: e.target.value }
                                    setLoadedRows(next)
                                  }}
                                  onBlur={() => setEditingCell(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === 'Escape') setEditingCell(null)
                                    if (e.key === "Tab") {
                                      e.preventDefault();
                                      focusNextCell(idx, "updateMode");
                                    }
                                  }}
                                  placeholder="Module"
                                />
                              ) : (
                                <span className="block cursor-text select-text">{r.updateMode || '—'}</span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium" onDoubleClick={() => setEditingCell({ row: idx, field: 'sqlAfter' })}>
                              {editingCell?.row === idx && editingCell.field === 'sqlAfter' ? (
                                <Input
                                  autoFocus
                                  value={r.sqlAfter}
                                  onChange={(e) => {
                                    const next = [...loadedRows]
                                    next[idx] = { ...next[idx], sqlAfter: e.target.value }
                                    setLoadedRows(next)
                                  }}
                                  onBlur={() => setEditingCell(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === 'Escape') setEditingCell(null)
                                    if (e.key === "Tab") {
                                      e.preventDefault();
                                      focusNextCell(idx, "sqlAfter");
                                    }
                                  }}
                                  placeholder="Module"
                                />
                              ) : (
                                <span className="block cursor-text select-text">{r.sqlAfter || '—'}</span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium" onDoubleClick={() => setEditingCell({ row: idx, field: 'conditions' })}>
                              {editingCell?.row === idx && editingCell.field === 'conditions' ? (
                                <Input
                                  autoFocus
                                  value={r.conditions}
                                  onChange={(e) => {
                                    const next = [...loadedRows]
                                    next[idx] = { ...next[idx], conditions: e.target.value }
                                    setLoadedRows(next)
                                  }}
                                  onBlur={() => setEditingCell(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === 'Escape') setEditingCell(null)
                                    if (e.key === "Tab") {
                                      e.preventDefault();
                                      focusNextCell(idx, "conditions");
                                    }
                                  }}
                                  placeholder="Module"
                                />
                              ) : (
                                <span className="block cursor-text select-text">{r.conditions || '—'}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreVertical />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedRow(r);
                                    setSelectDialogOpen(true);
                                  }}>select feilds</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedRow(r);
                                    setActiveTab("details");
                                  }}>details</DropdownMenuItem>
                                  <Separator />
                                  <DropdownMenuItem className="text-red-600" onClick={() => {
                                    setLoadedRows((prev) => prev.filter((_, i) => i !== idx));
                                  }
                                  }>delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="bg-secondary w-30 py-2 rounded-md">
                          <ContextMenuItem className="pl-6 py-1" onClick={() => {
                            setSelectedRow(r);
                            setSelectDialogOpen(true);
                          }} >select feilds</ContextMenuItem>
                          <ContextMenuItem className="pl-6 py-1" onClick={() => {
                            setSelectedRow(r);
                            setActiveTab("details");
                          }} >details</ContextMenuItem>
                          <Separator />
                          <ContextMenuItem className="text-red-600 pl-6 py-1" onClick={() => {
                            setLoadedRows((prev) => prev.filter((_, i) => i !== idx));
                          }
                          }>delete</ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={addRow} variant="secondary">Add Row</Button>
            </CardFooter>
          </Card>

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
                  <TableRow>
                    <TableCell className="font-medium">—</TableCell>
                    <TableCell>No errors yet</TableCell>
                    <TableCell>—</TableCell>
                  </TableRow>
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
                          className="border rounded px-2 py-1 text-sm bg-muted/30"
                          readOnly
                        />
                      </div>

                      <div className="grid grid-cols-2 items-center gap-2">
                        <label className="text-sm text-muted-foreground">Table Name:</label>
                        <input
                          type="text"
                          value={selectedRow.physicalName || ""}
                          className="border rounded px-2 py-1 text-sm bg-muted/30"
                          readOnly
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">
                          Select Fields:
                        </label>
                        <textarea
                          value={selectedRow.selectFields?.join(", ") || ""}
                          rows={4}
                          className="w-full border rounded px-2 py-1 text-sm bg-muted/30 resize-none"
                          readOnly
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">
                          SQL Before:
                        </label>
                        <textarea
                          value={selectedRow.sqlBefore || ""}
                          rows={4}
                          className="w-full border rounded px-2 py-1 text-sm bg-muted/30 resize-none"
                          readOnly
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
                          className="border rounded px-2 py-1 text-sm bg-muted/30"
                          readOnly
                        />
                      </div>

                      <div className="grid grid-cols-2 items-center gap-2">
                        <label className="text-sm text-muted-foreground">Table Type:</label>
                        <input
                          type="text"
                          value={selectedRow.tableType || ""}
                          className="border rounded px-2 py-1 text-sm bg-muted/30"
                          readOnly
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">
                          Excluded Fields:
                        </label>
                        <textarea
                          value={selectedRow.excludeFields?.join(", ") || ""}
                          rows={4}
                          className="w-full border rounded px-2 py-1 text-sm bg-muted/30 resize-none"
                          readOnly
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">
                          SQL After:
                        </label>
                        <textarea
                          value={selectedRow.sqlAfter || ""}
                          rows={4}
                          className="w-full border rounded px-2 py-1 text-sm bg-muted/30 resize-none"
                          readOnly
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
                      rows={3}
                      className="w-full border rounded px-2 py-1 text-sm bg-muted/30 resize-none"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Update Results:
                    </label>
                    <textarea
                      value={selectedRow.updateResults || ""}
                      rows={3}
                      className="w-full border rounded px-2 py-1 text-sm bg-muted/30 resize-none"
                      readOnly
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
      <SaveXmlDialog open={saveDialogOpen} onSave={handleSave} onOpenChange={setSaveDialogOpen} />
      <UpdateAlertDialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen} onContinue={handleUpdate} />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Connection" : "Create Connection"}</DialogTitle>
            <DialogDescription>Enter database connection details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="host" className="col-span-1 text-sm">Host</Label>
              <Input id="host" className="col-span-3" value={dbHost} onChange={(e) => setDbHost(e.target.value)} />
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="port" className="col-span-1 text-sm">Port</Label>
              <Input id="port" className="col-span-3" value={dbPort} onChange={(e) => setDbPort(e.target.value)} />
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="db" className="col-span-1 text-sm">Database</Label>
              <Input id="db" className="col-span-3" value={dbName} onChange={(e) => setDbName(e.target.value)} />
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="user" className="col-span-1 text-sm">User</Label>
              <Input id="user" className="col-span-3" value={dbUser} onChange={(e) => setDbUser(e.target.value)} />
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="pass" className="col-span-1 text-sm">Password</Label>
              <Input id="pass" type="password" className="col-span-3" value={dbPass} onChange={(e) => setDbPass(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveConnectionFromDialog}>
              Save Connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
      selectFields,
      excludeFields,
      tableDesc: find('TableDesc') || undefined,
    })
  }
  return items
}

function FieldRow({ id, label, value, onChange, onCreate, onTest }: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onCreate: () => void;
  onTest: () => void;
}) {
  return (
    <div className="grid grid-cols-12 items-center gap-2">
      <Label htmlFor={id} className="col-span-3 text-sm">{label}:</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="col-span-7"
        placeholder="Connection string"
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
