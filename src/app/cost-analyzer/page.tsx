"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { FileText, Play, Users, Settings, Sigma, Save, TableConfig, TableConfigIcon } from "lucide-react"
import MasterMRP from "./sections/MasterMRP"
import { ExecutePlanResponse, PartMRP, flattenTree, findTreeNodeForPart } from "@/lib/mrp-service";
import ViewPlanDialog from "./components/ViewPlan-dialog"
import ConfigureDialog from "./components/Configure-dialog"
import ExecutePlanDialog from "./components/ExecutePlan-dialog";
import LaborSummaryDialog from "./components/LaborSummary-dialog";
import MachineSummaryDialog from "./components/MachineSummary-dialog";
import MiscSummaryDialog from "./components/MiscSummary-dialog";
import { getConfig } from "@/lib/config-service"

export default function CostAnalyzer() {
  const [viewPlanOpen, setViewPlanOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [executePlanOpen, setExecutePlanOpen] = useState(false);
  const [laborSummaryOpen, setLaborSummaryOpen] = useState(false);
  const [machineSummaryOpen, setMachineSummaryOpen] = useState(false);
  const [miscSummaryOpen, setMiscSummaryOpen] = useState(false);
  const [mrpData, setMrpData] = useState<ExecutePlanResponse | null>(null);
  const [selectedMrpNode, setSelectedMrpNode] = useState<PartMRP | null>(null);
  const [selectedUniquePath, setSelectedUniquePath] = useState<string | null>(null);

  // Find the Tree node corresponding to the currently selected MRP node
  const selectedTreeNode = useMemo(() => {
    if (!mrpData || !selectedMrpNode) return null;
    return findTreeNodeForPart(mrpData, selectedMrpNode.partCode, selectedMrpNode.warehouse);
  }, [mrpData, selectedMrpNode]);

  const handlePlanExecuted = (data: ExecutePlanResponse) => {
    setMrpData(data);
    // Select the first tree's root node by default
    if (data && data.length > 0) {
      const rootNode = data[0].Root;
      setSelectedMrpNode(rootNode);
      // Create unique path for root: just the partCode-warehouse
      setSelectedUniquePath(`${rootNode.partCode}-${rootNode.warehouse}`);
    } else {
      setSelectedMrpNode(null);
      setSelectedUniquePath(null);
    }
  };

  const handleMrpRowClick = (node: PartMRP, uniquePath: string) => {
    setSelectedMrpNode(node);
    setSelectedUniquePath(uniquePath);
  };

  const [dbHost, setDbHost] = useState("")
  const [dbPort, setDbPort] = useState("")
  const [dbName, setDbName] = useState("")
  const [dbUser, setDbUser] = useState("")
  const [dbPass, setDbPass] = useState("")
  const [dbType, setDbType] = useState("")

  const [planConn, setPlanConn] = useState("")

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
  const openConfigDialog = () => {
    if (planConn && planConn.trim().length > 0) {
      const parsed = parseConnection(planConn)
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
    setConfigOpen(true)
  }

  useEffect(() => {
    const username = 'Administrator'
    getConfig(username)
      .then(cfg => {
        setPlanConn(cfg.plan_dsn)
      })
      .catch(() => {
        // no config yet or error — stay with defaults
      })
  }, [])
  return (
    <div className="flex flex-col h-[84vh] overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex items-center gap-2 border-b bg-background">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setViewPlanOpen(true)}>
          <FileText className="h-4 w-4" /> View Plan
        </Button>
        <Button variant="default" size="sm" className="gap-2" onClick={() => setExecutePlanOpen(true)} >
          <Play className="h-4 w-4" /> Execute
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setLaborSummaryOpen(true)}>
          <Users className="h-4 w-4" /> Labor
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setMachineSummaryOpen(true)}>
          <Settings className="h-4 w-4" /> Machine
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setMiscSummaryOpen(true)}>
          <Sigma className="h-4 w-4" /> Misc
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={openConfigDialog}>
          <TableConfigIcon className="h-4 w-4" /> Configure
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <Save className="h-4 w-4" /> Export
        </Button>
      </div>

      <ViewPlanDialog open={viewPlanOpen} onOpenChange={setViewPlanOpen} />
      <ExecutePlanDialog open={executePlanOpen} onOpenChange={setExecutePlanOpen} onPlanExecuted={handlePlanExecuted} />
      <LaborSummaryDialog open={laborSummaryOpen} onOpenChange={setLaborSummaryOpen} data={mrpData} />
      <MachineSummaryDialog open={machineSummaryOpen} onOpenChange={setMachineSummaryOpen} data={mrpData} />
      <MiscSummaryDialog open={miscSummaryOpen} onOpenChange={setMiscSummaryOpen} data={mrpData} />
      <ConfigureDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        setPlanConn={setPlanConn}
        dbConnection={{
          dbHost,
          dbPort,
          dbName,
          dbUser,
          dbPass,
          dbType
        }} />

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel - Main Table */}
          <ResizablePanel defaultSize={85} minSize={40}>
            <ResizablePanelGroup direction="vertical" className="w-50">
              <ResizablePanel defaultSize={65} minSize={40}>
                <MasterMRP data={mrpData} onRowClick={handleMrpRowClick} selectedNode={selectedMrpNode} selectedUniquePath={selectedUniquePath} />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={15} minSize={20} className="border-t">
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle withHandle />

          {/* Right Panel - Stacked Sections */}
          <ResizablePanel defaultSize={35} minSize={30}>
            <ResizablePanelGroup direction="vertical" className="h-full">
              {/* Nom Material Usage Section */}
              <ResizablePanel defaultSize={40} minSize={25}>
                <Card className="h-full flex flex-col rounded-none m-0 py-0">
                  <CardContent className="flex-1 overflow-auto p-2">
                    <Tabs defaultValue="nom-material" className="w-full h-full">
                      <TabsList className="grid w-full grid-cols-4 gap-1">
                        <TabsTrigger value="nom-material" className="text-xs truncate">Material Usage</TabsTrigger>
                        <TabsTrigger value="machine" className="text-xs truncate">Machine</TabsTrigger>
                        <TabsTrigger value="labor" className="text-xs truncate">Labor Usage</TabsTrigger>
                        <TabsTrigger value="misc" className="text-xs truncate">Miscellaneous</TabsTrigger>
                      </TabsList>
                      <TabsContent value="nom-material" className="mt-2">
                        <div className="text-xs text-muted-foreground mb-2">
                          (Source): Material Inputs: This part uses the following products as Material Input
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Stage</TableHead>
                              <TableHead>Part Code</TableHead>
                              <TableHead>WH</TableHead>
                              <TableHead>Part Desc</TableHead>
                              <TableHead>Recipe</TableHead>
                              <TableHead>Setup Qty</TableHead>
                              <TableHead>Input Qty</TableHead>
                              <TableHead>In Qty/Batch</TableHead>
                              <TableHead>UOM</TableHead>
                              <TableHead>Nom. In Qty.</TableHead>
                              <TableHead>Nom U...</TableHead>
                              <TableHead>Std Cost</TableHead>
                              <TableHead>Batches</TableHead>
                              <TableHead>Req Qty (Nom)</TableHead>
                              <TableHead>User Qty</TableHead>
                              <TableHead>Column</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedMrpNode?.materialIns && selectedMrpNode.materialIns.length > 0 ? (
                              selectedMrpNode.materialIns.map((material, index) => {
                                // Find the corresponding child node in the tree for this material input
                                const correspondingChild = selectedTreeNode?.Children?.find(child =>
                                  child.Root.partCode === material.partCode &&
                                  child.Root.warehouse === material.warehouse
                                );

                                return (
                                  <TableRow key={index}>
                                    <TableCell>{material.processStage}</TableCell>
                                    <TableCell>{material.partCode}</TableCell>
                                    <TableCell>{material.warehouse}</TableCell>
                                    <TableCell>{material.detailDesc}</TableCell>
                                    <TableCell>{material.recipeCode}</TableCell>
                                    <TableCell>{material.setupQty}</TableCell>
                                    <TableCell>{material.inputQty}</TableCell>
                                    <TableCell>{material.totalQty}</TableCell>
                                    <TableCell>{material.inputUom}</TableCell>
                                    <TableCell>{material.inputQtyNom}</TableCell>
                                    <TableCell>{material.inputNomUom}</TableCell>
                                    {/* Std Cost and Batches from the corresponding child node, if available */}
                                    <TableCell>
                                      {correspondingChild ? correspondingChild.Root.stdCost.toFixed(4) : ""}
                                    </TableCell>
                                    <TableCell>
                                      {correspondingChild ? correspondingChild.Root.totalBatches.toFixed(2) : ""}
                                    </TableCell>
                                    {/* Keep Req Qty (Nom) and User Qty from material itself */}
                                    <TableCell>{material.totalQtyNom}</TableCell>
                                    <TableCell>{material.userQty}</TableCell>
                                    {/* Example extra column from child node: BOM level (optional) */}
                                    <TableCell>
                                      {correspondingChild ? correspondingChild.Root.bomLevel : ""}
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            ) : (
                              <TableRow>
                                <TableCell colSpan={16} className="text-center text-muted-foreground py-4">
                                  {selectedMrpNode ? 'No material data for selected part' : 'No data available'}
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TabsContent>
                      <TabsContent value="machine" className="mt-2">
                        <div className="text-xs text-muted-foreground mb-2">Machine usage information</div>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Machine</TableHead>
                                <TableHead>Setup Time</TableHead>
                                <TableHead>Setup Unit</TableHead>
                                <TableHead>Run Rate Flag</TableHead>
                                <TableHead>Run Time</TableHead>
                                <TableHead>Run Rate</TableHead>
                                <TableHead>Run Time Unit</TableHead>
                                <TableHead>Setup Hours</TableHead>
                                <TableHead>Runtime Hours</TableHead>
                                <TableHead>Batch Hours</TableHead>
                                <TableHead>Recovery Rate</TableHead>
                                <TableHead>Direct Cost</TableHead>
                                <TableHead>OH Cost</TableHead>
                                <TableHead>OH Alloc Cost</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedMrpNode?.machineIns && selectedMrpNode.machineIns.length > 0 ? (
                                selectedMrpNode.machineIns.map((machine, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{machine.machineCode}</TableCell>
                                    <TableCell>{machine.setupTime.toFixed(4)}</TableCell>
                                    <TableCell>{machine.setupTimeUnit}</TableCell>
                                    <TableCell>{machine.runRateFlag}</TableCell>
                                    <TableCell>{machine.runTime.toFixed(4)}</TableCell>
                                    <TableCell>{machine.runRate.toFixed(4)}</TableCell>
                                    <TableCell>{machine.runTimeUnit}</TableCell>
                                    <TableCell>{machine.setupHours.toFixed(4)}</TableCell>
                                    <TableCell>{machine.runtimeHours.toFixed(4)}</TableCell>
                                    <TableCell>{machine.batchHours.toFixed(2)}</TableCell>
                                    <TableCell>{machine.recoveryRate.toFixed(4)}</TableCell>
                                    <TableCell>{machine.directCost.toFixed(4)}</TableCell>
                                    <TableCell>{machine.ohCost.toFixed(4)}</TableCell>
                                    <TableCell>{machine.ohAllocationCost.toFixed(4)}</TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={14} className="text-center text-muted-foreground py-4">
                                    No machine data available
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </TabsContent>
                      <TabsContent value="labor" className="mt-2">
                        <div className="text-xs text-muted-foreground mb-2">Labor usage information</div>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Labor Class</TableHead>
                                <TableHead>Labor Units</TableHead>
                                <TableHead>Setup Time</TableHead>
                                <TableHead>Setup Unit</TableHead>
                                <TableHead>Run Rate Flag</TableHead>
                                <TableHead>Run Time</TableHead>
                                <TableHead>Run Rate</TableHead>
                                <TableHead>Run Time Unit</TableHead>
                                <TableHead>Batch Hours</TableHead>
                                <TableHead>Total Hours</TableHead>
                                <TableHead>Recovery Rate</TableHead>
                                <TableHead>Direct Cost</TableHead>
                                <TableHead>OH Cost</TableHead>
                                <TableHead>OH Alloc Cost</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedMrpNode?.labIns && selectedMrpNode.labIns.length > 0 ? (
                                selectedMrpNode.labIns.map((labor, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{labor.laborClass}</TableCell>
                                    <TableCell>{labor.laborUnits}</TableCell>
                                    <TableCell>{labor.setupTime.toFixed(4)}</TableCell>
                                    <TableCell>{labor.setupTimeUnit}</TableCell>
                                    <TableCell>{labor.runRateFlag}</TableCell>
                                    <TableCell>{labor.runTime.toFixed(4)}</TableCell>
                                    <TableCell>{labor.runRate.toFixed(4)}</TableCell>
                                    <TableCell>{labor.runTimeUnit}</TableCell>
                                    <TableCell>{labor.batchHours.toFixed(2)}</TableCell>
                                    <TableCell>{(labor.setupHours + labor.runtimeHours).toFixed(4)}</TableCell>
                                    <TableCell>{labor.recoveryRate.toFixed(4)}</TableCell>
                                    <TableCell>{labor.directCost.toFixed(4)}</TableCell>
                                    <TableCell>{labor.ohCost.toFixed(4)}</TableCell>
                                    <TableCell>{labor.ohAllocationCost.toFixed(4)}</TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={14} className="text-center text-muted-foreground py-4">
                                    No labor data available
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </TabsContent>
                      <TabsContent value="misc" className="mt-2">
                        <div className="text-xs text-muted-foreground mb-2">Miscellaneous information</div>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Input Product</TableHead>
                                <TableHead>Fixed Cost</TableHead>
                                <TableHead>Input Qty</TableHead>
                                <TableHead>Input UOM</TableHead>
                                <TableHead>Unit Cost</TableHead>
                                <TableHead>Batches</TableHead>
                                <TableHead>Total Cost</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedMrpNode?.miscIns && selectedMrpNode.miscIns.length > 0 ? (
                                selectedMrpNode.miscIns.map((misc, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{misc.inputProduct}</TableCell>
                                    <TableCell>{misc.fixedCost.toFixed(4)}</TableCell>
                                    <TableCell>{misc.inputQty.toFixed(2)}</TableCell>
                                    <TableCell>{misc.inputUom}</TableCell>
                                    <TableCell>{misc.unitCost.toFixed(4)}</TableCell>
                                    <TableCell>{selectedMrpNode.totalBatches.toFixed(2)}</TableCell>
                                    <TableCell>{(misc.inputQty * misc.unitCost).toFixed(2)}</TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                                    No miscellaneous data available
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Part Usage Section */}
              <ResizablePanel defaultSize={30} minSize={20}>
                <Card className="h-full py-2 gap-0 flex flex-col rounded-none">
                  <CardHeader >
                    <CardTitle className="text-sm">Part Usage</CardTitle>
                    <div className="text-xs text-muted-foreground">
                      (Destination): Part Usage: This part is used to manufacture the following products.
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto p-2">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">Part Code</TableHead>
                            <TableHead className="w-[80px]">WH</TableHead>
                            <TableHead className="w-[120px]">Part Desc</TableHead>
                            <TableHead className="w-[80px]">Stage</TableHead>
                            <TableHead className="w-[80px]">Recipe</TableHead>
                            <TableHead className="w-[90px]">Setup Qty</TableHead>
                            <TableHead className="w-[90px]">Input Qty</TableHead>
                            <TableHead className="w-[100px]">Total Q...</TableHead>
                            <TableHead className="w-[70px]">UOM</TableHead>
                            <TableHead className="w-[90px]">Nom. T...</TableHead>
                            <TableHead className="w-[80px]">Nom U...</TableHead>
                            <TableHead className="w-[80px]">Batches</TableHead>
                            <TableHead className="w-[100px]">Total N...</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mrpData && selectedMrpNode ? (
                            (() => {
                              // Find the root node(s) that use this selected part
                              const allRoots = mrpData.map(tree => tree.Root);
                              const isRootPart = allRoots.some(root =>
                                root.partCode === selectedMrpNode.partCode &&
                                root.warehouse === selectedMrpNode.warehouse
                              );

                              if (isRootPart) {
                                return (
                                  <TableRow>
                                    <TableCell colSpan={13} className="text-center text-muted-foreground py-4">
                                      Select a child part to see its usage information.
                                    </TableCell>
                                  </TableRow>
                                );
                              }

                              // Search through all root nodes' materialIns to find usage of selected part
                              const partUsageData: typeof allRoots[0]['materialIns'] = [];
                              for (const root of allRoots) {
                                const usage = root.materialIns?.filter(m =>
                                  m.partCode === selectedMrpNode.partCode
                                ) || [];
                                partUsageData.push(...usage);
                              }

                              if (partUsageData.length > 0) {
                                return partUsageData.map((usage, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{usage.partCode}</TableCell>
                                    <TableCell>{usage.warehouse}</TableCell>
                                    <TableCell>{usage.detailDesc}</TableCell>
                                    <TableCell>{usage.processStage}</TableCell>
                                    <TableCell>{usage.recipeCode}</TableCell>
                                    <TableCell>{usage.setupQty.toFixed(2)}</TableCell>
                                    <TableCell>{usage.inputQty.toFixed(2)}</TableCell>
                                    <TableCell>{usage.totalQty.toFixed(4)}</TableCell>
                                    <TableCell>{usage.inputUom}</TableCell>
                                    <TableCell>{usage.totalQtyNom.toFixed(4)}</TableCell>
                                    <TableCell>{usage.inputNomUom}</TableCell>
                                    <TableCell>{allRoots[0]?.totalBatches.toFixed(2) || '0.00'}</TableCell>
                                    <TableCell>{usage.totalQtyNom.toFixed(4)}</TableCell>
                                  </TableRow>
                                ));
                              } else {
                                return (
                                  <TableRow>
                                    <TableCell colSpan={13} className="text-center text-muted-foreground py-4">
                                      No usage data available for this part.
                                    </TableCell>
                                  </TableRow>
                                );
                              }
                            })()
                          ) : (
                            <TableRow>
                              <TableCell colSpan={13} className="text-center text-muted-foreground py-4">
                                Select a child part to see its usage information.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Multi-level Bill of Materials Section */}
              <ResizablePanel defaultSize={30} minSize={20}>
                <Card className="h-full flex flex-col rounded-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Multi-level Bill of Materials</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto p-2">
                    <div className="flex gap-2 mb-2">
                      <Input placeholder="Part code" className="flex-1" />
                      <Button size="sm">Show Part</Button>
                    </div>
                    <div className="border rounded-md p-4 h-full min-h-[200px] bg-muted/20">
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Multi-level BOM structure will be displayed here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </ResizablePanel>

            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Status Bar */}
      <div className="border-t bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground">
        Status: Process Manufacturing Advanced Analyzer, Version 1.00
      </div>
    </div>
  )
}

