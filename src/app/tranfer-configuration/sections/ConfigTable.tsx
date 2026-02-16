import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@radix-ui/react-checkbox"
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from "@radix-ui/react-context-menu"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@radix-ui/react-dropdown-menu"
import { Separator } from "@radix-ui/react-menubar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dispatch, RefObject, SetStateAction, useState } from "react"
import { MoreVertical } from "lucide-react"

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

interface ConfigTableProps {
  setBulkUpdateDialogOpen: Dispatch<SetStateAction<boolean>>;
  setBulkPrefixDialogOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedRow: Dispatch<SetStateAction<TaskTableRow | undefined>>;
  setSelectDialogOpen: Dispatch<SetStateAction<boolean>>;
  setActiveTab: Dispatch<SetStateAction<string>>;
  setLoadedRows: Dispatch<SetStateAction<TaskTableRow[]>>;
  handleClearUpdateMode: () => void;
  handleClearTablePrefix: () => void;
  tableBodyRef: RefObject<HTMLTableSectionElement | null>;
  loadedRows: TaskTableRow[];
}

export default function ConfigTable(
  {
    setBulkUpdateDialogOpen,
    setBulkPrefixDialogOpen,
    setSelectedRow,
    setSelectDialogOpen,
    setActiveTab,
    setLoadedRows,
    handleClearUpdateMode,
    handleClearTablePrefix,
    tableBodyRef,
    loadedRows
  }: ConfigTableProps) {
  const [editingCell, setEditingCell] = useState<{
    row: number;
    field: keyof TaskTableRow;
  } | null>(null)

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
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <TableHead className="cursor-pointer">UpdateMode</TableHead>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => setBulkUpdateDialogOpen(true)}>
                    Update all
                  </ContextMenuItem>
                  <ContextMenuItem onClick={handleClearUpdateMode}>
                    Clear all
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
              <TableHead>Sql After</TableHead>
              <TableHead>Conditions</TableHead>
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <TableHead className="cursor-pointer">Table Prefix</TableHead>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => setBulkPrefixDialogOpen(true)}>
                    Update all
                  </ContextMenuItem>
                  <ContextMenuItem onClick={handleClearTablePrefix}>
                    Clear
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
              <TableHead>Custom Table Name</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody ref={tableBodyRef}>
            {loadedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="py-5 text-center text-muted-foreground">No data loaded. Click Load to import an ERPTables XML.</TableCell>
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
                      <TableCell className="font-medium" onDoubleClick={() => setEditingCell({ row: idx, field: 'tablePrefix' })}>
                        {editingCell?.row === idx && editingCell.field === 'tablePrefix' ? (
                          <Input
                            autoFocus
                            value={r.tablePrefix || ''}
                            onChange={(e) => {
                              const next = [...loadedRows]
                              next[idx] = { ...next[idx], tablePrefix: e.target.value }
                              setLoadedRows(next)
                            }}
                            onBlur={() => setEditingCell(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'Escape') setEditingCell(null)
                              if (e.key === "Tab") {
                                e.preventDefault();
                                focusNextCell(idx, "tablePrefix");
                              }
                            }}
                            placeholder="Table Prefix"
                          />
                        ) : (
                          <span className="block cursor-text select-text">{r.tablePrefix || '—'}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium" onDoubleClick={() => setEditingCell({ row: idx, field: 'cTableName' })}>
                        {editingCell?.row === idx && editingCell.field === 'cTableName' ? (
                          <Input
                            autoFocus
                            value={r.cTableName || ''}
                            onChange={(e) => {
                              const next = [...loadedRows]
                              next[idx] = { ...next[idx], cTableName: e.target.value }
                              setLoadedRows(next)
                            }}
                            onBlur={() => setEditingCell(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'Escape') setEditingCell(null)
                              if (e.key === "Tab") {
                                e.preventDefault();
                                focusNextCell(idx, "cTableName");
                              }
                            }}
                            placeholder="Table Prefix"
                          />
                        ) : (
                          <span className="block cursor-text select-text">{r.cTableName || '—'}</span>
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

  )
}
